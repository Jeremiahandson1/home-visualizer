// ═══════════════════════════════════════════════════════════════
// POST /api/visualize/inpaint
// BATCH MODE: Multiple zones, ONE OpenAI call, surgical composite
//
// Flow:
// 1. User clicks 6 zones, picks products for each
// 2. We combine all zone descriptions into ONE prompt
// 3. ONE OpenAI generation (~$0.08)
// 4. For each zone: extract AI pixels using that zone's SAM mask
// 5. Layer all masked zones onto original photo
// 6. Result: original photo with only the clicked zones changed
// ═══════════════════════════════════════════════════════════════

import { NextResponse } from 'next/server';
import { compositeWithMask, combineMasks } from '@/lib/composite';

// Optional: import your existing quota/storage utils if you have them
// import { verifyRenderQuota, incrementRenderCount } from '@/lib/quota';
// import { uploadBase64 } from '@/lib/storage';

const STRUCTURE_ANCHOR = `CRITICAL: This is a REAL photograph. You are EDITING it, not creating a new image.
Keep the EXACT same structure, camera angle, perspective, lighting, sky, landscaping, and all elements not listed below.
ONLY change the specific elements described. Everything else must remain identical.`;

export async function POST(req) {
  try {
    const {
      imageBase64,     // Original photo (base64)
      zones,           // Array of { maskBase64, zone, materialName, materialBrand, materialColor }
      customPrompt,    // Optional freeform override
      tenantSlug,
      imageWidth,
      imageHeight,
    } = await req.json();

    if (!imageBase64) {
      return NextResponse.json({ error: 'Missing imageBase64' }, { status: 400 });
    }
    if (!zones?.length && !customPrompt) {
      return NextResponse.json({ error: 'No zones or prompt provided' }, { status: 400 });
    }

    // TODO: Wire up your existing quota check if you have one
    // if (tenantSlug) {
    //   const quota = await verifyRenderQuota(tenantSlug);
    //   if (!quota.ok) return NextResponse.json({ error: quota.error }, { status: 429 });
    // }

    const start = Date.now();

    // ─── Step 1: Build ONE combined prompt for all zones ───
    const prompt = customPrompt || buildBatchPrompt(zones);

    // ─── Step 2: Combine all masks into one union mask ─────
    // This goes to OpenAI as guidance (optional, helps focus)
    const allMasks = zones.map(z => z.maskBase64).filter(Boolean);
    let unionMask = null;
    if (allMasks.length > 0) {
      unionMask = await combineMasks(allMasks, imageWidth || 1024, imageHeight || 1024);
    }

    // ─── Step 3: ONE OpenAI call ───────────────────────────
    let aiGeneratedBase64;

    // Try with mask first (OpenAI edits endpoint)
    if (unionMask) {
      aiGeneratedBase64 = await generateWithMask(imageBase64, unionMask, prompt);
    }

    // Fallback: generate without mask (Responses API)
    if (!aiGeneratedBase64) {
      aiGeneratedBase64 = await generateWithoutMask(imageBase64, prompt);
    }

    if (!aiGeneratedBase64) {
      return NextResponse.json({ error: 'Image generation failed' }, { status: 500 });
    }

    // ─── Step 4: Surgical composite ────────────────────────
    // If we have individual masks, composite per-zone for precision
    // If no masks (fallback), return the AI image directly
    let finalBase64;

    if (allMasks.length > 0) {
      // Combine all zone masks into one union, then composite
      // AI pixels only come through where ANY mask is white
      // Original pixels preserved everywhere else
      finalBase64 = await compositeWithMask(
        imageBase64,        // original photo
        aiGeneratedBase64,  // AI-generated full image
        unionMask,          // union of all zone masks
        3                   // 3px feather
      );
    } else {
      // No masks — return AI output directly (legacy behavior)
      finalBase64 = aiGeneratedBase64;
    }

    // TODO: Wire up storage upload if you want to persist results
    // const [originalUrl, generatedUrl] = await Promise.all([
    //   uploadBase64(imageBase64, 'originals').catch(() => null),
    //   uploadBase64(finalBase64, 'generated').catch(() => null),
    // ]);

    const elapsed = Date.now() - start;

    return NextResponse.json({
      generatedBase64: finalBase64,
      generationTimeMs: elapsed,
      zonesApplied: zones?.length || 0,
      provider: allMasks.length > 0 ? 'openai+composite' : 'openai',
    });

  } catch (err) {
    console.error('Inpaint API error:', err);
    return NextResponse.json({ error: err.message || 'Inpainting failed' }, { status: 500 });
  }
}

// ─── Build ONE prompt describing ALL zone changes ────────────
function buildBatchPrompt(zones) {
  if (!zones?.length) return '';

  const changes = zones.map((z, i) => {
    const product = [z.materialBrand, z.materialName].filter(Boolean).join(' ');
    const color = z.materialColor ? ` (${z.materialColor})` : '';
    const zoneName = (z.zone || 'surface').replace(/-/g, ' ');
    return `${i + 1}. Change the ${zoneName} to ${product}${color}`;
  });

  return `${STRUCTURE_ANCHOR}

Make these changes to the photo:
${changes.join('\n')}

Do NOT change anything else. Keep the exact same house shape, camera angle, sky, landscaping, driveway, and all unlisted elements pixel-identical.`;
}

// ─── OpenAI generation with mask (edits endpoint) ────────────
async function generateWithMask(imageBase64, maskBase64, prompt) {
  try {
    // Dynamic import for edge compatibility
    const { FormData } = await import('formdata-node');
    const { Blob } = await import('buffer');

    const imageBuf = Buffer.from(imageBase64, 'base64');
    const maskBuf = Buffer.from(maskBase64, 'base64');

    const form = new FormData();
    form.set('image', new Blob([imageBuf], { type: 'image/png' }), 'image.png');
    form.set('mask', new Blob([maskBuf], { type: 'image/png' }), 'mask.png');
    form.set('prompt', prompt);
    form.set('model', 'gpt-image-1');
    form.set('size', '1024x1024');
    form.set('response_format', 'b64_json');
    form.set('n', '1');

    const res = await fetch('https://api.openai.com/v1/images/edits', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${process.env.OPENAI_API_KEY}` },
      body: form,
    });

    if (!res.ok) {
      console.error('OpenAI edits failed:', res.status, await res.text());
      return null;
    }

    const data = await res.json();
    return data.data?.[0]?.b64_json || null;
  } catch (err) {
    console.error('OpenAI edits error:', err.message);
    return null;
  }
}

// ─── Fallback: generate via Responses API (no mask) ──────────
async function generateWithoutMask(imageBase64, prompt) {
  try {
    const res = await fetch('https://api.openai.com/v1/responses', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        input: [{
          role: 'user',
          content: [
            { type: 'input_image', image_url: `data:image/jpeg;base64,${imageBase64}` },
            { type: 'input_text', text: prompt },
          ],
        }],
        tools: [{ type: 'image_generation', quality: 'high' }],
      }),
    });

    const data = await res.json();
    const imgOut = data.output?.find(o => o.type === 'image_generation_call');
    return imgOut?.result || null;
  } catch (err) {
    console.error('Responses API fallback error:', err.message);
    return null;
  }
}

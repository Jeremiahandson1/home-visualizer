// ═══════════════════════════════════════════════════════════════
// POST /api/visualize/render
// Material swap rendering via Flux Kontext (Replicate)
// No OpenAI dependency — uses Flux for image-to-image editing
//
// Cost: ~$0.03-0.06 per render via Replicate
// ═══════════════════════════════════════════════════════════════

import { NextResponse } from 'next/server';

export const maxDuration = 120;

const STRUCTURE_ANCHOR = `CRITICAL: This is a REAL photograph of a house. You are EDITING it, not creating a new image.
Keep the EXACT same house structure, camera angle, perspective, lighting, sky, landscaping, and proportions.
ONLY change the specific materials/colors described below. Everything else must remain pixel-identical.
Maintain the exact same architectural style, roof shape, window positions, and overall composition.`;

const REPLICATE_API_URL = 'https://api.replicate.com/v1/predictions';

export async function POST(req) {
  try {
    const {
      imageBase64,    // Original photo
      changes,        // Array of { category, materialName, materialBrand, materialColor }
      tenantSlug,
      quality = 'medium',
    } = await req.json();

    if (!imageBase64 || typeof imageBase64 !== 'string') {
      return NextResponse.json({ error: 'Missing imageBase64' }, { status: 400 });
    }
    if (!Array.isArray(changes) || !changes.length) {
      return NextResponse.json({ error: 'No changes specified' }, { status: 400 });
    }
    for (const c of changes) {
      if (!c.category || (!c.materialName && !c.materialBrand)) {
        return NextResponse.json({ error: 'Each change needs category and materialName or materialBrand' }, { status: 400 });
      }
    }

    const apiKey = process.env.REPLICATE_API_TOKEN;
    if (!apiKey) {
      return NextResponse.json({ error: 'REPLICATE_API_TOKEN not configured' }, { status: 500 });
    }

    const start = Date.now();

    // Build the prompt describing all material changes
    const prompt = buildRenderPrompt(changes);

    // Use Flux Kontext Max for image-to-image editing
    const createRes = await fetch(REPLICATE_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        version: '8389ed8e4b16016c44fcdcc3ad142cf1e182e0a1ecaf0347b3e5254303f2beac',
        input: {
          prompt,
          input_image: `data:image/jpeg;base64,${imageBase64}`,
          aspect_ratio: 'match_input_image',
          safety_tolerance: 6,
          prompt_upsampling: false,
        },
      }),
    });

    if (!createRes.ok) {
      const errText = await createRes.text();
      console.error('Flux create error:', createRes.status, errText);
      return NextResponse.json({ error: 'Render failed' }, { status: 500 });
    }

    const prediction = await createRes.json();

    // Poll for completion
    const resultUrl = await pollPrediction(prediction.urls.get, apiKey);

    if (!resultUrl) {
      return NextResponse.json({ error: 'Image generation timed out' }, { status: 500 });
    }

    // Download the generated image and convert to base64
    const imgRes = await fetch(resultUrl);
    if (!imgRes.ok) {
      return NextResponse.json({ error: 'Failed to download generated image' }, { status: 500 });
    }
    const imgBuf = Buffer.from(await imgRes.arrayBuffer());
    const generatedBase64 = imgBuf.toString('base64');

    const elapsed = Date.now() - start;

    return NextResponse.json({
      generatedBase64,
      generationTimeMs: elapsed,
      changesApplied: changes.length,
      provider: 'flux-kontext',
    });

  } catch (err) {
    console.error('Render error:', err);
    return NextResponse.json({ error: err.message || 'Render failed' }, { status: 500 });
  }
}

// ─── Poll Replicate prediction until complete ─────────────────
async function pollPrediction(url, apiKey) {
  const maxWait = 90000;
  const interval = 2000;
  const start = Date.now();

  while (Date.now() - start < maxWait) {
    const res = await fetch(url, {
      headers: { 'Authorization': `Bearer ${apiKey}` },
    });
    if (!res.ok) return null;

    const data = await res.json();

    if (data.status === 'succeeded') {
      // Flux returns the image URL directly as output
      const output = data.output;
      if (typeof output === 'string') return output;
      if (Array.isArray(output)) return output[0];
      if (output?.url) return output.url;
      console.error('Unexpected Flux output:', JSON.stringify(output).slice(0, 200));
      return null;
    }
    if (data.status === 'failed' || data.status === 'canceled') {
      console.error('Flux prediction failed:', data.error);
      return null;
    }

    await new Promise(r => setTimeout(r, interval));
  }
  return null;
}

// ─── Build prompt describing all material changes ────────────
function buildRenderPrompt(changes) {
  const lines = changes.map((c, i) => {
    const product = [c.materialBrand, c.materialName].filter(Boolean).join(' ');
    const color = c.materialColor ? ` in ${c.materialColor} color` : '';
    const cat = (c.category || 'surface').replace(/-/g, ' ');
    return `${i + 1}. Change ALL ${cat} to ${product}${color}`;
  });

  return `${STRUCTURE_ANCHOR}

Make these material changes to the house exterior:
${lines.join('\n')}

IMPORTANT:
- Apply each change to ALL instances of that element (e.g., ALL trim pieces, ALL windows)
- Match the material texture and appearance realistically
- Maintain proper shadows and lighting on the new materials
- Keep the exact same house shape, landscaping, sky, and camera angle
- Do NOT change any elements not listed above`;
}

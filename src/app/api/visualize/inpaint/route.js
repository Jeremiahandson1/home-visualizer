// ═══════════════════════════════════════════════════════════════
// POST /api/visualize/inpaint
// BATCH MODE: Multiple zones, ONE OpenAI call, surgical composite
//
// Flow:
// 1. User clicks zones, picks products for each
// 2. We combine all zone descriptions into ONE prompt
// 3. ONE OpenAI generation (~$0.04-0.08)
// 4. For each zone: extract AI pixels using that zone's SAM mask
// 5. Layer all masked zones onto original photo
// 6. Result: original photo with only the clicked zones changed
// ═══════════════════════════════════════════════════════════════

import { NextResponse } from 'next/server';
import { compositeWithMask, combineMasks, convertMaskForOpenAI } from '@/lib/composite';
import { getSupabaseAdmin } from '@/lib/supabase';
import { checkRateLimit, releaseRateLimit } from '@/lib/rate-limit';
import { InpaintSchema, parseBody } from '@/lib/schemas';

export const maxDuration = 60;

// Rate limiting — Supabase-backed (see src/lib/rate-limit.js)

const STRUCTURE_ANCHOR = `CRITICAL: This is a REAL photograph. You are EDITING it, not creating a new image.
Keep the EXACT same structure, camera angle, perspective, lighting, sky, landscaping, and all elements not listed below.
ONLY change the specific elements described. Everything else must remain identical.`;

export async function POST(req) {
  let tenantSlug = null;

  try {
    const rawBody = await req.json();
    const { ok, error: parseError, data: body } = parseBody(InpaintSchema, rawBody);
    if (!ok) return NextResponse.json({ error: parseError }, { status: 400 });

    const { imageBase64, zones, customPrompt, imageWidth, imageHeight } = body;
    tenantSlug = body.tenantSlug;

    // ─── Rate limit ──────────────────────────────────────────
    const rateLimitError = await checkRateLimit(tenantSlug);
    if (rateLimitError) return NextResponse.json({ error: rateLimitError }, { status: 429 });

    // ─── Quota check (same as main /api/visualize route) ─────
    const supabase = getSupabaseAdmin();

    let tenant;
    if (tenantSlug === 'demo') {
      tenant = { id: 'demo', slug: 'demo', monthly_gen_limit: 999, plan: 'demo' };
    } else {
      const { data, error } = await supabase
        .from('tenants')
        .select('id, slug, monthly_gen_limit, plan, active')
        .eq('slug', tenantSlug)
        .eq('active', true)
        .single();

      if (error || !data) {
        releaseRateLimit(tenantSlug);
        return NextResponse.json({ error: 'Tenant not found or inactive' }, { status: 404 });
      }
      tenant = data;
    }

    const currentMonth = new Date().toISOString().slice(0, 7);
    const { data: usage } = await supabase
      .from('monthly_usage')
      .select('generation_count')
      .eq('tenant_id', tenant.id)
      .eq('month', currentMonth)
      .single();

    if ((usage?.generation_count || 0) >= tenant.monthly_gen_limit) {
      releaseRateLimit(tenantSlug);
      return NextResponse.json({ error: 'Monthly generation limit reached.' }, { status: 429 });
    }

    const start = Date.now();

    // ─── Step 1: Build ONE combined prompt for all zones ─────
    const prompt = customPrompt || buildBatchPrompt(zones);

    // ─── Step 2: Combine all masks into one union mask ───────
    const allMasks = zones.map(z => z.maskBase64).filter(Boolean);
    let unionMask = null;
    if (allMasks.length > 0) {
      unionMask = await combineMasks(allMasks, imageWidth || 1024, imageHeight || 1024);
    }

    // ─── Step 3: ONE OpenAI call ─────────────────────────────
    let aiGeneratedBase64;
    if (unionMask) {
      aiGeneratedBase64 = await generateWithMask(imageBase64, unionMask, prompt);
    }
    if (!aiGeneratedBase64) {
      aiGeneratedBase64 = await generateWithoutMask(imageBase64, prompt);
    }
    if (!aiGeneratedBase64) {
      releaseRateLimit(tenantSlug);
      return NextResponse.json({ error: 'Image generation failed' }, { status: 500 });
    }

    // ─── Step 4: Surgical composite ─────────────────────────
    let finalBase64;
    if (allMasks.length > 0) {
      finalBase64 = await compositeWithMask(imageBase64, aiGeneratedBase64, unionMask, 3);
    } else {
      finalBase64 = aiGeneratedBase64;
    }

    // ─── Step 5: Upload originals + generated to storage ─────
    const imageBuffer    = Buffer.from(imageBase64, 'base64');
    const generatedBuffer = Buffer.from(finalBase64, 'base64');
    const ts = Date.now();
    const photoPath     = `${tenant.slug}/${ts}-inpaint-original.jpg`;
    const generatedPath = `${tenant.slug}/${ts}-inpaint-generated.jpg`;

    const { error: origUploadErr } = await supabase.storage.from('photos').upload(photoPath, imageBuffer, { contentType: 'image/jpeg' });
    if (origUploadErr) console.error('Original upload failed:', origUploadErr.message);
    const { data: photoUrlData }     = supabase.storage.from('photos').getPublicUrl(photoPath);
    const { error: genUploadErr } = await supabase.storage.from('generated').upload(generatedPath, generatedBuffer, { contentType: 'image/jpeg' });
    if (genUploadErr) console.error('Generated upload failed:', genUploadErr.message);
    const { data: generatedUrlData } = supabase.storage.from('generated').getPublicUrl(generatedPath);

    // ─── Step 6: Log generation + increment quota ────────────
    const INPAINT_COST_CENTS = 8; // ~$0.08 per inpaint call

    supabase.from('generations').insert({
      tenant_id: tenant.id,
      project_type: 'inpaint',
      prompt,
      model: 'gpt-image-1',
      provider: allMasks.length > 0 ? 'openai+composite' : 'openai',
      cost_cents: INPAINT_COST_CENTS,
      generation_time_ms: Date.now() - start,
      status: 'success',
    }).then(() => {}).catch(err => console.error('Generation log failed:', err.message));

    if (tenant.id !== 'demo') {
      const { error: usageError } = await supabase.rpc('increment_monthly_usage', {
        p_tenant_id: tenant.id,
        p_month: currentMonth,
        p_cost: INPAINT_COST_CENTS,
      });
      if (usageError) console.error('Usage increment failed:', usageError.message);
    }

    releaseRateLimit(tenantSlug);

    return NextResponse.json({
      generatedBase64: finalBase64,
      generationTimeMs: Date.now() - start,
      zonesApplied: zones?.length || 0,
      originalUrl: photoUrlData?.publicUrl,
      generatedUrl: generatedUrlData?.publicUrl,
      provider: allMasks.length > 0 ? 'openai+composite' : 'openai',
    });

  } catch (err) {
    if (tenantSlug) releaseRateLimit(tenantSlug);
    console.error('Inpaint API error:', err);
    return NextResponse.json({ error: err.message || 'Inpainting failed' }, { status: 500 });
  }
}

// ─── Build ONE prompt describing ALL zone changes ─────────────
function buildBatchPrompt(zones) {
  if (!zones?.length) return '';
  const changes = zones.map((z, i) => {
    const product  = [z.materialBrand, z.materialName].filter(Boolean).join(' ');
    const color    = z.materialColor ? ` (${z.materialColor})` : '';
    const zoneName = (z.zone || 'surface').replace(/-/g, ' ');
    return `${i + 1}. Change the ${zoneName} to ${product}${color}`;
  });
  return `${STRUCTURE_ANCHOR}\n\nMake these changes to the photo:\n${changes.join('\n')}\n\nDo NOT change anything else.`;
}

// ─── Flux Kontext generation via Replicate (with or without mask) ──
const REPLICATE_API_URL = 'https://api.replicate.com/v1/predictions';

async function generateWithMask(imageBase64, maskBase64, prompt) {
  // Flux Kontext handles image editing — mask is used for compositing after
  return generateWithFlux(imageBase64, prompt);
}

async function generateWithoutMask(imageBase64, prompt) {
  return generateWithFlux(imageBase64, prompt);
}

async function generateWithFlux(imageBase64, prompt) {
  try {
    const apiKey = process.env.REPLICATE_API_TOKEN;
    if (!apiKey) { console.error('REPLICATE_API_TOKEN not set'); return null; }

    const createRes = await fetch(REPLICATE_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        version: '897a70f5a7dbd8a0611413b3b98cf417b45f266bd595c571a22947619d9ae462',
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
      console.error('Flux create failed:', createRes.status, await createRes.text());
      return null;
    }

    const prediction = await createRes.json();

    // Poll for completion
    const maxWait = 90000;
    const interval = 2000;
    const start = Date.now();

    while (Date.now() - start < maxWait) {
      const res = await fetch(prediction.urls.get, {
        headers: { 'Authorization': `Bearer ${apiKey}` },
      });
      if (!res.ok) return null;

      const data = await res.json();
      if (data.status === 'succeeded') {
        const output = data.output;
        const url = typeof output === 'string' ? output
          : Array.isArray(output) ? output[0]
          : output?.url || null;

        if (!url) { console.error('Unexpected Flux output:', JSON.stringify(output).slice(0, 200)); return null; }

        // Download and convert to base64
        const imgRes = await fetch(url);
        if (!imgRes.ok) return null;
        const buf = Buffer.from(await imgRes.arrayBuffer());
        return buf.toString('base64');
      }
      if (data.status === 'failed' || data.status === 'canceled') {
        console.error('Flux prediction failed:', data.error);
        return null;
      }

      await new Promise(r => setTimeout(r, interval));
    }
    console.error('Flux prediction timed out');
    return null;
  } catch (err) {
    console.error('Flux generation error:', err.message);
    return null;
  }
}

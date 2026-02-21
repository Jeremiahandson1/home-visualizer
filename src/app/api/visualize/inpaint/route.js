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

    await supabase.storage.from('photos').upload(photoPath, imageBuffer, { contentType: 'image/jpeg' }).catch(() => {});
    const { data: photoUrlData }     = supabase.storage.from('photos').getPublicUrl(photoPath);
    await supabase.storage.from('generated').upload(generatedPath, generatedBuffer, { contentType: 'image/jpeg' }).catch(() => {});
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
    }).then(() => {}).catch(() => {});

    if (tenant.id !== 'demo') {
      await supabase.rpc('increment_monthly_usage', {
        p_tenant_id: tenant.id,
        p_month: currentMonth,
        p_cost: INPAINT_COST_CENTS,
      });
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

// ─── OpenAI generation with mask (edits endpoint) ─────────────
async function generateWithMask(imageBase64, maskBase64, prompt) {
  try {
    const { FormData } = await import('formdata-node');
    const { Blob }     = await import('buffer');
    const imageBuf     = Buffer.from(imageBase64, 'base64');
    const openaiMaskBase64 = await convertMaskForOpenAI(maskBase64);
    const maskBuf = Buffer.from(openaiMaskBase64, 'base64');
    const form = new FormData();
    form.set('image',           new Blob([imageBuf], { type: 'image/png' }), 'image.png');
    form.set('mask',            new Blob([maskBuf],  { type: 'image/png' }), 'mask.png');
    form.set('prompt',          prompt);
    form.set('model',           'gpt-image-1');
    form.set('size',            '1024x1024');
    form.set('response_format', 'b64_json');
    form.set('n',               '1');
    const res = await fetch('https://api.openai.com/v1/images/edits', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${process.env.OPENAI_API_KEY}` },
      body: form,
    });
    if (!res.ok) { console.error('OpenAI edits failed:', res.status, await res.text()); return null; }
    const data = await res.json();
    return data.data?.[0]?.b64_json || null;
  } catch (err) {
    console.error('OpenAI edits error:', err.message);
    return null;
  }
}

// ─── Fallback: generate via Responses API (no mask) ───────────
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
        input: [{ role: 'user', content: [
          { type: 'input_image', image_url: `data:image/jpeg;base64,${imageBase64}` },
          { type: 'input_text',  text: prompt },
        ]}],
        tools: [{ type: 'image_generation', quality: 'medium' }],
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

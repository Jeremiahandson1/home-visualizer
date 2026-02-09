import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase';
import { generateVisualization } from '@/lib/ai';
import { buildMultiPrompt } from '@/lib/ai';
import { getMaterial } from '@/lib/materials';
import { isDemoMode, generateDemoResult } from '@/lib/demo';
import { validateHomePhoto } from '@/lib/image-gate';

export const maxDuration = 60;

// ─── SIMPLE IN-MEMORY RATE LIMITER ───────────────────
const rateLimits = new Map();

function checkRateLimit(tenantSlug) {
  const now = Date.now();
  let bucket = rateLimits.get(tenantSlug);
  if (!bucket || bucket.resetAt < now) {
    bucket = { count: 0, resetAt: now + 60000, active: 0 };
    rateLimits.set(tenantSlug, bucket);
  }
  if (bucket.active >= 5) return 'Too many concurrent requests. Please wait.';
  if (bucket.count >= 20) return 'Rate limit exceeded. Please wait a minute.';
  bucket.count++;
  bucket.active++;
  return null;
}

function releaseRateLimit(tenantSlug) {
  const bucket = rateLimits.get(tenantSlug);
  if (bucket) bucket.active = Math.max(0, bucket.active - 1);
}

const MAX_IMAGE_SIZE = 15 * 1024 * 1024;

function validateImage(imageBase64) {
  if (!imageBase64 || typeof imageBase64 !== 'string') return 'No image provided';
  const estimatedBytes = (imageBase64.length * 3) / 4;
  if (estimatedBytes > MAX_IMAGE_SIZE) return `Image too large (${(estimatedBytes / 1024 / 1024).toFixed(1)}MB). Maximum is ~10MB.`;
  try {
    const header = Buffer.from(imageBase64.slice(0, 16), 'base64');
    const isJPEG = header[0] === 0xFF && header[1] === 0xD8;
    const isPNG = header[0] === 0x89 && header[1] === 0x50;
    const isWebP = header[8] === 0x57 && header[9] === 0x45;
    if (!isJPEG && !isPNG && !isWebP) return 'Invalid image format. Please upload a JPG, PNG, or WebP file.';
  } catch { return 'Could not validate image format.'; }
  return null;
}

export async function POST(request) {
  let tenantSlug = null;

  try {
    const body = await request.json();
    const { imageBase64, selections } = body;
    // Support legacy single-material format too
    const { project, materialId } = body;
    tenantSlug = body.tenantSlug;

    const isMulti = Array.isArray(selections) && selections.length > 0;

    if (!imageBase64 || !tenantSlug) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }
    if (!isMulti && (!project || !materialId)) {
      return NextResponse.json({ error: 'Missing required fields: project, materialId or selections[]' }, { status: 400 });
    }

    const imageError = validateImage(imageBase64);
    if (imageError) return NextResponse.json({ error: imageError }, { status: 400 });

    const INTERIOR_CATEGORIES = ['kitchen', 'bathroom', 'flooring'];
    const isInteriorProject = isMulti
      ? selections.some(s => INTERIOR_CATEGORIES.includes(s.category))
      : INTERIOR_CATEGORIES.includes(project);
    const gate = await validateHomePhoto(imageBase64, { allowInterior: isInteriorProject });
    if (!gate.ok) return NextResponse.json({ error: gate.reason, gate: gate.type }, { status: 422 });

    const rateLimitError = checkRateLimit(tenantSlug);
    if (rateLimitError) return NextResponse.json({ error: rateLimitError }, { status: 429 });

    const supabase = getSupabaseAdmin();

    let { data: tenant, error: tenantError } = await supabase
      .from('tenants').select('*').eq('slug', tenantSlug).eq('active', true).single();

    if (tenantError || !tenant) {
      if (tenantSlug === 'demo') {
        tenant = { id: 'demo', slug: 'demo', monthly_gen_limit: 999, plan: 'demo' };
      } else {
        releaseRateLimit(tenantSlug);
        return NextResponse.json({ error: 'Tenant not found or inactive' }, { status: 404 });
      }
    }

    const currentMonth = new Date().toISOString().slice(0, 7);
    const { data: usage } = await supabase.from('monthly_usage')
      .select('generation_count').eq('tenant_id', tenant.id).eq('month', currentMonth).single();

    if ((usage?.generation_count || 0) >= tenant.monthly_gen_limit) {
      releaseRateLimit(tenantSlug);
      return NextResponse.json({ error: 'Monthly generation limit reached.' }, { status: 429 });
    }

    // ─── Resolve materials ───────────────────────────
    let resolvedSelections = [];

    if (isMulti) {
      // Multi-material mode
      for (const sel of selections) {
        let mat = getMaterial(sel.category, sel.materialId);
        if (!mat) {
          const isUUID = /^[0-9a-f]{8}-/.test(sel.materialId);
          if (isUUID) {
            const { data: customMat } = await supabase.from('materials').select('*').eq('id', sel.materialId).single();
            if (customMat) {
              mat = { brand: customMat.brand, name: customMat.name, type: customMat.category,
                color: customMat.color_hex || '#888', aiHint: customMat.ai_prompt_hint || '' };
            }
          }
        }
        if (mat) resolvedSelections.push({ category: sel.category, material: mat });
      }
      if (resolvedSelections.length === 0) {
        releaseRateLimit(tenantSlug);
        return NextResponse.json({ error: 'No valid materials found' }, { status: 400 });
      }
    } else {
      // Legacy single-material mode
      let material;
      const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-/.test(materialId);
      if (isUUID) {
        const { data: customMat } = await supabase.from('materials').select('*').eq('id', materialId).single();
        if (customMat) {
          material = { brand: customMat.brand, name: customMat.name, type: customMat.category,
            color: customMat.color_hex || '#888', aiHint: customMat.ai_prompt_hint || '' };
        }
      }
      if (!material) material = getMaterial(project, materialId);
      if (!material) {
        releaseRateLimit(tenantSlug);
        return NextResponse.json({ error: 'Material not found' }, { status: 400 });
      }
      resolvedSelections = [{ category: project, material }];
    }

    // ─── Upload original ─────────────────────────────
    const imageBuffer = Buffer.from(imageBase64, 'base64');
    const photoPath = `${tenant.slug}/${Date.now()}-original.jpg`;
    await supabase.storage.from('photos').upload(photoPath, imageBuffer, { contentType: 'image/jpeg' }).catch(() => {});
    const { data: photoUrl } = supabase.storage.from('photos').getPublicUrl(photoPath);

    // ─── Generate ────────────────────────────────────
    let result;
    if (isDemoMode()) {
      const label = resolvedSelections.map(s => s.material.name).join(' + ');
      result = await generateDemoResult(imageBuffer, label);
    } else {
      // Build combined prompt for all selections
      const { instruction } = buildMultiPrompt(resolvedSelections);
      result = await generateVisualization({ imageBuffer, project: resolvedSelections[0].category, material: resolvedSelections[0].material, overridePrompt: instruction });
    }

    // ─── Upload generated ────────────────────────────
    const generatedBuffer = Buffer.from(result.imageBase64, 'base64');
    const generatedPath = `${tenant.slug}/${Date.now()}-generated.jpg`;
    await supabase.storage.from('generated').upload(generatedPath, generatedBuffer, { contentType: 'image/jpeg' }).catch(() => {});
    const { data: generatedUrl } = supabase.storage.from('generated').getPublicUrl(generatedPath);

    // ─── Log ─────────────────────────────────────────
    const selectionSummary = resolvedSelections.map(s => `${s.category}:${s.material.name}`).join(', ');
    supabase.from('generations').insert({
      tenant_id: tenant.id,
      project_type: resolvedSelections.map(s => s.category).join('+'),
      material_id: isMulti ? selections[0].materialId : materialId,
      prompt: result.prompt,
      model: result.model || 'unknown',
      provider: result.provider || 'unknown',
      cost_cents: result.costCents,
      generation_time_ms: result.generationTimeMs,
      status: 'success',
    }).then(() => {}).catch(() => {});

    await supabase.rpc('increment_monthly_usage', {
      p_tenant_id: tenant.id, p_month: currentMonth, p_cost: result.costCents,
    });

    releaseRateLimit(tenantSlug);

    return NextResponse.json({
      originalUrl: photoUrl.publicUrl,
      generatedUrl: generatedUrl.publicUrl,
      generatedBase64: result.imageBase64,
      generationTimeMs: result.generationTimeMs,
      provider: result.provider,
      model: result.model,
      selections: selectionSummary,
    });

  } catch (error) {
    if (tenantSlug) releaseRateLimit(tenantSlug);
    console.error('Visualization error:', error);
    return NextResponse.json(
      { error: 'Generation failed. Please try again.', details: error.message },
      { status: 500 }
    );
  }
}

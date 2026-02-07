import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase';
import { generateVisualization } from '@/lib/ai';
import { getMaterial } from '@/lib/materials';
import { isDemoMode, generateDemoResult } from '@/lib/demo';
import { validateHomePhoto } from '@/lib/image-gate';

export const maxDuration = 60;

// ─── SIMPLE IN-MEMORY RATE LIMITER ───────────────────
// Prevents abuse of the expensive AI endpoint.
// Per-tenant: max 5 concurrent requests, max 20/minute
const rateLimits = new Map(); // key: tenantSlug, value: { count, resetAt, active }

function checkRateLimit(tenantSlug) {
  const now = Date.now();
  let bucket = rateLimits.get(tenantSlug);

  if (!bucket || bucket.resetAt < now) {
    bucket = { count: 0, resetAt: now + 60000, active: 0 };
    rateLimits.set(tenantSlug, bucket);
  }

  if (bucket.active >= 5) {
    return 'Too many concurrent requests. Please wait for current generations to finish.';
  }
  if (bucket.count >= 20) {
    return 'Rate limit exceeded. Please wait a minute before trying again.';
  }

  bucket.count++;
  bucket.active++;
  return null;
}

function releaseRateLimit(tenantSlug) {
  const bucket = rateLimits.get(tenantSlug);
  if (bucket) bucket.active = Math.max(0, bucket.active - 1);
}

// ─── IMAGE VALIDATION ────────────────────────────────
const MAX_IMAGE_SIZE = 15 * 1024 * 1024; // 15MB base64 (~11MB raw)

function validateImage(imageBase64) {
  if (!imageBase64 || typeof imageBase64 !== 'string') {
    return 'No image provided';
  }
  // Check base64 size (rough file size estimate)
  const estimatedBytes = (imageBase64.length * 3) / 4;
  if (estimatedBytes > MAX_IMAGE_SIZE) {
    return `Image too large (${(estimatedBytes / 1024 / 1024).toFixed(1)}MB). Maximum is ~10MB.`;
  }
  // Quick header check for common image formats
  try {
    const header = Buffer.from(imageBase64.slice(0, 16), 'base64');
    const isJPEG = header[0] === 0xFF && header[1] === 0xD8;
    const isPNG = header[0] === 0x89 && header[1] === 0x50;
    const isWebP = header[8] === 0x57 && header[9] === 0x45; // "WE" in WEBP
    if (!isJPEG && !isPNG && !isWebP) {
      return 'Invalid image format. Please upload a JPG, PNG, or WebP file.';
    }
  } catch {
    return 'Could not validate image format.';
  }
  return null;
}

export async function POST(request) {
  let tenantSlug = null;

  try {
    const body = await request.json();
    const { imageBase64, project, materialId } = body;
    tenantSlug = body.tenantSlug;

    if (!imageBase64 || !project || !materialId || !tenantSlug) {
      return NextResponse.json(
        { error: 'Missing required fields: imageBase64, project, materialId, tenantSlug' },
        { status: 400 }
      );
    }

    // Validate image server-side
    const imageError = validateImage(imageBase64);
    if (imageError) {
      return NextResponse.json({ error: imageError }, { status: 400 });
    }

    // AI quality gate — is this actually a house exterior? (~$0.002)
    const gate = await validateHomePhoto(imageBase64);
    if (!gate.ok) {
      return NextResponse.json({ error: gate.reason, gate: gate.type }, { status: 422 });
    }

    // Rate limit check
    const rateLimitError = checkRateLimit(tenantSlug);
    if (rateLimitError) {
      return NextResponse.json({ error: rateLimitError }, { status: 429 });
    }

    const supabase = getSupabaseAdmin();

    // 1. Verify tenant exists and is active
    let { data: tenant, error: tenantError } = await supabase
      .from('tenants')
      .select('*')
      .eq('slug', tenantSlug)
      .eq('active', true)
      .single();

    if (tenantError || !tenant) {
      // Allow demo mode without a real tenant
      if (tenantSlug === 'demo') {
        tenant = { id: 'demo', slug: 'demo', monthly_gen_limit: 999, plan: 'demo' };
      } else {
        releaseRateLimit(tenantSlug);
        return NextResponse.json({ error: 'Tenant not found or inactive' }, { status: 404 });
      }
    }

    // 2. Check usage limits
    const currentMonth = new Date().toISOString().slice(0, 7);
    const { data: usage } = await supabase
      .from('monthly_usage')
      .select('generation_count')
      .eq('tenant_id', tenant.id)
      .eq('month', currentMonth)
      .single();

    const currentCount = usage?.generation_count || 0;
    if (currentCount >= tenant.monthly_gen_limit) {
      releaseRateLimit(tenantSlug);
      return NextResponse.json(
        { error: 'Monthly generation limit reached. Upgrade your plan for more.' },
        { status: 429 }
      );
    }

    // 3. Get material details — check custom DB materials first, then built-in defaults
    let material;

    // Try custom material from database (materialId could be UUID or string ID)
    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(materialId);
    
    if (isUUID) {
      const { data: customMaterial } = await supabase
        .from('materials')
        .select('*')
        .eq('id', materialId)
        .single();

      if (customMaterial) {
        material = {
          brand: customMaterial.brand,
          name: customMaterial.name,
          type: customMaterial.category,
          color: customMaterial.color_hex || '#888',
          colorFamily: customMaterial.color_family || '',
          aiPromptHint: customMaterial.ai_prompt_hint || '',
          aiHint: customMaterial.ai_prompt_hint || '',
        };
      }
    }

    if (!material) {
      // Fall back to built-in material library
      material = getMaterial(project, materialId);
    }

    if (!material) {
      releaseRateLimit(tenantSlug);
      return NextResponse.json({ error: 'Material not found' }, { status: 400 });
    }

    // 4. Upload original photo to Supabase Storage
    const imageBuffer = Buffer.from(imageBase64, 'base64');
    const photoPath = `${tenant.slug}/${Date.now()}-original.jpg`;
    const { error: uploadError } = await supabase.storage.from('photos').upload(photoPath, imageBuffer, {
      contentType: 'image/jpeg',
    });
    if (uploadError) {
      console.error('Photo upload error:', uploadError);
      // Non-fatal — continue with generation even if storage fails
    }
    const { data: photoUrl } = supabase.storage.from('photos').getPublicUrl(photoPath);

    // 5. Generate visualization (demo mode or AI)
    let result;
    if (isDemoMode()) {
      result = await generateDemoResult(imageBuffer, material.name);
    } else {
      result = await generateVisualization({ imageBuffer, project, material });
    }

    // 6. Upload generated image to Supabase Storage
    const generatedBuffer = Buffer.from(result.imageBase64, 'base64');
    const generatedPath = `${tenant.slug}/${Date.now()}-generated.jpg`;
    const { error: genUploadError } = await supabase.storage.from('generated').upload(generatedPath, generatedBuffer, {
      contentType: 'image/jpeg',
    });
    if (genUploadError) {
      console.error('Generated image upload error:', genUploadError);
    }
    const { data: generatedUrl } = supabase.storage.from('generated').getPublicUrl(generatedPath);

    // 7. Log the generation (non-blocking)
    supabase.from('generations').insert({
      tenant_id: tenant.id,
      project_type: project,
      material_id: materialId,
      prompt: result.prompt,
      model: result.model || 'unknown',
      provider: result.provider || 'unknown',
      cost_cents: result.costCents,
      generation_time_ms: result.generationTimeMs,
      status: 'success',
    }).then(() => {}).catch(err => console.error('Gen log error:', err));

    // 8. Update monthly usage
    await supabase.rpc('increment_monthly_usage', {
      p_tenant_id: tenant.id,
      p_month: currentMonth,
      p_cost: result.costCents,
    });

    releaseRateLimit(tenantSlug);

    return NextResponse.json({
      originalUrl: photoUrl.publicUrl,
      generatedUrl: generatedUrl.publicUrl,
      generatedBase64: result.imageBase64,
      generationTimeMs: result.generationTimeMs,
      provider: result.provider,
      model: result.model,
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

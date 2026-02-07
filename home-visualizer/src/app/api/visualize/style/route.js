import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase';
import { generateFromStyle } from '@/lib/ai';
import { getStyleById } from '@/lib/styles';
import { isDemoMode, generateDemoResult } from '@/lib/demo';
import { validateHomePhoto } from '@/lib/image-gate';

export const maxDuration = 60;

// POST /api/visualize/style
// Generates a visualization from a style preset (Instant Design)
export async function POST(request) {
  try {
    const body = await request.json();
    const { imageBase64, styleId, tenantSlug } = body;

    if (!imageBase64 || !styleId || !tenantSlug) {
      return NextResponse.json(
        { error: 'Missing: imageBase64, styleId, tenantSlug' },
        { status: 400 }
      );
    }

    const style = getStyleById(styleId);
    if (!style) {
      return NextResponse.json({ error: 'Style not found' }, { status: 400 });
    }

    // AI quality gate — is this a house exterior? (~$0.002)
    const gate = await validateHomePhoto(imageBase64);
    if (!gate.ok) {
      return NextResponse.json({ error: gate.reason, gate: gate.type }, { status: 422 });
    }

    const supabase = getSupabaseAdmin();

    // Verify tenant
    let { data: tenant } = await supabase
      .from('tenants')
      .select('id, monthly_gen_limit, slug')
      .eq('slug', tenantSlug)
      .eq('active', true)
      .single();

    if (!tenant) {
      if (tenantSlug === 'demo' && isDemoMode()) {
        tenant = { id: 'demo', slug: 'demo', monthly_gen_limit: 999 };
      } else {
        return NextResponse.json({ error: 'Tenant not found' }, { status: 404 });
      }
    }

    // Check usage
    const currentMonth = new Date().toISOString().slice(0, 7);
    const { data: usage } = await supabase
      .from('monthly_usage')
      .select('generation_count')
      .eq('tenant_id', tenant.id)
      .eq('month', currentMonth)
      .single();

    if ((usage?.generation_count || 0) >= tenant.monthly_gen_limit) {
      return NextResponse.json({ error: 'Monthly limit reached' }, { status: 429 });
    }

    const imageBuffer = Buffer.from(imageBase64, 'base64');

    // Upload original
    const photoPath = `${tenant.slug}/${Date.now()}-original.jpg`;
    await supabase.storage.from('photos').upload(photoPath, imageBuffer, {
      contentType: 'image/jpeg',
    }).catch(() => {});
    const { data: photoUrl } = supabase.storage.from('photos').getPublicUrl(photoPath);

    // Generate
    let result;
    if (isDemoMode()) {
      result = await generateDemoResult(imageBuffer, style.name);
    } else {
      result = await generateFromStyle({ imageBuffer, style });
    }

    // Upload generated
    const genBuffer = Buffer.from(result.imageBase64, 'base64');
    const genPath = `${tenant.slug}/${Date.now()}-style-${styleId}.jpg`;
    await supabase.storage.from('generated').upload(genPath, genBuffer, {
      contentType: 'image/jpeg',
    }).catch(() => {});
    const { data: genUrl } = supabase.storage.from('generated').getPublicUrl(genPath);

    // Log
    supabase.from('generations').insert({
      tenant_id: tenant.id,
      project_type: 'exterior',
      material_id: styleId,
      prompt: style.prompt,
      model: result.model || 'unknown',
      provider: result.provider || 'unknown',
      cost_cents: result.costCents,
      generation_time_ms: result.generationTimeMs,
      status: 'success',
    }).then(() => {}).catch(() => {});

    await supabase.rpc('increment_monthly_usage', {
      p_tenant_id: tenant.id,
      p_month: currentMonth,
      p_cost: result.costCents,
    });

    return NextResponse.json({
      originalUrl: photoUrl?.publicUrl,
      generatedUrl: genUrl?.publicUrl,
      generatedBase64: result.imageBase64,
      generationTimeMs: result.generationTimeMs,
      provider: result.provider,
      model: result.model,
      style: { id: style.id, name: style.name },
    });

  } catch (error) {
    console.error('Style generation error:', error);
    return NextResponse.json(
      { error: 'Generation failed. Please try again.', details: error.message },
      { status: 500 }
    );
  }
}

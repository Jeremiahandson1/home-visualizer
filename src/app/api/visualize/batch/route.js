import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase';
import { generateFromStyle } from '@/lib/ai';
import { getStyleById, getInstantStyles } from '@/lib/styles';

export const maxDuration = 120;

// POST /api/visualize/batch
// Generates multiple style variations in parallel
// Body: { imageBase64, styleIds: ['modern-farmhouse', 'contemporary', 'coastal'], tenantSlug }
// If styleIds omitted, uses top 3 styles
export async function POST(request) {
  try {
    const body = await request.json();
    const { imageBase64, tenantSlug } = body;
    let { styleIds } = body;

    if (!imageBase64 || !tenantSlug) {
      return NextResponse.json({ error: 'Missing: imageBase64, tenantSlug' }, { status: 400 });
    }

    // Default to top 3 styles
    if (!styleIds || !styleIds.length) {
      styleIds = getInstantStyles(3).map(s => s.id);
    }

    // Cap at 4 to control costs
    styleIds = styleIds.slice(0, 4);

    const styles = styleIds.map(id => getStyleById(id)).filter(Boolean);
    if (!styles.length) {
      return NextResponse.json({ error: 'No valid styles provided' }, { status: 400 });
    }

    const supabase = getSupabaseAdmin();

    // Verify tenant & usage
    const { data: tenant } = await supabase
      .from('tenants')
      .select('id, monthly_gen_limit, slug')
      .eq('slug', tenantSlug)
      .eq('active', true)
      .single();

    if (!tenant) {
      return NextResponse.json({ error: 'Tenant not found' }, { status: 404 });
    }

    const currentMonth = new Date().toISOString().slice(0, 7);
    const { data: usage } = await supabase
      .from('monthly_usage')
      .select('generation_count')
      .eq('tenant_id', tenant.id)
      .eq('month', currentMonth)
      .single();

    const remaining = tenant.monthly_gen_limit - (usage?.generation_count || 0);
    if (remaining < styles.length) {
      return NextResponse.json({
        error: `Only ${remaining} generations remaining this month. Batch needs ${styles.length}.`,
      }, { status: 429 });
    }

    const imageBuffer = Buffer.from(imageBase64, 'base64');

    // Upload original once
    const photoPath = `${tenant.slug}/${Date.now()}-original.jpg`;
    const { error: origUploadErr } = await supabase.storage.from('photos').upload(photoPath, imageBuffer, {
      contentType: 'image/jpeg',
    });
    if (origUploadErr) console.error('Original upload failed:', origUploadErr.message);
    const { data: photoUrl } = supabase.storage.from('photos').getPublicUrl(photoPath);

    // Generate all styles in parallel
    const results = await Promise.allSettled(
      styles.map(async (style) => {
        const result = await generateFromStyle({ imageBuffer, style });

        // Upload generated
        const genBuffer = Buffer.from(result.imageBase64, 'base64');
        const genPath = `${tenant.slug}/${Date.now()}-batch-${style.id}.jpg`;
        const { error: genUploadErr } = await supabase.storage.from('generated').upload(genPath, genBuffer, {
          contentType: 'image/jpeg',
        });
        if (genUploadErr) console.error('Generated upload failed:', genUploadErr.message);
        const { data: genUrl } = supabase.storage.from('generated').getPublicUrl(genPath);

        // Log
        supabase.from('generations').insert({
          tenant_id: tenant.id,
          project_type: 'exterior',
          material_id: style.id,
          prompt: style.prompt?.slice(0, 500),
          model: `${result.provider}/${result.model}`,
          cost_cents: result.costCents,
          generation_time_ms: result.generationTimeMs,
          status: 'success',
        }).then(() => {}).catch(err => console.error('Generation log failed:', err.message));

        return {
          styleId: style.id,
          styleName: style.name,
          generatedUrl: genUrl?.publicUrl,
          generatedBase64: result.imageBase64,
          generationTimeMs: result.generationTimeMs,
          provider: result.provider,
          costCents: result.costCents || 0,
        };
      })
    );

    const successes = results
      .filter(r => r.status === 'fulfilled')
      .map(r => r.value);

    const failures = results
      .filter(r => r.status === 'rejected')
      .map((r, i) => ({ styleId: styles[i]?.id, error: r.reason?.message }));

    // Only charge quota for successful generations (not failed ones)
    for (const s of successes) {
      const { error: usageError } = await supabase.rpc('increment_monthly_usage', {
        p_tenant_id: tenant.id,
        p_month: currentMonth,
        p_cost: s.costCents || 0,
      });
      if (usageError) console.error('Usage increment failed:', usageError.message);
    }

    return NextResponse.json({
      originalUrl: photoUrl?.publicUrl,
      variations: successes,
      failures,
      totalGenerated: successes.length,
      totalFailed: failures.length,
    });

  } catch (error) {
    console.error('Batch generation error:', error);
    return NextResponse.json(
      { error: 'Batch generation failed', details: error.message },
      { status: 500 }
    );
  }
}

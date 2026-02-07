import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase';
import { refineVisualization } from '@/lib/ai';
import { isDemoMode, generateDemoResult } from '@/lib/demo';

export const maxDuration = 60;

// POST /api/visualize/refine
// Takes a generated image + natural language instruction and refines it
export async function POST(request) {
  try {
    const body = await request.json();
    const { generatedBase64, instruction, context, originalBase64, tenantSlug } = body;

    if (!generatedBase64 || !instruction || !tenantSlug) {
      return NextResponse.json(
        { error: 'Missing: generatedBase64, instruction, tenantSlug' },
        { status: 400 }
      );
    }

    const supabase = getSupabaseAdmin();

    // Verify tenant
    const { data: tenant } = await supabase
      .from('tenants')
      .select('id, monthly_gen_limit, slug')
      .eq('slug', tenantSlug)
      .eq('active', true)
      .single();

    if (!tenant) {
      return NextResponse.json({ error: 'Tenant not found' }, { status: 404 });
    }

    // Check usage (refinements count as generations)
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

    const imageBuffer = Buffer.from(generatedBase64, 'base64');
    const originalBuffer = originalBase64 ? Buffer.from(originalBase64, 'base64') : null;

    let result;
    if (isDemoMode()) {
      result = await generateDemoResult(imageBuffer, instruction);
    } else {
      result = await refineVisualization({
        imageBuffer, instruction, context: context || {}, originalImage: originalBuffer,
      });
    }

    // Upload refined image
    const refinedBuffer = Buffer.from(result.imageBase64, 'base64');
    const refinedPath = `${tenant.slug}/${Date.now()}-refined.jpg`;
    await supabase.storage.from('generated').upload(refinedPath, refinedBuffer, {
      contentType: 'image/jpeg',
    }).catch(() => {});
    const { data: refinedUrl } = supabase.storage.from('generated').getPublicUrl(refinedPath);

    // Log generation
    supabase.from('generations').insert({
      tenant_id: tenant.id,
      project_type: context?.project || 'refine',
      prompt: result.prompt,
      model: `${result.provider}/${result.model}`,
      cost_cents: result.costCents,
      generation_time_ms: result.generationTimeMs,
      status: 'success',
    }).then(() => {}).catch(() => {});

    // Update usage
    await supabase.rpc('increment_monthly_usage', {
      p_tenant_id: tenant.id,
      p_month: currentMonth,
      p_cost: result.costCents,
    });

    return NextResponse.json({
      generatedUrl: refinedUrl?.publicUrl,
      generatedBase64: result.imageBase64,
      generationTimeMs: result.generationTimeMs,
      provider: result.provider,
      model: result.model,
      instruction,
    });

  } catch (error) {
    console.error('Refinement error:', error);
    return NextResponse.json(
      { error: 'Refinement failed. Please try again.', details: error.message },
      { status: 500 }
    );
  }
}

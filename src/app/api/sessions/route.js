import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase';
import crypto from 'crypto';

// POST /api/sessions — create or resume a session
export async function POST(request) {
  try {
    const { tenantSlug, sessionToken, originalPhotoUrl } = await request.json();

    if (!tenantSlug) {
      return NextResponse.json({ error: 'tenantSlug required' }, { status: 400 });
    }

    const supabase = getSupabaseAdmin();

    // Get tenant
    const { data: tenant } = await supabase
      .from('tenants')
      .select('id')
      .eq('slug', tenantSlug)
      .eq('active', true)
      .single();

    if (!tenant) {
      return NextResponse.json({ error: 'Tenant not found' }, { status: 404 });
    }

    // Try to resume existing session
    if (sessionToken) {
      const { data: existing } = await supabase
        .from('design_sessions')
        .select('*, design_variations(*)')
        .eq('session_token', sessionToken)
        .eq('tenant_id', tenant.id)
        .gt('expires_at', new Date().toISOString())
        .single();

      if (existing) {
        // Update last activity
        supabase.from('design_sessions')
          .update({ updated_at: new Date().toISOString() })
          .eq('id', existing.id)
          .then(() => {});

        return NextResponse.json({
          sessionId: existing.id,
          sessionToken: existing.session_token,
          originalPhotoUrl: existing.original_photo_url,
          variations: existing.design_variations || [],
          resumed: true,
        });
      }
    }

    // Create new session
    const newToken = crypto.randomBytes(16).toString('hex');
    const { data: session, error } = await supabase
      .from('design_sessions')
      .insert({
        tenant_id: tenant.id,
        session_token: newToken,
        original_photo_url: originalPhotoUrl || null,
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      sessionId: session.id,
      sessionToken: session.session_token,
      originalPhotoUrl: session.original_photo_url,
      variations: [],
      resumed: false,
    });

  } catch (error) {
    console.error('Session error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// GET /api/sessions?token=...&tenant=...
export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const token = searchParams.get('token');
  const tenantSlug = searchParams.get('tenant');

  if (!token || !tenantSlug) {
    return NextResponse.json({ error: 'token and tenant required' }, { status: 400 });
  }

  const supabase = getSupabaseAdmin();

  const { data } = await supabase
    .from('design_sessions')
    .select(`
      *,
      design_variations(
        id, mode, project_type, material_id, material_name, material_brand,
        style_id, refine_instruction, generated_photo_url,
        is_favorite, rating, cost_cents, generation_time_ms, created_at
      ),
      tenants!inner(slug)
    `)
    .eq('session_token', token)
    .eq('tenants.slug', tenantSlug)
    .gt('expires_at', new Date().toISOString())
    .single();

  if (!data) {
    return NextResponse.json({ error: 'Session not found or expired' }, { status: 404 });
  }

  return NextResponse.json({
    sessionId: data.id,
    sessionToken: data.session_token,
    originalPhotoUrl: data.original_photo_url,
    variations: (data.design_variations || []).sort((a, b) =>
      new Date(b.created_at) - new Date(a.created_at)
    ),
    favorites: (data.design_variations || []).filter(v => v.is_favorite),
  });
}

import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase';
import crypto from 'crypto';

// POST /api/share — create shareable link for a visualization
export async function POST(request) {
  const {
    tenant_id, original_photo_url, generated_photo_url,
    project_type, material_brand, material_name, style_name,
  } = await request.json();

  if (!original_photo_url || !generated_photo_url) {
    return NextResponse.json({ error: 'Both photo URLs required' }, { status: 400 });
  }

  const shareId = crypto.randomBytes(6).toString('hex'); // 12-char ID
  const supabase = getSupabaseAdmin();

  const { data, error } = await supabase
    .from('shares')
    .insert({
      id: shareId,
      tenant_id: tenant_id || null,
      original_photo_url,
      generated_photo_url,
      project_type: project_type || '',
      material_brand: material_brand || '',
      material_name: material_name || '',
      style_name: style_name || '',
      view_count: 0,
    })
    .select()
    .single();

  if (error) {
    console.error('Share creation error:', error);
    return NextResponse.json({ error: 'Failed to create share link' }, { status: 500 });
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

  return NextResponse.json({
    shareId,
    shareUrl: `${appUrl}/share/${shareId}`,
  });
}

// GET /api/share?id=... — get share data (used by share page)
export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');

  if (!id) {
    return NextResponse.json({ error: 'id required' }, { status: 400 });
  }

  const supabase = getSupabaseAdmin();

  // Increment view count
  const { data, error } = await supabase
    .from('shares')
    .select('*, tenants(company_name, slug, phone, website, colors)')
    .eq('id', id)
    .single();

  if (error || !data) {
    return NextResponse.json({ error: 'Share not found' }, { status: 404 });
  }

  // Atomic view count increment (avoids race condition with concurrent reads)
  supabase.rpc('increment_share_views', { p_share_id: id }).catch(err => {
    // Fallback to non-atomic increment if RPC doesn't exist
    supabase
      .from('shares')
      .update({ view_count: (data.view_count || 0) + 1 })
      .eq('id', id)
      .then(() => {})
      .catch(err2 => console.error('View count increment failed:', err2.message));
  });

  return NextResponse.json(data);
}

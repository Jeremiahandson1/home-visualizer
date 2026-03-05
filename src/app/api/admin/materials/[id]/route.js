import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/admin-auth';
import { getSupabaseAdmin } from '@/lib/supabase';

// PUT /api/admin/materials/[id]
export async function PUT(request, { params }) {
  const authError = requireAuth();
  if (authError) return authError;

  const body = await request.json();
  const supabase = getSupabaseAdmin();

  const allowed = [
    'category', 'subcategory', 'brand', 'name', 'color_name', 'color_hex',
    'color_family', 'type', 'swatch_url', 'description', 'ai_prompt_hint',
    'sort_order', 'active',
  ];

  const updates = {};
  allowed.forEach(f => { if (body[f] !== undefined) updates[f] = body[f]; });

  const { data, error } = await supabase
    .from('materials')
    .update(updates)
    .eq('id', params.id)
    .select('*, tenants(company_name, slug)')
    .single();

  if (error) {
    console.error('Material update error:', error);
    return NextResponse.json({ error: 'Failed to update material' }, { status: 500 });
  }

  return NextResponse.json(data);
}

// DELETE /api/admin/materials/[id]
export async function DELETE(request, { params }) {
  const authError = requireAuth();
  if (authError) return authError;

  const supabase = getSupabaseAdmin();

  const { error } = await supabase
    .from('materials')
    .delete()
    .eq('id', params.id);

  if (error) {
    console.error('Material deletion error:', error);
    return NextResponse.json({ error: 'Failed to delete material' }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}

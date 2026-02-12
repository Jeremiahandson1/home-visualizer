import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/admin-auth';
import { getSupabaseAdmin } from '@/lib/supabase';

// GET /api/admin/materials?tenant_id=...&category=siding
export async function GET(request) {
  const authError = requireAuth();
  if (authError) return authError;

  const { searchParams } = new URL(request.url);
  const tenantId = searchParams.get('tenant_id');
  const category = searchParams.get('category');

  const supabase = getSupabaseAdmin();

  let query = supabase
    .from('materials')
    .select('*, tenants(company_name, slug)')
    .order('category')
    .order('brand')
    .order('sort_order');

  if (tenantId) query = query.eq('tenant_id', tenantId);
  if (category) query = query.eq('category', category);

  const { data, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data || []);
}

// POST /api/admin/materials — create material
export async function POST(request) {
  const authError = requireAuth();
  if (authError) return authError;

  const body = await request.json();
  const {
    tenant_id, category, subcategory, brand, name, color_name, color_hex,
    color_family, type, swatch_url, description, ai_prompt_hint, sort_order,
  } = body;

  if (!category || !brand || !name) {
    return NextResponse.json({ error: 'category, brand, and name are required' }, { status: 400 });
  }

  const supabase = getSupabaseAdmin();

  const { data, error } = await supabase
    .from('materials')
    .insert({
      tenant_id: tenant_id || null,
      category,
      subcategory: subcategory || null,
      brand,
      name,
      color_name: color_name || '',
      color_hex: color_hex || null,
      color_family: color_family || 'gray',
      type: type || null,
      swatch_url: swatch_url || null,
      description: description || '',
      ai_prompt_hint: ai_prompt_hint || '',
      sort_order: sort_order || 0,
      active: true,
    })
    .select('*, tenants(company_name, slug)')
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data, { status: 201 });
}

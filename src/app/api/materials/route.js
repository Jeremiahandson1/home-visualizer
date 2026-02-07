import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase';
import { MATERIALS, filterMaterials, getBrandsForProject, getTypesForProject } from '@/lib/materials';

// GET /api/materials?tenant_id=&category=&brand=&type=&colorFamily=&search=
// Returns merged: tenant custom materials first, then built-in defaults
export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const tenantId = searchParams.get('tenant_id');
  const category = searchParams.get('category');
  const brand = searchParams.get('brand');
  const type = searchParams.get('type');
  const colorFamily = searchParams.get('colorFamily');
  const search = searchParams.get('search');
  const meta = searchParams.get('meta'); // 'brands' | 'types' — return filter options

  // Return filter metadata
  if (meta === 'brands' && category) {
    return NextResponse.json(getBrandsForProject(category));
  }
  if (meta === 'types' && category) {
    return NextResponse.json(getTypesForProject(category));
  }

  const supabase = getSupabaseAdmin();

  // Try custom materials from database first
  let customMaterials = [];
  if (tenantId) {
    let query = supabase
      .from('materials')
      .select('*')
      .eq('active', true)
      .or(`tenant_id.is.null,tenant_id.eq.${tenantId}`)
      .order('sort_order');

    if (category) query = query.eq('category', category);
    const { data } = await query;
    customMaterials = (data || []).map(m => ({
      id: m.id,
      name: m.name,
      brand: m.brand,
      type: m.category,
      color: m.color_hex || '#888',
      accent: m.color_hex || '#666',
      colorFamily: m.color_family || 'gray',
      aiHint: m.ai_prompt_hint || '',
      swatchUrl: m.swatch_url,
      description: m.description,
      custom: true,
    }));
  }

  // Get built-in materials with optional filters
  let builtIn = [];
  if (category) {
    builtIn = filterMaterials(category, { brand, type, colorFamily, search });
  } else {
    // Return all categories
    const all = {};
    for (const [cat, mats] of Object.entries(MATERIALS)) {
      all[cat] = filterMaterials(cat, { brand, type, colorFamily, search });
    }
    return NextResponse.json({
      custom: customMaterials,
      builtin: all,
      totalProducts: Object.values(all).reduce((s, a) => s + a.length, 0),
    });
  }

  // Merge: custom first, then built-in
  const merged = [...customMaterials, ...builtIn];

  return NextResponse.json(merged);
}

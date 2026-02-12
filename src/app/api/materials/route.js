import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase';
import { MATERIALS, filterMaterials, getBrandsForProject, getTypesForProject } from '@/lib/materials';

export const dynamic = 'force-dynamic';

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
  let hiddenKeys = new Set();

  if (tenantId) {
    // Fetch custom materials
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
      type: m.type || m.category,
      subcategory: m.subcategory || '',
      color: m.color_hex || '#888',
      accent: m.color_hex || '#666',
      colorFamily: m.color_family || 'gray',
      aiHint: m.ai_prompt_hint || '',
      swatchUrl: m.swatch_url,
      description: m.description,
      custom: true,
    }));

    // Fetch hidden product keys for this tenant
    const { data: hiddenRows } = await supabase
      .from('tenant_hidden_materials')
      .select('material_key')
      .eq('tenant_id', tenantId);
    hiddenKeys = new Set((hiddenRows || []).map(r => r.material_key));
  }

  // Get built-in materials with optional filters
  let builtIn = [];
  if (category) {
    builtIn = filterMaterials(category, { brand, type, colorFamily, search });
  } else {
    // Return all categories
    const all = {};
    for (const [cat, mats] of Object.entries(MATERIALS)) {
      all[cat] = filterMaterials(cat, { brand, type, colorFamily, search })
        .filter(m => !hiddenKeys.has(m.id));
    }
    return NextResponse.json({
      custom: customMaterials,
      builtin: all,
      totalProducts: Object.values(all).reduce((s, a) => s + a.length, 0),
    });
  }

  // Filter out hidden products
  if (hiddenKeys.size > 0) {
    builtIn = builtIn.filter(m => !hiddenKeys.has(m.id));
  }

  // Merge: custom first, then built-in
  const merged = [...customMaterials, ...builtIn];

  return NextResponse.json(merged);
}

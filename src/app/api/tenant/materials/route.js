import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase';
import { MATERIALS, SUBCATEGORIES, PROJECTS, COLOR_FAMILIES, TOTAL_PRODUCTS, filterMaterials } from '@/lib/materials';

export const dynamic = 'force-dynamic';

// ─── Auth helper: verify tenant API key ──────────────
async function authenticateTenant(request) {
  const authHeader = request.headers.get('authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  const apiKey = authHeader.slice(7);
  const supabase = getSupabaseAdmin();
  const { data: tenant } = await supabase
    .from('tenants')
    .select('id, slug, company_name, features')
    .eq('api_key', apiKey)
    .eq('active', true)
    .single();
  return tenant || null;
}

// ─── CORS headers ─────────────────────────────────────
function corsHeaders(request) {
  const origin = request?.headers?.get?.('origin') || '*';
  return {
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Vary': 'Origin',
  };
}

// ─── OPTIONS (CORS preflight) ─────────────────────────
export async function OPTIONS(request) {
  return new NextResponse(null, { status: 204, headers: corsHeaders(request) });
}

// ─── GET /api/tenant/materials ────────────────────────
// Returns full catalog (built-in + custom) for the authenticated tenant
// Query params: ?category=siding&subcategory=trim
export async function GET(request) {
  const tenant = await authenticateTenant(request);
  if (!tenant) {
    return NextResponse.json({ error: 'Invalid API key' }, { status: 401, headers: corsHeaders(request) });
  }

  const { searchParams } = new URL(request.url);
  const category = searchParams.get('category');

  const supabase = getSupabaseAdmin();

  // Fetch tenant's custom materials
  let query = supabase
    .from('materials')
    .select('*')
    .eq('active', true)
    .or(`tenant_id.is.null,tenant_id.eq.${tenant.id}`)
    .order('sort_order');

  if (category) query = query.eq('category', category);
  const { data: customRows } = await query;

  const custom = (customRows || []).map(m => ({
    id: m.id,
    name: m.name,
    brand: m.brand,
    type: m.type || m.category,
    subcategory: m.subcategory || '',
    color: m.color_hex || '#888',
    accent: m.color_hex || '#666',
    colorFamily: m.color_family || 'gray',
    aiHint: m.ai_prompt_hint || '',
    description: m.description || '',
    active: m.active,
    tenant_id: m.tenant_id,
    _source: 'custom',
    _dbId: m.id,
  }));

  // Fetch tenant's hidden products list
  const { data: hiddenRows } = await supabase
    .from('tenant_hidden_materials')
    .select('material_key')
    .eq('tenant_id', tenant.id);
  const hiddenKeys = new Set((hiddenRows || []).map(r => r.material_key));

  // Build built-in catalog
  let builtin = [];
  if (category) {
    builtin = (MATERIALS[category] || []).map(m => ({
      ...m,
      _source: 'builtin',
      _hidden: hiddenKeys.has(m.id),
    }));
  } else {
    // All categories
    for (const [cat, mats] of Object.entries(MATERIALS)) {
      builtin.push(...mats.map(m => ({
        ...m,
        category: cat,
        _source: 'builtin',
        _hidden: hiddenKeys.has(m.id),
      })));
    }
  }

  return NextResponse.json({
    tenant: { id: tenant.id, slug: tenant.slug, company: tenant.company_name },
    categories: PROJECTS.map(p => ({ id: p.id, label: p.label, icon: p.icon })),
    subcategories: SUBCATEGORIES,
    colorFamilies: COLOR_FAMILIES,
    totalBuiltIn: TOTAL_PRODUCTS,
    custom,
    builtin,
    hiddenKeys: [...hiddenKeys],
  }, { headers: corsHeaders(request) });
}

// ─── POST /api/tenant/materials ───────────────────────
// Create a custom material for this tenant
export async function POST(request) {
  const tenant = await authenticateTenant(request);
  if (!tenant) {
    return NextResponse.json({ error: 'Invalid API key' }, { status: 401, headers: corsHeaders(request) });
  }

  const body = await request.json();
  const {
    category, subcategory, brand, name, color_name, color_hex,
    color_family, type, swatch_url, description, ai_prompt_hint, sort_order,
  } = body;

  if (!category || !brand || !name) {
    return NextResponse.json({ error: 'category, brand, and name are required' }, { status: 400, headers: corsHeaders(request) });
  }

  const supabase = getSupabaseAdmin();

  const { data, error } = await supabase
    .from('materials')
    .insert({
      tenant_id: tenant.id,
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
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500, headers: corsHeaders(request) });
  }

  return NextResponse.json(data, { status: 201, headers: corsHeaders(request) });
}

// ─── PUT /api/tenant/materials ────────────────────────
// Update a custom material OR toggle hide/show a built-in product
// Body: { action: 'update', id: '...', ... } or { action: 'hide', material_key: '...' } or { action: 'show', material_key: '...' }
export async function PUT(request) {
  const tenant = await authenticateTenant(request);
  if (!tenant) {
    return NextResponse.json({ error: 'Invalid API key' }, { status: 401, headers: corsHeaders(request) });
  }

  const body = await request.json();
  const supabase = getSupabaseAdmin();

  // Hide a built-in product
  if (body.action === 'hide' && body.material_key) {
    const { error } = await supabase
      .from('tenant_hidden_materials')
      .upsert({ tenant_id: tenant.id, material_key: body.material_key }, { onConflict: 'tenant_id,material_key' });

    if (error) return NextResponse.json({ error: error.message }, { status: 500, headers: corsHeaders(request) });
    return NextResponse.json({ success: true, hidden: true }, { headers: corsHeaders(request) });
  }

  // Show (unhide) a built-in product
  if (body.action === 'show' && body.material_key) {
    const { error } = await supabase
      .from('tenant_hidden_materials')
      .delete()
      .eq('tenant_id', tenant.id)
      .eq('material_key', body.material_key);

    if (error) return NextResponse.json({ error: error.message }, { status: 500, headers: corsHeaders(request) });
    return NextResponse.json({ success: true, hidden: false }, { headers: corsHeaders(request) });
  }

  // Update a custom material
  if (body.action === 'update' && body.id) {
    // Verify ownership
    const { data: existing } = await supabase
      .from('materials')
      .select('tenant_id')
      .eq('id', body.id)
      .single();

    if (!existing || existing.tenant_id !== tenant.id) {
      return NextResponse.json({ error: 'Not found or not yours' }, { status: 404, headers: corsHeaders(request) });
    }

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
      .eq('id', body.id)
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500, headers: corsHeaders(request) });
    return NextResponse.json(data, { headers: corsHeaders(request) });
  }

  return NextResponse.json({ error: 'Invalid action' }, { status: 400, headers: corsHeaders(request) });
}

// ─── DELETE /api/tenant/materials ─────────────────────
// Delete a custom material: ?id=...
export async function DELETE(request) {
  const tenant = await authenticateTenant(request);
  if (!tenant) {
    return NextResponse.json({ error: 'Invalid API key' }, { status: 401, headers: corsHeaders(request) });
  }

  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');
  if (!id) {
    return NextResponse.json({ error: 'id required' }, { status: 400, headers: corsHeaders(request) });
  }

  const supabase = getSupabaseAdmin();

  // Verify ownership
  const { data: existing } = await supabase
    .from('materials')
    .select('tenant_id')
    .eq('id', id)
    .single();

  if (!existing || existing.tenant_id !== tenant.id) {
    return NextResponse.json({ error: 'Not found or not yours' }, { status: 404, headers: corsHeaders(request) });
  }

  const { error } = await supabase.from('materials').delete().eq('id', id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500, headers: corsHeaders(request) });

  return NextResponse.json({ success: true }, { headers: corsHeaders(request) });
}

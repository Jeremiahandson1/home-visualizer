import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/admin-auth';
import { getSupabaseAdmin } from '@/lib/supabase';

// GET /api/admin/tenants — list all tenants
export async function GET() {
  const authError = requireAuth();
  if (authError) return authError;

  const supabase = getSupabaseAdmin();
  const currentMonth = new Date().toISOString().slice(0, 7);

  const { data: tenants, error } = await supabase
    .from('tenants')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Tenants query error:', error);
    return NextResponse.json({ error: 'Failed to fetch tenants' }, { status: 500 });
  }

  // Get usage for each tenant this month
  const { data: usage, error: usageError } = await supabase
    .from('monthly_usage')
    .select('tenant_id, generation_count')
    .eq('month', currentMonth);

  if (usageError) console.error('Usage query failed:', usageError.message);
  const usageMap = {};
  (usage || []).forEach(u => { usageMap[u.tenant_id] = u.generation_count; });

  // Get lead counts per tenant
  const { data: leadCounts, error: leadsError } = await supabase
    .from('leads')
    .select('tenant_id');

  if (leadsError) console.error('Lead counts query failed:', leadsError.message);
  const leadMap = {};
  (leadCounts || []).forEach(l => {
    leadMap[l.tenant_id] = (leadMap[l.tenant_id] || 0) + 1;
  });

  const enriched = tenants.map(t => ({
    ...t,
    monthGenerations: usageMap[t.id] || 0,
    totalLeads: leadMap[t.id] || 0,
  }));

  return NextResponse.json(enriched);
}

// POST /api/admin/tenants — create new tenant
export async function POST(request) {
  const authError = requireAuth();
  if (authError) return authError;

  const body = await request.json();
  const {
    slug, company_name, tagline, phone, email, website,
    logo_url, colors, features, lead_notify_email,
    crm_webhook_url, plan, monthly_gen_limit,
  } = body;

  if (!slug || !company_name) {
    return NextResponse.json({ error: 'slug and company_name are required' }, { status: 400 });
  }

  // Sanitize slug
  const cleanSlug = slug.toLowerCase().replace(/[^a-z0-9-]/g, '-').replace(/-+/g, '-');

  const supabase = getSupabaseAdmin();

  const { data, error } = await supabase
    .from('tenants')
    .insert({
      slug: cleanSlug,
      company_name,
      tagline: tagline || '',
      phone: phone || '',
      email: email || '',
      website: website || '',
      logo_url: logo_url || null,
      colors: colors || undefined,
      features: features || undefined,
      lead_notify_email: lead_notify_email || email || '',
      crm_webhook_url: crm_webhook_url || null,
      plan: plan || 'starter',
      monthly_gen_limit: monthly_gen_limit || 50,
      active: true,
    })
    .select()
    .single();

  if (error) {
    if (error.code === '23505') {
      return NextResponse.json({ error: 'A tenant with this slug already exists' }, { status: 409 });
    }
    console.error('Tenant creation error:', error);
    return NextResponse.json({ error: 'Failed to create tenant' }, { status: 500 });
  }

  return NextResponse.json(data, { status: 201 });
}

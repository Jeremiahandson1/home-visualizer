import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/admin-auth';
import { getSupabaseAdmin } from '@/lib/supabase';

// GET /api/admin/tenants/[id]
export async function GET(request, { params }) {
  const authError = requireAuth();
  if (authError) return authError;

  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from('tenants')
    .select('*')
    .eq('id', params.id)
    .single();

  if (error || !data) {
    return NextResponse.json({ error: 'Tenant not found' }, { status: 404 });
  }

  // Get lead count and recent leads
  const [leadCountResult, recentLeadsResult] = await Promise.all([
    supabase.from('leads').select('*', { count: 'exact', head: true }).eq('tenant_id', params.id),
    supabase.from('leads').select('*').eq('tenant_id', params.id)
      .order('created_at', { ascending: false }).limit(20),
  ]);
  const leadCount = leadCountResult.count;
  const recentLeads = recentLeadsResult.data;

  // Get usage history (last 6 months)
  const { data: usageHistory } = await supabase
    .from('monthly_usage')
    .select('*')
    .eq('tenant_id', params.id)
    .order('month', { ascending: false })
    .limit(6);

  return NextResponse.json({
    ...data,
    leadCount: leadCount || 0,
    recentLeads: recentLeads || [],
    usageHistory: usageHistory || [],
  });
}

// PUT /api/admin/tenants/[id]
export async function PUT(request, { params }) {
  const authError = requireAuth();
  if (authError) return authError;

  const body = await request.json();
  const supabase = getSupabaseAdmin();

  // Only update fields that were provided
  const updates = {};
  const allowed = [
    'company_name', 'tagline', 'phone', 'email', 'website',
    'logo_url', 'colors', 'features', 'lead_notify_email',
    'crm_webhook_url', 'plan', 'monthly_gen_limit', 'active',
  ];

  allowed.forEach(field => {
    if (body[field] !== undefined) updates[field] = body[field];
  });

  updates.updated_at = new Date().toISOString();

  // Set gen limits based on plan if plan changed
  if (body.plan && !body.monthly_gen_limit) {
    const limits = { starter: 50, pro: 200, enterprise: 500 };
    updates.monthly_gen_limit = limits[body.plan] || 50;
  }

  const { data, error } = await supabase
    .from('tenants')
    .update(updates)
    .eq('id', params.id)
    .select()
    .single();

  if (error) {
    console.error('Tenant update error:', error);
    return NextResponse.json({ error: 'Failed to update tenant' }, { status: 500 });
  }

  return NextResponse.json(data);
}

// DELETE /api/admin/tenants/[id] — soft delete (deactivate)
export async function DELETE(request, { params }) {
  const authError = requireAuth();
  if (authError) return authError;

  const supabase = getSupabaseAdmin();

  const { data, error } = await supabase
    .from('tenants')
    .update({ active: false, updated_at: new Date().toISOString() })
    .eq('id', params.id)
    .select()
    .single();

  if (error) {
    console.error('Tenant deactivation error:', error);
    return NextResponse.json({ error: 'Failed to deactivate tenant' }, { status: 500 });
  }

  return NextResponse.json({ success: true, tenant: data });
}

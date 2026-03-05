import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/admin-auth';
import { getSupabaseAdmin } from '@/lib/supabase';

// GET /api/admin/leads?tenant=slug&status=new&page=1
export async function GET(request) {
  const authError = requireAuth();
  if (authError) return authError;

  const { searchParams } = new URL(request.url);
  const tenantSlug = searchParams.get('tenant');
  const status = searchParams.get('status');
  const page = Math.max(1, parseInt(searchParams.get('page') || '1') || 1);
  const perPage = 25;

  const supabase = getSupabaseAdmin();

  let query = supabase
    .from('leads')
    .select('*, tenants(company_name, slug)', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range((page - 1) * perPage, page * perPage - 1);

  if (tenantSlug) {
    const { data: tenant } = await supabase
      .from('tenants').select('id').eq('slug', tenantSlug).single();
    if (tenant) query = query.eq('tenant_id', tenant.id);
  }

  if (status && status !== 'all') {
    query = query.eq('status', status);
  }

  const { data, count, error } = await query;

  if (error) {
    console.error('Leads query error:', error);
    return NextResponse.json({ error: 'Failed to fetch leads' }, { status: 500 });
  }

  return NextResponse.json({
    leads: data || [],
    total: count || 0,
    page,
    perPage,
    totalPages: Math.ceil((count || 0) / perPage),
  });
}

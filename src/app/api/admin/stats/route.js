import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/admin-auth';
import { getSupabaseAdmin } from '@/lib/supabase';

export async function GET() {
  const authError = requireAuth();
  if (authError) return authError;

  const supabase = getSupabaseAdmin();
  const currentMonth = new Date().toISOString().slice(0, 7);

  // Run all queries in parallel
  const [
    { count: totalTenants },
    { count: activeTenants },
    { count: totalLeads },
    { count: monthLeads },
    { data: monthUsage },
    { data: recentLeads },
    { data: topTenants },
  ] = await Promise.all([
    supabase.from('tenants').select('*', { count: 'exact', head: true }),
    supabase.from('tenants').select('*', { count: 'exact', head: true }).eq('active', true),
    supabase.from('leads').select('*', { count: 'exact', head: true }),
    supabase.from('leads').select('*', { count: 'exact', head: true })
      .gte('created_at', `${currentMonth}-01`),
    supabase.from('monthly_usage').select('generation_count, total_cost_cents')
      .eq('month', currentMonth),
    supabase.from('leads').select('id, name, email, project_type, status, created_at, tenants(company_name)')
      .order('created_at', { ascending: false })
      .limit(10),
    supabase.from('monthly_usage').select('generation_count, total_cost_cents, tenants(company_name, slug)')
      .eq('month', currentMonth)
      .order('generation_count', { ascending: false })
      .limit(5),
  ]);

  const totalGens = (monthUsage || []).reduce((sum, u) => sum + (u.generation_count || 0), 0);
  const totalCost = (monthUsage || []).reduce((sum, u) => sum + (u.total_cost_cents || 0), 0);

  return NextResponse.json({
    overview: {
      totalTenants: totalTenants || 0,
      activeTenants: activeTenants || 0,
      totalLeads: totalLeads || 0,
      monthLeads: monthLeads || 0,
      monthGenerations: totalGens,
      monthCostCents: totalCost,
      currentMonth,
    },
    recentLeads: recentLeads || [],
    topTenants: (topTenants || []).map(t => ({
      company: t.tenants?.company_name,
      slug: t.tenants?.slug,
      generations: t.generation_count,
      costCents: t.total_cost_cents,
    })),
  });
}

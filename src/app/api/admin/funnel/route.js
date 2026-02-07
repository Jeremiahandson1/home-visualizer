import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase';

// GET /api/admin/funnel?tenant=uuid&range=30
// Also accepts: ?tenant_id=uuid&days=30 (legacy)
export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const tenantId = searchParams.get('tenant') || searchParams.get('tenant_id') || null;
  const days = parseInt(searchParams.get('range') || searchParams.get('days') || '30');

  const supabase = getSupabaseAdmin();
  const since = new Date(Date.now() - days * 86400000).toISOString();

  // Count events — supports all-tenants or single tenant
  async function countEvents(eventType) {
    let q = supabase
      .from('analytics_events')
      .select('*', { count: 'exact', head: true })
      .eq('event_type', eventType)
      .gte('created_at', since);
    if (tenantId && tenantId !== 'all') q = q.eq('tenant_id', tenantId);
    const { count } = await q;
    return count || 0;
  }

  async function countLeads() {
    let q = supabase
      .from('leads')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', since);
    if (tenantId && tenantId !== 'all') q = q.eq('tenant_id', tenantId);
    const { count } = await q;
    return count || 0;
  }

  async function countGenerations() {
    let q = supabase
      .from('generations')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', since);
    if (tenantId && tenantId !== 'all') q = q.eq('tenant_id', tenantId);
    const { count } = await q;
    return count || 0;
  }

  async function getProviderBreakdown() {
    let q = supabase.from('generations').select('provider').gte('created_at', since);
    if (tenantId && tenantId !== 'all') q = q.eq('tenant_id', tenantId);
    const { data } = await q;
    if (!data) return {};
    const counts = {};
    data.forEach(row => { const p = row.provider || 'unknown'; counts[p] = (counts[p] || 0) + 1; });
    return counts;
  }

  try {
    const [pageViews, uploads, generations, refinements, leads, shares, favorites, providerBreakdown] =
      await Promise.all([
        countEvents('page_view'),
        countEvents('upload'),
        countGenerations(),
        countEvents('refine'),
        countLeads(),
        countEvents('share'),
        countEvents('favorite'),
        getProviderBreakdown(),
      ]);

    return NextResponse.json({
      pageViews,
      uploads,
      generations,
      refinements,
      leads,
      shares,
      favorites,
      providerBreakdown,
      // Computed rates
      upload_to_gen_pct: uploads > 0 ? Math.round(generations / uploads * 100) : 0,
      gen_to_lead_pct: generations > 0 ? Math.round(leads / generations * 100) : 0,
      range: days,
      since,
    });
  } catch (error) {
    console.error('Funnel error:', error);
    return NextResponse.json({ error: 'Failed to load analytics' }, { status: 500 });
  }
}

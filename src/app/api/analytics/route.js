import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase';
import { requireAuth } from '@/lib/admin-auth';

// POST /api/analytics — track an event (public, fire-and-forget)
export async function POST(request) {
  const { tenant_id, event_type, metadata } = await request.json();

  const validEvents = ['page_view', 'upload', 'generate', 'share', 'lead_submit', 'embed_load'];

  if (!event_type || !validEvents.includes(event_type)) {
    return NextResponse.json({ error: `Invalid event. Must be: ${validEvents.join(', ')}` }, { status: 400 });
  }

  const supabase = getSupabaseAdmin();

  const { error } = await supabase
    .from('analytics_events')
    .insert({
      tenant_id: tenant_id || null,
      event_type,
      metadata: metadata || {},
      user_agent: request.headers.get('user-agent') || '',
      referrer: request.headers.get('referer') || '',
    });

  if (error) {
    console.error('Analytics insert error:', error);
    // Don't fail the request — analytics should be fire-and-forget
  }

  return NextResponse.json({ ok: true });
}

// GET /api/analytics?tenant_id=...&days=30 — get analytics summary (admin only)
export async function GET(request) {
  const authError = requireAuth();
  if (authError) return authError;

  const { searchParams } = new URL(request.url);
  const tenantId = searchParams.get('tenant_id');
  const days = parseInt(searchParams.get('days') || '30');

  const supabase = getSupabaseAdmin();
  const since = new Date(Date.now() - days * 86400000).toISOString();

  let query = supabase
    .from('analytics_events')
    .select('event_type, created_at')
    .gte('created_at', since);

  if (tenantId) {
    query = query.eq('tenant_id', tenantId);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Analytics query error:', error);
    return NextResponse.json({ error: 'Failed to fetch analytics' }, { status: 500 });
  }

  // Aggregate by event type
  const counts = {};
  const daily = {};

  (data || []).forEach(e => {
    counts[e.event_type] = (counts[e.event_type] || 0) + 1;

    const day = e.created_at.slice(0, 10);
    if (!daily[day]) daily[day] = {};
    daily[day][e.event_type] = (daily[day][e.event_type] || 0) + 1;
  });

  // Conversion funnel
  const funnel = {
    pageViews: counts.page_view || 0,
    uploads: counts.upload || 0,
    generations: counts.generate || 0,
    shares: counts.share || 0,
    leads: counts.lead_submit || 0,
    uploadRate: counts.page_view ? ((counts.upload || 0) / counts.page_view * 100).toFixed(1) : '0',
    generateRate: counts.upload ? ((counts.generate || 0) / counts.upload * 100).toFixed(1) : '0',
    leadRate: counts.generate ? ((counts.lead_submit || 0) / counts.generate * 100).toFixed(1) : '0',
    overallRate: counts.page_view ? ((counts.lead_submit || 0) / counts.page_view * 100).toFixed(1) : '0',
  };

  return NextResponse.json({ counts, daily, funnel, days });
}

import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase';

// GET /api/analytics/stats?tenant_id=uuid
// Returns public-safe counts for social proof display
export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const tenantId = searchParams.get('tenant_id');

  const supabase = getSupabaseAdmin();
  const weekAgo = new Date(Date.now() - 7 * 86400000).toISOString();

  let totalQuery = supabase
    .from('generations')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'success');

  let weekQuery = supabase
    .from('generations')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'success')
    .gte('created_at', weekAgo);

  if (tenantId) {
    totalQuery = totalQuery.eq('tenant_id', tenantId);
    weekQuery = weekQuery.eq('tenant_id', tenantId);
  }

  const [{ count: total }, { count: week }] = await Promise.all([totalQuery, weekQuery]);

  return NextResponse.json({
    totalDesigns: total || 0,
    thisWeek: week || 0,
  });
}

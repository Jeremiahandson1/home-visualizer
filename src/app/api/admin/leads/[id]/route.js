import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/admin-auth';
import { getSupabaseAdmin } from '@/lib/supabase';

// PUT /api/admin/leads/[id] — update lead status
export async function PUT(request, { params }) {
  const authError = requireAuth();
  if (authError) return authError;

  const { status } = await request.json();
  const valid = ['new', 'contacted', 'quoted', 'won', 'lost'];

  if (!valid.includes(status)) {
    return NextResponse.json({ error: `Invalid status. Must be: ${valid.join(', ')}` }, { status: 400 });
  }

  const supabase = getSupabaseAdmin();

  const { data, error } = await supabase
    .from('leads')
    .update({ status })
    .eq('id', params.id)
    .select()
    .single();

  if (error) {
    console.error('Lead status update error:', error);
    return NextResponse.json({ error: 'Failed to update lead' }, { status: 500 });
  }

  return NextResponse.json(data);
}

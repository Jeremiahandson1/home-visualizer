import { NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { getSupabaseAdmin } from '@/lib/supabase';

// POST /api/billing/portal — create customer portal session
export async function POST(request) {
  try {
    const { tenant_id } = await request.json();

    if (!tenant_id) {
      return NextResponse.json({ error: 'tenant_id required' }, { status: 400 });
    }

    const supabase = getSupabaseAdmin();
    const { data: tenant } = await supabase
      .from('tenants')
      .select('stripe_customer_id, company_name')
      .eq('id', tenant_id)
      .single();

    if (!tenant?.stripe_customer_id) {
      return NextResponse.json({ error: 'No Stripe customer found for this tenant' }, { status: 404 });
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

    const session = await stripe.billingPortal.sessions.create({
      customer: tenant.stripe_customer_id,
      return_url: `${appUrl}/admin/tenants`,
    });

    return NextResponse.json({ url: session.url });
  } catch (err) {
    console.error('Portal error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

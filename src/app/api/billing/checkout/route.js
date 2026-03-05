import { NextResponse } from 'next/server';
import { getStripe, PLANS } from '@/lib/stripe';

// POST /api/billing/checkout — create checkout session (subscription or one-time)
export async function POST(request) {
  try {
    const { plan, model, company_name, email, slug } = await request.json();

    if (!plan || !PLANS[plan]) {
      return NextResponse.json({ error: 'Invalid plan' }, { status: 400 });
    }
    if (!company_name || !email || !slug) {
      return NextResponse.json({ error: 'company_name, email, and slug are required' }, { status: 400 });
    }

    const planData = PLANS[plan];

    if (!planData.priceId) {
      return NextResponse.json({ error: 'Stripe price not configured for this plan. Run seed script first.' }, { status: 500 });
    }

    const cleanSlug = slug.toLowerCase().replace(/[^a-z0-9-]/g, '-').replace(/-+/g, '-');
    const appUrl = process.env.NEXT_PUBLIC_BASE_URL || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const isLicense = planData.mode === 'payment';

    // Build session config — differs for subscription vs one-time
    const sessionConfig = {
      mode: isLicense ? 'payment' : 'subscription',
      payment_method_types: ['card'],
      customer_email: email,
      line_items: [
        {
          price: planData.priceId,
          quantity: 1,
        },
      ],
      metadata: {
        plan,
        model: isLicense ? 'license' : 'saas',
        company_name,
        slug: cleanSlug,
        email,
      },
      success_url: `${appUrl}/signup/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${appUrl}/signup?canceled=true&model=${isLicense ? 'license' : 'saas'}`,
      allow_promotion_codes: true,
    };

    // Subscription-specific config
    if (!isLicense) {
      sessionConfig.subscription_data = {
        metadata: {
          plan,
          slug: cleanSlug,
        },
      };
    }

    // One-time payment — generate invoice for receipt
    if (isLicense) {
      sessionConfig.invoice_creation = {
        enabled: true,
      };
    }

    const session = await getStripe().checkout.sessions.create(sessionConfig);

    return NextResponse.json({ url: session.url });
  } catch (err) {
    console.error('Checkout error:', err);
    return NextResponse.json({ error: 'Checkout session creation failed' }, { status: 500 });
  }
}

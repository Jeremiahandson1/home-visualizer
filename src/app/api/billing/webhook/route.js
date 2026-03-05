import { NextResponse } from 'next/server';
import { getStripe, getPlanByPriceId } from '@/lib/stripe';
import { getSupabaseAdmin } from '@/lib/supabase';
import { sendWelcomeEmail } from '@/lib/email';

// Disable body parsing — Stripe needs raw body for signature verification
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
// Next.js App Router: request.text() works correctly for raw body access

export async function POST(request) {
  const body = await request.text();
  const sig = request.headers.get('stripe-signature');
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!webhookSecret) {
    console.error('STRIPE_WEBHOOK_SECRET not configured');
    return NextResponse.json({ error: 'Webhook not configured' }, { status: 500 });
  }

  let event;

  try {
    event = getStripe().webhooks.constructEvent(
      body,
      sig,
      webhookSecret
    );
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message);
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  const supabase = getSupabaseAdmin();

  try {
    switch (event.type) {
      // ─── NEW SUBSCRIPTION (checkout completed) ───────
      case 'checkout.session.completed': {
        const session = event.data.object;
        if (session.mode !== 'subscription') break;

        const { plan, company_name, slug, email } = session.metadata || {};
        if (!slug || !plan) {
          console.error('Webhook missing required metadata:', { slug, plan, company_name });
          break;
        }
        const customerId = session.customer;
        const subscriptionId = session.subscription;

        // Check if tenant already exists (idempotency)
        const { data: existing } = await supabase
          .from('tenants')
          .select('id')
          .eq('slug', slug)
          .single();

        if (existing) {
          // Update existing tenant with Stripe info
          await supabase
            .from('tenants')
            .update({
              stripe_customer_id: customerId,
              stripe_subscription_id: subscriptionId,
              plan,
              active: true,
              updated_at: new Date().toISOString(),
            })
            .eq('id', existing.id);
          break;
        }

        // Auto-provision new tenant
        const { error: insertError } = await supabase
          .from('tenants')
          .insert({
            slug,
            company_name,
            email,
            lead_notify_email: email,
            plan,
            monthly_gen_limit: plan === 'starter' ? 50 : plan === 'pro' ? 200 : 500,
            active: true,
            stripe_customer_id: customerId,
            stripe_subscription_id: subscriptionId,
            colors: {
              primary: '#B8860B', primaryDark: '#8B6508', accent: '#1C1917',
              background: '#FDFBF7', surface: '#FFFFFF', text: '#1C1917',
              muted: '#78716C', border: '#E7E5E4',
            },
            features: {
              siding: true, roofing: true, deck: true,
              windows: true, addition: true, exterior: true,
            },
          });

        if (insertError) {
          console.error('Failed to provision tenant:', insertError);
        } else {
          console.log(`✓ Tenant provisioned: ${company_name} (${slug}) on ${plan} plan`);
          // Send welcome email with setup instructions
          sendWelcomeEmail({ email, company_name, slug, plan }).catch(err =>
            console.error('Welcome email failed:', err)
          );
        }
        break;
      }

      // ─── SUBSCRIPTION UPDATED (plan change) ─────────
      case 'customer.subscription.updated': {
        const subscription = event.data.object;
        const priceId = subscription.items.data[0]?.price?.id;
        const plan = getPlanByPriceId(priceId);

        if (!plan) break;

        const { data: tenant } = await supabase
          .from('tenants')
          .select('id')
          .eq('stripe_subscription_id', subscription.id)
          .single();

        if (tenant) {
          await supabase
            .from('tenants')
            .update({
              plan: plan.id,
              monthly_gen_limit: plan.genLimit,
              active: subscription.status === 'active' || subscription.status === 'trialing',
              updated_at: new Date().toISOString(),
            })
            .eq('id', tenant.id);

          console.log(`✓ Tenant updated to ${plan.name} plan`);
        }
        break;
      }

      // ─── SUBSCRIPTION CANCELED ──────────────────────
      case 'customer.subscription.deleted': {
        const subscription = event.data.object;

        const { data: tenant } = await supabase
          .from('tenants')
          .select('id, company_name')
          .eq('stripe_subscription_id', subscription.id)
          .single();

        if (tenant) {
          await supabase
            .from('tenants')
            .update({
              active: false,
              updated_at: new Date().toISOString(),
            })
            .eq('id', tenant.id);

          console.log(`✗ Tenant deactivated: ${tenant.company_name}`);
        }
        break;
      }

      // ─── PAYMENT FAILED ─────────────────────────────
      case 'invoice.payment_failed': {
        const invoice = event.data.object;
        const customerId = invoice.customer;

        const { data: tenant } = await supabase
          .from('tenants')
          .select('id, company_name, email')
          .eq('stripe_customer_id', customerId)
          .single();

        if (tenant) {
          console.warn(`⚠ Payment failed for ${tenant.company_name} (${tenant.email})`);
          // Could trigger email notification here via Resend
        }
        break;
      }

      default:
        // Unhandled event type
        break;
    }
  } catch (err) {
    console.error(`Webhook handler error (${event.type}):`, err);
    return NextResponse.json({ error: 'Webhook handler failed' }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}

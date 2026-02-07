// ═══════════════════════════════════════════════════════
// STRIPE BILLING — Configuration & Helpers
// ═══════════════════════════════════════════════════════

import Stripe from 'stripe';

// Lazy initialization — Stripe SDK crashes if no key is provided,
// but Next.js tries to evaluate this at build time when env vars aren't available.
let _stripe = null;
export function getStripe() {
  if (!_stripe) {
    if (!process.env.STRIPE_SECRET_KEY) {
      throw new Error('STRIPE_SECRET_KEY is not set');
    }
    _stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: '2024-12-18.acacia',
    });
  }
  return _stripe;
}

// Keep backward compat — but only use in runtime code
export const stripe = typeof process !== 'undefined' && process.env.STRIPE_SECRET_KEY
  ? new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: '2024-12-18.acacia' })
  : null;

// ─── PLAN DEFINITIONS ────────────────────────────────
// After creating products in Stripe Dashboard, paste price IDs here.
// Or use the seed script below to create them programmatically.

export const PLANS = {
  starter: {
    name: 'Starter',
    price: 14900,         // $149 in cents
    priceId: process.env.STRIPE_PRICE_STARTER || '',
    genLimit: 50,
    mode: 'subscription',
  },
  pro: {
    name: 'Pro',
    price: 34900,        // $349
    priceId: process.env.STRIPE_PRICE_PRO || '',
    genLimit: 200,
    mode: 'subscription',
    popular: true,
  },
  enterprise: {
    name: 'Enterprise',
    price: 74900,        // $749
    priceId: process.env.STRIPE_PRICE_ENTERPRISE || '',
    genLimit: 999,
    mode: 'subscription',
  },
  // One-time licenses
  'license-starter': {
    name: 'Starter License',
    price: 249700,       // $2,497
    priceId: process.env.STRIPE_PRICE_LICENSE_STARTER || '',
    genLimit: 999,
    mode: 'payment',
  },
  'license-pro': {
    name: 'Pro License',
    price: 499700,       // $4,997
    priceId: process.env.STRIPE_PRICE_LICENSE_PRO || '',
    genLimit: 999,
    mode: 'payment',
    popular: true,
  },
  'license-agency': {
    name: 'Agency License',
    price: 999700,       // $9,997
    priceId: process.env.STRIPE_PRICE_LICENSE_AGENCY || '',
    genLimit: 999,
    mode: 'payment',
  },
};

// ─── HELPER: Get plan from Stripe price ID ───────────
export function getPlanByPriceId(priceId) {
  for (const [key, plan] of Object.entries(PLANS)) {
    if (plan.priceId === priceId) return { id: key, ...plan };
  }
  return null;
}

// ─── HELPER: Get plan from plan name ─────────────────
export function getPlan(planId) {
  return PLANS[planId] ? { id: planId, ...PLANS[planId] } : null;
}

// ─── SEED SCRIPT ─────────────────────────────────────
// Run once to create Stripe products + prices.
// node -e "require('./src/lib/stripe').seedStripeProducts()"
//
// After running, copy the price IDs into your .env file.

export async function seedStripeProducts() {
  console.log('Creating Stripe products...\n');

  for (const [key, plan] of Object.entries(PLANS)) {
    const isLicense = plan.mode === 'payment';

    const product = await stripe.products.create({
      name: `HomeVisualizer ${plan.name}`,
      description: isLicense
        ? `One-time license — ${plan.name}`
        : `${plan.genLimit} AI visualizations/month for contractors`,
      metadata: { plan: key, mode: plan.mode },
    });

    const priceConfig = {
      product: product.id,
      unit_amount: plan.price,
      currency: 'usd',
      metadata: { plan: key },
    };

    // Add recurring interval only for subscriptions
    if (!isLicense) {
      priceConfig.recurring = { interval: 'month' };
    }

    const price = await stripe.prices.create(priceConfig);

    const envKey = key.toUpperCase().replace(/-/g, '_');
    console.log(`${plan.name} (${plan.mode}):`);
    console.log(`  Product: ${product.id}`);
    console.log(`  Price:   ${price.id}  ← STRIPE_PRICE_${envKey}`);
    console.log('');
  }

  console.log('Done! Add price IDs to your .env file.');
}

// ═══════════════════════════════════════════════════════
// STRIPE BILLING — Configuration & Helpers
// ═══════════════════════════════════════════════════════

import Stripe from 'stripe';

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

export const stripe = typeof process !== 'undefined' && process.env.STRIPE_SECRET_KEY
  ? new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: '2024-12-18.acacia' })
  : null;

export const PLANS = {
  monthly: {
    name: 'Monthly',
    price: 4900,
    priceId: process.env.STRIPE_PRICE_MONTHLY || '',
    genLimit: 200,
    mode: 'subscription',
    popular: true,
  },
  license: {
    name: 'One-Time License',
    price: 149700,
    priceId: process.env.STRIPE_PRICE_LICENSE || '',
    genLimit: 999,
    mode: 'payment',
    popular: true,
  },
};

export function getPlanByPriceId(priceId) {
  for (const [key, plan] of Object.entries(PLANS)) {
    if (plan.priceId === priceId) return { id: key, ...plan };
  }
  return null;
}

export function getPlan(planId) {
  return PLANS[planId] ? { id: planId, ...PLANS[planId] } : null;
}

export async function seedStripeProducts() {
  console.log('Creating Stripe products...\n');

  for (const [key, plan] of Object.entries(PLANS)) {
    const isLicense = plan.mode === 'payment';

    const product = await stripe.products.create({
      name: `Twomiah Vision ${plan.name}`,
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

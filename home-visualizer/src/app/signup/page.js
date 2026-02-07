'use client';

import { useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';

const PLANS = [
  {
    id: 'starter',
    name: 'Starter',
    price: 149,
    genLimit: '50',
    features: [
      'Your branding & logo',
      '50 AI visualizations/mo',
      '179+ real products & 12 styles',
      'Lead capture + email alerts',
      'Before/after sharing',
      'Embed on your website',
    ],
  },
  {
    id: 'pro',
    name: 'Pro',
    price: 349,
    genLimit: '200',
    popular: true,
    features: [
      'Everything in Starter',
      '200 AI visualizations/mo',
      'Analytics dashboard',
      'CRM webhook (Zapier/Jobber)',
      'Custom materials library',
      'A/B testing + priority support',
    ],
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    price: 749,
    genLimit: 'Unlimited',
    features: [
      'Everything in Pro',
      'Unlimited visualizations',
      'No "Powered by" badge',
      'API access',
      'White-glove onboarding',
      'Dedicated support',
    ],
  },
];

const LICENSES = [
  {
    id: 'license-starter',
    name: 'Starter License',
    price: 2497,
    features: ['Full source code', 'All products & styles', 'Lead capture', 'Deploy on your server', '90 days support'],
  },
  {
    id: 'license-pro',
    name: 'Pro License',
    price: 4997,
    popular: true,
    features: ['Everything in Starter', 'Analytics + webhooks', 'We deploy for you', '6 months support'],
  },
  {
    id: 'license-agency',
    name: 'Agency License',
    price: 9997,
    features: ['Multi-tenant (unlimited clients)', 'Resell rights', 'Full API', '12 months priority support'],
  },
];

export default function SignupPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-stone-950" />}>
      <SignupPageInner />
    </Suspense>
  );
}

function SignupPageInner() {
  const searchParams = useSearchParams();
  const canceled = searchParams.get('canceled');
  const initialModel = searchParams.get('model') === 'license' ? 'license' : 'saas';

  const [model, setModel] = useState(initialModel);
  const [selectedPlan, setSelectedPlan] = useState(initialModel === 'license' ? 'license-pro' : 'pro');
  const [form, setForm] = useState({ company_name: '', email: '', slug: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const update = (key, val) => {
    setForm(f => ({ ...f, [key]: val }));
    // Auto-generate slug from company name
    if (key === 'company_name') {
      setForm(f => ({
        ...f,
        [key]: val,
        slug: val.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, ''),
      }));
    }
  };

  const handleCheckout = async () => {
    if (!form.company_name || !form.email) {
      setError('Company name and email are required');
      return;
    }
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/billing/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan: selectedPlan, model, ...form }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Something went wrong');
        setLoading(false);
        return;
      }

      // Redirect to Stripe Checkout
      window.location.href = data.url;
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-stone-950 text-stone-200">
      {/* Header */}
      <header className="border-b border-stone-800">
        <div className="max-w-5xl mx-auto px-6 py-5 flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-amber-700 flex items-center justify-center text-white font-bold">H</div>
          <div>
            <div className="font-bold text-white">HomeVisualizer</div>
            <div className="text-[11px] text-stone-500">AI-Powered Renovation Visualization</div>
          </div>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-6 py-16">
        {/* Hero */}
        <div className="text-center mb-14">
          <h1 className="text-4xl font-bold text-white mb-4">
            Turn Website Visitors Into <span className="text-amber-400">Booked Jobs</span>
          </h1>
          <p className="text-lg text-stone-400 max-w-2xl mx-auto">
            Give homeowners instant AI-powered before/after visualizations of your products on their actual home.
            Capture qualified leads while they're excited about the result.
          </p>
        </div>

        {canceled && (
          <div className="max-w-lg mx-auto mb-8 bg-amber-500/10 border border-amber-500/30 text-amber-400 text-sm rounded-lg px-4 py-3 text-center">
            Checkout was canceled. Pick a plan and try again.
          </div>
        )}

        {/* Model Toggle */}
        <div className="flex justify-center mb-10">
          <div className="inline-flex bg-stone-800 rounded-xl p-1">
            <button
              onClick={() => { setModel('saas'); setSelectedPlan('pro'); }}
              className={`px-6 py-2.5 rounded-lg text-sm font-semibold transition ${
                model === 'saas' ? 'bg-amber-600 text-white' : 'text-stone-400 hover:text-stone-200'
              }`}
            >
              🔄 Monthly
            </button>
            <button
              onClick={() => { setModel('license'); setSelectedPlan('license-pro'); }}
              className={`px-6 py-2.5 rounded-lg text-sm font-semibold transition ${
                model === 'license' ? 'bg-green-600 text-white' : 'text-stone-400 hover:text-stone-200'
              }`}
            >
              🏠 Own It (One-Time)
            </button>
          </div>
        </div>

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-3 gap-5 mb-14">
          {(model === 'saas' ? PLANS : LICENSES).map(plan => (
            <div
              key={plan.id}
              onClick={() => setSelectedPlan(plan.id)}
              className={`relative bg-stone-900 rounded-2xl p-6 cursor-pointer transition-all border-2 ${
                selectedPlan === plan.id
                  ? model === 'license' ? 'border-green-500 shadow-lg shadow-green-500/10' : 'border-amber-500 shadow-lg shadow-amber-500/10'
                  : 'border-stone-800 hover:border-stone-700'
              }`}
            >
              {plan.popular && (
                <div className={`absolute -top-3 left-1/2 -translate-x-1/2 text-white text-[10px] font-bold uppercase tracking-wider px-3 py-1 rounded-full ${
                  model === 'license' ? 'bg-green-600' : 'bg-amber-600'
                }`}>
                  {model === 'license' ? 'Best Value' : 'Most Popular'}
                </div>
              )}
              <div className="text-sm font-semibold text-stone-400 mb-2">{plan.name}</div>
              <div className="flex items-baseline gap-1 mb-1">
                <span className="text-3xl font-bold text-white">${plan.price.toLocaleString()}</span>
                <span className="text-stone-500 text-sm">{model === 'saas' ? '/mo' : ' one-time'}</span>
              </div>
              {model === 'saas' && (
                <div className="text-xs text-stone-500 mb-5">{plan.genLimit} visualizations/month</div>
              )}
              {model === 'license' && (
                <div className="text-xs text-green-500 mb-5">No monthly fees. Ever.</div>
              )}
              <ul className="space-y-2.5">
                {plan.features.map((f, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-stone-300">
                    <span className={`mt-0.5 shrink-0 ${model === 'license' ? 'text-green-400' : 'text-green-400'}`}>✓</span>
                    {f}
                  </li>
                ))}
              </ul>
              {selectedPlan === plan.id && (
                <div className="mt-5 text-center">
                  <div className={`inline-flex items-center gap-1.5 text-xs font-semibold ${
                    model === 'license' ? 'text-green-400' : 'text-amber-400'
                  }`}>
                    <span className={`w-4 h-4 rounded-full flex items-center justify-center text-white text-[10px] ${
                      model === 'license' ? 'bg-green-500' : 'bg-amber-500'
                    }`}>✓</span>
                    Selected
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Signup Form */}
        <div className="max-w-lg mx-auto">
          <div className="bg-stone-900 border border-stone-800 rounded-2xl p-7">
            <h2 className="text-lg font-bold text-white mb-5">Get Started</h2>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-stone-400 mb-1.5">Company Name *</label>
                <input
                  type="text"
                  value={form.company_name}
                  onChange={e => update('company_name', e.target.value)}
                  placeholder="Claflin Construction"
                  className="w-full bg-stone-800 border border-stone-700 rounded-lg px-4 py-3 text-sm text-white placeholder-stone-600 focus:outline-none focus:border-amber-600"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-stone-400 mb-1.5">Email *</label>
                <input
                  type="email"
                  value={form.email}
                  onChange={e => update('email', e.target.value)}
                  placeholder="info@claflinconstruction.com"
                  className="w-full bg-stone-800 border border-stone-700 rounded-lg px-4 py-3 text-sm text-white placeholder-stone-600 focus:outline-none focus:border-amber-600"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-stone-400 mb-1.5">Your URL Slug</label>
                <div className="flex items-center bg-stone-800 border border-stone-700 rounded-lg overflow-hidden">
                  <span className="px-3 text-xs text-stone-500 border-r border-stone-700 py-3">visualizer.app/</span>
                  <input
                    type="text"
                    value={form.slug}
                    onChange={e => setForm(f => ({ ...f, slug: e.target.value }))}
                    placeholder="claflin-construction"
                    className="flex-1 bg-transparent px-3 py-3 text-sm text-white placeholder-stone-600 focus:outline-none"
                  />
                </div>
              </div>

              {error && (
                <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm rounded-lg px-4 py-2.5">
                  {error}
                </div>
              )}

              <button
                onClick={handleCheckout}
                disabled={loading || !form.company_name || !form.email}
                className={`w-full hover:opacity-90 disabled:opacity-40 text-white font-bold py-3.5 rounded-lg text-sm transition mt-2 ${
                  model === 'license' ? 'bg-green-600' : 'bg-amber-600'
                }`}
              >
                {loading ? 'Redirecting to checkout...' : model === 'saas'
                  ? `Start ${PLANS.find(p => p.id === selectedPlan)?.name} Plan — $${PLANS.find(p => p.id === selectedPlan)?.price}/mo`
                  : `Buy ${LICENSES.find(p => p.id === selectedPlan)?.name} — $${LICENSES.find(p => p.id === selectedPlan)?.price.toLocaleString()}`
                }
              </button>

              <p className="text-center text-[11px] text-stone-600">
                {model === 'saas'
                  ? 'Secure payment via Stripe. 14-day free trial. Cancel anytime.'
                  : 'Secure one-time payment via Stripe. Source code delivered immediately.'
                }
              </p>
            </div>
          </div>
        </div>

        {/* Social proof / value props */}
        <div className="grid md:grid-cols-3 gap-6 mt-14">
          {[
            { icon: '⚡', title: 'Live in 5 Minutes', desc: 'Sign up, customize your branding, embed on your website. That\'s it.' },
            { icon: '🎯', title: 'Qualified Leads', desc: 'Homeowners who see their renovation are 4x more likely to request a quote.' },
            { icon: '🏠', title: 'Real Products', desc: 'James Hardie, GAF, Trex — real materials your customers actually buy.' },
          ].map((item, i) => (
            <div key={i} className="text-center">
              <div className="text-3xl mb-3">{item.icon}</div>
              <div className="font-semibold text-white text-sm mb-1">{item.title}</div>
              <div className="text-xs text-stone-500">{item.desc}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

import Link from 'next/link';
import { TOTAL_PRODUCTS, PROJECTS } from '@/lib/materials';
import { STYLE_PRESETS } from '@/lib/styles';

export const metadata = {
  title: 'HomeVisualizer — AI Home Design for Contractors',
  description: 'White-label AI home visualization. Homeowners see real products on their home. Every visualization becomes a qualified lead.',
};

export default function HomePage() {
  return (
    <div className="min-h-screen bg-stone-50 font-body">
      {/* Nav */}
      <nav className="flex items-center justify-between px-6 py-4 max-w-6xl mx-auto">
        <div className="font-display font-bold text-xl text-stone-900">
          HomeVisualizer<span className="text-amber-700">.ai</span>
        </div>
        <div className="flex items-center gap-6">
          <a href="#features" className="text-sm font-medium text-stone-600 hover:text-stone-900 hidden sm:block">Features</a>
          <a href="#vs-hover" className="text-sm font-medium text-stone-600 hover:text-stone-900 hidden sm:block">vs HOVER</a>
          <a href="#pricing" className="text-sm font-medium text-stone-600 hover:text-stone-900 hidden sm:block">Pricing</a>
          <Link
            href="/demo"
            className="text-sm font-semibold bg-stone-900 text-white px-4 py-2 rounded-lg hover:bg-stone-800 transition"
          >
            Try Free →
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="px-6 py-20 md:py-28 max-w-4xl mx-auto text-center">
        <div className="inline-block bg-amber-100 text-amber-800 text-xs font-semibold px-3 py-1 rounded-full mb-6 uppercase tracking-wide">
          {TOTAL_PRODUCTS}+ Real Products · {STYLE_PRESETS.length} Instant Styles · AI-Powered
        </div>
        <h1 className="font-display text-4xl sm:text-5xl md:text-6xl font-extrabold text-stone-900 leading-tight mb-6">
          Your competitors show samples.<br />
          <span className="text-amber-700">You show their actual house.</span>
        </h1>
        <p className="text-lg text-stone-600 max-w-2xl mx-auto mb-10 leading-relaxed">
          AI-powered home visualization that lives on your website with your branding.
          Homeowners upload a photo, choose from {TOTAL_PRODUCTS}+ real products or {STYLE_PRESETS.length} architectural styles,
          and see a photorealistic before/after in seconds. Every visualization becomes a qualified lead.
        </p>
        <div className="flex items-center justify-center gap-4 flex-wrap">
          <Link
            href="/demo"
            className="bg-amber-700 text-white px-8 py-3.5 rounded-xl font-bold text-lg hover:bg-amber-800 shadow-lg shadow-amber-700/20 transition"
          >
            Try It Free →
          </Link>
          <Link
            href="/signup"
            className="border-2 border-stone-300 text-stone-700 px-8 py-3.5 rounded-xl font-bold text-lg hover:border-stone-400 transition"
          >
            Get Started · $99/mo
          </Link>
        </div>

        {/* Trust badges */}
        <div className="flex items-center justify-center gap-6 mt-10 text-xs text-stone-400">
          <span>James Hardie</span>
          <span>·</span>
          <span>GAF</span>
          <span>·</span>
          <span>Sherwin-Williams</span>
          <span>·</span>
          <span>Benjamin Moore</span>
          <span>·</span>
          <span>Trex</span>
          <span>·</span>
          <span>Andersen</span>
          <span>·</span>
          <span>Pella</span>
        </div>
      </section>

      {/* Try It Now — embedded demo */}
      <section className="px-6 py-16 bg-white border-y border-stone-200">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="font-display text-3xl font-bold text-stone-900 mb-3">
            Try It Right Now
          </h2>
          <p className="text-stone-600 mb-8">
            Upload a photo of any house and see it transformed in seconds. No signup required.
          </p>
          <div className="rounded-2xl overflow-hidden shadow-2xl border border-stone-200" style={{ maxWidth: 520, margin: '0 auto' }}>
            <iframe
              src="/demo"
              style={{ width: '100%', height: 680, border: 'none' }}
              allow="camera"
              loading="lazy"
              title="Try HomeVisualizer"
            />
          </div>
          <p className="text-xs text-stone-400 mt-4">
            This is the exact experience homeowners get on your website — with your brand, your colors, your logo.
          </p>
        </div>
      </section>

      {/* How it works */}
      <section className="px-6 py-16 bg-white border-y border-stone-200">
        <div className="max-w-5xl mx-auto">
          <h2 className="font-display text-3xl font-bold text-center text-stone-900 mb-12">
            How It Works
          </h2>
          <div className="grid md:grid-cols-4 gap-8">
            {[
              { step: '1', icon: '📸', title: 'Upload Photo', desc: 'Homeowner snaps a photo of their home — exterior or interior' },
              { step: '2', icon: '✨', title: 'Choose Design', desc: `Pick an instant style or browse ${TOTAL_PRODUCTS}+ real products by brand, color, and type` },
              { step: '3', icon: '🏠', title: 'See It Instantly', desc: 'AI generates a photorealistic before/after in 10-20 seconds' },
              { step: '4', icon: '🎯', title: 'Capture Lead', desc: 'Homeowner submits their info — delivered to your inbox and CRM' },
            ].map((s, i) => (
              <div key={i} className="text-center">
                <div className="text-4xl mb-3">{s.icon}</div>
                <div className="inline-block bg-amber-100 text-amber-800 text-xs font-bold px-2 py-0.5 rounded-full mb-2">
                  Step {s.step}
                </div>
                <h3 className="font-display font-bold text-stone-900 mb-1">{s.title}</h3>
                <p className="text-sm text-stone-600">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="px-6 py-20 max-w-5xl mx-auto">
        <h2 className="font-display text-3xl font-bold text-center text-stone-900 mb-4">
          Everything HOVER Instant Design Does — And More
        </h2>
        <p className="text-center text-stone-600 mb-12 max-w-2xl mx-auto">
          Flat monthly pricing instead of per-job fees. Your brand, your data, your leads.
        </p>
        <div className="grid md:grid-cols-3 gap-6">
          {[
            {
              icon: '✨',
              title: `${STYLE_PRESETS.length} Instant Styles`,
              desc: `Modern Farmhouse, Craftsman, Contemporary, Coastal, Tudor, Mediterranean, and more. Upload one photo → see it transformed instantly.`,
            },
            {
              icon: '🎨',
              title: `${TOTAL_PRODUCTS}+ Real Products`,
              desc: `James Hardie, GAF, Sherwin-Williams, Benjamin Moore, Trex, Andersen, Pella, CertainTeed, Clopay — real materials homeowners can buy.`,
            },
            {
              icon: '✏️',
              title: 'Iterative Refinement',
              desc: `"Try darker trim." "Add stone accents." "Change the door to red." Homeowners refine their design with natural language — no starting over.`,
            },
            {
              icon: '🏷️',
              title: 'Your Brand, 100%',
              desc: 'Your logo, colors, domain, and URL. Embed on your website with one iframe tag. Homeowners never leave your brand experience.',
            },
            {
              icon: '🎯',
              title: 'Lead Generation Engine',
              desc: 'Every visualization is a qualified lead with name, email, phone, project type, and the AI-generated image attached. Delivered to your inbox automatically.',
            },
            {
              icon: '📊',
              title: 'Analytics Dashboard',
              desc: 'Full funnel visibility: uploads → generations → refinements → leads. See conversion rates, popular materials, and usage trends.',
            },
            {
              icon: '↗️',
              title: 'Social Sharing',
              desc: 'Homeowners share their before/after on social media — with your branding. Free marketing for your business.',
            },
            {
              icon: '★',
              title: 'Save & Compare',
              desc: 'Homeowners save favorite designs and compare them side-by-side. More engagement = higher conversion.',
            },
            {
              icon: '🔌',
              title: 'Easy Integration',
              desc: 'One iframe tag to embed. Works with any website — WordPress, Wix, Squarespace, or custom. No coding required.',
            },
          ].map((f, i) => (
            <div key={i} className="bg-white p-6 rounded-2xl border border-stone-200 shadow-sm">
              <div className="text-3xl mb-3">{f.icon}</div>
              <h3 className="font-display font-bold text-stone-900 mb-1">{f.title}</h3>
              <p className="text-stone-600 text-sm leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Project Types */}
      <section className="px-6 py-16 bg-white border-y border-stone-200">
        <div className="max-w-5xl mx-auto">
          <h2 className="font-display text-2xl font-bold text-center text-stone-900 mb-8">
            {PROJECTS.length} Project Categories
          </h2>
          <div className="flex flex-wrap justify-center gap-3">
            {PROJECTS.map(p => (
              <span key={p.id} className="bg-stone-100 text-stone-700 px-4 py-2 rounded-full text-sm font-medium">
                {p.icon} {p.label}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* vs HOVER */}
      <section id="vs-hover" className="px-6 py-20 max-w-5xl mx-auto">
        <h2 className="font-display text-3xl font-bold text-center text-stone-900 mb-4">
          HomeVisualizer vs HOVER Instant Design
        </h2>
        <p className="text-center text-stone-600 mb-12">HOVER charges $25 per project. We don&apos;t. Here&apos;s what that means.</p>

        {/* Cost comparison at volume */}
        <div className="bg-amber-50 border-2 border-amber-200 rounded-2xl p-6 mb-10">
          <h3 className="font-bold text-lg text-stone-900 mb-4 text-center">Annual Cost at 20 Projects/Month</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b-2 border-amber-300">
                  <th className="text-left py-3 px-3 text-stone-500 font-medium"></th>
                  <th className="text-center py-3 px-3 text-stone-600 font-bold">HOVER<br /><span className="text-xs font-normal">$25/project</span></th>
                  <th className="text-center py-3 px-3 text-amber-700 font-bold">Our SaaS<br /><span className="text-xs font-normal">$149/mo flat</span></th>
                  <th className="text-center py-3 px-3 text-green-700 font-bold">Our License<br /><span className="text-xs font-normal">$2,497 once</span></th>
                </tr>
              </thead>
              <tbody>
                {[
                  ['10 projects/mo', '$3,000/yr', '$1,788/yr', '~$180/yr', ''],
                  ['20 projects/mo', '$6,000/yr', '$1,788/yr', '~$180/yr', ''],
                  ['50 projects/mo', '$15,000/yr', '$4,188/yr', '~$420/yr', ''],
                  ['Year 1 total (20/mo)', '$6,000', '$1,788', '$2,677', 'License + API'],
                  ['Year 2 total (20/mo)', '$12,000', '$3,576', '$2,857', 'API only'],
                  ['Year 3 total (20/mo)', '$18,000', '$5,364', '$3,037', ''],
                  ['3-year savings vs HOVER', '—', '$12,636 saved', '$14,963 saved', ''],
                ].map(([label, hover, saas, license, note], i) => (
                  <tr key={i} className={i === 6 ? 'bg-green-50 font-bold' : i % 2 === 0 ? 'bg-white' : 'bg-amber-50/30'}>
                    <td className="py-2.5 px-3 text-stone-700 font-medium">{label}</td>
                    <td className="py-2.5 px-3 text-center text-red-600">{hover}</td>
                    <td className="py-2.5 px-3 text-center text-amber-700">{saas}</td>
                    <td className="py-2.5 px-3 text-center text-green-700">{license}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="text-xs text-stone-500 mt-3 text-center">
            License API cost: ~$0.05/generation paid directly to OpenAI. SaaS includes all hosting and API costs.
          </p>
        </div>

        {/* Feature comparison */}
        <div className="bg-white rounded-2xl border border-stone-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-stone-50 border-b border-stone-200">
                <th className="text-left py-3 px-4 font-medium text-stone-500">Feature</th>
                <th className="text-center py-3 px-4 font-medium text-stone-500">HOVER</th>
                <th className="text-center py-3 px-4 font-bold text-amber-700">Our SaaS</th>
                <th className="text-center py-3 px-4 font-bold text-green-700">Our License</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {[
                ['Pricing model', '$25/project', 'Flat monthly', 'One-time purchase'],
                ['Homeowner self-serve on your site', '✅', '✅', '✅'],
                ['White-label (your brand only)', '⚠️ HOVER branded', '✅', '✅'],
                ['Lead capture + CRM alerts', '⚠️ Limited', '✅', '✅'],
                ['Real manufacturer products', '✅ (curated)', `✅ ${TOTAL_PRODUCTS}+`, `✅ ${TOTAL_PRODUCTS}+`],
                ['Style presets', '✅', `✅ ${STYLE_PRESETS.length} styles`, `✅ ${STYLE_PRESETS.length} styles`],
                ['Analytics dashboard', '⚠️ Basic', '✅ Full funnel', '✅ Full funnel'],
                ['Custom materials', '❌', '✅', '✅'],
                ['You own the code', '❌', '❌', '✅'],
                ['You own the data', '❌ HOVER owns it', '⚠️ On our servers', '✅ 100% yours'],
                ['Social sharing with your brand', '⚠️ HOVER branded', '✅', '✅'],
                ['Works if vendor shuts down', '❌', '❌', '✅ You have the code'],
              ].map(([feature, hover, saas, license], i) => (
                <tr key={i} className={i % 2 === 0 ? '' : 'bg-stone-50/50'}>
                  <td className="py-2.5 px-4 text-stone-700 font-medium">{feature}</td>
                  <td className="py-2.5 px-4 text-center text-stone-500">{hover}</td>
                  <td className="py-2.5 px-4 text-center">{saas}</td>
                  <td className="py-2.5 px-4 text-center">{license}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <p className="text-center text-sm text-stone-500 mt-6">
          HOVER pricing based on publicly listed $25/project for Instant Design as of 2025.
        </p>
      </section>

      {/* How It Integrates */}
      <section className="px-6 py-16 bg-stone-50 border-t border-stone-200">
        <div className="max-w-4xl mx-auto">
          <h2 className="font-display text-3xl font-bold text-center text-stone-900 mb-4">
            Works With Your Existing Website
          </h2>
          <p className="text-center text-stone-600 mb-10">
            No new website needed. Drop one line of code on your current site and you&apos;re live.
          </p>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-white rounded-2xl border border-stone-200 p-6">
              <div className="text-3xl mb-3">🔗</div>
              <h3 className="font-bold text-lg text-stone-900 mb-2">Embed on Your Site</h3>
              <p className="text-sm text-stone-600 mb-4">
                Paste one snippet on your WordPress, Wix, Squarespace, or any website. The visualizer
                appears right on your page with your brand colors and logo. Homeowners never leave your site.
              </p>
              <div className="bg-stone-50 rounded-lg p-3 font-mono text-xs text-stone-500">
                &lt;iframe src=&quot;homevisualizer.ai/your-company&quot; ...&gt;
              </div>
            </div>
            <div className="bg-white rounded-2xl border border-stone-200 p-6">
              <div className="text-3xl mb-3">🌐</div>
              <h3 className="font-bold text-lg text-stone-900 mb-2">Standalone Page</h3>
              <p className="text-sm text-stone-600 mb-4">
                Get a branded page you can link to from anywhere — social media, Google Ads, email campaigns,
                yard signs with QR codes. No embed needed. Works on its own.
              </p>
              <div className="bg-stone-50 rounded-lg p-3 font-mono text-xs text-stone-500">
                homevisualizer.ai/your-company
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="px-6 py-20 bg-white border-t border-stone-200">
        <div className="max-w-5xl mx-auto">
          <h2 className="font-display text-3xl font-bold text-center text-stone-900 mb-4">
            Two Ways to Buy. You Choose.
          </h2>
          <p className="text-center text-stone-600 mb-12">
            Monthly subscription or buy it once and own it forever. One extra closed job pays for a full year — or the whole thing.
          </p>

          {/* ─── Monthly SaaS ─────────────────────── */}
          <div className="mb-16">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center text-lg">🔄</div>
              <div>
                <h3 className="font-display font-bold text-xl text-stone-900">Monthly — We Host, You Sell</h3>
                <p className="text-sm text-stone-500">We handle everything. You focus on closing jobs.</p>
              </div>
            </div>
            <div className="grid md:grid-cols-3 gap-6">
              {[
                {
                  name: 'Starter',
                  price: '$149',
                  annual: '$125',
                  gens: '50 visualizations/mo',
                  features: [
                    'Your branding + logo',
                    TOTAL_PRODUCTS + '+ real products',
                    STYLE_PRESETS.length + ' instant styles',
                    'Lead capture + email alerts',
                    'Before/after sharing',
                    'Embed on your website',
                  ],
                  cta: 'Start 14-Day Trial',
                  highlighted: false,
                },
                {
                  name: 'Pro',
                  price: '$349',
                  annual: '$290',
                  gens: '200 visualizations/mo',
                  features: [
                    'Everything in Starter',
                    'Analytics dashboard',
                    'CRM webhook (Zapier/Jobber)',
                    'Custom materials library',
                    'A/B testing',
                    'Priority support',
                  ],
                  cta: 'Start 14-Day Trial',
                  highlighted: true,
                },
                {
                  name: 'Enterprise',
                  price: '$749',
                  annual: '$625',
                  gens: 'Unlimited visualizations',
                  features: [
                    'Everything in Pro',
                    'No "Powered by" badge',
                    'API access',
                    'White-glove onboarding',
                    'Dedicated support',
                    'Custom integrations',
                  ],
                  cta: 'Contact Us',
                  highlighted: false,
                },
              ].map((plan, i) => (
                <div
                  key={i}
                  className={`p-8 rounded-2xl border-2 ${
                    plan.highlighted
                      ? 'border-amber-700 bg-amber-50 shadow-lg shadow-amber-700/10 relative'
                      : 'border-stone-200 bg-white'
                  }`}
                >
                  {plan.highlighted && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-amber-700 text-white text-xs font-bold px-3 py-1 rounded-full">
                      Most Popular
                    </div>
                  )}
                  <h3 className="font-display font-bold text-xl text-stone-900">{plan.name}</h3>
                  <div className="mt-4 mb-1">
                    <span className="text-4xl font-bold text-stone-900">{plan.price}</span>
                    <span className="text-stone-500">/month</span>
                  </div>
                  <p className="text-xs text-stone-400 mb-1">
                    or {plan.annual}/mo billed annually <span className="text-amber-700 font-semibold">(save 2 months)</span>
                  </p>
                  <p className="text-sm text-stone-600 mb-6">{plan.gens}</p>
                  <ul className="space-y-2.5 mb-8">
                    {plan.features.map((f, j) => (
                      <li key={j} className="flex items-start gap-2 text-sm text-stone-700">
                        <span className="text-amber-700 font-bold mt-0.5">✓</span>
                        {f}
                      </li>
                    ))}
                  </ul>
                  <Link
                    href="/signup"
                    className={`block w-full py-3 rounded-lg font-bold text-sm text-center transition ${
                      plan.highlighted
                        ? 'bg-amber-700 text-white hover:bg-amber-800'
                        : 'bg-stone-100 text-stone-700 hover:bg-stone-200'
                    }`}
                  >
                    {plan.cta}
                  </Link>
                </div>
              ))}
            </div>
            <p className="text-center text-xs text-stone-400 mt-6">
              All plans include a 14-day free trial. No credit card required to start. Cancel anytime.
            </p>
          </div>

          {/* ─── One-Time Self-Hosted ────────────── */}
          <div className="border-t border-stone-200 pt-16">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-green-100 flex items-center justify-center text-lg">🏠</div>
              <div>
                <h3 className="font-display font-bold text-xl text-stone-900">Own It — One-Time Purchase</h3>
                <p className="text-sm text-stone-500">Buy once, deploy on your server, no monthly fees ever.</p>
              </div>
            </div>

            <div className="grid md:grid-cols-3 gap-6">
              {[
                {
                  name: 'Starter License',
                  price: '$2,497',
                  payback: 'Pays for itself in 17 months vs $149/mo',
                  features: [
                    'Full source code',
                    'Your branding + white-label',
                    'All ' + TOTAL_PRODUCTS + '+ products',
                    'Lead capture + notifications',
                    'Deploy on your server',
                    '90 days email support',
                    'Deployment documentation',
                  ],
                },
                {
                  name: 'Pro License',
                  price: '$4,997',
                  payback: 'Pays for itself in 15 months vs $349/mo',
                  features: [
                    'Everything in Starter License',
                    'Analytics dashboard',
                    'CRM webhook system',
                    'Custom materials admin',
                    'A/B testing framework',
                    'We deploy it for you (included)',
                    '6 months email support',
                  ],
                  highlighted: true,
                },
                {
                  name: 'Agency License',
                  price: '$9,997',
                  payback: 'Deploy for unlimited clients. Infinite ROI.',
                  features: [
                    'Everything in Pro License',
                    'Multi-tenant admin (unlimited clients)',
                    'No "Powered by" badge',
                    'Resell to your own customers',
                    'Full API access',
                    'White-glove setup + training call',
                    '12 months priority support',
                  ],
                },
              ].map((plan, i) => (
                <div
                  key={i}
                  className={`p-8 rounded-2xl border-2 ${
                    plan.highlighted
                      ? 'border-green-600 bg-green-50 shadow-lg shadow-green-600/10 relative'
                      : 'border-stone-200 bg-white'
                  }`}
                >
                  {plan.highlighted && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-green-600 text-white text-xs font-bold px-3 py-1 rounded-full">
                      Best Value
                    </div>
                  )}
                  <h3 className="font-display font-bold text-xl text-stone-900">{plan.name}</h3>
                  <div className="mt-4 mb-2">
                    <span className="text-4xl font-bold text-stone-900">{plan.price}</span>
                    <span className="text-stone-500 ml-1">one-time</span>
                  </div>
                  <p className="text-xs text-green-700 font-medium mb-6">{plan.payback}</p>
                  <ul className="space-y-2.5 mb-8">
                    {plan.features.map((f, j) => (
                      <li key={j} className="flex items-start gap-2 text-sm text-stone-700">
                        <span className="text-green-600 font-bold mt-0.5">✓</span>
                        {f}
                      </li>
                    ))}
                  </ul>
                  <Link
                    href="/signup?model=license"
                    className={`block w-full py-3 rounded-lg font-bold text-sm text-center transition ${
                      plan.highlighted
                        ? 'bg-green-600 text-white hover:bg-green-700'
                        : 'bg-stone-100 text-stone-700 hover:bg-stone-200'
                    }`}
                  >
                    Buy License
                  </Link>
                </div>
              ))}
            </div>

            {/* Self-hosted add-ons */}
            <div className="mt-8 bg-stone-50 rounded-2xl border border-stone-200 p-6">
              <h4 className="font-bold text-stone-900 mb-3">Optional Add-Ons for Self-Hosted</h4>
              <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  { name: 'Installation Service', desc: 'We deploy it on your server', price: '$500' },
                  { name: 'Annual Updates', desc: 'Get every new feature for a year', price: '$499/yr' },
                  { name: 'Support Contract', desc: 'Email + phone support', price: '$199/mo' },
                  { name: 'Custom Development', desc: 'Features built to your spec', price: '$150/hr' },
                ].map((addon, i) => (
                  <div key={i} className="text-sm">
                    <p className="font-semibold text-stone-900">{addon.name}</p>
                    <p className="text-xs text-stone-500 mb-1">{addon.desc}</p>
                    <p className="font-bold text-green-700">{addon.price}</p>
                  </div>
                ))}
              </div>
            </div>

            <p className="text-center text-xs text-stone-400 mt-6">
              Self-hosted licenses include full source code. You own it. You host it. You control it.
              <br />Requires Node.js, Supabase (free tier works), and an OpenAI API key (~$0.05/generation).
            </p>
          </div>

          {/* SaaS vs License Comparison */}
          <div className="mt-16 bg-stone-50 border-2 border-stone-200 rounded-2xl p-8">
            <h3 className="font-display text-2xl font-bold text-center text-stone-900 mb-2">SaaS vs. Own It — Real Numbers</h3>
            <p className="text-center text-stone-500 text-sm mb-8">Based on 200 visualizations per month</p>

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b-2 border-stone-300">
                    <th className="text-left py-3 px-4 text-stone-500 font-medium"></th>
                    <th className="text-center py-3 px-4 text-amber-700 font-bold">Pro SaaS<br /><span className="text-xs font-normal text-stone-400">$349/mo</span></th>
                    <th className="text-center py-3 px-4 text-green-700 font-bold">Pro License<br /><span className="text-xs font-normal text-stone-400">$4,997 one-time</span></th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    ['Year 1 cost', '$4,188', '$5,117', 'License: $4,997 + ~$10/mo API'],
                    ['Year 2 cost', '$8,376', '$5,237', 'Only API fees after purchase'],
                    ['Year 3 cost', '$12,564', '$5,357', ''],
                    ['3-year savings', '—', '$7,207 saved', 'Savings grow every month'],
                    ['Cost per generation', '~$1.75', '~$0.05', 'Direct API cost, no markup'],
                    ['You own the code', '❌', '✅', 'Modify anything, anytime'],
                    ['Hosting', 'We handle it', 'You host ($7–25/mo)', 'Render, Railway, or your server'],
                    ['Updates', 'Automatic', '$499/yr optional', 'Or update code yourself'],
                    ['Data ownership', 'On our servers', '100% yours', 'Your database, your leads'],
                  ].map(([label, saas, license, note], i) => (
                    <tr key={i} className={i % 2 === 0 ? 'bg-white' : 'bg-stone-50/50'}>
                      <td className="py-3 px-4 font-medium text-stone-700">{label}</td>
                      <td className="py-3 px-4 text-center text-stone-600">{saas}</td>
                      <td className="py-3 px-4 text-center font-semibold text-green-700">{license}</td>
                      {note && <td className="py-3 px-4 text-xs text-stone-400 hidden lg:table-cell">{note}</td>}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="mt-6 grid sm:grid-cols-2 gap-4 text-center">
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                <p className="text-xs text-stone-500 mb-1">Best if you want</p>
                <p className="font-bold text-amber-800">Zero maintenance</p>
                <p className="text-xs text-stone-500 mt-1">We host, update, and support. You focus on roofing.</p>
              </div>
              <div className="bg-green-50 border border-green-200 rounded-xl p-4">
                <p className="text-xs text-stone-500 mb-1">Best if you want</p>
                <p className="font-bold text-green-800">Maximum control &amp; savings</p>
                <p className="text-xs text-stone-500 mt-1">Own the code. Pay ~$0.05/scan directly to OpenAI. No middleman.</p>
              </div>
            </div>
          </div>

          {/* ROI Calculator */}
          <div className="mt-8 bg-amber-50 border-2 border-amber-200 rounded-2xl p-8 text-center">
            <h3 className="font-display text-2xl font-bold text-stone-900 mb-2">Either Way, The ROI is Insane</h3>
            <p className="text-stone-600 mb-6">Average exterior project: $8,000–$25,000</p>
            <div className="grid sm:grid-cols-3 gap-6 max-w-2xl mx-auto">
              <div>
                <p className="text-3xl font-bold text-amber-700">1</p>
                <p className="text-sm text-stone-600">Extra job closed per month</p>
              </div>
              <div>
                <p className="text-3xl font-bold text-amber-700">$15K</p>
                <p className="text-sm text-stone-600">Average project value</p>
              </div>
              <div>
                <p className="text-3xl font-bold text-amber-700">100x</p>
                <p className="text-sm text-stone-600">ROI on $149/mo</p>
              </div>
            </div>
            <p className="text-xs text-stone-500 mt-4">One extra &ldquo;yes&rdquo; pays for a full year — or the entire license. Everything after that is profit.</p>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="px-6 py-20 max-w-3xl mx-auto text-center">
        <h2 className="font-display text-3xl font-bold text-stone-900 mb-4">
          Ready to Close More Jobs?
        </h2>
        <p className="text-stone-600 mb-8">
          Set up in 10 minutes. Embed on your website today. Start generating leads tonight.
        </p>
        <div className="flex items-center justify-center gap-4 flex-wrap">
          <Link
            href="/signup"
            className="bg-amber-700 text-white px-8 py-3.5 rounded-xl font-bold text-lg hover:bg-amber-800 shadow-lg shadow-amber-700/20 transition"
          >
            Start Your Free Trial →
          </Link>
          <Link
            href="/demo"
            className="text-stone-700 px-8 py-3.5 rounded-xl font-bold text-lg hover:text-stone-900 transition"
          >
            Try Demo First
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-stone-200 px-6 py-8 text-center text-sm text-stone-500">
        <p>© {new Date().getFullYear()} HomeVisualizer · Built by BreakPoint Digital</p>
      </footer>
    </div>
  );
}

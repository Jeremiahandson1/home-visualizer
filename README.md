# HomeVisualizer — AI Home Visualization SaaS

White-label AI home visualization platform for contractors. Homeowners upload a photo → choose from 179+ real products or 12 instant styles → see photorealistic before/after → submit lead.

**Better than HOVER Instant Design. Flat monthly pricing. Your brand. Your data.**

## Quick Start

```bash
npm install
cp .env.example .env.local   # fill in keys
# Run schema.sql in Supabase SQL Editor
# Create Stripe products (see Billing section)
npm run dev
```

## Architecture

| Layer        | Stack                                |
|-------------|--------------------------------------|
| Frontend    | Next.js 14 App Router, Tailwind CSS  |
| Database    | Supabase (Postgres + Storage + Auth) |
| AI          | OpenAI GPT Image 1 → Flux → Stability fallback |
| Billing     | Stripe (Checkout, Webhooks, Portal)  |
| Email       | Resend (lead notifications, confirmations) |
| Multi-tenant| Subdomain/path routing, per-tenant config |

## Features

### For Homeowners
- **179+ Real Products** — James Hardie, GAF, Sherwin-Williams, Benjamin Moore, Trex, Andersen, Pella, CertainTeed, Clopay, TimberTech, and more
- **12 Instant Styles** — Modern Farmhouse, Craftsman, Contemporary, Coastal, Colonial, Tudor, Mediterranean, Modern Dark, Scandinavian, Mountain Lodge, Mid-Century, Transitional
- **11 Project Categories** — Siding, Roofing, Paint, Windows, Deck, Garage Doors, Gutters, Full Exterior, Kitchen, Bathroom, Flooring
- **Iterative Refinement** — "Make the trim darker", "Try a red door", "Add stone accents" — refine without starting over
- **Material Browser** — Filter by brand, type, color family, or search
- **Save & Compare** — Save favorites and compare designs side-by-side
- **Social Sharing** — Share before/after with contractor branding

### For Contractors
- **White-label** — Your logo, colors, domain. No HOVER branding.
- **Lead Capture** — Full form: name, email, phone, address, notes + AI image attached
- **Analytics Dashboard** — Full funnel: uploads → generations → refinements → leads
- **Custom Materials** — Add your own products alongside the built-in catalog
- **CRM Integration** — Webhook to any CRM (Zapier, HubSpot, etc.)
- **Email Notifications** — Instant lead alerts + homeowner confirmations
- **Embeddable** — One iframe tag on any website (WordPress, Wix, custom)

### Platform
- **3 AI Providers** — OpenAI (primary), Flux Kontext Max (fallback), Stability SDXL (fallback)
- **Batch Generation** — Generate 3-4 style variations in parallel
- **Design Sessions** — Persistent sessions with variation history
- **Rate Limiting** — Per-tenant concurrent + per-minute limits
- **Image Validation** — Server-side format, size, and dimension checks
- **Stripe Billing** — Checkout, webhooks, customer portal, auto-provisioning

## Pricing Model

| Plan       | Price    | Generations | AI Cost/gen | Margin |
|-----------|----------|-------------|-------------|--------|
| Starter   | $99/mo   | 50          | ~$0.10      | 95%    |
| Pro       | $249/mo  | 200         | ~$0.10      | 92%    |
| Enterprise| $499/mo  | Unlimited   | ~$0.10      | 90%+   |

## API Endpoints

| Endpoint                    | Method | Description                        |
|----------------------------|--------|------------------------------------|
| `/api/visualize`           | POST   | Generate from material selection   |
| `/api/visualize/style`     | POST   | Generate from style preset         |
| `/api/visualize/refine`    | POST   | Refine existing generation         |
| `/api/visualize/batch`     | POST   | Batch generate multiple styles     |
| `/api/materials`           | GET    | Browse materials with filters      |
| `/api/leads`               | POST   | Submit lead form                   |
| `/api/share`               | GET/POST | Share visualizations             |
| `/api/sessions`            | POST   | Create/resume design session       |
| `/api/sessions/variations` | PATCH  | Favorite/rate variations           |
| `/api/analytics`           | POST   | Track events                       |
| `/api/config/[slug]`       | GET    | Tenant configuration               |
| `/api/billing/checkout`    | POST   | Stripe checkout session            |
| `/api/billing/portal`      | POST   | Stripe customer portal             |
| `/api/billing/webhook`     | POST   | Stripe webhook handler             |
| `/api/admin/*`             | Various| Admin dashboard APIs               |

## Deployment (Render)

```bash
# Build command
npm run build

# Start command
npm start

# Environment
NODE_ENV=production
```

Set all env vars from `.env.example`. Configure Stripe webhook to point to `https://yourdomain.com/api/billing/webhook`.

## vs HOVER Instant Design

| Feature                   | HomeVisualizer   | HOVER Design    |
|--------------------------|------------------|-----------------|
| Photo → AI design         | ✅               | ✅              |
| Real products             | ✅ 179+          | ✅ (curated)    |
| Instant style presets     | ✅ 12            | ✅              |
| Iterative refinement      | ✅               | ✅              |
| White-label               | ✅ 100%          | ⚠️ HOVER branded|
| Lead capture              | ✅ Full form     | ⚠️ Limited     |
| Flat monthly pricing      | ✅ From $99/mo   | ❌ Per-job      |
| You own the data          | ✅               | ❌              |
| Interior projects         | ✅               | ⚠️ Exterior    |
| Custom materials          | ✅               | ❌              |

## File Structure

```
src/
  app/
    [tenant]/page.js         — Tenant visualizer page
    embed/page.js            — Iframe embed endpoint
    share/[id]/page.js       — Shared visualization page
    signup/                   — Self-service signup + Stripe
    admin/                    — Admin dashboard (8 pages)
    api/
      visualize/             — Generation, refinement, style, batch
      materials/             — Material catalog API
      leads/                 — Lead capture
      share/                 — Social sharing
      sessions/              — Design session persistence
      analytics/             — Event tracking
      billing/               — Stripe integration
      admin/                 — Admin APIs
      config/                — Tenant config
  components/
    Visualizer.jsx           — Main visualizer (972 lines)
    CompareSlider.jsx        — Before/after slider
    admin/TenantForm.jsx     — Admin tenant editor
  lib/
    ai.js                    — AI engine + prompt builder
    materials.js             — 179 product catalog
    styles.js                — 12 style presets
    providers/               — OpenAI, Flux, Stability
    analytics.js             — Event tracking
    email.js                 — Resend integration
    stripe.js                — Stripe helpers
    supabase.js              — DB client
supabase/
  schema.sql                 — Complete database schema
```

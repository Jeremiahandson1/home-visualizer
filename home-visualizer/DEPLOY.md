# 🚀 Deploy Checklist — HomeVisualizer

## 1. Supabase (5 min)

- [ ] Go to [supabase.com](https://supabase.com) → New Project
- [ ] Name it `home-visualizer`, pick a region near you, set DB password
- [ ] Once created, go to **SQL Editor** → paste contents of `supabase/schema.sql` → Run
- [ ] Go to **Settings → API** → copy:
  - `Project URL` → this is `NEXT_PUBLIC_SUPABASE_URL`
  - `anon public` key → this is `NEXT_PUBLIC_SUPABASE_ANON_KEY`  
  - `service_role` key → this is `SUPABASE_SERVICE_ROLE_KEY`
- [ ] Go to **Storage** → Create bucket named `photos` (public)

## 2. OpenAI (2 min)

- [ ] Go to [platform.openai.com/api-keys](https://platform.openai.com/api-keys)
- [ ] Create new key → copy it → this is `OPENAI_API_KEY`
- [ ] Make sure you have credits loaded ($10 is enough for ~100 generations)

## 3. Render (5 min)

- [ ] Push code to GitHub: `git init && git add -A && git commit -m "v1" && git remote add origin <your-repo> && git push -u origin main`
- [ ] Go to [render.com](https://render.com) → New → Web Service → Connect your repo
- [ ] Render will auto-detect `render.yaml` — or manually set:
  - **Build Command:** `npm install && npm run build`
  - **Start Command:** `npm start`
  - **Plan:** Starter ($7/mo) is fine to test
- [ ] Add environment variables (Settings → Environment):

```
NEXT_PUBLIC_BASE_URL=https://your-app-name.onrender.com
ADMIN_PASSWORD=<pick something strong>
NEXT_PUBLIC_SUPABASE_URL=<from step 1>
NEXT_PUBLIC_SUPABASE_ANON_KEY=<from step 1>
SUPABASE_SERVICE_ROLE_KEY=<from step 1>
OPENAI_API_KEY=<from step 2>
```

- [ ] Deploy → wait for build (2-3 min)

## 4. First Test (5 min)

- [ ] Visit `https://your-app.onrender.com` — landing page should load
- [ ] Visit `https://your-app.onrender.com/demo` — try the visualizer
- [ ] Upload a photo of YOUR house (exterior, good lighting)
- [ ] Tap "Modern Farmhouse" → wait 10-20 seconds → see the result
- [ ] If it looks good → you have a product
- [ ] If it looks weird → tweak prompts in `src/lib/ai.js`

## 5. Admin Setup (2 min)

- [ ] Visit `https://your-app.onrender.com/admin`
- [ ] Log in with your `ADMIN_PASSWORD`
- [ ] Go to Setup → create your first tenant (Claflin Construction)
- [ ] Set brand colors, notification email
- [ ] Copy embed code → paste on claflinconstruction.com

## 6. Optional — Do Later

These are nice-to-have but NOT needed to launch:

**Stripe (billing)**
- Create products/prices in Stripe Dashboard
- Set STRIPE_SECRET_KEY, STRIPE_PUBLISHABLE_KEY
- Set STRIPE_WEBHOOK_SECRET (create webhook pointing to `/api/billing/webhook`)
- Set price IDs for each plan

**Resend (email notifications)**
- Sign up at resend.com, verify your domain
- Set RESEND_API_KEY and EMAIL_FROM
- Without this, lead notifications log to console instead of emailing

**Custom Domain**
- In Render: Settings → Custom Domains → add your domain
- Update DNS: CNAME to your-app.onrender.com
- Update NEXT_PUBLIC_BASE_URL to your custom domain

---

## Quick Troubleshooting

**Build fails:** Check that `sharp` installs correctly. Render's Node 18+ should handle it. If not, add to render.yaml: `env: SHARP_IGNORE_GLOBAL_LIBVIPS=1`

**"Tenant not found":** You need to create a tenant in admin first. The seed data in schema.sql creates a `claflin-construction` tenant automatically.

**Generation timeout:** Render Starter has a 30-second request timeout. Generation usually takes 10-20s. If timing out, upgrade to Standard plan ($25/mo) which has no timeout.

**Demo mode:** If OPENAI_API_KEY is not set, the app runs in demo mode — applies a warm tint filter instead of real AI. This is intentional so the UX works without API keys.

**Images not loading:** Make sure the `photos` bucket in Supabase is set to public.

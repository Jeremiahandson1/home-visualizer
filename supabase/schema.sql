-- ═══════════════════════════════════════════════════════
-- HOME VISUALIZER — Complete Database Schema v2
-- Run this ONCE in Supabase SQL Editor
-- Idempotent — safe to run multiple times
-- ═══════════════════════════════════════════════════════

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ─── TENANTS (contractor clients) ────────────────────
CREATE TABLE IF NOT EXISTS tenants (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  slug TEXT UNIQUE NOT NULL,
  company_name TEXT NOT NULL,
  tagline TEXT DEFAULT '',
  phone TEXT DEFAULT '',
  email TEXT DEFAULT '',
  website TEXT DEFAULT '',
  logo_url TEXT,

  colors JSONB DEFAULT '{
    "primary": "#B8860B",
    "primaryDark": "#8B6508",
    "accent": "#1C1917",
    "bg": "#FDFBF7",
    "surface": "#FFFFFF",
    "text": "#1C1917",
    "muted": "#78716C",
    "border": "#E7E5E4"
  }'::jsonb,

  features JSONB DEFAULT '{
    "siding": true, "roofing": true, "paint": true,
    "windows": true, "deck": true, "garage": true,
    "gutters": true, "exterior": true,
    "kitchen": true, "bathroom": true, "flooring": true,
    "instantStyles": true, "refinement": true,
    "batchGeneration": true, "favorites": true
  }'::jsonb,

  -- Lead routing
  lead_notify_email TEXT,
  crm_webhook_url TEXT,

  -- Billing
  plan TEXT DEFAULT 'starter' CHECK (plan IN ('starter', 'pro', 'enterprise')),
  stripe_customer_id TEXT UNIQUE,
  stripe_subscription_id TEXT UNIQUE,
  monthly_gen_limit INT DEFAULT 50,
  active BOOLEAN DEFAULT true,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─── DESIGN SESSIONS (homeowner journey persistence) ──
CREATE TABLE IF NOT EXISTS design_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  session_token TEXT UNIQUE NOT NULL,
  original_photo_url TEXT,
  original_photo_base64_hash TEXT,  -- for matching uploads
  metadata JSONB DEFAULT '{}',      -- browser info, source, etc.
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '30 days')
);

-- ─── LEADS (homeowner submissions) ───────────────────
CREATE TABLE IF NOT EXISTS leads (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  session_id UUID REFERENCES design_sessions(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT DEFAULT '',
  address TEXT DEFAULT '',
  notes TEXT DEFAULT '',
  project_type TEXT NOT NULL,
  material_id TEXT,
  material_name TEXT,
  material_brand TEXT,
  original_photo_url TEXT,
  generated_photo_url TEXT,
  status TEXT DEFAULT 'new' CHECK (status IN ('new', 'contacted', 'quoted', 'won', 'lost')),
  utm JSONB DEFAULT '{}',              -- { source, medium, campaign, term, content }
  referrer TEXT DEFAULT '',             -- document.referrer from embed page
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─── DESIGN VARIATIONS (each generated image in a session)
CREATE TABLE IF NOT EXISTS design_variations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id UUID NOT NULL REFERENCES design_sessions(id) ON DELETE CASCADE,
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  parent_id UUID REFERENCES design_variations(id),  -- for refinements
  
  -- What was generated
  mode TEXT NOT NULL CHECK (mode IN ('material', 'style', 'refine', 'batch')),
  project_type TEXT,
  material_id TEXT,
  material_name TEXT,
  material_brand TEXT,
  style_id TEXT,
  refine_instruction TEXT,
  
  -- Results
  generated_photo_url TEXT,
  prompt TEXT,
  model TEXT,
  provider TEXT,
  cost_cents INT DEFAULT 5,
  generation_time_ms INT,
  
  -- User actions
  is_favorite BOOLEAN DEFAULT false,
  rating INT CHECK (rating BETWEEN 1 AND 5),
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─── GENERATIONS (AI usage tracking) ─────────────────
CREATE TABLE IF NOT EXISTS generations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  session_id UUID REFERENCES design_sessions(id) ON DELETE SET NULL,
  lead_id UUID REFERENCES leads(id) ON DELETE SET NULL,
  variation_id UUID REFERENCES design_variations(id) ON DELETE SET NULL,
  project_type TEXT,
  material_id TEXT,
  prompt TEXT,
  model TEXT DEFAULT 'gpt-image-1',
  cost_cents INT DEFAULT 5,
  generation_time_ms INT,
  status TEXT DEFAULT 'success' CHECK (status IN ('success', 'failed', 'pending')),
  provider TEXT DEFAULT 'openai',
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─── MONTHLY USAGE ──────────────────────────────────
CREATE TABLE IF NOT EXISTS monthly_usage (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  month TEXT NOT NULL,
  generation_count INT DEFAULT 0,
  refinement_count INT DEFAULT 0,
  lead_count INT DEFAULT 0,
  total_cost_cents INT DEFAULT 0,
  UNIQUE(tenant_id, month)
);

-- ─── CUSTOM MATERIALS ────────────────────────────────
CREATE TABLE IF NOT EXISTS materials (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  category TEXT NOT NULL,
  brand TEXT NOT NULL,
  name TEXT NOT NULL,
  color_name TEXT DEFAULT '',
  color_hex TEXT,
  color_family TEXT DEFAULT 'gray',
  swatch_url TEXT,
  description TEXT DEFAULT '',
  ai_prompt_hint TEXT DEFAULT '',
  sort_order INT DEFAULT 0,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─── SHAREABLE VISUALIZATION LINKS ──────────────────
CREATE TABLE IF NOT EXISTS shares (
  id TEXT PRIMARY KEY,
  tenant_id UUID REFERENCES tenants(id) ON DELETE SET NULL,
  session_id UUID REFERENCES design_sessions(id) ON DELETE SET NULL,
  original_photo_url TEXT NOT NULL,
  generated_photo_url TEXT NOT NULL,
  project_type TEXT DEFAULT '',
  material_brand TEXT DEFAULT '',
  material_name TEXT DEFAULT '',
  style_name TEXT DEFAULT '',
  view_count INT DEFAULT 0,
  lead_count INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─── ANALYTICS EVENTS ────────────────────────────────
CREATE TABLE IF NOT EXISTS analytics_events (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID REFERENCES tenants(id) ON DELETE SET NULL,
  session_id UUID REFERENCES design_sessions(id) ON DELETE SET NULL,
  event_type TEXT NOT NULL,
  metadata JSONB DEFAULT '{}',
  user_agent TEXT DEFAULT '',
  referrer TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ═══════════════════════════════════════════════════════
-- INDEXES
-- ═══════════════════════════════════════════════════════

CREATE INDEX IF NOT EXISTS idx_tenants_slug ON tenants(slug);
CREATE INDEX IF NOT EXISTS idx_tenants_active ON tenants(active);
CREATE INDEX IF NOT EXISTS idx_tenants_stripe_customer ON tenants(stripe_customer_id);
CREATE INDEX IF NOT EXISTS idx_tenants_stripe_subscription ON tenants(stripe_subscription_id);

CREATE INDEX IF NOT EXISTS idx_leads_tenant ON leads(tenant_id);
CREATE INDEX IF NOT EXISTS idx_leads_status ON leads(tenant_id, status);
CREATE INDEX IF NOT EXISTS idx_leads_created ON leads(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_leads_session ON leads(session_id);

CREATE INDEX IF NOT EXISTS idx_sessions_tenant ON design_sessions(tenant_id);
CREATE INDEX IF NOT EXISTS idx_sessions_token ON design_sessions(session_token);
CREATE INDEX IF NOT EXISTS idx_sessions_created ON design_sessions(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_variations_session ON design_variations(session_id);
CREATE INDEX IF NOT EXISTS idx_variations_tenant ON design_variations(tenant_id);
CREATE INDEX IF NOT EXISTS idx_variations_favorites ON design_variations(session_id, is_favorite) WHERE is_favorite = true;
CREATE INDEX IF NOT EXISTS idx_variations_created ON design_variations(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_generations_tenant ON generations(tenant_id);
CREATE INDEX IF NOT EXISTS idx_generations_session ON generations(session_id);
CREATE INDEX IF NOT EXISTS idx_generations_created ON generations(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_monthly_usage_tenant_month ON monthly_usage(tenant_id, month);

CREATE INDEX IF NOT EXISTS idx_materials_tenant ON materials(tenant_id);
CREATE INDEX IF NOT EXISTS idx_materials_category ON materials(category);
CREATE INDEX IF NOT EXISTS idx_materials_color_family ON materials(color_family);

CREATE INDEX IF NOT EXISTS idx_shares_tenant ON shares(tenant_id);

CREATE INDEX IF NOT EXISTS idx_analytics_tenant ON analytics_events(tenant_id);
CREATE INDEX IF NOT EXISTS idx_analytics_event_type ON analytics_events(event_type);
CREATE INDEX IF NOT EXISTS idx_analytics_created ON analytics_events(created_at);
CREATE INDEX IF NOT EXISTS idx_analytics_tenant_type_date ON analytics_events(tenant_id, event_type, created_at);

-- ═══════════════════════════════════════════════════════
-- RPC FUNCTIONS
-- ═══════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION increment_monthly_usage(
  p_tenant_id UUID,
  p_month TEXT,
  p_cost INT DEFAULT 5
)
RETURNS void AS $$
BEGIN
  INSERT INTO monthly_usage (tenant_id, month, generation_count, total_cost_cents)
  VALUES (p_tenant_id, p_month, 1, p_cost)
  ON CONFLICT (tenant_id, month) DO UPDATE SET
    generation_count = monthly_usage.generation_count + 1,
    total_cost_cents = monthly_usage.total_cost_cents + p_cost;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION increment_monthly_leads(
  p_tenant_id UUID,
  p_month TEXT
)
RETURNS void AS $$
BEGIN
  INSERT INTO monthly_usage (tenant_id, month, lead_count)
  VALUES (p_tenant_id, p_month, 1)
  ON CONFLICT (tenant_id, month) DO UPDATE SET
    lead_count = monthly_usage.lead_count + 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Funnel analytics: conversion rates by tenant
CREATE OR REPLACE FUNCTION get_funnel_stats(
  p_tenant_id UUID,
  p_days INT DEFAULT 30
)
RETURNS TABLE(
  uploads BIGINT,
  generations BIGINT,
  refinements BIGINT,
  favorites BIGINT,
  shares BIGINT,
  leads BIGINT,
  upload_to_gen_pct NUMERIC,
  gen_to_lead_pct NUMERIC
) AS $$
DECLARE
  v_since TIMESTAMPTZ := NOW() - (p_days || ' days')::INTERVAL;
  v_uploads BIGINT;
  v_gens BIGINT;
  v_refines BIGINT;
  v_favs BIGINT;
  v_shares BIGINT;
  v_leads BIGINT;
BEGIN
  SELECT COUNT(*) INTO v_uploads FROM analytics_events
    WHERE tenant_id = p_tenant_id AND event_type = 'upload' AND created_at > v_since;
  SELECT COUNT(*) INTO v_gens FROM analytics_events
    WHERE tenant_id = p_tenant_id AND event_type = 'generate' AND created_at > v_since;
  SELECT COUNT(*) INTO v_refines FROM analytics_events
    WHERE tenant_id = p_tenant_id AND event_type = 'refine' AND created_at > v_since;
  SELECT COUNT(*) INTO v_favs FROM analytics_events
    WHERE tenant_id = p_tenant_id AND event_type = 'favorite' AND created_at > v_since;
  SELECT COUNT(*) INTO v_shares FROM analytics_events
    WHERE tenant_id = p_tenant_id AND event_type = 'share' AND created_at > v_since;
  SELECT COUNT(*) INTO v_leads FROM analytics_events
    WHERE tenant_id = p_tenant_id AND event_type = 'lead_submit' AND created_at > v_since;

  RETURN QUERY SELECT
    v_uploads, v_gens, v_refines, v_favs, v_shares, v_leads,
    CASE WHEN v_uploads > 0 THEN ROUND(v_gens::NUMERIC / v_uploads * 100, 1) ELSE 0 END,
    CASE WHEN v_gens > 0 THEN ROUND(v_leads::NUMERIC / v_gens * 100, 1) ELSE 0 END;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ═══════════════════════════════════════════════════════
-- ROW LEVEL SECURITY
-- ═══════════════════════════════════════════════════════

ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE design_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE design_variations ENABLE ROW LEVEL SECURITY;
ALTER TABLE generations ENABLE ROW LEVEL SECURITY;
ALTER TABLE monthly_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE materials ENABLE ROW LEVEL SECURITY;
ALTER TABLE shares ENABLE ROW LEVEL SECURITY;
ALTER TABLE analytics_events ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN CREATE POLICY "Public read active tenants" ON tenants FOR SELECT USING (active = true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY "Service role full tenants" ON tenants FOR ALL USING (auth.role() = 'service_role'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY "Service role full leads" ON leads FOR ALL USING (auth.role() = 'service_role'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY "Service role full sessions" ON design_sessions FOR ALL USING (auth.role() = 'service_role'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY "Service role full variations" ON design_variations FOR ALL USING (auth.role() = 'service_role'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY "Service role full generations" ON generations FOR ALL USING (auth.role() = 'service_role'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY "Service role full monthly_usage" ON monthly_usage FOR ALL USING (auth.role() = 'service_role'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY "Service role full materials" ON materials FOR ALL USING (auth.role() = 'service_role'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY "Public read active materials" ON materials FOR SELECT USING (active = true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY "Service role full shares" ON shares FOR ALL USING (auth.role() = 'service_role'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY "Public read shares" ON shares FOR SELECT USING (true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY "Public insert analytics" ON analytics_events FOR INSERT WITH CHECK (true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY "Service role full analytics" ON analytics_events FOR ALL USING (auth.role() = 'service_role'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ═══════════════════════════════════════════════════════
-- STORAGE BUCKETS
-- ═══════════════════════════════════════════════════════

INSERT INTO storage.buckets (id, name, public)
VALUES ('photos', 'photos', true), ('generated', 'generated', true)
ON CONFLICT DO NOTHING;

DO $$ BEGIN CREATE POLICY "Public read photos" ON storage.objects FOR SELECT USING (bucket_id = 'photos'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY "Service write photos" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'photos'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY "Public read generated" ON storage.objects FOR SELECT USING (bucket_id = 'generated'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY "Service write generated" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'generated'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ═══════════════════════════════════════════════════════
-- SEED
-- ═══════════════════════════════════════════════════════

INSERT INTO tenants (slug, company_name, tagline, phone, email, website, lead_notify_email, plan, monthly_gen_limit)
VALUES (
  'claflin-construction',
  'Claflin Construction',
  'Chippewa Valley''s Premier Contractor',
  '(715) 723-2687',
  'info@claflinconstruction.com',
  'claflinconstruction.com',
  'leads@claflinconstruction.com',
  'pro',
  200
)
ON CONFLICT (slug) DO NOTHING;

-- ═══════════════════════════════════════════════════════
-- Migration 004: Add api_key to tenants + tenant_hidden_materials table
-- Required by: /api/tenant/materials (Bearer token auth + hide/show)
-- ═══════════════════════════════════════════════════════

-- Add api_key column to tenants for programmatic API access
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS api_key TEXT UNIQUE;

-- Index for fast API key lookups
CREATE INDEX IF NOT EXISTS idx_tenants_api_key ON tenants(api_key) WHERE api_key IS NOT NULL;

-- Table for tenants to hide built-in materials from their catalog
CREATE TABLE IF NOT EXISTS tenant_hidden_materials (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  material_key TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(tenant_id, material_key)
);

-- Enable RLS
ALTER TABLE tenant_hidden_materials ENABLE ROW LEVEL SECURITY;

-- Service role can do anything
CREATE POLICY "service_role_all" ON tenant_hidden_materials
  FOR ALL USING (true) WITH CHECK (true);

-- Optional: RPC for atomic share view count increment
CREATE OR REPLACE FUNCTION increment_share_views(p_share_id TEXT)
RETURNS void AS $$
BEGIN
  UPDATE shares SET view_count = view_count + 1 WHERE id = p_share_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

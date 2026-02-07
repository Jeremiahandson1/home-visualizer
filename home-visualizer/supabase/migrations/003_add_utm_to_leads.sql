-- Migration: Add UTM attribution tracking to leads
-- Run this if you already have a database from a previous version

ALTER TABLE leads ADD COLUMN IF NOT EXISTS utm JSONB DEFAULT '{}';
ALTER TABLE leads ADD COLUMN IF NOT EXISTS referrer TEXT DEFAULT '';

-- Index for querying by UTM source
CREATE INDEX IF NOT EXISTS idx_leads_utm_source ON leads USING gin(utm);

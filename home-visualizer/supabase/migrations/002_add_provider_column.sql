-- Migration: Add provider column to generations table
-- Run this if you already have a database from a previous version

ALTER TABLE generations ADD COLUMN IF NOT EXISTS provider TEXT DEFAULT 'openai';

-- Backfill from model field if it contains provider info (e.g. "openai/gpt-image-1")
UPDATE generations
SET provider = split_part(model, '/', 1)
WHERE provider = 'openai'
  AND model LIKE '%/%';

-- Add index for funnel analytics
CREATE INDEX IF NOT EXISTS idx_generations_provider ON generations(provider);
CREATE INDEX IF NOT EXISTS idx_generations_tenant_created ON generations(tenant_id, created_at);

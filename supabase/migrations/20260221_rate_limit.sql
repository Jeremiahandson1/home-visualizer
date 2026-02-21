-- ═══════════════════════════════════════════════════════
-- RATE LIMIT BUCKETS — Survives Render cold starts
-- Each row = one tenant × one 60-second window
-- Old rows auto-expire via the cleanup function
-- ═══════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS rate_limit_buckets (
  id           BIGSERIAL PRIMARY KEY,
  slug         TEXT        NOT NULL,
  window_start TIMESTAMPTZ NOT NULL,
  count        INT         NOT NULL DEFAULT 0,
  active       INT         NOT NULL DEFAULT 0,
  UNIQUE (slug, window_start)
);

CREATE INDEX IF NOT EXISTS idx_rate_limit_slug_window
  ON rate_limit_buckets (slug, window_start);

-- Auto-delete rows older than 5 minutes (keeps table tiny)
CREATE INDEX IF NOT EXISTS idx_rate_limit_window
  ON rate_limit_buckets (window_start);


-- ─── check_and_increment_rate_limit ──────────────────
-- Atomically upserts the bucket and checks limits.
-- Returns: { blocked bool, reason text, count int, active int }
CREATE OR REPLACE FUNCTION check_and_increment_rate_limit(
  p_slug         TEXT,
  p_window_start TIMESTAMPTZ,
  p_max_per_min  INT DEFAULT 20,
  p_max_active   INT DEFAULT 5
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_count  INT;
  v_active INT;
BEGIN
  -- Upsert: create or increment atomically
  INSERT INTO rate_limit_buckets (slug, window_start, count, active)
  VALUES (p_slug, p_window_start, 1, 1)
  ON CONFLICT (slug, window_start) DO UPDATE SET
    count  = rate_limit_buckets.count  + 1,
    active = rate_limit_buckets.active + 1
  RETURNING count, active INTO v_count, v_active;

  -- Check limits AFTER increment (so we count this request)
  IF v_active > p_max_active THEN
    -- Roll back the increment so we don't permanently inflate
    UPDATE rate_limit_buckets SET
      count  = GREATEST(count  - 1, 0),
      active = GREATEST(active - 1, 0)
    WHERE slug = p_slug AND window_start = p_window_start;

    RETURN jsonb_build_object(
      'blocked', true,
      'reason',  'Too many concurrent requests. Please wait.',
      'count',   v_count  - 1,
      'active',  v_active - 1
    );
  END IF;

  IF v_count > p_max_per_min THEN
    UPDATE rate_limit_buckets SET
      count  = GREATEST(count  - 1, 0),
      active = GREATEST(active - 1, 0)
    WHERE slug = p_slug AND window_start = p_window_start;

    RETURN jsonb_build_object(
      'blocked', true,
      'reason',  'Rate limit exceeded. Please wait a minute.',
      'count',   v_count  - 1,
      'active',  v_active - 1
    );
  END IF;

  -- Cleanup rows older than 5 minutes (opportunistic, non-blocking)
  DELETE FROM rate_limit_buckets
  WHERE window_start < NOW() - INTERVAL '5 minutes';

  RETURN jsonb_build_object(
    'blocked', false,
    'count',   v_count,
    'active',  v_active
  );
END;
$$;


-- ─── release_rate_limit ───────────────────────────────
-- Decrements active count when a request finishes.
CREATE OR REPLACE FUNCTION release_rate_limit(
  p_slug         TEXT,
  p_window_start TIMESTAMPTZ
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE rate_limit_buckets
  SET active = GREATEST(active - 1, 0)
  WHERE slug = p_slug AND window_start = p_window_start;
END;
$$;

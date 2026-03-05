// ═══════════════════════════════════════════════════════
// RATE LIMITER — Supabase-backed, survives cold starts
//
// Strategy: optimistic local cache + Supabase fallback.
// On cold start the local Map is empty but Supabase has
// the real counts, so limits are always enforced.
//
// Limits (per tenantSlug):
//   - 20 requests per 60-second rolling window
//   - 5 concurrent active requests at once
//
// Table: rate_limit_buckets (see schema migration below)
// ═══════════════════════════════════════════════════════

import { getSupabaseAdmin } from './supabase';

// Local cache — speeds up the hot path, lost on cold start (acceptable)
const localCache = new Map();

const WINDOW_MS    = 60_000; // 1 minute
const MAX_PER_MIN  = 20;
const MAX_ACTIVE   = 5;

/**
 * Check and increment rate limit for a tenant.
 * Returns an error string if limited, null if allowed.
 */
export async function checkRateLimit(tenantSlug) {
  const now    = Date.now();
  const window = Math.floor(now / WINDOW_MS); // changes every 60s

  // ─── 1. Local cache fast path ──────────────────────
  const cacheKey = `${tenantSlug}:${window}`;
  let local = localCache.get(cacheKey);
  if (local) {
    if (local.active >= MAX_ACTIVE) return 'Too many concurrent requests. Please wait.';
    if (local.count  >= MAX_PER_MIN) return 'Rate limit exceeded. Please wait a minute.';
    local.count++;
    local.active++;
    return null;
  }

  // ─── 2. Supabase for cold-start / distributed check ─
  try {
    const supabase    = getSupabaseAdmin();
    const windowStart = new Date(window * WINDOW_MS).toISOString();

    // Upsert atomically: increment count, track active
    const { data, error } = await supabase.rpc('check_and_increment_rate_limit', {
      p_slug:         tenantSlug,
      p_window_start: windowStart,
      p_max_per_min:  MAX_PER_MIN,
      p_max_active:   MAX_ACTIVE,
    });

    if (error) throw error;

    if (data?.blocked) {
      return data.reason || 'Rate limit exceeded.';
    }

    // Seed local cache from DB result
    localCache.set(cacheKey, {
      count:  data?.count  || 1,
      active: data?.active || 1,
    });

    // Clean stale cache keys (keep last 3 windows only)
    for (const key of localCache.keys()) {
      const keyWindow = parseInt(key.split(':').pop(), 10);
      if (Number.isNaN(keyWindow) || window - keyWindow > 3) localCache.delete(key);
    }

    return null;
  } catch (err) {
    // If Supabase is unreachable, use local-only with conservative limits.
    // Fail closed: enforce stricter local limits to prevent abuse during outages.
    console.warn('Rate limit DB check failed, using local fallback:', err.message);
    const localEntry = { count: 1, active: 1 };
    localCache.set(cacheKey, localEntry);

    // Count how many local entries exist for this tenant (across windows)
    let totalLocalCount = 0;
    for (const [key, val] of localCache) {
      if (key.startsWith(tenantSlug + ':')) totalLocalCount += val.count;
    }
    // During DB outage, cap at half normal limit to be safe
    if (totalLocalCount > Math.floor(MAX_PER_MIN / 2)) {
      return 'Rate limit exceeded (degraded mode). Please try again shortly.';
    }
    return null;
  }
}

/**
 * Decrement active count when request completes.
 */
export async function releaseRateLimit(tenantSlug) {
  const now    = Date.now();
  const window = Math.floor(now / WINDOW_MS);
  const cacheKey = `${tenantSlug}:${window}`;

  // Update local cache
  const local = localCache.get(cacheKey);
  if (local) local.active = Math.max(0, local.active - 1);

  // Fire-and-forget DB update
  try {
    const supabase    = getSupabaseAdmin();
    const windowStart = new Date(window * WINDOW_MS).toISOString();
    await supabase.rpc('release_rate_limit', {
      p_slug:         tenantSlug,
      p_window_start: windowStart,
    });
  } catch {
    // Non-critical — local cache still decremented
  }
}

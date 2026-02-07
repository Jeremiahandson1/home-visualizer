// ═══════════════════════════════════════════════════════
// A/B TEST FRAMEWORK — Simple split testing
// Assigns visitors to variants via localStorage-free
// random bucketing (works in iframes/embeds).
// Tracks variant assignment + conversion in analytics.
// ═══════════════════════════════════════════════════════

/**
 * Active experiments.
 * Each experiment defines variants with weights (must sum to 100).
 * The Visualizer checks these at render time.
 */
export const EXPERIMENTS = {
  // Lead form timing — when does the "Get a Free Estimate" form appear?
  lead_form_timing: {
    id: 'lead_form_timing',
    variants: [
      { id: 'delay_3s', weight: 34, config: { delayMs: 3000, mode: 'slide' } },
      { id: 'delay_0s', weight: 33, config: { delayMs: 0, mode: 'slide' } },
      { id: 'sticky_bar', weight: 33, config: { delayMs: 0, mode: 'sticky' } },
    ],
  },

  // Style card layout — which visual treatment converts better?
  style_cards: {
    id: 'style_cards',
    variants: [
      { id: 'house_silhouette', weight: 50, config: { cardStyle: 'silhouette' } },
      { id: 'color_bars', weight: 50, config: { cardStyle: 'bars' } },
    ],
  },
};

/**
 * Assign a visitor to a variant for a given experiment.
 * Uses a stable random bucket per session (no localStorage needed).
 * Returns the full variant object { id, weight, config }.
 */
export function getVariant(experimentId) {
  const experiment = EXPERIMENTS[experimentId];
  if (!experiment) return null;

  // Generate a stable-ish random number for this session
  // Uses a combination that stays consistent within a page load
  // but varies between visitors
  const seed = hashCode(experimentId + getSessionSeed());
  const bucket = Math.abs(seed) % 100;

  let cumulative = 0;
  for (const variant of experiment.variants) {
    cumulative += variant.weight;
    if (bucket < cumulative) {
      return variant;
    }
  }

  // Fallback to last variant
  return experiment.variants[experiment.variants.length - 1];
}

/**
 * Get all assigned variants for the current session.
 * Useful for including in analytics events.
 */
export function getAllAssignments() {
  const assignments = {};
  for (const expId of Object.keys(EXPERIMENTS)) {
    const variant = getVariant(expId);
    if (variant) assignments[expId] = variant.id;
  }
  return assignments;
}

// ─── Internal helpers ────────────────────────────────

let _sessionSeed = null;

function getSessionSeed() {
  if (_sessionSeed !== null) return _sessionSeed;

  // Try to get a stable seed per page visit
  // Performance.now gives us sub-ms timing that's unique per visit
  // Combined with a random component for cross-tab uniqueness
  if (typeof window !== 'undefined') {
    _sessionSeed = String(Math.random()).slice(2, 10) +
      String(Date.now()).slice(-6);
  } else {
    // Server-side: just random
    _sessionSeed = String(Math.random()).slice(2, 14);
  }

  return _sessionSeed;
}

function hashCode(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit int
  }
  return hash;
}

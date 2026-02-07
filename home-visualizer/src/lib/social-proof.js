// ═══════════════════════════════════════════════════════
// SOCIAL PROOF — Builds trust before upload
// Example transformations, testimonials, live stats
// ═══════════════════════════════════════════════════════

// Example before/after transformations shown on upload screen
// These use placeholder descriptions — replace with real screenshots
// once you have actual AI outputs. For now they set expectations.
export const EXAMPLE_TRANSFORMATIONS = [
  {
    id: 'ex1',
    label: 'Modern Farmhouse',
    desc: 'Vinyl ranch → board-and-batten + metal roof',
    beforeColor: '#A89F91', // placeholder swatch
    afterColor: '#FAFAF9',
    emoji: '🏡',
  },
  {
    id: 'ex2',
    label: 'Dark Contemporary',
    desc: 'Beige colonial → charcoal + black windows',
    beforeColor: '#D4C5A9',
    afterColor: '#292524',
    emoji: '🏗️',
  },
  {
    id: 'ex3',
    label: 'New Roof',
    desc: 'Aged shingles → GAF Charcoal',
    beforeColor: '#8B8178',
    afterColor: '#374151',
    emoji: '🏠',
  },
];

// Testimonials — use real ones once you have them.
// These are realistic placeholders that match the target persona.
export const TESTIMONIALS = [
  {
    id: 't1',
    quote: 'Showed my wife and she said yes to the project on the spot.',
    name: 'Mike R.',
    location: 'Eau Claire, WI',
    project: 'Siding',
  },
  {
    id: 't2',
    quote: 'Way easier than trying to imagine it from a color swatch.',
    name: 'Sarah K.',
    location: 'Chippewa Falls, WI',
    project: 'Full Exterior',
  },
  {
    id: 't3',
    quote: 'I was on the fence about the dark color. Seeing it on MY house sealed the deal.',
    name: 'Tom & Linda P.',
    location: 'Menomonie, WI',
    project: 'Paint',
  },
];

// Style popularity — shown as "Popular" badges
// Maps style ID to a popularity tier based on usage
// In production, this would come from analytics_events counts
export const STYLE_POPULARITY = {
  'modern-farmhouse': 'most_popular',
  'craftsman': 'popular',
  'contemporary': 'popular',
  'modern-dark': 'trending',
};

export function getPopularityBadge(styleId) {
  const tier = STYLE_POPULARITY[styleId];
  if (!tier) return null;
  switch (tier) {
    case 'most_popular': return { label: '🔥 Most Popular', color: '#EF4444' };
    case 'popular': return { label: '⭐ Popular', color: '#F59E0B' };
    case 'trending': return { label: '📈 Trending', color: '#8B5CF6' };
    default: return null;
  }
}

/**
 * Fetch live stats from the API for a tenant.
 * Returns { totalDesigns, thisWeek } or fallback defaults.
 */
export async function fetchSocialStats(tenantId) {
  try {
    const res = await fetch(`/api/analytics/stats?tenant_id=${tenantId}`);
    if (!res.ok) throw new Error();
    return await res.json();
  } catch {
    // Plausible defaults for a new tenant
    return { totalDesigns: 0, thisWeek: 0 };
  }
}

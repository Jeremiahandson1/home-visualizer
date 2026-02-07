// ═══════════════════════════════════════════════════════════════
// INSTANT DESIGN — Architectural Style Presets
// Upload one photo → get 6 instant style suggestions
// Each style is a curated multi-material package with a
// complete prompt that transforms the entire exterior
// ═══════════════════════════════════════════════════════════════

export const STYLE_PRESETS = [
  {
    id: 'modern-farmhouse',
    name: 'Modern Farmhouse',
    shortDesc: 'White + black + natural wood',
    thumbnail: '🏡',
    colors: { primary: '#FAFAF9', secondary: '#292524', accent: '#C19A6B' },
    prompt: `Transform this home into a Modern Farmhouse style:
- SIDING: White board-and-batten vertical siding OR white horizontal lap siding (James Hardie Arctic White or similar)
- ROOF: Black or dark charcoal standing seam metal roof OR dark gray architectural shingles
- WINDOWS: Black-framed windows (Andersen or Pella style), clean modern profiles
- FRONT DOOR: Stained natural wood door with black hardware, or black door with glass sidelight
- TRIM: Black gutters, black downspouts, black fascia, or matching dark trim
- ACCENTS: Natural wood beam accent above garage or entry, black metal light fixtures
- GARAGE: White carriage-style garage door with black hardware OR black modern flush door
- Keep the exact same house structure, lot, landscaping, driveway. Only change exterior finishes.
- Result must look like a real photograph of this exact home after a professional renovation.`,
  },
  {
    id: 'craftsman',
    name: 'Craftsman',
    shortDesc: 'Earth tones + stone + wood',
    thumbnail: '🪵',
    colors: { primary: '#8B7355', secondary: '#5C4D30', accent: '#A09080' },
    prompt: `Transform this home into a Craftsman style:
- SIDING: Warm earth-toned horizontal lap siding (brown, olive, or dark green) with cedar shingle accents in gables
- ROOF: Low-pitched roof with wide overhanging eaves, exposed rafter tails, dark brown or green shingles
- PORCH: Full-width or partial front porch with tapered columns on stone pedestals, thick square columns
- WINDOWS: Double-hung windows with divided upper sash (4-over-1 or 6-over-1 pattern), dark or natural wood frames
- FRONT DOOR: Stained wood door with glass panels, Craftsman-style divided lights
- ACCENTS: Stone veneer on lower walls or column bases, natural wood trim, Arts & Crafts lighting
- TRIM: Wide trim boards, visible bracket supports under eaves, earth-toned color palette
- Keep the exact same house structure, lot, landscaping, driveway. Only change exterior finishes.
- Result must look like a real photograph.`,
  },
  {
    id: 'contemporary',
    name: 'Contemporary',
    shortDesc: 'Mixed materials + clean lines',
    thumbnail: '🏗️',
    colors: { primary: '#374151', secondary: '#1F2937', accent: '#10B981' },
    prompt: `Transform this home into a Contemporary/Modern style:
- SIDING: Mix of materials — dark horizontal lap siding combined with natural wood-look cladding and possibly stone or stucco
- ROOF: Flat or very low-slope roof, clean edge, dark color. Standing seam metal if sloped is necessary
- WINDOWS: Large floor-to-ceiling or oversized picture windows, black aluminum frames, minimal muntins
- FRONT DOOR: Large pivot door or modern slab door, dark color with clean hardware
- TRIM: Minimal trim, clean edges, dark gutters hidden or integrated
- ACCENTS: Horizontal wood slat privacy screens, integrated landscape lighting, minimalist house numbers
- GARAGE: Modern flush panel garage door with no hardware, dark color, possibly glass panels
- Keep overall house footprint. Simplify rooflines if possible. Emphasize horizontal lines and geometric forms.
- Result must look like a real photograph.`,
  },
  {
    id: 'coastal',
    name: 'Coastal',
    shortDesc: 'Light blues + white + weathered',
    thumbnail: '🏖️',
    colors: { primary: '#E8EEF2', secondary: '#4A6B8A', accent: '#FAFAF9' },
    prompt: `Transform this home into a Coastal/Beach House style:
- SIDING: Light blue-gray OR soft white cedar shingle siding (CertainTeed or Hardie shingle), weathered natural look
- ROOF: Light gray or weathered cedar shake roof, or light metal roof
- WINDOWS: White-framed windows, possibly with functional shutters in a complementary blue or seafoam
- FRONT DOOR: Light blue, seafoam green, or natural wood tone
- TRIM: Bright white trim, white railings, white fascia
- ACCENTS: Covered porch with white columns, nautical-style light fixtures, rope or driftwood details
- GARAGE: White or light gray carriage-style garage door
- RAILINGS: White painted wood railings, possibly cable rail on modern coastal
- Overall feel: breezy, relaxed, sun-bleached. Light color palette.
- Keep the exact same house structure. Result must look like a real photograph.`,
  },
  {
    id: 'colonial',
    name: 'Colonial',
    shortDesc: 'Symmetry + shutters + tradition',
    thumbnail: '🏛️',
    colors: { primary: '#F5F5F0', secondary: '#1C3D5A', accent: '#8B3A3A' },
    prompt: `Transform this home into a Colonial style:
- SIDING: White or cream horizontal clapboard siding, clean traditional lines
- ROOF: Dark gray or black architectural shingles, moderate pitch
- WINDOWS: Symmetrically placed double-hung windows with divided lights (6-over-6 pattern), white frames
- SHUTTERS: Black, navy, or dark green functional-looking shutters flanking each window
- FRONT DOOR: Centered entry with pediment or portico, classic 6-panel door in red, black, or navy
- TRIM: White corner boards, white window casings, dentil molding details
- ACCENTS: Columned entry portico, symmetrical facade, traditional coach lights
- GARAGE: White raised-panel garage door with window inserts
- Result must be perfectly symmetrical where possible. Classic American Colonial.
- Keep the exact same house structure. Result must look like a real photograph.`,
  },
  {
    id: 'tudor',
    name: 'Tudor',
    shortDesc: 'Half-timber + stucco + brick',
    thumbnail: '🏰',
    colors: { primary: '#E8DCC8', secondary: '#4A3728', accent: '#8B5E3C' },
    prompt: `Transform this home into an English Tudor style:
- WALLS: Stucco in warm cream/white with dark wood half-timber framing creating decorative patterns
- LOWER WALLS: Red or brown brick on lower portions, stone accents around entry
- ROOF: Steep-pitched cross-gabled roof in dark gray or dark brown shingles, prominent front-facing gables
- WINDOWS: Tall narrow casement windows with diamond-pane leaded glass look, grouped in sets
- FRONT DOOR: Heavy arched or rounded wood door with iron strap hinges, set in stone or brick surround
- CHIMNEY: Prominent decorative masonry chimney, possibly with decorative chimney pots
- ACCENTS: Arched entry, copper or wrought iron light fixtures, natural stone walkway
- Keep the exact same house structure and lot. Result must look like a real photograph.`,
  },
  {
    id: 'mediterranean',
    name: 'Mediterranean',
    shortDesc: 'Stucco + terracotta + arches',
    thumbnail: '☀️',
    colors: { primary: '#E8DCC8', secondary: '#C46A3A', accent: '#4A6B42' },
    prompt: `Transform this home into a Mediterranean/Spanish style:
- WALLS: Smooth warm-toned stucco in cream, tan, or soft terracotta
- ROOF: Barrel-shaped terracotta clay tile roof in warm red-orange
- WINDOWS: Arched or rounded top windows, wrought iron window grilles, deep-set in thick walls
- FRONT DOOR: Dark stained arched wood door with decorative iron hardware
- ACCENTS: Wrought iron balcony railings, clay pot planters, exposed wood beam details at entry
- TRIM: Minimal trim, stucco returns at windows, dark ironwork accents
- PATIO: Covered loggia or arcade with arched openings, terra cotta tile floors visible
- LANDSCAPING NOTE: Mediterranean plants (olive, cypress, bougainvillea) would complement but keep existing landscaping
- Keep the exact same house structure. Result must look like a real photograph.`,
  },
  {
    id: 'modern-dark',
    name: 'Modern Dark',
    shortDesc: 'All black + dramatic',
    thumbnail: '🖤',
    colors: { primary: '#1C1917', secondary: '#292524', accent: '#F5F5F0' },
    prompt: `Transform this home into a Modern Dark/All-Black style:
- SIDING: Matte black siding — board-and-batten, horizontal lap, or mixed panels, all in deep black
- ROOF: Black standing seam metal roof, clean lines
- WINDOWS: Black-framed windows, large format, plenty of glass for contrast
- FRONT DOOR: Black door OR one accent: natural stained wood door as the single warm element
- TRIM: All black — gutters, fascia, soffit, downspouts, all matching black
- GARAGE: Black flush-panel or modern garage door, matching exterior
- ACCENTS: Minimal — black modern sconce lights, matte black house numbers, possibly one wood-clad accent wall or entry surround as the only non-black element
- Dramatic monochromatic black exterior. The only contrast comes from glass reflections and one optional wood or white accent at the entry.
- Keep the exact same house structure. Result must look like a real photograph.`,
  },
  {
    id: 'scandinavian',
    name: 'Scandinavian',
    shortDesc: 'White + wood + minimal',
    thumbnail: '❄️',
    colors: { primary: '#F5F5F0', secondary: '#C19A6B', accent: '#78716C' },
    prompt: `Transform this home into a Scandinavian/Nordic style:
- SIDING: Clean white horizontal siding with natural wood cladding accents (light cedar or pine tone)
- ROOF: Simple gabled roof in dark gray or black, clean eave lines, no decorative elements
- WINDOWS: Large windows with thin black or natural wood frames, maximizing natural light, minimal divided lights
- FRONT DOOR: Natural stained wood door OR muted color (sage, dusty blue), simple clean hardware
- TRIM: Minimal white or natural wood trim, no ornamental details
- ACCENTS: Light natural wood on entry surround, porch ceiling, or accent wall, warm subtle earth tones
- GARAGE: Simple panel door in white or wood tone
- Overall: Restrained, warm minimalism. Nothing ornamental. Natural materials. Hygge warmth.
- Keep the exact same house structure. Result must look like a real photograph.`,
  },
  {
    id: 'rustic-mountain',
    name: 'Mountain Lodge',
    shortDesc: 'Stone + timber + rugged',
    thumbnail: '⛰️',
    colors: { primary: '#6B4E37', secondary: '#A09080', accent: '#2D4A2D' },
    prompt: `Transform this home into a Mountain Lodge/Rustic style:
- SIDING: Dark stained wood plank siding (vertical or horizontal), heavy timber accents
- STONE: Substantial natural stone veneer on lower walls, chimney, and entry columns
- ROOF: Dark green or dark bronze standing seam metal, OR dark cedar shake. Wide overhangs with exposed timber rafter tails
- WINDOWS: Large windows with natural wood or dark bronze frames, possibly multi-pane
- FRONT DOOR: Heavy rustic wood door with iron hardware, possibly arched
- ACCENTS: Massive timber beams at entry/porch, natural stone columns, wrought iron details
- CHIMNEY: Large stone chimney, prominent feature
- GARAGE: Dark stained wood carriage-style garage door with iron hardware
- Overall: Substantial, grounded, connected to nature. Heavy materials. Lodge feel.
- Keep the exact same house structure. Result must look like a real photograph.`,
  },
  {
    id: 'mid-century',
    name: 'Mid-Century Modern',
    shortDesc: 'Retro lines + natural materials',
    thumbnail: '🌴',
    colors: { primary: '#92400E', secondary: '#78350F', accent: '#E8DCC8' },
    prompt: `Transform this home into a Mid-Century Modern style:
- SIDING: Mix of materials — natural stone or brick, painted or stained wood paneling, possibly some stucco. Earth tones: olive, rust, walnut, cream
- ROOF: Flat roof or low-slope butterfly/shed roof, wide overhangs, exposed beams at eave
- WINDOWS: Large picture windows, floor-to-ceiling glass, clerestory windows, minimal frames
- FRONT DOOR: Bold color accent door (orange, teal, or yellow) OR natural stained wood slab door
- TRIM: Minimal, clean lines. Visible post-and-beam structure
- ACCENTS: Breeze block or decorative screen element, angular geometric details, retro-modern lighting
- GARAGE: Open carport or simple flush-panel door
- Overall: Celebrate structure, connection to outdoors, optimistic mid-century spirit. Horizontal emphasis.
- Keep the exact same house structure. Result must look like a real photograph.`,
  },
  {
    id: 'transitional',
    name: 'Transitional',
    shortDesc: 'Updated classic + clean',
    thumbnail: '🏠',
    colors: { primary: '#D1C8BA', secondary: '#3A3C3E', accent: '#78716C' },
    prompt: `Transform this home into a Transitional style (updated traditional):
- SIDING: Warm greige horizontal lap siding (like Sherwin-Williams Agreeable Gray or Accessible Beige)
- ROOF: Dark charcoal architectural shingles, clean lines
- WINDOWS: Black or dark bronze framed windows, simple profiles, no divided lights or minimal grids
- FRONT DOOR: Dark charcoal or black door with simple modern hardware, possibly with glass
- TRIM: White or cream trim at windows and corners, but cleaner/simpler than full traditional
- GUTTERS: Dark bronze or black, matching window frames
- ACCENTS: One stone or brick accent element (entry wall, water table), modern light fixtures
- GARAGE: Dark-framed carriage-style or flush modern garage door
- Overall: Traditional proportions with modern finishes. Clean but warm. Not fussy, not sterile.
- Keep the exact same house structure. Result must look like a real photograph.`,
  },
];

// Get 6 recommended styles for instant design
// Could be personalized based on house type detection in the future
export function getInstantStyles(count = 6) {
  // Return the most popular/versatile styles first
  const priority = [
    'modern-farmhouse', 'transitional', 'contemporary',
    'coastal', 'craftsman', 'modern-dark',
    'colonial', 'scandinavian', 'mediterranean',
    'tudor', 'rustic-mountain', 'mid-century',
  ];
  return priority.slice(0, count).map(id => STYLE_PRESETS.find(s => s.id === id));
}

export function getStyleById(id) {
  return STYLE_PRESETS.find(s => s.id === id);
}

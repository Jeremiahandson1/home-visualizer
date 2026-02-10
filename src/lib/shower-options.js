// ═══════════════════════════════════════════════════════════════
// SHOWER & TUB BUILDER — Configuration Options
// Step-by-step configurator for bath/shower/tub design
// Selections compile into a detailed AI prompt
// ═══════════════════════════════════════════════════════════════

export const BUILDER_STEPS = [
  { id: 'layout',    label: 'Layout',       icon: '📐', required: true },
  { id: 'walls',     label: 'Wall Tile',    icon: '🧱', required: true },
  { id: 'floor',     label: 'Floor',        icon: '⬡',  required: true },
  { id: 'glass',     label: 'Enclosure',    icon: '🪟', required: true },
  { id: 'fixtures',  label: 'Fixtures',     icon: '🚿', required: true },
  { id: 'tub',       label: 'Tub Style',    icon: '🛁', showIf: (sel) => sel.layout?.hasTub },
  { id: 'niche',     label: 'Storage',      icon: '📦', required: false },
  { id: 'extras',    label: 'Extras',       icon: '✨', required: false },
];

export const LAYOUT_OPTIONS = [
  {
    id: 'walkin-shower',
    name: 'Walk-In Shower',
    desc: 'Open or glass-enclosed, no tub',
    icon: '🚿',
    hasTub: false,
    colors: ['#E8E5E0', '#9CA3AF'],
    promptBase: 'a spacious walk-in shower',
  },
  {
    id: 'tub-shower-combo',
    name: 'Tub/Shower Combo',
    desc: 'Bathtub with showerhead above',
    icon: '🛁',
    hasTub: true,
    colors: ['#E8E5E0', '#6B99B8'],
    promptBase: 'a tub/shower combination with bathtub and overhead shower',
  },
  {
    id: 'freestanding-tub',
    name: 'Freestanding Tub',
    desc: 'Standalone soaking tub, separate or no shower',
    icon: '🫧',
    hasTub: true,
    colors: ['#F5F5F0', '#C19A6B'],
    promptBase: 'a freestanding soaking bathtub as the centerpiece',
  },
  {
    id: 'alcove-tub',
    name: 'Alcove Tub',
    desc: 'Built-in tub between three walls',
    icon: '🧼',
    hasTub: true,
    colors: ['#E8E5E0', '#78716C'],
    promptBase: 'an alcove bathtub built between three walls',
  },
  {
    id: 'corner-shower',
    name: 'Corner Shower',
    desc: 'Neo-angle or curved glass corner unit',
    icon: '📐',
    hasTub: false,
    colors: ['#D1C8BA', '#6B7280'],
    promptBase: 'a corner shower with neo-angle glass enclosure',
  },
  {
    id: 'doorless-walkin',
    name: 'Doorless Walk-In',
    desc: 'Open entry, no door or glass, curbless',
    icon: '🚪',
    hasTub: false,
    colors: ['#F5F5F0', '#374151'],
    promptBase: 'a doorless curbless walk-in shower with open entry, no glass door',
  },
  {
    id: 'wet-room',
    name: 'Wet Room',
    desc: 'Fully tiled open shower area, European style',
    icon: '💧',
    hasTub: false,
    colors: ['#9CA3AF', '#374151'],
    promptBase: 'a European-style wet room with fully tiled open shower area and linear floor drain',
  },
];

export const WALL_TILE_OPTIONS = [
  // ── Large Format ──
  { id: 'large-white-matte', name: 'White Matte Large Format', color: '#F0EDE8', accent: '#E0DDD5', family: 'white',
    desc: '24×48 or larger, minimal grout', prompt: 'large format white matte porcelain wall tile (24x48 inch), minimal thin grout lines, clean modern look' },
  { id: 'large-gray', name: 'Light Gray Large Format', color: '#C8C5C0', accent: '#B0ADA8', family: 'gray',
    desc: '24×48 or larger, soft gray', prompt: 'large format light gray matte porcelain wall tile, minimal grout lines, spa-like' },
  { id: 'large-warm-beige', name: 'Warm Beige Large Format', color: '#D8CCBA', accent: '#C4B8A5', family: 'beige',
    desc: '24×48, warm natural tone', prompt: 'large format warm beige porcelain wall tile, natural stone-like tone, minimal grout' },
  { id: 'large-charcoal', name: 'Charcoal Large Format', color: '#3A3C3E', accent: '#252728', family: 'black',
    desc: '24×48, dramatic dark', prompt: 'large format dark charcoal matte porcelain wall tile, dramatic and bold, thin dark grout lines' },

  // ── Subway ──
  { id: 'subway-white', name: 'White Subway', color: '#F5F5F0', accent: '#E8E5E0', family: 'white',
    desc: 'Classic 3×6 brick lay', prompt: 'classic white subway tile in brick-lay pattern, 3x6 inch, light gray grout lines' },
  { id: 'subway-white-stacked', name: 'White Stacked Subway', color: '#F5F5F0', accent: '#E8E5E0', family: 'white',
    desc: 'Vertical stack bond', prompt: 'white subway tile in vertical stacked bond pattern, modern linear look, thin grout lines' },
  { id: 'subway-sage', name: 'Sage Green Subway', color: '#8FA87C', accent: '#6D8A5E', family: 'green',
    desc: 'Soft green, glossy', prompt: 'sage green glossy subway tile in brick-lay pattern, soft natural green with gentle sheen' },
  { id: 'subway-navy', name: 'Navy Subway', color: '#1C3D5A', accent: '#0E2540', family: 'blue',
    desc: 'Deep navy, glossy', prompt: 'deep navy blue glossy subway tile in brick-lay pattern, rich dramatic blue' },
  { id: 'subway-black', name: 'Black Subway', color: '#1C1917', accent: '#0C0A09', family: 'black',
    desc: 'Matte black, bold', prompt: 'matte black subway tile in brick-lay pattern, bold dramatic with light gray grout' },

  // ── Marble Look ──
  { id: 'marble-calacatta', name: 'Calacatta Marble Look', color: '#F5F0E8', accent: '#B8A88A', family: 'white',
    desc: 'White with gold veining', prompt: 'Calacatta marble-look porcelain tile, white background with dramatic warm gold and gray veining, floor to ceiling, luxurious' },
  { id: 'marble-carrara', name: 'Carrara Marble Look', color: '#F0EDE8', accent: '#9A9590', family: 'white',
    desc: 'White with soft gray veining', prompt: 'Carrara marble-look porcelain tile, white background with soft subtle gray veining, classic elegant, floor to ceiling' },
  { id: 'marble-dark-emperador', name: 'Dark Emperador', color: '#4A3828', accent: '#C4A878', family: 'brown',
    desc: 'Rich brown with gold veins', prompt: 'dark Emperador marble-look porcelain tile, rich dark brown with warm gold veining, dramatic luxury' },

  // ── Zellige / Handmade ──
  { id: 'zellige-white', name: 'White Zellige', color: '#F0EDE5', accent: '#D8D5CD', family: 'white',
    desc: 'Handmade Moroccan, imperfect glaze', prompt: 'white zellige tile with handmade irregular surface, slight variation and imperfections in glaze, warm artisan character' },
  { id: 'zellige-terracotta', name: 'Terracotta Zellige', color: '#C46A3A', accent: '#A55228', family: 'red',
    desc: 'Warm clay Moroccan tile', prompt: 'terracotta zellige tile with handmade surface, warm earthy orange-red clay with glaze variation' },
  { id: 'zellige-blue', name: 'Ocean Blue Zellige', color: '#4A6B8A', accent: '#35516A', family: 'blue',
    desc: 'Deep blue, handmade', prompt: 'deep ocean blue zellige tile with handmade irregular glaze, rich blue with tonal variation' },

  // ── Herringbone / Pattern ──
  { id: 'herringbone-white', name: 'White Herringbone', color: '#F5F5F0', accent: '#E0DDD5', family: 'white',
    desc: 'Herringbone pattern, white', prompt: 'white porcelain tile in herringbone pattern, V-shaped interlocking layout, clean and textured' },
  { id: 'herringbone-marble', name: 'Marble Herringbone', color: '#F0EDE8', accent: '#9A9590', family: 'white',
    desc: 'Marble-look herringbone', prompt: 'marble-look porcelain tile in herringbone pattern, white with gray veining, elegant texture' },

  // ── Natural Stone Look ──
  { id: 'travertine', name: 'Travertine Look', color: '#D4C5A9', accent: '#B8A88A', family: 'beige',
    desc: 'Warm natural travertine', prompt: 'travertine-look porcelain wall tile, warm cream and tan with natural stone pitting and variation' },
  { id: 'slate-dark', name: 'Dark Slate Look', color: '#3A3E42', accent: '#252830', family: 'black',
    desc: 'Textured dark slate', prompt: 'dark slate-look porcelain tile, textured cleft surface, charcoal-gray natural stone appearance' },
];

export const FLOOR_OPTIONS = [
  { id: 'floor-match', name: 'Match Walls', color: null, accent: null, family: 'match',
    desc: 'Same tile as walls', prompt: 'floor tile matching the wall tile in same material and color' },
  { id: 'pebble-white', name: 'White Pebble Mosaic', color: '#E8E5E0', accent: '#D0CDC8', family: 'white',
    desc: 'Smooth river pebbles', prompt: 'white smooth river pebble mosaic floor tile, rounded stones in shades of white and cream' },
  { id: 'pebble-gray', name: 'Gray Pebble Mosaic', color: '#8A8A82', accent: '#6A6A62', family: 'gray',
    desc: 'Mixed gray pebbles', prompt: 'mixed gray river pebble mosaic floor tile, varied gray tones from light to charcoal' },
  { id: 'hex-white', name: 'White Hexagon', color: '#F5F5F0', accent: '#E0DDD5', family: 'white',
    desc: 'Classic hex mosaic', prompt: 'white hexagonal mosaic floor tile, classic 2-inch hexagons with gray grout, traditional' },
  { id: 'hex-marble', name: 'Marble Hexagon', color: '#F0EDE8', accent: '#B8B0A5', family: 'white',
    desc: 'Marble-look hex mosaic', prompt: 'Carrara marble-look hexagonal mosaic floor tile, white with gray veining, elegant' },
  { id: 'hex-black-white', name: 'Black & White Hex', color: '#1C1917', accent: '#F5F5F0', family: 'black',
    desc: 'Graphic two-tone', prompt: 'black and white hexagonal mosaic floor tile, graphic pattern alternating black and white hexagons' },
  { id: 'penny-white', name: 'White Penny Round', color: '#F5F5F0', accent: '#E0DDD5', family: 'white',
    desc: 'Small round mosaic', prompt: 'white penny round mosaic floor tile, small circular tiles with gray grout' },
  { id: 'penny-black', name: 'Black Penny Round', color: '#1C1917', accent: '#0C0A09', family: 'black',
    desc: 'Black round mosaic', prompt: 'matte black penny round mosaic floor tile, dramatic dark floor with contrasting grout' },
  { id: 'large-gray-floor', name: 'Gray Large Format', color: '#9A9590', accent: '#807B76', family: 'gray',
    desc: 'Large format gray porcelain', prompt: 'large format gray porcelain floor tile, matte finish, minimal grout lines, modern' },
  { id: 'wood-look', name: 'Wood Look Plank', color: '#A0784A', accent: '#7B5B3A', family: 'brown',
    desc: 'Warm wood-look porcelain', prompt: 'warm wood-look porcelain plank floor tile, natural oak tone, realistic wood grain' },
  { id: 'pattern-cement', name: 'Patterned Cement', color: '#7A7A72', accent: '#F5F5F0', family: 'gray',
    desc: 'Decorative encaustic pattern', prompt: 'decorative patterned cement tile floor, black and white geometric encaustic pattern, Mediterranean artisan' },
];

export const GLASS_OPTIONS = [
  { id: 'frameless-full', name: 'Frameless Glass', desc: 'Full height, no frame, clean modern',
    prompt: 'frameless clear glass shower enclosure, floor-to-ceiling, minimal hardware, clean and modern' },
  { id: 'frameless-half', name: 'Half Glass Panel', desc: 'Frameless panel, open top',
    prompt: 'frameless half-height glass panel, fixed panel without door, modern open feel' },
  { id: 'semi-frameless', name: 'Semi-Frameless', desc: 'Slim frame, clean lines',
    prompt: 'semi-frameless glass shower door with slim metal frame, clean modern lines' },
  { id: 'black-frame', name: 'Black Framed', desc: 'Grid pattern, industrial chic',
    prompt: 'matte black framed glass shower enclosure with grid pattern dividers, industrial style, Crittall-inspired' },
  { id: 'gold-frame', name: 'Gold/Brass Frame', desc: 'Brushed gold frame, elegant',
    prompt: 'brushed gold framed glass shower enclosure, elegant warm metal frame with clear glass' },
  { id: 'barn-door', name: 'Sliding Barn Door', desc: 'Bypass sliding glass panel',
    prompt: 'sliding barn-door style glass shower panel on exposed roller track hardware' },
  { id: 'curtain', name: 'Shower Curtain', desc: 'Fabric or linen curtain, no glass',
    prompt: 'fabric shower curtain in white or neutral linen, hung from ceiling-mount rod, no glass enclosure' },
  { id: 'no-enclosure', name: 'Open / No Enclosure', desc: 'Doorless walk-in, open entry',
    prompt: 'no glass enclosure, open doorless entry to the shower area, curbless transition' },
];

export const FIXTURE_FINISH_OPTIONS = [
  { id: 'matte-black', name: 'Matte Black', color: '#1C1917', prompt: 'matte black' },
  { id: 'brushed-nickel', name: 'Brushed Nickel', color: '#A8A8A8', prompt: 'brushed nickel' },
  { id: 'polished-chrome', name: 'Polished Chrome', color: '#C0C0C0', prompt: 'polished chrome' },
  { id: 'brushed-gold', name: 'Brushed Gold', color: '#C19A6B', prompt: 'brushed gold/champagne bronze' },
  { id: 'oil-rubbed-bronze', name: 'Oil-Rubbed Bronze', color: '#4A3828', prompt: 'oil-rubbed bronze' },
  { id: 'polished-brass', name: 'Polished Brass', color: '#D4A84B', prompt: 'polished brass' },
  { id: 'gunmetal', name: 'Gunmetal Gray', color: '#5A5E62', prompt: 'gunmetal gray' },
];

export const SHOWERHEAD_OPTIONS = [
  { id: 'rain-ceiling', name: 'Ceiling Rain Head', desc: '12"+ overhead flush mount',
    prompt: 'large ceiling-mounted rainfall showerhead (12 inch or larger), flush to ceiling' },
  { id: 'rain-wall', name: 'Wall-Mount Rain Head', desc: 'Rain head on wall arm',
    prompt: 'wall-mounted rainfall showerhead on adjustable arm, large square or round head' },
  { id: 'handheld', name: 'Handheld Only', desc: 'Slide bar with hand shower',
    prompt: 'handheld shower on vertical slide bar, adjustable height, no fixed head' },
  { id: 'dual-rain-hand', name: 'Dual: Rain + Handheld', desc: 'Both rain head and handheld',
    prompt: 'dual shower system with ceiling rain showerhead AND wall-mounted handheld on slide bar' },
  { id: 'body-jets', name: 'Multi-Jet System', desc: 'Body jets + rain head, luxury',
    prompt: 'luxury multi-jet shower system with ceiling rain head, multiple wall-mounted body spray jets, and handheld' },
  { id: 'exposed-pipe', name: 'Exposed Pipe', desc: 'Vintage exposed thermostatic set',
    prompt: 'exposed pipe thermostatic shower set with vintage-style crosshandle controls and overhead rain can' },
];

export const TUB_OPTIONS = [
  // ── Freestanding ──
  { id: 'freestanding-slipper', name: 'Slipper Tub', desc: 'Raised back, classic elegant',
    color: '#F5F5F0', category: 'freestanding',
    prompt: 'white freestanding slipper bathtub with one raised end for reclining, classic elegant shape, smooth exterior' },
  { id: 'freestanding-oval', name: 'Modern Oval', desc: 'Sleek contemporary oval',
    color: '#F5F5F0', category: 'freestanding',
    prompt: 'white modern freestanding oval soaking tub, contemporary minimalist shape, smooth seamless exterior' },
  { id: 'freestanding-flat-bottom', name: 'Flat Bottom', desc: 'Modern minimalist, sits flat',
    color: '#F5F5F0', category: 'freestanding',
    prompt: 'white freestanding flat-bottom bathtub, rectangular modern shape, sits directly on floor' },
  { id: 'freestanding-clawfoot', name: 'Clawfoot', desc: 'Classic vintage, metal feet',
    color: '#F5F5F0', category: 'freestanding',
    prompt: 'classic white clawfoot bathtub with ornate metal claw feet, vintage roll-top design' },
  { id: 'freestanding-black', name: 'Black Exterior', desc: 'White inside, matte black outside',
    color: '#1C1917', category: 'freestanding',
    prompt: 'freestanding bathtub with matte black exterior and white interior, dramatic modern contrast' },
  { id: 'freestanding-stone', name: 'Natural Stone', desc: 'Concrete or stone-look',
    color: '#9A9590', category: 'freestanding',
    prompt: 'freestanding bathtub in natural concrete or stone-look material, gray matte finish, organic modern' },
  { id: 'freestanding-japanese', name: 'Japanese Soaking', desc: 'Deep, compact, upright soaking',
    color: '#F5F5F0', category: 'freestanding',
    prompt: 'deep Japanese soaking tub (ofuro style), compact and deep for upright soaking, natural wood or white composite' },

  // ── Built-In ──
  { id: 'alcove-standard', name: 'Standard Alcove', desc: 'Basic 60" built-in',
    color: '#F5F5F0', category: 'builtin',
    prompt: 'standard white alcove bathtub built between three walls, 60-inch, clean apron front' },
  { id: 'alcove-skirted', name: 'Skirted Alcove', desc: 'Seamless integrated skirt',
    color: '#F5F5F0', category: 'builtin',
    prompt: 'white skirted alcove bathtub with seamless integrated apron, clean modern lines' },
  { id: 'drop-in', name: 'Drop-In Tub', desc: 'Set into tiled surround/deck',
    color: '#F5F5F0', category: 'builtin',
    prompt: 'drop-in bathtub set into a tiled surround deck, with tiled deck surface around rim, built-in luxury' },
  { id: 'undermount', name: 'Undermount Tub', desc: 'Rim hidden under deck',
    color: '#F5F5F0', category: 'builtin',
    prompt: 'undermount bathtub with rim hidden beneath tiled deck, seamless modern look' },
  { id: 'corner-tub', name: 'Corner Tub', desc: 'Triangular corner whirlpool',
    color: '#F5F5F0', category: 'builtin',
    prompt: 'corner bathtub with triangular shape fitting into corner, whirlpool/soaking style' },
];

export const NICHE_OPTIONS = [
  { id: 'niche-tiled', name: 'Tiled Niche', desc: 'Built-in wall niche, matching or accent tile',
    prompt: 'built-in tiled shower niche recessed into wall, for shampoo and soap storage' },
  { id: 'niche-marble-shelf', name: 'Marble Shelf Niche', desc: 'Niche with marble slab shelf',
    prompt: 'built-in shower niche with marble or quartz slab shelf divider, elegant storage' },
  { id: 'niche-accent', name: 'Accent Tile Niche', desc: 'Niche with contrasting accent tile inside',
    prompt: 'built-in shower niche with contrasting accent tile inside (metallic, mosaic, or different color), decorative feature' },
  { id: 'corner-shelf', name: 'Corner Floating Shelf', desc: 'Metal corner shelves',
    prompt: 'metal corner floating shelves in shower, minimalist storage, matching fixture finish' },
  { id: 'ledge', name: 'Full-Width Ledge', desc: 'Continuous horizontal shelf/ledge',
    prompt: 'full-width continuous horizontal shelf ledge running along one shower wall, for storage and display' },
  { id: 'none', name: 'No Storage', desc: 'Clean walls, no niches',
    prompt: 'no built-in storage niches or shelves, clean uninterrupted wall tile' },
];

export const EXTRAS_OPTIONS = [
  { id: 'bench-tiled', name: 'Tiled Bench', desc: 'Built-in tiled seat',
    prompt: 'built-in tiled shower bench seat along one wall, matching wall tile' },
  { id: 'bench-teak', name: 'Teak Bench', desc: 'Freestanding or floating teak wood',
    prompt: 'teak wood shower bench, natural warm wood accent, spa feel' },
  { id: 'linear-drain', name: 'Linear Drain', desc: 'Sleek linear floor drain',
    prompt: 'sleek linear floor drain along one wall instead of center drain, modern minimal' },
  { id: 'accent-strip', name: 'Accent Tile Strip', desc: 'Horizontal decorative band',
    prompt: 'horizontal accent tile strip band running across shower wall, contrasting mosaic or metallic tile' },
  { id: 'led-niche', name: 'LED Niche Lighting', desc: 'Backlit niche or strip',
    prompt: 'LED strip lighting inside shower niche and/or along ceiling perimeter, warm ambient glow' },
  { id: 'steam', name: 'Steam Generator', desc: 'Steam shower with sealed glass',
    prompt: 'steam shower setup with fully sealed glass enclosure to ceiling, steam generator vent visible' },
  { id: 'window', name: 'Natural Light Window', desc: 'Frosted window or skylight',
    prompt: 'frosted glass window or skylight in shower area allowing natural light while maintaining privacy' },
];

// ─── PROMPT COMPILER ────────────────────────────────────
// Takes all selections and builds the final AI prompt
export function compileShowerPrompt(selections) {
  const { layout, walls, floor, glass, fixtures, showerhead, tub, niche, extras } = selections;

  if (!layout || !walls || !fixtures) return null;

  const fixtureDesc = fixtures.prompt;

  let prompt = `Transform ONLY the shower/bathtub area in this bathroom photo. Keep the rest of the bathroom (vanity, mirror, toilet, flooring outside shower) exactly as they are. Replace the existing shower or tub with:

LAYOUT: ${layout.promptBase}

WALL TILE: ${walls.prompt}, covering all shower walls floor to ceiling

FLOOR: ${floor ? floor.prompt : 'matching the wall tile on the shower floor'}

ENCLOSURE: ${glass ? glass.prompt : 'frameless clear glass enclosure'}

FIXTURES: All shower fixtures in ${fixtureDesc} finish — faucet, handles, showerhead, all hardware coordinated in ${fixtureDesc}

SHOWERHEAD: ${showerhead ? showerhead.prompt : 'wall-mounted rainfall showerhead'}, in ${fixtureDesc}`;

  if (tub && layout.hasTub) {
    prompt += `\n\nBATHTUB: ${tub.prompt}`;
    if (tub.category === 'freestanding') {
      prompt += `, with floor-mounted tub filler faucet in ${fixtureDesc}`;
    }
  }

  if (niche && niche.id !== 'none') {
    prompt += `\n\nSTORAGE: ${niche.prompt}`;
  }

  if (extras && extras.length > 0) {
    const extraPrompts = extras.map(e => e.prompt).join('. ');
    prompt += `\n\nEXTRAS: ${extraPrompts}`;
  }

  prompt += `

CRITICAL RULES:
- ONLY modify the shower/tub area. Keep everything else in the bathroom identical.
- Maintain the same room dimensions, lighting, and perspective.
- Result must look like a real photograph of a professional bathroom renovation.
- All fixtures, hardware, and accessories must be coordinated in ${fixtureDesc} finish.`;

  return prompt;
}

// Build a summary label for the configured design
export function getBuilderSummary(selections) {
  const parts = [];
  if (selections.layout) parts.push(selections.layout.name);
  if (selections.walls) parts.push(selections.walls.name);
  if (selections.fixtures) parts.push(selections.fixtures.name);
  if (selections.tub) parts.push(selections.tub.name);
  return parts.join(' · ') || 'Custom Shower';
}

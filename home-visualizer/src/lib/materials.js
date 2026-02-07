// ═══════════════════════════════════════════════════════════════
// MATERIALS CATALOG — 150+ Real Products from Real Manufacturers
// Organized by category, filterable by brand, type, color family
// ═══════════════════════════════════════════════════════════════

export const PROJECTS = [
  { id: 'siding',   label: 'Siding',           icon: '◧', desc: 'Fiber cement, vinyl, engineered wood, stone veneer' },
  { id: 'roofing',  label: 'Roofing',          icon: '⌂', desc: 'Architectural shingles, metal, shake, tile' },
  { id: 'paint',    label: 'Exterior Paint',    icon: '◉', desc: 'Sherwin-Williams, Benjamin Moore, PPG' },
  { id: 'windows',  label: 'Windows & Doors',   icon: '▣', desc: 'Andersen, Pella, Marvin, Milgard' },
  { id: 'deck',     label: 'Deck & Patio',      icon: '▦', desc: 'Composite, PVC, hardwood, stone' },
  { id: 'garage',   label: 'Garage Doors',      icon: '▤', desc: 'Clopay, Amarr, C.H.I., Wayne Dalton' },
  { id: 'gutters',  label: 'Gutters & Trim',    icon: '═', desc: 'Seamless aluminum, copper, fascia, soffit' },
  { id: 'exterior', label: 'Full Exterior',      icon: '✦', desc: 'Complete style transformations' },
  { id: 'kitchen',  label: 'Kitchen',            icon: '▧', desc: 'Cabinets, countertops, backsplash' },
  { id: 'bathroom', label: 'Bathroom',           icon: '◫', desc: 'Tile, vanity, fixtures, shower' },
  { id: 'flooring', label: 'Flooring',           icon: '▨', desc: 'Hardwood, LVP, tile, carpet' },
];

// Color families for filtering
export const COLOR_FAMILIES = [
  { id: 'white',  label: 'White & Cream', range: ['#FFFFFF', '#F5F0E0'] },
  { id: 'gray',   label: 'Gray',          range: ['#E0E0E0', '#404040'] },
  { id: 'black',  label: 'Black',         range: ['#3A3A3A', '#000000'] },
  { id: 'blue',   label: 'Blue',          range: ['#B0C4DE', '#1A2744'] },
  { id: 'green',  label: 'Green',         range: ['#A8D5A0', '#2D4A2D'] },
  { id: 'brown',  label: 'Brown & Tan',   range: ['#D4B896', '#3E2718'] },
  { id: 'red',    label: 'Red & Burgundy',range: ['#CD5C5C', '#5B1515'] },
  { id: 'yellow', label: 'Yellow & Gold', range: ['#FFE4A0', '#8B7E2B'] },
  { id: 'beige',  label: 'Beige & Taupe', range: ['#E8DCC8', '#7A6B55'] },
];

// ─── SIDING ────────────────────────────────────────────
const SIDING = [
  // James Hardie — HardiePlank Lap Siding (ColorPlus)
  { id: 'hardie-arctic',       name: 'Arctic White',       color: '#F5F5F0', accent: '#E0E0DB', brand: 'James Hardie', type: 'Fiber Cement Lap', colorFamily: 'white',  aiHint: 'smooth horizontal lap siding, 8.25 inch exposure, clean lines, bright white fiber cement' },
  { id: 'hardie-iron-gray',    name: 'Iron Gray',          color: '#5C5C5C', accent: '#404040', brand: 'James Hardie', type: 'Fiber Cement Lap', colorFamily: 'gray',   aiHint: 'medium-dark gray horizontal lap siding, subtle wood grain texture' },
  { id: 'hardie-evening-blue', name: 'Evening Blue',       color: '#2C3E5A', accent: '#1A2744', brand: 'James Hardie', type: 'Fiber Cement Lap', colorFamily: 'blue',   aiHint: 'deep navy blue fiber cement lap siding, sophisticated dark blue' },
  { id: 'hardie-monterey',     name: 'Monterey Taupe',     color: '#A89882', accent: '#8B7D68', brand: 'James Hardie', type: 'Fiber Cement Lap', colorFamily: 'beige',  aiHint: 'warm taupe fiber cement, earthy mid-tone, pairs with white trim' },
  { id: 'hardie-night-gray',   name: 'Night Gray',         color: '#3A3C3E', accent: '#252728', brand: 'James Hardie', type: 'Fiber Cement Lap', colorFamily: 'black',  aiHint: 'very dark charcoal gray, nearly black fiber cement siding' },
  { id: 'hardie-aged-pewter',  name: 'Aged Pewter',        color: '#8B8D8F', accent: '#6E7072', brand: 'James Hardie', type: 'Fiber Cement Lap', colorFamily: 'gray',   aiHint: 'medium gray with slight blue undertone, classic pewter' },
  { id: 'hardie-cobble-stone', name: 'Cobble Stone',       color: '#B5A998', accent: '#9A8E7D', brand: 'James Hardie', type: 'Fiber Cement Lap', colorFamily: 'beige',  aiHint: 'warm light tan stone-inspired tone, natural look' },
  { id: 'hardie-khaki-brown',  name: 'Khaki Brown',        color: '#7A6B52', accent: '#5E5040', brand: 'James Hardie', type: 'Fiber Cement Lap', colorFamily: 'brown',  aiHint: 'rich earthy khaki brown, warm neutral' },
  { id: 'hardie-boothbay-blue',name: 'Boothbay Blue',      color: '#6B8399', accent: '#4D6577', brand: 'James Hardie', type: 'Fiber Cement Lap', colorFamily: 'blue',   aiHint: 'soft coastal blue-gray, muted nautical blue' },
  { id: 'hardie-woodland-cream',name:'Woodland Cream',     color: '#E8DCC8', accent: '#D4C8B0', brand: 'James Hardie', type: 'Fiber Cement Lap', colorFamily: 'beige',  aiHint: 'warm cream with yellow undertone, classic traditional' },
  { id: 'hardie-mountain-sage',name: 'Mountain Sage',      color: '#7A8B72', accent: '#5E7456', brand: 'James Hardie', type: 'Fiber Cement Lap', colorFamily: 'green',  aiHint: 'muted sage green, organic natural green' },
  { id: 'hardie-timber-bark',  name: 'Timber Bark',        color: '#6B4E37', accent: '#4D3825', brand: 'James Hardie', type: 'Fiber Cement Lap', colorFamily: 'brown',  aiHint: 'deep rich brown, dark wood-inspired' },

  // James Hardie — HardieShingle
  { id: 'hardie-shingle-pearl',name: 'Pearl Gray Shingle', color: '#D0D0CE', accent: '#B8B8B5', brand: 'James Hardie', type: 'Fiber Cement Shingle', colorFamily: 'gray', aiHint: 'staggered-edge shingle siding, light gray, coastal cottage look' },
  { id: 'hardie-shingle-mid',  name: 'Midnight Blue Shingle',color:'#2A3A52',accent: '#1C2840', brand: 'James Hardie', type: 'Fiber Cement Shingle', colorFamily: 'blue', aiHint: 'dark navy shingle siding, Cape Cod style, deep blue' },

  // James Hardie — HardiePanel Vertical
  { id: 'hardie-panel-white',  name: 'Arctic White Panel', color: '#F5F5F0', accent: '#E0E0DB', brand: 'James Hardie', type: 'Fiber Cement Panel', colorFamily: 'white', aiHint: 'smooth vertical panel siding with batten strips, modern farmhouse board-and-batten, white' },
  { id: 'hardie-panel-gray',   name: 'Iron Gray Panel',    color: '#5C5C5C', accent: '#404040', brand: 'James Hardie', type: 'Fiber Cement Panel', colorFamily: 'gray',  aiHint: 'vertical board-and-batten panel siding, modern gray' },

  // LP SmartSide
  { id: 'lp-sage',             name: 'Sage Green',         color: '#7A9172', accent: '#5E7456', brand: 'LP SmartSide', type: 'Engineered Wood Lap', colorFamily: 'green',  aiHint: 'textured engineered wood lap siding, natural sage green, cedar grain texture' },
  { id: 'lp-canyon-brown',     name: 'Canyon Brown',       color: '#6B4E37', accent: '#4D3825', brand: 'LP SmartSide', type: 'Engineered Wood Lap', colorFamily: 'brown',  aiHint: 'deep brown engineered wood lap siding with realistic cedar grain' },
  { id: 'lp-french-gray',     name: 'French Gray',        color: '#9CA0A5', accent: '#7D8185', brand: 'LP SmartSide', type: 'Engineered Wood Lap', colorFamily: 'gray',   aiHint: 'sophisticated medium gray engineered wood with cedar texture' },
  { id: 'lp-deep-ocean',      name: 'Deep Ocean',         color: '#2C4A60', accent: '#1A3248', brand: 'LP SmartSide', type: 'Engineered Wood Lap', colorFamily: 'blue',   aiHint: 'dark ocean blue engineered wood siding, dramatic and bold' },
  { id: 'lp-snowflake-white', name: 'Snowflake White',    color: '#F8F6F0', accent: '#E8E5DC', brand: 'LP SmartSide', type: 'Engineered Wood Lap', colorFamily: 'white',  aiHint: 'bright white engineered wood lap siding with subtle woodgrain' },
  { id: 'lp-panel-charcoal',  name: 'Charcoal Panel',     color: '#3A3C3E', accent: '#252728', brand: 'LP SmartSide', type: 'Engineered Wood Panel', colorFamily: 'black', aiHint: 'vertical board-and-batten engineered wood panels, very dark charcoal' },

  // CertainTeed (Vinyl)
  { id: 'ct-barn-red',         name: 'Heritage Red',       color: '#8B3A3A', accent: '#6B2222', brand: 'CertainTeed', type: 'Vinyl Lap',        colorFamily: 'red',    aiHint: 'classic barn red vinyl siding, traditional New England style' },
  { id: 'ct-cypress',          name: 'Cypress',            color: '#8FA87C', accent: '#6D8A5E', brand: 'CertainTeed', type: 'Vinyl Lap',        colorFamily: 'green',  aiHint: 'muted green vinyl siding, natural organic feel' },
  { id: 'ct-sterling-gray',    name: 'Sterling Gray',      color: '#9A9EA5', accent: '#7D8088', brand: 'CertainTeed', type: 'Vinyl Lap',        colorFamily: 'gray',   aiHint: 'cool medium gray vinyl siding, modern and clean' },
  { id: 'ct-linen',            name: 'Linen',              color: '#E8E0D0', accent: '#D4C8B5', brand: 'CertainTeed', type: 'Vinyl Lap',        colorFamily: 'beige',  aiHint: 'warm linen white vinyl, soft cream tone' },
  { id: 'ct-savannah-wicker',  name: 'Savannah Wicker',    color: '#C4AD8A', accent: '#A89570', brand: 'CertainTeed', type: 'Vinyl Lap',        colorFamily: 'beige',  aiHint: 'warm golden tan vinyl siding, southern warmth' },
  { id: 'ct-pacific-blue',     name: 'Pacific Blue',       color: '#4A6B8A', accent: '#35516A', brand: 'CertainTeed', type: 'Vinyl Lap',        colorFamily: 'blue',   aiHint: 'rich coastal blue vinyl siding, ocean-inspired' },
  { id: 'ct-shake-driftwood',  name: 'Driftwood Shake',    color: '#A89882', accent: '#8B7D68', brand: 'CertainTeed', type: 'Vinyl Shake',      colorFamily: 'beige',  aiHint: 'staggered cedar shake vinyl, weathered driftwood gray-brown' },
  { id: 'ct-shake-moss',       name: 'Moss Shake',         color: '#6B7A5A', accent: '#506040', brand: 'CertainTeed', type: 'Vinyl Shake',      colorFamily: 'green',  aiHint: 'deep moss green cedar shake vinyl, rustic cottage style' },

  // Stone Veneer
  { id: 'boral-fieldstone',    name: 'Fieldstone',         color: '#A09080', accent: '#857560', brand: 'Boral',        type: 'Stone Veneer',     colorFamily: 'beige',  aiHint: 'natural fieldstone veneer, mixed gray-tan irregular stones, rustic texture' },
  { id: 'boral-cedar',         name: 'Cedar Blend',        color: '#B8956A', accent: '#9A7B52', brand: 'Boral',        type: 'Stone Veneer',     colorFamily: 'brown',  aiHint: 'warm cedar-toned stone veneer, golden brown natural stone' },
  { id: 'cs-charcoal-ledge',   name: 'Charcoal Ledgestone',color: '#4A4E52', accent: '#35383C', brand: 'Cultured Stone',type:'Stone Veneer',     colorFamily: 'gray',   aiHint: 'dark gray stacked ledgestone veneer, horizontal linear stone, modern' },
  { id: 'cs-white-ledge',      name: 'White Elm Ledge',    color: '#D8D4CC', accent: '#C0BCB2', brand: 'Cultured Stone',type:'Stone Veneer',     colorFamily: 'white',  aiHint: 'light cream-white stacked stone veneer, clean modern stone accent' },
  { id: 'cs-country-creek',    name: 'Country Creek',      color: '#8A7A62', accent: '#6E6048', brand: 'Cultured Stone',type:'Stone Veneer',     colorFamily: 'brown',  aiHint: 'mixed warm brown and gray natural creek stone, organic random pattern' },

  // Board & Batten
  { id: 'bb-white',            name: 'White Board & Batten',color:'#F5F5F0', accent: '#E0E0DB', brand: 'Mixed',        type: 'Board & Batten',   colorFamily: 'white',  aiHint: 'vertical board and batten siding, wide boards with narrow battens, white, modern farmhouse' },
  { id: 'bb-black',            name: 'Black Board & Batten',color:'#1C1917', accent: '#0C0A09', brand: 'Mixed',        type: 'Board & Batten',   colorFamily: 'black',  aiHint: 'vertical board and batten siding, matte black, dramatic modern' },
  { id: 'bb-navy',             name: 'Navy Board & Batten', color:'#1E3250', accent: '#142240', brand: 'Mixed',        type: 'Board & Batten',   colorFamily: 'blue',   aiHint: 'vertical board and batten siding, deep navy blue, coastal modern' },
];

// ─── ROOFING ───────────────────────────────────────────
const ROOFING = [
  // GAF Timberline HDZ
  { id: 'gaf-charcoal',        name: 'Charcoal',           color: '#374151', accent: '#1F2937', brand: 'GAF Timberline HDZ',     type: 'Architectural Shingle', colorFamily: 'gray',  aiHint: 'dark charcoal dimensional shingle roof, layered shadow lines, most popular color' },
  { id: 'gaf-weathered-wood',  name: 'Weathered Wood',     color: '#8B7355', accent: '#6B5740', brand: 'GAF Timberline HDZ',     type: 'Architectural Shingle', colorFamily: 'brown', aiHint: 'warm brown blend shingles with weathered look, tan-brown mix' },
  { id: 'gaf-barkwood',        name: 'Barkwood',           color: '#7A6B55', accent: '#5C5040', brand: 'GAF Timberline HDZ',     type: 'Architectural Shingle', colorFamily: 'brown', aiHint: 'rich tree bark brown dimensional shingles, warm earthy brown' },
  { id: 'gaf-pewter-gray',     name: 'Pewter Gray',        color: '#7A7D80', accent: '#5C5F62', brand: 'GAF Timberline HDZ',     type: 'Architectural Shingle', colorFamily: 'gray',  aiHint: 'medium gray with slight warm undertone, classic neutral' },
  { id: 'gaf-slate',           name: 'Slate',              color: '#5A6878', accent: '#404E5E', brand: 'GAF Timberline HDZ',     type: 'Architectural Shingle', colorFamily: 'blue',  aiHint: 'blue-gray slate-toned shingles, cool sophisticated gray' },
  { id: 'gaf-hickory',         name: 'Hickory',            color: '#6B5B48', accent: '#504535', brand: 'GAF Timberline HDZ',     type: 'Architectural Shingle', colorFamily: 'brown', aiHint: 'deep warm brown with reddish undertone, classic hickory' },
  { id: 'gaf-shakewood',       name: 'Shakewood',          color: '#9A8A72', accent: '#7A6A55', brand: 'GAF Timberline HDZ',     type: 'Architectural Shingle', colorFamily: 'beige', aiHint: 'light warm tan-brown blend, cedar shake inspired' },
  { id: 'gaf-mission-brown',   name: 'Mission Brown',      color: '#5A4535', accent: '#3E3025', brand: 'GAF Timberline HDZ',     type: 'Architectural Shingle', colorFamily: 'brown', aiHint: 'deep chocolate brown, Spanish mission inspired, very dark brown' },

  // Owens Corning Duration
  { id: 'oc-onyx-black',       name: 'Onyx Black',         color: '#1C1917', accent: '#0C0A09', brand: 'Owens Corning Duration', type: 'Architectural Shingle', colorFamily: 'black', aiHint: 'pure black dimensional shingles, bold dramatic black roof' },
  { id: 'oc-estate-gray',      name: 'Estate Gray',        color: '#64748B', accent: '#475569', brand: 'Owens Corning Duration', type: 'Architectural Shingle', colorFamily: 'gray',  aiHint: 'sophisticated blue-tinted gray, elegant estate style' },
  { id: 'oc-driftwood',        name: 'Driftwood',          color: '#A09080', accent: '#857060', brand: 'Owens Corning Duration', type: 'Architectural Shingle', colorFamily: 'beige', aiHint: 'weathered sandy gray-brown, coastal driftwood look' },
  { id: 'oc-desert-tan',       name: 'Desert Tan',         color: '#C4AD8A', accent: '#A89570', brand: 'Owens Corning Duration', type: 'Architectural Shingle', colorFamily: 'beige', aiHint: 'light sandy tan, warm desert-inspired, popular in warm climates' },
  { id: 'oc-teak',             name: 'Teak',               color: '#7A5E42', accent: '#5C4530', brand: 'Owens Corning Duration', type: 'Architectural Shingle', colorFamily: 'brown', aiHint: 'rich teak wood brown with warm red undertone' },

  // CertainTeed Landmark
  { id: 'ct-moire-black',      name: 'Moire Black',        color: '#252525', accent: '#151515', brand: 'CertainTeed Landmark',  type: 'Architectural Shingle', colorFamily: 'black', aiHint: 'jet black shingle roof with subtle tonal variation' },
  { id: 'ct-georgetown-gray',  name: 'Georgetown Gray',    color: '#6A7078', accent: '#4E545C', brand: 'CertainTeed Landmark',  type: 'Architectural Shingle', colorFamily: 'gray',  aiHint: 'refined medium gray, sophisticated Georgetown colonial gray' },
  { id: 'ct-heather-blend',    name: 'Heather Blend',      color: '#8A7A6A', accent: '#6A5E50', brand: 'CertainTeed Landmark',  type: 'Architectural Shingle', colorFamily: 'brown', aiHint: 'warm brown-gray blend, heathered natural look' },

  // Standing Seam Metal
  { id: 'metal-black',         name: 'Matte Black',        color: '#1C1917', accent: '#0F0E0D', brand: 'Englert',               type: 'Standing Seam Metal', colorFamily: 'black',  aiHint: 'matte black standing seam metal roof, clean vertical ribs, modern' },
  { id: 'metal-bronze',        name: 'Dark Bronze',        color: '#7B6843', accent: '#5C4D30', brand: 'Englert',               type: 'Standing Seam Metal', colorFamily: 'brown',  aiHint: 'dark bronze standing seam metal, warm metallic brown-gold' },
  { id: 'metal-galvalume',     name: 'Galvalume Silver',   color: '#A8A8A8', accent: '#888888', brand: 'Englert',               type: 'Standing Seam Metal', colorFamily: 'gray',   aiHint: 'silver galvalume standing seam metal, industrial clean look' },
  { id: 'metal-forest-green',  name: 'Forest Green',       color: '#2D4A2D', accent: '#1C361C', brand: 'Englert',               type: 'Standing Seam Metal', colorFamily: 'green',  aiHint: 'deep forest green standing seam metal roof, classic country' },
  { id: 'metal-barn-red',      name: 'Barn Red',           color: '#8B3A3A', accent: '#6B2222', brand: 'Englert',               type: 'Standing Seam Metal', colorFamily: 'red',    aiHint: 'traditional barn red standing seam metal, farmhouse style' },
  { id: 'metal-charcoal',      name: 'Charcoal Metal',     color: '#3A3C3E', accent: '#252728', brand: 'Englert',               type: 'Standing Seam Metal', colorFamily: 'gray',   aiHint: 'dark charcoal gray standing seam metal roof, sleek modern' },
  { id: 'metal-copper',        name: 'Aged Copper',        color: '#6B8B73', accent: '#4A6B52', brand: 'Custom',                type: 'Standing Seam Metal', colorFamily: 'green',  aiHint: 'patina copper standing seam metal, verdigris green, aged copper roof' },

  // Cedar Shake
  { id: 'shake-cedar',         name: 'Natural Cedar',      color: '#A0784A', accent: '#7B5B3A', brand: 'Maibec',                type: 'Cedar Shake',         colorFamily: 'brown',  aiHint: 'natural cedar shake roof, split cedar with warm honey-brown tones, rustic' },
  { id: 'shake-weathered',     name: 'Weathered Gray',     color: '#8A8A82', accent: '#6A6A62', brand: 'Maibec',                type: 'Cedar Shake',         colorFamily: 'gray',   aiHint: 'weathered silver-gray cedar shake, aged natural patina' },

  // Tile
  { id: 'tile-terracotta',     name: 'Terracotta',         color: '#C46A3A', accent: '#A55228', brand: 'Boral',                 type: 'Clay Tile',           colorFamily: 'red',    aiHint: 'traditional terracotta barrel clay tile roof, Mediterranean style, warm orange-red' },
  { id: 'tile-slate-gray',     name: 'Slate Gray Tile',    color: '#5A5E62', accent: '#404448', brand: 'DaVinci',               type: 'Synthetic Tile',      colorFamily: 'gray',   aiHint: 'flat gray slate-look synthetic roof tiles, European style, clean gray' },
];

// ─── PAINT ─────────────────────────────────────────────
const PAINT = [
  // Sherwin-Williams Top Exterior Colors
  { id: 'sw-pure-white',       name: 'Pure White (SW7005)', color: '#F3EFE0', accent: '#E8E4D5', brand: 'Sherwin-Williams', type: 'Exterior Paint', colorFamily: 'white',  aiHint: 'painted siding in warm pure white, clean but not stark, slight cream warmth' },
  { id: 'sw-alabaster',        name: 'Alabaster (SW7008)',  color: '#EDEADF', accent: '#E0DDD2', brand: 'Sherwin-Williams', type: 'Exterior Paint', colorFamily: 'white',  aiHint: 'soft creamy white exterior paint, warm alabaster, inviting traditional' },
  { id: 'sw-snowbound',        name: 'Snowbound (SW7004)', color: '#EDE9DF', accent: '#E0DCD2', brand: 'Sherwin-Williams', type: 'Exterior Paint', colorFamily: 'white',  aiHint: 'soft warm white, gentle ivory undertone, bright yet not cold' },
  { id: 'sw-repose-gray',      name: 'Repose Gray (SW7015)',color:'#C2BFB8', accent: '#ABA8A0', brand: 'Sherwin-Williams', type: 'Exterior Paint', colorFamily: 'gray',   aiHint: 'warm medium gray exterior paint, greige undertone, most popular gray' },
  { id: 'sw-agreeable-gray',   name: 'Agreeable Gray (SW7029)',color:'#D1C8BA',accent:'#BEB5A5',brand: 'Sherwin-Williams', type: 'Exterior Paint', colorFamily: 'beige',  aiHint: 'warm greige exterior paint, balanced gray-beige, universally appealing' },
  { id: 'sw-iron-ore',         name: 'Iron Ore (SW7069)',  color: '#434243', accent: '#323232', brand: 'Sherwin-Williams', type: 'Exterior Paint', colorFamily: 'black',  aiHint: 'very dark charcoal exterior paint, nearly black, dramatic modern' },
  { id: 'sw-naval',            name: 'Naval (SW6244)',      color: '#2E3441', accent: '#1E242F', brand: 'Sherwin-Williams', type: 'Exterior Paint', colorFamily: 'blue',   aiHint: 'deep navy blue exterior paint, sophisticated dark blue, 2020 COTY' },
  { id: 'sw-sea-salt',         name: 'Sea Salt (SW6204)',   color: '#C7D0C5', accent: '#B0BAA8', brand: 'Sherwin-Williams', type: 'Exterior Paint', colorFamily: 'green',  aiHint: 'soft green-gray exterior paint, coastal spa-like, muted sage' },
  { id: 'sw-accessible-beige', name: 'Accessible Beige (SW7036)',color:'#D1C4AD',accent:'#BEB19A',brand:'Sherwin-Williams', type: 'Exterior Paint', colorFamily: 'beige',  aiHint: 'warm neutral beige exterior paint, sandy warmth, classic' },
  { id: 'sw-tricorn-black',    name: 'Tricorn Black (SW6258)',color:'#2C2C2C',accent:'#1A1A1A',brand: 'Sherwin-Williams', type: 'Exterior Paint', colorFamily: 'black',  aiHint: 'true black exterior paint, bold dramatic black house' },
  { id: 'sw-thunderous',       name: 'Thunderous (SW6201)', color: '#636A6D', accent: '#4A5255', brand: 'Sherwin-Williams', type: 'Exterior Paint', colorFamily: 'gray',   aiHint: 'dark blue-gray exterior paint, moody sophisticated dark gray' },
  { id: 'sw-evergreen-fog',    name: 'Evergreen Fog (SW9130)',color:'#9EA393',accent:'#848A78',brand: 'Sherwin-Williams', type: 'Exterior Paint', colorFamily: 'green',  aiHint: 'muted sage green exterior paint, earthy organic green-gray, 2022 COTY' },
  { id: 'sw-urbane-bronze',    name: 'Urbane Bronze (SW7048)',color:'#5E5549',accent:'#454035',brand: 'Sherwin-Williams', type: 'Exterior Paint', colorFamily: 'brown',  aiHint: 'dark warm bronze-brown exterior paint, sophisticated earthy dark' },
  { id: 'sw-cyberspace',       name: 'Cyberspace (SW7076)', color: '#2E3238', accent: '#1E2228', brand: 'Sherwin-Williams', type: 'Exterior Paint', colorFamily: 'black',  aiHint: 'deep dark blue-black exterior paint, midnight tone, modern drama' },
  { id: 'sw-dover-white',      name: 'Dover White (SW6385)',color: '#E4D9C5', accent: '#D4C9B2', brand: 'Sherwin-Williams', type: 'Exterior Paint', colorFamily: 'beige',  aiHint: 'warm cream-white with subtle yellow, traditional warm white' },

  // Benjamin Moore Top Exterior Colors
  { id: 'bm-white-dove',       name: 'White Dove (OC-17)',  color: '#ECE5D5', accent: '#DDD5C5', brand: 'Benjamin Moore', type: 'Exterior Paint', colorFamily: 'white',  aiHint: 'soft warm white with subtle yellow, not stark, inviting' },
  { id: 'bm-simply-white',     name: 'Simply White (OC-117)',color:'#F5F0E1',accent:'#E8E3D4',brand: 'Benjamin Moore', type: 'Exterior Paint', colorFamily: 'white',  aiHint: 'clean bright white with warm undertone, fresh and crisp' },
  { id: 'bm-hale-navy',        name: 'Hale Navy (HC-154)',  color: '#2B3850', accent: '#1C2840', brand: 'Benjamin Moore', type: 'Exterior Paint', colorFamily: 'blue',   aiHint: 'rich dark navy blue, classic nautical deep blue, sophisticated' },
  { id: 'bm-revere-pewter',    name: 'Revere Pewter (HC-172)',color:'#C4B9A3',accent:'#ACA18A',brand: 'Benjamin Moore', type: 'Exterior Paint', colorFamily: 'beige',  aiHint: 'warm greige, balanced pewter, classic neutral warm gray-beige' },
  { id: 'bm-chantilly-lace',   name: 'Chantilly Lace (OC-65)',color:'#F5F2ED',accent:'#E8E5E0',brand: 'Benjamin Moore', type: 'Exterior Paint', colorFamily: 'white',  aiHint: 'bright crisp white with neutral undertone, clean modern white' },
  { id: 'bm-kendall-charcoal', name: 'Kendall Charcoal (HC-166)',color:'#545758',accent:'#3E4142',brand: 'Benjamin Moore', type: 'Exterior Paint', colorFamily: 'gray', aiHint: 'rich deep charcoal gray, warm undertone, dramatic dark gray' },
  { id: 'bm-newburyport-blue', name: 'Newburyport Blue (HC-155)',color:'#3A4E62',accent:'#283A4C',brand: 'Benjamin Moore', type: 'Exterior Paint', colorFamily: 'blue', aiHint: 'deep blue with gray undertone, coastal New England blue' },
  { id: 'bm-edgecomb-gray',    name: 'Edgecomb Gray (HC-173)',color:'#D2C9B8',accent:'#BEB5A2',brand: 'Benjamin Moore', type: 'Exterior Paint', colorFamily: 'beige',  aiHint: 'light warm greige, versatile neutral with subtle warmth' },
  { id: 'bm-wrought-iron',     name: 'Wrought Iron (2124-10)',color:'#3A3C3E',accent:'#2A2C2E',brand: 'Benjamin Moore', type: 'Exterior Paint', colorFamily: 'black',  aiHint: 'dark near-black with subtle brown, softer than pure black, elegant' },
  { id: 'bm-sage-green',       name: 'Sage (2138-10)',      color: '#6B7A5A', accent: '#506040', brand: 'Benjamin Moore', type: 'Exterior Paint', colorFamily: 'green',  aiHint: 'earthy sage green, organic natural tone, pairs with cream trim' },

  // PPG / Glidden
  { id: 'ppg-juniper-berry',   name: 'Juniper Berry',       color: '#3B5440', accent: '#284030', brand: 'PPG',           type: 'Exterior Paint', colorFamily: 'green',  aiHint: 'deep forest green exterior paint, rich evergreen' },
  { id: 'ppg-gray-flannel',    name: 'Gray Flannel',        color: '#7A7E82', accent: '#5E6266', brand: 'PPG',           type: 'Exterior Paint', colorFamily: 'gray',   aiHint: 'classic medium gray, neutral flannel tone' },
];

// ─── WINDOWS & DOORS ───────────────────────────────────
const WINDOWS = [
  // Andersen
  { id: 'andersen-black',       name: 'Black',              color: '#1C1917', accent: '#0C0A09', brand: 'Andersen 400 Series',   type: 'Double-Hung',   colorFamily: 'black', aiHint: 'black exterior frame double-hung windows, modern contrast, clean lines' },
  { id: 'andersen-white',       name: 'White',              color: '#FAFAF9', accent: '#E7E5E4', brand: 'Andersen 400 Series',   type: 'Double-Hung',   colorFamily: 'white', aiHint: 'white frame double-hung windows, traditional clean look' },
  { id: 'andersen-sandtone',    name: 'Sandtone',           color: '#C8B898', accent: '#A89E78', brand: 'Andersen 400 Series',   type: 'Double-Hung',   colorFamily: 'beige', aiHint: 'warm sandtone beige frame windows, soft neutral' },
  { id: 'andersen-dark-bronze', name: 'Dark Bronze',        color: '#3E3420', accent: '#2A2218', brand: 'Andersen E-Series',     type: 'Casement',      colorFamily: 'brown', aiHint: 'dark bronze aluminum-clad casement windows, upscale' },
  // Pella
  { id: 'pella-black',          name: 'Black',              color: '#1C1917', accent: '#0C0A09', brand: 'Pella Lifestyle',       type: 'Casement',      colorFamily: 'black', aiHint: 'black frame casement windows, contemporary, operable' },
  { id: 'pella-putty',          name: 'Putty',              color: '#C4B8A0', accent: '#A89C82', brand: 'Pella 250 Series',      type: 'Double-Hung',   colorFamily: 'beige', aiHint: 'warm putty beige frame double-hung windows, classic' },
  { id: 'pella-hartford-green', name: 'Hartford Green',     color: '#2E4A35', accent: '#1C3225', brand: 'Pella Architect',       type: 'Casement',      colorFamily: 'green', aiHint: 'deep green window frames, traditional colonial green' },
  // Marvin
  { id: 'marvin-ebony',         name: 'Ebony',              color: '#292524', accent: '#1C1917', brand: 'Marvin Ultimate',       type: 'Picture Window', colorFamily: 'black', aiHint: 'ebony black large picture window, expansive glass, modern' },
  { id: 'marvin-stone-white',   name: 'Stone White',        color: '#E8E0D0', accent: '#D4C8B5', brand: 'Marvin Essential',      type: 'Slider',        colorFamily: 'white', aiHint: 'soft stone white slider windows, contemporary clean' },
  // Doors
  { id: 'door-black-modern',    name: 'Black Modern Entry',  color: '#1C1917', accent: '#0C0A09', brand: 'Therma-Tru',          type: 'Entry Door',    colorFamily: 'black', aiHint: 'modern black fiberglass entry door with glass sidelights and clean hardware' },
  { id: 'door-craftsman',       name: 'Craftsman Stained',   color: '#6B4E37', accent: '#4D3825', brand: 'Therma-Tru',          type: 'Entry Door',    colorFamily: 'brown', aiHint: 'stained wood grain craftsman door with glass panels, warm mahogany' },
  { id: 'door-red',             name: 'Classic Red',         color: '#8B2222', accent: '#6B1515', brand: 'Therma-Tru',          type: 'Entry Door',    colorFamily: 'red',   aiHint: 'bold red front door, classic traditional statement, colonial style' },
  { id: 'door-navy',            name: 'Navy Blue',           color: '#2B3850', accent: '#1C2840', brand: 'Therma-Tru',          type: 'Entry Door',    colorFamily: 'blue',  aiHint: 'deep navy blue front door, coastal sophisticated, modern classic' },
];

// ─── DECK & PATIO ──────────────────────────────────────
const DECK = [
  // Trex
  { id: 'trex-gravel',          name: 'Gravel Path',        color: '#B8AFA0', accent: '#9A9182', brand: 'Trex Transcend',        type: 'Composite',     colorFamily: 'beige', aiHint: 'light tan composite deck boards, subtle grain pattern, clean modern deck' },
  { id: 'trex-lava',            name: 'Lava Rock',          color: '#5C4A3A', accent: '#3E3028', brand: 'Trex Transcend',        type: 'Composite',     colorFamily: 'brown', aiHint: 'deep dark brown composite deck, rich espresso tone' },
  { id: 'trex-tiki',            name: 'Tiki Torch',         color: '#C4A060', accent: '#A68540', brand: 'Trex Transcend',        type: 'Composite',     colorFamily: 'yellow', aiHint: 'warm golden honey composite deck boards, tropical warmth' },
  { id: 'trex-spiced',          name: 'Spiced Rum',         color: '#8B5E3C', accent: '#6B4528', brand: 'Trex Transcend',        type: 'Composite',     colorFamily: 'brown', aiHint: 'rich warm medium brown composite deck, cedar-inspired' },
  { id: 'trex-island-mist',     name: 'Island Mist',        color: '#9AA098', accent: '#7A8078', brand: 'Trex Transcend',        type: 'Composite',     colorFamily: 'gray',  aiHint: 'soft gray-green composite deck, weathered coastal look' },
  { id: 'trex-vintage-lantern', name: 'Vintage Lantern',    color: '#7A6048', accent: '#5C4835', brand: 'Trex Transcend',        type: 'Composite',     colorFamily: 'brown', aiHint: 'warm dark brown composite deck with vintage character' },
  // TimberTech
  { id: 'timbertech-pecan',     name: 'Pecan',              color: '#9A7B52', accent: '#7B5B3A', brand: 'TimberTech AZEK',       type: 'PVC Deck',      colorFamily: 'brown', aiHint: 'warm pecan brown PVC deck boards, realistic wood grain, no splinters' },
  { id: 'timbertech-slate',     name: 'Slate Gray',         color: '#6B7280', accent: '#4B5563', brand: 'TimberTech AZEK',       type: 'PVC Deck',      colorFamily: 'gray',  aiHint: 'cool slate gray PVC deck boards, contemporary modern' },
  { id: 'timbertech-dark-hickory',name:'Dark Hickory',      color: '#4A3728', accent: '#2E2218', brand: 'TimberTech AZEK',       type: 'PVC Deck',      colorFamily: 'brown', aiHint: 'deep dark hickory brown PVC deck, dramatic rich color' },
  // Natural
  { id: 'cedar-natural',        name: 'Natural Cedar',      color: '#C19A6B', accent: '#A0784A', brand: 'Western Red Cedar',     type: 'Wood',          colorFamily: 'brown', aiHint: 'natural western red cedar deck, honey-toned warm wood, beautiful grain' },
  { id: 'ipe-dark',             name: 'Brazilian Ipe',      color: '#4A3728', accent: '#2E2218', brand: 'Advantage Lumber',      type: 'Hardwood',      colorFamily: 'brown', aiHint: 'exotic Brazilian ipe hardwood deck, very dense dark rich wood' },
  // Stone
  { id: 'bluestone',            name: 'Bluestone',          color: '#7A8B99', accent: '#5C6D7A', brand: 'Natural Stone',         type: 'Patio Stone',   colorFamily: 'blue',  aiHint: 'natural bluestone patio pavers, blue-gray irregular flagstone, classic northeastern' },
  { id: 'travertine',           name: 'Travertine',         color: '#C4B9A0', accent: '#A89E85', brand: 'Natural Stone',         type: 'Patio Stone',   colorFamily: 'beige', aiHint: 'cream travertine patio tiles, Mediterranean elegance, warm stone' },
];

// ─── GARAGE DOORS ──────────────────────────────────────
const GARAGE = [
  { id: 'clopay-white-raised',  name: 'White Raised Panel', color: '#F5F5F0', accent: '#E0E0DB', brand: 'Clopay',               type: 'Steel Raised Panel', colorFamily: 'white', aiHint: 'white steel raised panel garage door, traditional 3-section, clean' },
  { id: 'clopay-black-modern',  name: 'Black Modern',       color: '#1C1917', accent: '#0C0A09', brand: 'Clopay',               type: 'Steel Flush',       colorFamily: 'black', aiHint: 'full-view modern black garage door with frosted glass panels, contemporary' },
  { id: 'clopay-walnut',        name: 'Walnut Carriage',    color: '#6B4E37', accent: '#4D3825', brand: 'Clopay Canyon Ridge',   type: 'Faux Wood Carriage',colorFamily: 'brown', aiHint: 'faux wood walnut stained carriage-style garage door with crossbuck design and hardware' },
  { id: 'amarr-oak',            name: 'Medium Oak',         color: '#8B6B42', accent: '#6B5030', brand: 'Amarr Classica',        type: 'Faux Wood Carriage',colorFamily: 'brown', aiHint: 'medium oak stain carriage garage door, arched top panels, rustic elegance' },
  { id: 'chi-glass-black',      name: 'Black Full View',    color: '#1C1917', accent: '#0C0A09', brand: 'C.H.I.',               type: 'Aluminum & Glass',  colorFamily: 'black', aiHint: 'modern full-view aluminum and clear glass garage door, black frame, industrial modern' },
  { id: 'chi-white-carriage',   name: 'White Carriage',     color: '#F5F5F0', accent: '#E0E0DB', brand: 'C.H.I.',               type: 'Steel Carriage',    colorFamily: 'white', aiHint: 'white steel carriage-style garage door with decorative hardware and window inserts' },
];

// ─── GUTTERS & TRIM ────────────────────────────────────
const GUTTERS = [
  { id: 'gutter-white',         name: 'White Seamless',     color: '#F5F5F0', accent: '#E0E0DB', brand: 'Seamless',              type: 'Aluminum',      colorFamily: 'white', aiHint: 'white seamless aluminum gutters and downspouts with white fascia trim' },
  { id: 'gutter-black',         name: 'Black Seamless',     color: '#1C1917', accent: '#0C0A09', brand: 'Seamless',              type: 'Aluminum',      colorFamily: 'black', aiHint: 'black seamless aluminum gutters and downspouts, modern contrast' },
  { id: 'gutter-bronze',        name: 'Dark Bronze',        color: '#5C4D30', accent: '#3E3420', brand: 'Seamless',              type: 'Aluminum',      colorFamily: 'brown', aiHint: 'dark bronze seamless aluminum gutters, elegant traditional' },
  { id: 'gutter-copper',        name: 'Natural Copper',     color: '#B87333', accent: '#8B5A28', brand: 'Custom',                type: 'Copper',        colorFamily: 'brown', aiHint: 'natural bright copper half-round gutters with round downspouts, premium luxury detail' },
  { id: 'fascia-white-pvc',     name: 'White PVC Fascia',   color: '#FAFAFA', accent: '#E8E8E8', brand: 'Royal',                 type: 'PVC Trim',      colorFamily: 'white', aiHint: 'crisp white PVC fascia and soffit trim, clean maintenance-free' },
  { id: 'soffit-vented-white',  name: 'Vented White Soffit',color: '#F5F5F0', accent: '#E0E0DB', brand: 'Royal',                 type: 'PVC Soffit',    colorFamily: 'white', aiHint: 'white vented PVC soffit panels for proper roof ventilation' },
];

// ─── FULL EXTERIOR STYLES ──────────────────────────────
const EXTERIOR = [
  { id: 'modern-farmhouse',     name: 'Modern Farmhouse',   color: '#FAFAF9', accent: '#292524', brand: 'Mixed',                 type: 'Style Package', colorFamily: 'white', aiHint: 'white board and batten siding, black window frames, black metal roof, stained wood front door, black gutters, modern farmhouse with industrial accents' },
  { id: 'craftsman',            name: 'Craftsman Revival',  color: '#8B7355', accent: '#5C4D30', brand: 'Mixed',                 type: 'Style Package', colorFamily: 'brown', aiHint: 'tapered columns on stone bases, low-pitch roof, earth-tone shingle siding, wide overhangs, exposed rafters, mixed materials with stone accents' },
  { id: 'contemporary',         name: 'Contemporary',       color: '#374151', accent: '#10B981', brand: 'Mixed',                 type: 'Style Package', colorFamily: 'gray',  aiHint: 'clean horizontal lines, flat or low-slope roof, large windows, mixed materials: dark siding + natural wood + stone, minimalist modern, asymmetric design' },
  { id: 'colonial',             name: 'Colonial Classic',   color: '#F5F5F0', accent: '#1C3D5A', brand: 'Mixed',                 type: 'Style Package', colorFamily: 'white', aiHint: 'symmetrical facade, centered entry with columns, white clapboard siding, black shutters, slate gray roof, traditional American colonial' },
  { id: 'mid-century',          name: 'Mid-Century Modern', color: '#92400E', accent: '#78350F', brand: 'Mixed',                 type: 'Style Package', colorFamily: 'brown', aiHint: 'flat or butterfly roof, large picture windows, vertical siding, earth tones mixed with bold accents, open carport, post-and-beam construction' },
  { id: 'scandinavian',         name: 'Scandinavian',       color: '#F5F5F0', accent: '#78716C', brand: 'Mixed',                 type: 'Style Package', colorFamily: 'white', aiHint: 'clean white exterior with natural wood accents, simple gabled roof, minimal trim, large windows, muted earth accents, hygge warmth' },
  { id: 'coastal',              name: 'Coastal',            color: '#E8EEF2', accent: '#4A6B8A', brand: 'Mixed',                 type: 'Style Package', colorFamily: 'blue',  aiHint: 'light blue-gray shingle siding, white trim, raised foundation, covered porches, metal roof, coastal beach house, breezy relaxed' },
  { id: 'tudor',                name: 'Tudor',              color: '#E8DCC8', accent: '#4A3728', brand: 'Mixed',                 type: 'Style Package', colorFamily: 'beige', aiHint: 'half-timbering with stucco and dark wood beams, steep gabled roof, diamond-pane windows, brick and stone accents, English Tudor' },
  { id: 'mediterranean',        name: 'Mediterranean',      color: '#E8DCC8', accent: '#C46A3A', brand: 'Mixed',                 type: 'Style Package', colorFamily: 'beige', aiHint: 'stucco walls in warm cream, terracotta barrel tile roof, arched windows and doorways, wrought iron details, Mediterranean Spanish villa' },
  { id: 'modern-black',         name: 'Modern Dark',        color: '#1C1917', accent: '#F5F5F0', brand: 'Mixed',                 type: 'Style Package', colorFamily: 'black', aiHint: 'all-black exterior with black siding, black windows, black metal roof, dramatic monochrome modern, white or natural wood accent only at entry' },
  { id: 'rustic-mountain',      name: 'Rustic Mountain',    color: '#6B4E37', accent: '#A09080', brand: 'Mixed',                 type: 'Style Package', colorFamily: 'brown', aiHint: 'natural wood and stone lodge style, dark stained wood siding, massive stone chimney, green metal roof, mountain cabin, heavy timber accents' },
  { id: 'transitional',         name: 'Transitional',       color: '#D1C8BA', accent: '#3A3C3E', brand: 'Mixed',                 type: 'Style Package', colorFamily: 'beige', aiHint: 'blend of traditional and modern, warm greige siding, dark trim and gutters, simple clean lines but traditional proportions, updated classic' },
];

// ─── KITCHEN ───────────────────────────────────────────
const KITCHEN = [
  { id: 'kitchen-white-shaker', name: 'White Shaker',       color: '#F5F5F0', accent: '#E0E0DB', brand: 'Mixed',                 type: 'Cabinet Style', colorFamily: 'white', aiHint: 'bright white shaker-style kitchen cabinets, subway tile backsplash, quartz countertops, stainless appliances, modern farmhouse kitchen' },
  { id: 'kitchen-navy',         name: 'Navy & White',       color: '#2B3850', accent: '#F5F5F0', brand: 'Mixed',                 type: 'Cabinet Style', colorFamily: 'blue',  aiHint: 'navy blue lower cabinets with white uppers, brass hardware, marble countertops, transitional kitchen' },
  { id: 'kitchen-natural-wood', name: 'Natural Wood',       color: '#C19A6B', accent: '#A0784A', brand: 'Mixed',                 type: 'Cabinet Style', colorFamily: 'brown', aiHint: 'natural white oak flat-panel cabinets, warm wood grain, minimal hardware, light quartz countertops, Scandinavian modern kitchen' },
  { id: 'kitchen-sage',         name: 'Sage Green',         color: '#9EA393', accent: '#848A78', brand: 'Mixed',                 type: 'Cabinet Style', colorFamily: 'green', aiHint: 'sage green shaker cabinets, butcher block countertops, open shelving, brass fixtures, cottage style kitchen' },
  { id: 'kitchen-black',        name: 'Matte Black',        color: '#1C1917', accent: '#F5F5F0', brand: 'Mixed',                 type: 'Cabinet Style', colorFamily: 'black', aiHint: 'matte black flat-panel cabinets, white countertops, black hardware, modern industrial kitchen' },
  { id: 'kitchen-two-tone',     name: 'Two-Tone Gray',      color: '#6B7280', accent: '#F5F5F0', brand: 'Mixed',                 type: 'Cabinet Style', colorFamily: 'gray',  aiHint: 'gray lower cabinets and white upper cabinets, two-tone kitchen, contemporary transitional' },
];

// ─── BATHROOM ──────────────────────────────────────────
const BATHROOM = [
  { id: 'bath-spa-white',       name: 'Spa White',          color: '#F5F5F0', accent: '#E8E0D0', brand: 'Mixed',                 type: 'Bath Style',    colorFamily: 'white', aiHint: 'all white spa bathroom, large format white tiles, floating vanity, frameless glass shower, warm white, luxury spa feel' },
  { id: 'bath-marble',          name: 'Carrara Marble',     color: '#E8E0E0', accent: '#C0B8B8', brand: 'Mixed',                 type: 'Bath Style',    colorFamily: 'white', aiHint: 'white and gray Carrara marble tiles on floor and walls, marble-look countertop, elegant classical bathroom' },
  { id: 'bath-modern-dark',     name: 'Modern Dark',        color: '#374151', accent: '#1C1917', brand: 'Mixed',                 type: 'Bath Style',    colorFamily: 'gray',  aiHint: 'dark charcoal tile bathroom, matte black fixtures, floating dark vanity, rain shower, dramatic modern bathroom' },
  { id: 'bath-coastal',         name: 'Coastal Blue',       color: '#B0C4DE', accent: '#E8DCC8', brand: 'Mixed',                 type: 'Bath Style',    colorFamily: 'blue',  aiHint: 'light blue and white coastal bathroom, beadboard wainscoting, nautical fixtures, beach house style' },
  { id: 'bath-warm-wood',       name: 'Warm Wood & White',  color: '#C19A6B', accent: '#F5F5F0', brand: 'Mixed',                 type: 'Bath Style',    colorFamily: 'brown', aiHint: 'warm wood vanity with white subway tile, wood-look floor tile, modern organic bathroom, warm and inviting' },
];

// ─── FLOORING ──────────────────────────────────────────
const FLOORING = [
  { id: 'floor-white-oak',      name: 'White Oak Hardwood', color: '#D4C4A0', accent: '#BEB08A', brand: 'Mixed',                 type: 'Hardwood',      colorFamily: 'beige', aiHint: 'natural white oak hardwood floors, light warm tone, wide plank, satin finish' },
  { id: 'floor-dark-walnut',    name: 'Dark Walnut',        color: '#4A3728', accent: '#2E2218', brand: 'Mixed',                 type: 'Hardwood',      colorFamily: 'brown', aiHint: 'dark walnut stained hardwood floors, rich deep brown, classic elegance' },
  { id: 'floor-gray-lvp',       name: 'Gray Oak LVP',       color: '#9A9590', accent: '#7A7570', brand: 'COREtec',               type: 'LVP',           colorFamily: 'gray',  aiHint: 'gray-washed luxury vinyl plank flooring, modern farmhouse, waterproof, realistic wood grain' },
  { id: 'floor-herringbone',    name: 'Herringbone Oak',    color: '#C4A878', accent: '#A88A60', brand: 'Mixed',                 type: 'Hardwood',      colorFamily: 'brown', aiHint: 'light oak herringbone pattern hardwood floor, elegant European style' },
  { id: 'floor-marble-tile',    name: 'White Marble Tile',  color: '#E8E0E0', accent: '#C8C0C0', brand: 'Mixed',                 type: 'Tile',          colorFamily: 'white', aiHint: 'large format white marble tile floor, subtle gray veining, polished, luxury' },
  { id: 'floor-slate',          name: 'Natural Slate',      color: '#5A6068', accent: '#404850', brand: 'Mixed',                 type: 'Tile',          colorFamily: 'gray',  aiHint: 'natural slate stone tile floor, dark gray-blue, cleft texture, rustic-modern' },
];

// ─── EXPORT COMBINED ───────────────────────────────────
export const MATERIALS = {
  siding: SIDING,
  roofing: ROOFING,
  paint: PAINT,
  windows: WINDOWS,
  deck: DECK,
  garage: GARAGE,
  gutters: GUTTERS,
  exterior: EXTERIOR,
  kitchen: KITCHEN,
  bathroom: BATHROOM,
  flooring: FLOORING,
};

export function getMaterialsForProject(projectId) {
  return MATERIALS[projectId] || [];
}

export function getMaterial(projectId, materialId) {
  const mats = MATERIALS[projectId] || [];
  return mats.find(m => m.id === materialId);
}

// Get all unique brands for a category
export function getBrandsForProject(projectId) {
  const mats = MATERIALS[projectId] || [];
  return [...new Set(mats.map(m => m.brand))];
}

// Get all unique types for a category
export function getTypesForProject(projectId) {
  const mats = MATERIALS[projectId] || [];
  return [...new Set(mats.map(m => m.type))];
}

// Filter materials
export function filterMaterials(projectId, { brand, type, colorFamily, search } = {}) {
  let mats = MATERIALS[projectId] || [];
  if (brand) mats = mats.filter(m => m.brand === brand);
  if (type) mats = mats.filter(m => m.type === type);
  if (colorFamily) mats = mats.filter(m => m.colorFamily === colorFamily);
  if (search) {
    const s = search.toLowerCase();
    mats = mats.filter(m =>
      m.name.toLowerCase().includes(s) ||
      m.brand.toLowerCase().includes(s) ||
      m.type.toLowerCase().includes(s)
    );
  }
  return mats;
}

// Total count
export const TOTAL_PRODUCTS = Object.values(MATERIALS).reduce((sum, arr) => sum + arr.length, 0);

// ─── Popular products — best sellers across categories ───
// These skip the category step: tap product → generate
export const POPULAR_PRODUCTS = [
  { ...MATERIALS.siding[0], category: 'siding' },     // Arctic White Hardie
  { ...MATERIALS.siding[4], category: 'siding' },      // Iron Gray Hardie
  { ...MATERIALS.roofing[0], category: 'roofing' },    // Charcoal GAF
  { ...MATERIALS.roofing[3], category: 'roofing' },    // Weathered Wood GAF
  { ...MATERIALS.paint[0], category: 'paint' },        // Chantilly Lace BM
  { ...MATERIALS.paint[4], category: 'paint' },        // Repose Gray SW
  { ...MATERIALS.windows[0], category: 'windows' },    // Andersen 400 White
  { ...MATERIALS.windows[3], category: 'windows' },    // Andersen 400 Black
  { ...MATERIALS.deck[0], category: 'deck' },          // Trex Lava Rock
  { ...MATERIALS.garage[0], category: 'garage' },      // Clopay Classic White
  { ...MATERIALS.gutters?.[0], category: 'gutters' },  // If exists
  { ...MATERIALS.stone?.[0], category: 'stone' },      // If exists
].filter(p => p && p.id); // Filter out undefined entries

// ═══════════════════════════════════════════════════════════════
// INSTANT DESIGN — Architectural Style Presets
// Upload one photo → get instant style suggestions
// Each style is a curated multi-material package with a
// complete prompt that transforms the space
// ═══════════════════════════════════════════════════════════════

export const STYLE_PRESETS = [
  // ═══════════════════════════════════════════════════════
  // EXTERIOR STYLES
  // ═══════════════════════════════════════════════════════
  {
    id: 'modern-farmhouse',
    name: 'Modern Farmhouse',
    shortDesc: 'White + black + natural wood',
    category: 'exterior',
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
    category: 'exterior',
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
    category: 'exterior',
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
    category: 'exterior',
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
    category: 'exterior',
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
    category: 'exterior',
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
    category: 'exterior',
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
    category: 'exterior',
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
    category: 'exterior',
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
    category: 'exterior',
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
    category: 'exterior',
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
    category: 'exterior',
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

  // ═══════════════════════════════════════════════════════
  // KITCHEN STYLES
  // ═══════════════════════════════════════════════════════
  {
    id: 'kitchen-modern-white',
    name: 'Modern White',
    shortDesc: 'White shakers + quartz + subway tile',
    category: 'kitchen',
    thumbnail: '🤍',
    colors: { primary: '#FAFAF9', secondary: '#E8E5E0', accent: '#292524' },
    prompt: `Transform this kitchen into a Modern White Kitchen:
- CABINETS: White Shaker-style cabinets (uppers and lowers), clean recessed panel, soft-close hardware
- COUNTERTOPS: White or light gray quartz with subtle veining (Calacatta or Carrara look), eased or mitered edge
- BACKSPLASH: White subway tile in brick-lay pattern with light gray grout, OR large format white tile
- HARDWARE: Matte black bar pulls on drawers and cabinets, modern minimalist profile
- SINK: Stainless steel undermount single-bowl sink, modern matte black gooseneck faucet
- ISLAND: Same white cabinets, possibly with a waterfall edge countertop on one side
- LIGHTING: Black or brushed nickel pendant lights over island, recessed cans elsewhere
- FLOORING: Light oak hardwood or light gray LVP, wide plank
- Keep the exact same kitchen layout, window positions, and room shape. Only change finishes.
- Result must look like a real photograph of a professional kitchen renovation.`,
  },
  {
    id: 'kitchen-farmhouse',
    name: 'Farmhouse Kitchen',
    shortDesc: 'Warm wood + open shelving + apron sink',
    category: 'kitchen',
    thumbnail: '🌾',
    colors: { primary: '#F5F0E8', secondary: '#8B7355', accent: '#3A5540' },
    prompt: `Transform this kitchen into a Farmhouse Kitchen:
- CABINETS: Mix of white painted lowers with natural wood-tone uppers (or open wood shelving), Shaker profile
- COUNTERTOPS: Butcher block on island or prep area, white/cream quartz on perimeter counters
- BACKSPLASH: White subway tile with warm grout, OR beadboard wainscoting in white
- HARDWARE: Matte black cup pulls and knobs, vintage-inspired but clean
- SINK: White fireclay apron-front (farmhouse) sink, brushed gold or oil-rubbed bronze bridge faucet
- ISLAND: Contrasting color island (sage green, navy, or natural wood) with butcher block top
- LIGHTING: Black iron or antique brass pendant lanterns over island, under-cabinet lighting
- ACCENTS: Open wood shelving with stacked dishes, wood ceiling beams if possible, vintage touches
- Keep the exact same kitchen layout. Only change finishes and fixtures.
- Result must look like a real photograph.`,
  },
  {
    id: 'kitchen-contemporary-dark',
    name: 'Contemporary Dark',
    shortDesc: 'Dark cabinets + waterfall island + minimal',
    category: 'kitchen',
    thumbnail: '🖤',
    colors: { primary: '#1C2530', secondary: '#D4C5A9', accent: '#C19A6B' },
    prompt: `Transform this kitchen into a Contemporary Dark Kitchen:
- CABINETS: Dark navy, charcoal, or matte black flat-panel (slab) cabinets, handleless or with integrated pulls
- COUNTERTOPS: White marble-look quartz with dramatic veining, waterfall edge on island
- BACKSPLASH: Large format porcelain slab matching countertop, OR dark tile matching cabinets for monolithic look
- HARDWARE: Integrated edge pulls or push-to-open, brushed gold accents if any visible hardware
- SINK: Undermount sink in dark composite or stainless, modern pull-down spray faucet in brushed gold or matte black
- ISLAND: Large island with waterfall countertop, dark cabinet base, pendant lighting
- LIGHTING: Sculptural modern pendants in brass or black over island, linear LED under cabinets
- FLOORING: Wide plank dark wood or large format gray-black tile
- Keep the exact same kitchen layout. Only change finishes.
- Result must look like a real photograph.`,
  },
  {
    id: 'kitchen-transitional',
    name: 'Transitional Kitchen',
    shortDesc: 'Two-tone + marble look + warm metals',
    category: 'kitchen',
    thumbnail: '✨',
    colors: { primary: '#F5F0E8', secondary: '#4A5565', accent: '#C19A6B' },
    prompt: `Transform this kitchen into a Transitional Kitchen:
- CABINETS: Two-tone — white or cream upper cabinets with darker lower cabinets (navy, dark gray, or sage green), Shaker-style profile
- COUNTERTOPS: White marble-look quartz with soft gray veining, eased edge profile
- BACKSPLASH: Herringbone or arabesque tile pattern in white/cream, adding texture and interest
- HARDWARE: Brushed gold or champagne bronze knobs and pulls, elegant but not ornate
- SINK: Stainless undermount, brushed gold single-handle faucet with pull-down spray
- ISLAND: Lower cabinet color with marble-look quartz top, seating on one side with waterfall or standard edge
- LIGHTING: Glass and brass pendant lights over island, warm recessed lighting
- FLOORING: Medium-tone hardwood or wood-look tile, herringbone or wide plank
- Keep the exact same kitchen layout. Only change finishes.
- Result must look like a real photograph.`,
  },
  {
    id: 'kitchen-industrial',
    name: 'Industrial',
    shortDesc: 'Concrete + steel + raw texture',
    category: 'kitchen',
    thumbnail: '🔩',
    colors: { primary: '#6B7280', secondary: '#292524', accent: '#C19A6B' },
    prompt: `Transform this kitchen into an Industrial Kitchen:
- CABINETS: Flat-panel cabinets in dark gray or charcoal, lower cabinets only — replace uppers with open metal shelving
- COUNTERTOPS: Concrete-look quartz or actual poured concrete, raw matte finish, square edge
- BACKSPLASH: Exposed brick wall OR dark subway tile, raw industrial character
- HARDWARE: Matte black oversized bar pulls, industrial-grade aesthetic
- SINK: Deep stainless steel single-bowl, commercial-style pull-down spring faucet in chrome or matte black
- SHELVING: Open black metal and reclaimed wood floating shelves on upper walls
- LIGHTING: Industrial cage pendants or Edison-bulb fixtures, black metal, exposed bulbs
- FLOORING: Polished concrete, dark slate tile, or distressed wide-plank wood
- ACCENTS: Metal stools at island, exposed ductwork or pipes if visible, raw materials celebrated
- Keep the exact same kitchen layout. Only change finishes.
- Result must look like a real photograph.`,
  },
  {
    id: 'kitchen-coastal',
    name: 'Coastal Kitchen',
    shortDesc: 'Light blue + white + natural textures',
    category: 'kitchen',
    thumbnail: '🐚',
    colors: { primary: '#F5F8FA', secondary: '#6B99B8', accent: '#C19A6B' },
    prompt: `Transform this kitchen into a Coastal Kitchen:
- CABINETS: White Shaker cabinets with possible soft blue or seafoam island, beadboard panel details
- COUNTERTOPS: White quartz or light marble-look with very subtle veining, soft rounded edge
- BACKSPLASH: White or pale blue glass tile, OR white beadboard wainscoting, nautical but not themed
- HARDWARE: Brushed nickel or chrome bin pulls, rope-wrapped accents optional
- SINK: White undermount or apron-front sink, polished chrome bridge-style faucet
- ISLAND: White or soft blue-painted island with butcher block or white quartz top, wicker or rattan stools
- LIGHTING: White or rattan woven pendant lights, natural texture, airy feel
- FLOORING: Light whitewashed wood or light natural oak, wide plank
- ACCENTS: Glass-front cabinet doors, open shelving with sea glass or coastal objects, bright and airy
- Keep the exact same kitchen layout. Only change finishes.
- Result must look like a real photograph.`,
  },

  // ═══════════════════════════════════════════════════════
  // BATHROOM STYLES
  // ═══════════════════════════════════════════════════════
  {
    id: 'bath-spa-modern',
    name: 'Spa Modern',
    shortDesc: 'White + gray + frameless glass',
    category: 'bathroom',
    thumbnail: '🧖',
    colors: { primary: '#F5F5F0', secondary: '#9CA3AF', accent: '#6B7280' },
    prompt: `Transform this bathroom into a Modern Spa Bathroom:
- WALLS: Large format white or light gray porcelain tile (24x48 or larger), minimal grout lines
- SHOWER: Frameless glass enclosure, full height, large format matching wall tile, linear drain, rain showerhead and handheld
- VANITY: Floating wall-mounted vanity in white or light wood with soft-close drawers, undermount white rectangular basin
- COUNTERTOP: White quartz or solid surface, clean seamless look
- MIRROR: Large frameless or thin black-framed rectangular mirror, backlit LED option
- FIXTURES: Matte black or brushed nickel faucets, towel bars, and accessories, minimal and coordinated
- FLOOR: Large format gray or white matte porcelain tile, possibly with heated floor
- LIGHTING: Recessed cans, LED strip behind mirror, clean ambient lighting
- TOILET: Modern wall-hung or skirted one-piece toilet with concealed trapway
- Overall: Clean, calm, hotel-spa feel. Minimal visual clutter. Warm but minimal.
- Keep the exact same bathroom layout. Only change finishes and fixtures.
- Result must look like a real photograph.`,
  },
  {
    id: 'bath-classic-marble',
    name: 'Classic Marble',
    shortDesc: 'Marble + chrome + timeless elegance',
    category: 'bathroom',
    thumbnail: '🏛️',
    colors: { primary: '#F5F5F0', secondary: '#D1C8BA', accent: '#8B8B8B' },
    prompt: `Transform this bathroom into a Classic Marble Bathroom:
- WALLS: White Carrara or Calacatta marble tile (or marble-look porcelain), floor-to-ceiling in shower, wainscot height elsewhere
- SHOWER: Glass enclosure with marble walls, marble niche shelf, traditional crosshandle fixtures in polished chrome
- VANITY: Traditional furniture-style vanity in white with marble top, undermount oval basin, polished chrome widespread faucet
- MIRROR: Framed vanity mirror in white or silver, arched or rectangular traditional profile
- FIXTURES: Polished chrome everything, towel bars, robe hooks, toilet paper holder, all coordinated
- FLOOR: Marble mosaic floor (basketweave, hexagon, or herringbone pattern), white with gray veining
- LIGHTING: Crystal or glass sconces flanking mirror, chandelier if space allows
- ACCENTS: Crown molding at ceiling, decorative baseboards, classic elegance details
- Overall: Timeless, luxurious, traditional marble bath. Hotel-quality finishes.
- Keep the exact same bathroom layout. Only change finishes and fixtures.
- Result must look like a real photograph.`,
  },
  {
    id: 'bath-warm-organic',
    name: 'Warm & Organic',
    shortDesc: 'Wood + stone + warm tones',
    category: 'bathroom',
    thumbnail: '🪵',
    colors: { primary: '#E8DCC8', secondary: '#8B7355', accent: '#6B8B73' },
    prompt: `Transform this bathroom into a Warm Organic Bathroom:
- WALLS: Natural stone-look tile in warm tones (travertine, sandstone, or warm gray), OR smooth plaster-effect walls in cream or warm white
- SHOWER: Walk-in with natural stone tile, pebble floor accent, warm brass rainfall showerhead
- VANITY: Natural wood floating vanity (walnut, white oak, or teak), vessel basin in white or natural stone
- COUNTERTOP: Natural stone slab or warm-toned quartz with organic veining
- MIRROR: Round mirror with natural wood or brass frame, organic shape
- FIXTURES: Brushed brass or champagne gold faucets and accessories, warm metal throughout
- FLOOR: Large format stone-look porcelain in warm tones, or natural stone
- LIGHTING: Warm ambient lighting, sconces with linen or organic shades, backlit round mirror
- ACCENTS: Live-edge wood shelf, potted plants, woven baskets, natural linen towels
- Overall: Spa-like but warm and textured. Biophilic design. Connected to nature.
- Keep the exact same bathroom layout. Only change finishes.
- Result must look like a real photograph.`,
  },
  {
    id: 'bath-bold-contemporary',
    name: 'Bold Contemporary',
    shortDesc: 'Dark tile + black fixtures + drama',
    category: 'bathroom',
    thumbnail: '🖤',
    colors: { primary: '#292524', secondary: '#78716C', accent: '#C19A6B' },
    prompt: `Transform this bathroom into a Bold Contemporary Bathroom:
- WALLS: Large format dark tile (charcoal, black, or deep navy), floor-to-ceiling, thin grout lines
- SHOWER: Frameless glass with dark tile throughout, matte black fixtures, curbless entry if possible
- VANITY: Dark floating vanity (matte black, dark walnut, or dark gray), integrated or undermount white basin for contrast
- COUNTERTOP: White quartz or marble for striking contrast against dark cabinets
- MIRROR: Large round or irregular-shaped backlit LED mirror
- FIXTURES: Matte black everything, faucet, showerhead, towel bars, accessories
- FLOOR: Matching dark tile or contrasting geometric black-and-white pattern
- LIGHTING: LED strips, black downlights, dramatic accent lighting
- ACCENTS: Gold or brass accent on one element (mirror frame, shelf bracket, or towel ring), otherwise monochrome
- Overall: Dark, dramatic, high-contrast. Boutique hotel aesthetic.
- Keep the exact same bathroom layout. Only change finishes.
- Result must look like a real photograph.`,
  },
  {
    id: 'bath-coastal',
    name: 'Coastal Bath',
    shortDesc: 'White + blue + natural textures',
    category: 'bathroom',
    thumbnail: '🌊',
    colors: { primary: '#F5F8FA', secondary: '#6B99B8', accent: '#E8DCC8' },
    prompt: `Transform this bathroom into a Coastal Bathroom:
- WALLS: White shiplap or beadboard wainscoting on lower half, soft blue or white paint above, or white tile with blue glass accent strip
- SHOWER: White subway tile or fish-scale tile in soft blue or seafoam, polished chrome fixtures
- VANITY: White painted vanity with beadboard panel detail, marble or quartz top, polished chrome widespread faucet
- MIRROR: White wood-framed or rope-framed mirror, beachy but refined
- FIXTURES: Polished chrome or brushed nickel, coastal-classic styling
- FLOOR: White hexagonal mosaic tile, or whitewashed wood-look porcelain plank
- LIGHTING: Chrome or glass sconces, nautical-inspired but not themed
- ACCENTS: Woven basket storage, glass jars, natural textures, sea glass colors, bright and breezy
- Overall: Light, airy, relaxed. Coastal elegance without being kitschy.
- Keep the exact same bathroom layout. Only change finishes.
- Result must look like a real photograph.`,
  },
  {
    id: 'bath-farmhouse',
    name: 'Farmhouse Bath',
    shortDesc: 'Shiplap + vintage hardware + rustic',
    category: 'bathroom',
    thumbnail: '🌿',
    colors: { primary: '#F5F0E8', secondary: '#6B7280', accent: '#292524' },
    prompt: `Transform this bathroom into a Farmhouse Bathroom:
- WALLS: White shiplap or horizontal plank paneling full height, painted white or soft cream
- SHOWER: White subway tile with dark grout, glass panel door, oil-rubbed bronze or matte black fixtures
- VANITY: Reclaimed wood or barnwood-style vanity with vessel or undermount white sink, matte black faucet
- MIRROR: Rustic wood-framed mirror or industrial black metal frame
- FIXTURES: Matte black or oil-rubbed bronze faucets, towel hooks (not bars), vintage-inspired
- FLOOR: Black and white hexagonal tile pattern, or wide plank wood-look porcelain in weathered gray
- LIGHTING: Black industrial cage sconces or vintage Edison-style wall lights
- ACCENTS: Wire baskets for storage, mason jar details, galvanized metal touches, cotton towels in neutral tones
- Overall: Rustic charm meets clean simplicity. Warm, inviting, lived-in feel.
- Keep the exact same bathroom layout. Only change finishes.
- Result must look like a real photograph.`,
  },
];

// Get styles by category
export function getStylesByCategory(category) {
  return STYLE_PRESETS.filter(s => s.category === category);
}

// Get 6 recommended styles for instant design (exterior only — legacy support)
export function getInstantStyles(count = 6) {
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

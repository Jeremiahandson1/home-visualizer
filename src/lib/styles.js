// ═══════════════════════════════════════════════════════════════
// INSTANT DESIGN — Architectural Style Presets
// Upload one photo → get instant style suggestions
// Each style is a curated multi-material package with a
// complete prompt that restyles the space
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
    prompt: `Restyle the exterior finishes of THIS house to achieve a Modern Farmhouse look. Keep the exact same house shape, roofline, window positions, garage location, and camera angle. Only change surface materials and colors:
- SIDING: White board-and-batten vertical siding OR white horizontal lap siding (James Hardie Arctic White or similar)
- ROOF: Same roof shape — change to black or dark charcoal standing seam metal OR dark gray architectural shingles
- WINDOWS: Same positions and sizes — update to black-framed windows (Andersen or Pella style), clean modern profiles
- FRONT DOOR: Stained natural wood door with black hardware, or black door with glass sidelight
- TRIM: Black gutters, black downspouts, black fascia, or matching dark trim
- ACCENTS: Natural wood beam accent above garage or entry, black metal light fixtures
- GARAGE: White carriage-style garage door with black hardware OR black modern flush door — same opening size
- Keep all landscaping, driveway, walkways, sky, and surroundings exactly as they appear in the photo.`,
  },
  {
    id: 'craftsman',
    name: 'Craftsman',
    shortDesc: 'Earth tones + stone + wood',
    category: 'exterior',
    thumbnail: '🪵',
    colors: { primary: '#8B7355', secondary: '#5C4D30', accent: '#A09080' },
    prompt: `Restyle the exterior finishes of THIS house to achieve a Craftsman look. Keep the exact same house shape, roofline, window positions, and camera angle. Only change surface materials and colors:
- SIDING: Warm earth-toned horizontal lap siding (brown, olive, or dark green) with cedar shingle accents in gables
- ROOF: Same roof shape — change to dark brown or green shingles
- PORCH: If a porch exists, add tapered columns on stone pedestals. If not, keep the entry as-is but add Craftsman details
- WINDOWS: Same window positions — add divided upper sash (4-over-1 or 6-over-1 pattern), dark or natural wood frames
- FRONT DOOR: Stained wood door with glass panels, Craftsman-style divided lights
- ACCENTS: Stone veneer on lower walls or column bases, natural wood trim, Arts & Crafts lighting
- TRIM: Wide trim boards, visible bracket supports under eaves, earth-toned color palette
- Keep all landscaping, driveway, walkways, sky, and surroundings exactly as they appear in the photo.`,
  },
  {
    id: 'contemporary',
    name: 'Contemporary',
    shortDesc: 'Mixed materials + clean lines',
    category: 'exterior',
    thumbnail: '🏗️',
    colors: { primary: '#374151', secondary: '#1F2937', accent: '#10B981' },
    prompt: `Restyle the exterior finishes of THIS house to achieve a Contemporary/Modern look. Keep the exact same house shape, roofline angles, window positions, and camera angle. Only change surface materials and colors:
- SIDING: Mix of materials — dark horizontal lap siding combined with natural wood-look cladding and possibly stone or stucco sections
- ROOF: Same roof shape — change to dark color, standing seam metal if appropriate
- WINDOWS: Same window positions and sizes — update to black aluminum frames, minimal muntins
- FRONT DOOR: Modern slab door, dark color with clean hardware
- TRIM: Minimal trim, clean edges, dark gutters hidden or integrated
- ACCENTS: Horizontal wood slat accents where appropriate, minimalist house numbers
- GARAGE: Modern flush panel garage door, dark color, possibly glass panels — same opening size
- Do NOT change the roofline shape, do NOT add flat roofs if the house has a pitched roof. Keep all landscaping, driveway, and surroundings exactly as they appear.`,
  },
  {
    id: 'coastal',
    name: 'Coastal',
    shortDesc: 'Light blues + white + weathered',
    category: 'exterior',
    thumbnail: '🏖️',
    colors: { primary: '#E8EEF2', secondary: '#4A6B8A', accent: '#FAFAF9' },
    prompt: `Restyle the exterior finishes of THIS house to achieve a Coastal/Beach House look. Keep the exact same house shape, roofline, window positions, and camera angle. Only change surface materials and colors:
- SIDING: Light blue-gray OR soft white cedar shingle siding, weathered natural look
- ROOF: Same roof shape — change to light gray or weathered cedar shake color
- WINDOWS: Same positions — update to white-framed windows, possibly add functional shutters in complementary blue or seafoam
- FRONT DOOR: Light blue, seafoam green, or natural wood tone
- TRIM: Bright white trim, white railings, white fascia
- ACCENTS: White columns on any existing porch, nautical-style light fixtures
- GARAGE: White or light gray carriage-style garage door — same opening
- Overall feel: breezy, relaxed, sun-bleached. Light color palette.
- Keep all landscaping, driveway, walkways, sky, and surroundings exactly as they appear in the photo.`,
  },
  {
    id: 'colonial',
    name: 'Colonial',
    shortDesc: 'Symmetry + shutters + tradition',
    category: 'exterior',
    thumbnail: '🏛️',
    colors: { primary: '#F5F5F0', secondary: '#1C3D5A', accent: '#8B3A3A' },
    prompt: `Restyle the exterior finishes of THIS house to achieve a Colonial look. Keep the exact same house shape, roofline, window positions, and camera angle. Only change surface materials and colors:
- SIDING: White or cream horizontal clapboard siding, clean traditional lines
- ROOF: Same roof shape — change to dark gray or black architectural shingles
- WINDOWS: Same positions and sizes — update to white frames with divided lights (6-over-6 pattern)
- SHUTTERS: Black, navy, or dark green functional-looking shutters flanking each existing window
- FRONT DOOR: Classic 6-panel door in red, black, or navy — add pediment or portico detail at entry if appropriate
- TRIM: White corner boards, white window casings, dentil molding details
- ACCENTS: Traditional coach lights, symmetrical facade emphasis
- GARAGE: White raised-panel garage door with window inserts — same opening
- Keep all landscaping, driveway, walkways, sky, and surroundings exactly as they appear in the photo.`,
  },
  {
    id: 'tudor',
    name: 'Tudor',
    shortDesc: 'Half-timber + stucco + brick',
    category: 'exterior',
    thumbnail: '🏰',
    colors: { primary: '#E8DCC8', secondary: '#4A3728', accent: '#8B5E3C' },
    prompt: `Restyle the exterior finishes of THIS house to achieve an English Tudor look. Keep the exact same house shape, roofline, window positions, and camera angle. Only change surface materials and colors:
- WALLS: Apply stucco texture in warm cream/white with dark wood half-timber framing creating decorative patterns on existing wall surfaces
- LOWER WALLS: Red or brown brick texture on lower portions, stone accents around entry
- ROOF: Same roof shape — change to dark gray or dark brown shingles
- WINDOWS: Same positions and sizes — update to tall narrow casement style with diamond-pane leaded glass look
- FRONT DOOR: Heavy arched or rounded wood door with iron strap hinges, set in stone or brick surround
- CHIMNEY: If chimney exists, enhance with decorative masonry detail
- ACCENTS: Arched entry detail, copper or wrought iron light fixtures
- Keep all landscaping, driveway, walkways, sky, and surroundings exactly as they appear in the photo.`,
  },
  {
    id: 'mediterranean',
    name: 'Mediterranean',
    shortDesc: 'Stucco + terracotta + arches',
    category: 'exterior',
    thumbnail: '☀️',
    colors: { primary: '#E8DCC8', secondary: '#C46A3A', accent: '#4A6B42' },
    prompt: `Restyle the exterior finishes of THIS house to achieve a Mediterranean/Spanish look. Keep the exact same house shape, roofline, window positions, and camera angle. Only change surface materials and colors:
- WALLS: Apply smooth warm-toned stucco texture in cream, tan, or soft terracotta to all wall surfaces
- ROOF: Same roof shape — change to barrel-shaped terracotta clay tile texture in warm red-orange
- WINDOWS: Same positions and sizes — add arched or rounded top trim details, wrought iron window grilles
- FRONT DOOR: Dark stained arched wood door with decorative iron hardware
- ACCENTS: Wrought iron balcony railings on any existing balconies, clay pot planters, exposed wood beam details at entry
- TRIM: Minimal trim, stucco returns at windows, dark ironwork accents
- Keep all landscaping, driveway, walkways, sky, and surroundings exactly as they appear in the photo.`,
  },
  {
    id: 'modern-dark',
    name: 'Modern Dark',
    shortDesc: 'All black + dramatic',
    category: 'exterior',
    thumbnail: '🖤',
    colors: { primary: '#1C1917', secondary: '#292524', accent: '#F5F5F0' },
    prompt: `Restyle the exterior finishes of THIS house to achieve a Modern Dark/All-Black look. Keep the exact same house shape, roofline, window positions, and camera angle. Only change surface materials and colors:
- SIDING: Matte black siding on all existing wall surfaces — board-and-batten, horizontal lap, or mixed panels, all in deep black
- ROOF: Same roof shape — change to black standing seam metal or black shingles
- WINDOWS: Same positions and sizes — update to black-framed windows
- FRONT DOOR: Black door OR one accent: natural stained wood door as the single warm element
- TRIM: All black — gutters, fascia, soffit, downspouts, all matching black
- GARAGE: Black flush-panel or modern garage door — same opening size
- ACCENTS: Minimal — black modern sconce lights, matte black house numbers, possibly one wood-clad accent at entry as the only non-black element
- Dramatic monochromatic black exterior. The only contrast comes from glass reflections and one optional wood accent.
- Keep all landscaping, driveway, walkways, sky, and surroundings exactly as they appear in the photo.`,
  },
  {
    id: 'scandinavian',
    name: 'Scandinavian',
    shortDesc: 'White + wood + minimal',
    category: 'exterior',
    thumbnail: '❄️',
    colors: { primary: '#F5F5F0', secondary: '#C19A6B', accent: '#78716C' },
    prompt: `Restyle the exterior finishes of THIS house to achieve a Scandinavian/Nordic look. Keep the exact same house shape, roofline, window positions, and camera angle. Only change surface materials and colors:
- SIDING: Clean white horizontal siding with natural wood cladding accents (light cedar or pine tone) on select surfaces
- ROOF: Same roof shape — change to dark gray or black shingles, clean eave lines
- WINDOWS: Same positions and sizes — update to thin black or natural wood frames, minimal divided lights
- FRONT DOOR: Natural stained wood door OR muted color (sage, dusty blue), simple clean hardware
- TRIM: Minimal white or natural wood trim, no ornamental details
- ACCENTS: Light natural wood on entry surround or accent wall, warm subtle earth tones
- GARAGE: Simple panel door in white or wood tone — same opening
- Overall: Restrained, warm minimalism. Nothing ornamental. Natural materials.
- Keep all landscaping, driveway, walkways, sky, and surroundings exactly as they appear in the photo.`,
  },
  {
    id: 'rustic-mountain',
    name: 'Mountain Lodge',
    shortDesc: 'Stone + timber + rugged',
    category: 'exterior',
    thumbnail: '⛰️',
    colors: { primary: '#6B4E37', secondary: '#A09080', accent: '#2D4A2D' },
    prompt: `Restyle the exterior finishes of THIS house to achieve a Mountain Lodge/Rustic look. Keep the exact same house shape, roofline, window positions, and camera angle. Only change surface materials and colors:
- SIDING: Dark stained wood plank siding (vertical or horizontal) on all wall surfaces, heavy timber accent beams
- STONE: Natural stone veneer on lower walls and entry columns
- ROOF: Same roof shape — change to dark green or dark bronze standing seam metal, OR dark cedar shake. Add exposed timber rafter tail details at eaves
- WINDOWS: Same positions and sizes — update to natural wood or dark bronze frames
- FRONT DOOR: Heavy rustic wood door with iron hardware
- ACCENTS: Timber beam details at entry/porch, natural stone column bases, wrought iron details
- CHIMNEY: If chimney exists, enhance with stone veneer
- GARAGE: Dark stained wood carriage-style garage door with iron hardware — same opening
- Overall: Substantial, grounded, connected to nature. Heavy materials. Lodge feel.
- Keep all landscaping, driveway, walkways, sky, and surroundings exactly as they appear in the photo.`,
  },
  {
    id: 'mid-century',
    name: 'Mid-Century Modern',
    shortDesc: 'Retro lines + natural materials',
    category: 'exterior',
    thumbnail: '🌴',
    colors: { primary: '#92400E', secondary: '#78350F', accent: '#E8DCC8' },
    prompt: `Restyle the exterior finishes of THIS house to achieve a Mid-Century Modern look. Keep the exact same house shape, roofline, window positions, and camera angle. Only change surface materials and colors:
- SIDING: Mix of materials on existing surfaces — natural stone or brick, painted or stained wood paneling, possibly some stucco. Earth tones: olive, rust, walnut, cream
- ROOF: Same roof shape — change to low-profile dark material, add exposed beams at eave if appropriate
- WINDOWS: Same positions and sizes — update to large clean frames, minimal mullions
- FRONT DOOR: Bold color accent door (orange, teal, or yellow) OR natural stained wood slab door
- TRIM: Minimal, clean lines
- ACCENTS: Breeze block or decorative screen element where appropriate, angular geometric details, retro-modern lighting
- GARAGE: Simple flush-panel door — same opening
- Overall: Celebrate structure, connection to outdoors, optimistic mid-century spirit. Horizontal emphasis.
- Keep all landscaping, driveway, walkways, sky, and surroundings exactly as they appear in the photo.`,
  },
  {
    id: 'transitional',
    name: 'Transitional',
    shortDesc: 'Updated classic + clean',
    category: 'exterior',
    thumbnail: '🏠',
    colors: { primary: '#D1C8BA', secondary: '#3A3C3E', accent: '#78716C' },
    prompt: `Restyle the exterior finishes of THIS house to achieve a Transitional (updated traditional) look. Keep the exact same house shape, roofline, window positions, and camera angle. Only change surface materials and colors:
- SIDING: Warm greige horizontal lap siding (like Sherwin-Williams Agreeable Gray or Accessible Beige)
- ROOF: Same roof shape — change to dark charcoal architectural shingles
- WINDOWS: Same positions and sizes — update to black or dark bronze frames, simple profiles, minimal grids
- FRONT DOOR: Dark charcoal or black door with simple modern hardware, possibly with glass
- TRIM: White or cream trim at windows and corners, cleaner and simpler than full traditional
- GUTTERS: Dark bronze or black, matching window frames
- ACCENTS: One stone or brick accent element at entry, modern light fixtures
- GARAGE: Dark-framed carriage-style or flush modern garage door — same opening
- Overall: Traditional proportions with modern finishes. Clean but warm. Not fussy, not sterile.
- Keep all landscaping, driveway, walkways, sky, and surroundings exactly as they appear in the photo.`,
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
    prompt: `Restyle the finishes in THIS kitchen to achieve a Modern White Kitchen look. Keep the exact same kitchen layout, cabinet positions, window positions, island location, and room shape. Only change surface finishes:
- CABINETS: White Shaker-style cabinets (uppers and lowers), clean recessed panel, soft-close hardware
- COUNTERTOPS: White or light gray quartz with subtle veining (Calacatta or Carrara look), eased or mitered edge
- BACKSPLASH: White subway tile in brick-lay pattern with light gray grout, OR large format white tile
- HARDWARE: Matte black bar pulls on drawers and cabinets, modern minimalist profile
- SINK: Stainless steel undermount single-bowl sink, modern matte black gooseneck faucet
- ISLAND: Same position — apply white cabinets, possibly with a waterfall edge countertop on one side
- LIGHTING: Black or brushed nickel pendant lights over island, recessed cans elsewhere
- FLOORING: Light oak hardwood or light gray LVP, wide plank
- Keep all appliance positions, windows, and room dimensions exactly as they appear in the photo.`,
  },
  {
    id: 'kitchen-farmhouse',
    name: 'Farmhouse Kitchen',
    shortDesc: 'Warm wood + open shelving + apron sink',
    category: 'kitchen',
    thumbnail: '🌾',
    colors: { primary: '#F5F0E8', secondary: '#8B7355', accent: '#3A5540' },
    prompt: `Restyle the finishes in THIS kitchen to achieve a Farmhouse Kitchen look. Keep the exact same kitchen layout, cabinet positions, window positions, island location, and room shape. Only change surface finishes:
- CABINETS: Mix of white painted lowers with natural wood-tone uppers (or open wood shelving), Shaker profile
- COUNTERTOPS: Butcher block on island or prep area, white/cream quartz on perimeter counters
- BACKSPLASH: White subway tile with warm grout, OR beadboard wainscoting in white
- HARDWARE: Matte black cup pulls and knobs, vintage-inspired but clean
- SINK: White fireclay apron-front (farmhouse) sink, brushed gold or oil-rubbed bronze bridge faucet
- ISLAND: Same position — contrasting color (sage green, navy, or natural wood) with butcher block top
- LIGHTING: Black iron or antique brass pendant lanterns over island, under-cabinet lighting
- ACCENTS: Open wood shelving with stacked dishes, vintage touches
- Keep all appliance positions, windows, and room dimensions exactly as they appear in the photo.`,
  },
  {
    id: 'kitchen-contemporary-dark',
    name: 'Contemporary Dark',
    shortDesc: 'Dark cabinets + waterfall island + minimal',
    category: 'kitchen',
    thumbnail: '🖤',
    colors: { primary: '#1C2530', secondary: '#D4C5A9', accent: '#C19A6B' },
    prompt: `Restyle the finishes in THIS kitchen to achieve a Contemporary Dark Kitchen look. Keep the exact same kitchen layout, cabinet positions, window positions, island location, and room shape. Only change surface finishes:
- CABINETS: Dark navy, charcoal, or matte black flat-panel (slab) cabinets, handleless or with integrated pulls
- COUNTERTOPS: White marble-look quartz with dramatic veining, waterfall edge on island
- BACKSPLASH: Large format porcelain slab matching countertop, OR dark tile matching cabinets for monolithic look
- HARDWARE: Integrated edge pulls or push-to-open, brushed gold accents if any visible hardware
- SINK: Undermount sink in dark composite or stainless, modern pull-down spray faucet in brushed gold or matte black
- ISLAND: Same position — waterfall countertop, dark cabinet base, pendant lighting
- LIGHTING: Sculptural modern pendants in brass or black over island, linear LED under cabinets
- FLOORING: Wide plank dark wood or large format gray-black tile
- Keep all appliance positions, windows, and room dimensions exactly as they appear in the photo.`,
  },
  {
    id: 'kitchen-transitional',
    name: 'Transitional Kitchen',
    shortDesc: 'Two-tone + marble look + warm metals',
    category: 'kitchen',
    thumbnail: '✨',
    colors: { primary: '#F5F0E8', secondary: '#4A5565', accent: '#C19A6B' },
    prompt: `Restyle the finishes in THIS kitchen to achieve a Transitional Kitchen look. Keep the exact same kitchen layout, cabinet positions, window positions, island location, and room shape. Only change surface finishes:
- CABINETS: Two-tone — white or cream upper cabinets with darker lower cabinets (navy, dark gray, or sage green), Shaker-style profile
- COUNTERTOPS: White marble-look quartz with soft gray veining, eased edge profile
- BACKSPLASH: Herringbone or arabesque tile pattern in white/cream, adding texture and interest
- HARDWARE: Brushed gold or champagne bronze knobs and pulls, elegant but not ornate
- SINK: Stainless undermount, brushed gold single-handle faucet with pull-down spray
- ISLAND: Same position — lower cabinet color with marble-look quartz top, seating on one side
- LIGHTING: Glass and brass pendant lights over island, warm recessed lighting
- FLOORING: Medium-tone hardwood or wood-look tile, herringbone or wide plank
- Keep all appliance positions, windows, and room dimensions exactly as they appear in the photo.`,
  },
  {
    id: 'kitchen-industrial',
    name: 'Industrial',
    shortDesc: 'Concrete + steel + raw texture',
    category: 'kitchen',
    thumbnail: '🔩',
    colors: { primary: '#6B7280', secondary: '#292524', accent: '#C19A6B' },
    prompt: `Restyle the finishes in THIS kitchen to achieve an Industrial Kitchen look. Keep the exact same kitchen layout, cabinet positions, window positions, island location, and room shape. Only change surface finishes:
- CABINETS: Flat-panel cabinets in dark gray or charcoal, lower cabinets only — replace uppers with open metal shelving
- COUNTERTOPS: Concrete-look quartz or actual poured concrete, raw matte finish, square edge
- BACKSPLASH: Exposed brick texture OR dark subway tile, raw industrial character
- HARDWARE: Matte black oversized bar pulls, industrial-grade aesthetic
- SINK: Deep stainless steel single-bowl, commercial-style pull-down spring faucet in chrome or matte black
- SHELVING: Open black metal and reclaimed wood floating shelves on upper walls
- LIGHTING: Industrial cage pendants or Edison-bulb fixtures, black metal, exposed bulbs
- FLOORING: Polished concrete, dark slate tile, or distressed wide-plank wood
- ACCENTS: Metal stools at island, raw materials celebrated
- Keep all appliance positions, windows, and room dimensions exactly as they appear in the photo.`,
  },
  {
    id: 'kitchen-coastal',
    name: 'Coastal Kitchen',
    shortDesc: 'Light blue + white + natural textures',
    category: 'kitchen',
    thumbnail: '🐚',
    colors: { primary: '#F5F8FA', secondary: '#6B99B8', accent: '#C19A6B' },
    prompt: `Restyle the finishes in THIS kitchen to achieve a Coastal Kitchen look. Keep the exact same kitchen layout, cabinet positions, window positions, island location, and room shape. Only change surface finishes:
- CABINETS: White Shaker cabinets with possible soft blue or seafoam island, beadboard panel details
- COUNTERTOPS: White quartz or light marble-look with very subtle veining, soft rounded edge
- BACKSPLASH: White or pale blue glass tile, OR white beadboard wainscoting, nautical but not themed
- HARDWARE: Brushed nickel or chrome bin pulls, rope-wrapped accents optional
- SINK: White undermount or apron-front sink, polished chrome bridge-style faucet
- ISLAND: Same position — white or soft blue-painted with butcher block or white quartz top, wicker or rattan stools
- LIGHTING: White or rattan woven pendant lights, natural texture, airy feel
- FLOORING: Light whitewashed wood or light natural oak, wide plank
- ACCENTS: Glass-front cabinet doors, open shelving with coastal objects, bright and airy
- Keep all appliance positions, windows, and room dimensions exactly as they appear in the photo.`,
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
    prompt: `Restyle the finishes in THIS bathroom to achieve a Modern Spa Bathroom look. Keep the exact same bathroom layout, fixture positions, vanity location, shower/tub position, and room shape. Only change surface finishes and fixtures:
- WALLS: Large format white or light gray porcelain tile (24x48 or larger), minimal grout lines
- SHOWER: Same position — frameless glass enclosure, full height, large format matching wall tile, linear drain, rain showerhead and handheld
- VANITY: Same position — floating wall-mounted vanity in white or light wood with soft-close drawers, undermount white rectangular basin
- COUNTERTOP: White quartz or solid surface, clean seamless look
- MIRROR: Large frameless or thin black-framed rectangular mirror, backlit LED option
- FIXTURES: Matte black or brushed nickel faucets, towel bars, and accessories, minimal and coordinated
- FLOOR: Large format gray or white matte porcelain tile
- LIGHTING: Recessed cans, LED strip behind mirror, clean ambient lighting
- TOILET: Modern wall-hung or skirted one-piece toilet with concealed trapway
- Overall: Clean, calm, hotel-spa feel. Minimal visual clutter. Warm but minimal.
- Keep all plumbing positions, windows, and room dimensions exactly as they appear in the photo.`,
  },
  {
    id: 'bath-classic-marble',
    name: 'Classic Marble',
    shortDesc: 'Marble + chrome + timeless elegance',
    category: 'bathroom',
    thumbnail: '🏛️',
    colors: { primary: '#F5F5F0', secondary: '#D1C8BA', accent: '#8B8B8B' },
    prompt: `Restyle the finishes in THIS bathroom to achieve a Classic Marble Bathroom look. Keep the exact same bathroom layout, fixture positions, vanity location, shower/tub position, and room shape. Only change surface finishes and fixtures:
- WALLS: White Carrara or Calacatta marble tile (or marble-look porcelain), floor-to-ceiling in shower, wainscot height elsewhere
- SHOWER: Same position — glass enclosure with marble walls, marble niche shelf, traditional crosshandle fixtures in polished chrome
- VANITY: Same position — traditional furniture-style vanity in white with marble top, undermount oval basin, polished chrome widespread faucet
- MIRROR: Framed vanity mirror in white or silver, arched or rectangular traditional profile
- FIXTURES: Polished chrome everything, towel bars, robe hooks, toilet paper holder, all coordinated
- FLOOR: Marble mosaic floor (basketweave, hexagon, or herringbone pattern), white with gray veining
- LIGHTING: Crystal or glass sconces flanking mirror
- ACCENTS: Crown molding at ceiling, decorative baseboards, classic elegance details
- Overall: Timeless, luxurious, traditional marble bath. Hotel-quality finishes.
- Keep all plumbing positions, windows, and room dimensions exactly as they appear in the photo.`,
  },
  {
    id: 'bath-warm-organic',
    name: 'Warm & Organic',
    shortDesc: 'Wood + stone + warm tones',
    category: 'bathroom',
    thumbnail: '🪵',
    colors: { primary: '#E8DCC8', secondary: '#8B7355', accent: '#6B8B73' },
    prompt: `Restyle the finishes in THIS bathroom to achieve a Warm Organic Bathroom look. Keep the exact same bathroom layout, fixture positions, vanity location, shower/tub position, and room shape. Only change surface finishes and fixtures:
- WALLS: Natural stone-look tile in warm tones (travertine, sandstone, or warm gray), OR smooth plaster-effect walls in cream or warm white
- SHOWER: Same position — natural stone tile, pebble floor accent, warm brass rainfall showerhead
- VANITY: Same position — natural wood floating vanity (walnut, white oak, or teak), vessel basin in white or natural stone
- COUNTERTOP: Natural stone slab or warm-toned quartz with organic veining
- MIRROR: Round mirror with natural wood or brass frame, organic shape
- FIXTURES: Brushed brass or champagne gold faucets and accessories, warm metal throughout
- FLOOR: Large format stone-look porcelain in warm tones, or natural stone
- LIGHTING: Warm ambient lighting, sconces with linen or organic shades, backlit round mirror
- ACCENTS: Live-edge wood shelf, potted plants, woven baskets, natural linen towels
- Overall: Spa-like but warm and textured. Biophilic design. Connected to nature.
- Keep all plumbing positions, windows, and room dimensions exactly as they appear in the photo.`,
  },
  {
    id: 'bath-bold-contemporary',
    name: 'Bold Contemporary',
    shortDesc: 'Dark tile + black fixtures + drama',
    category: 'bathroom',
    thumbnail: '🖤',
    colors: { primary: '#292524', secondary: '#78716C', accent: '#C19A6B' },
    prompt: `Restyle the finishes in THIS bathroom to achieve a Bold Contemporary Bathroom look. Keep the exact same bathroom layout, fixture positions, vanity location, shower/tub position, and room shape. Only change surface finishes and fixtures:
- WALLS: Large format dark tile (charcoal, black, or deep navy), floor-to-ceiling, thin grout lines
- SHOWER: Same position — frameless glass with dark tile throughout, matte black fixtures, curbless entry if possible
- VANITY: Same position — dark floating vanity (matte black, dark walnut, or dark gray), integrated or undermount white basin for contrast
- COUNTERTOP: White quartz or marble for striking contrast against dark cabinets
- MIRROR: Large round or irregular-shaped backlit LED mirror
- FIXTURES: Matte black everything, faucet, showerhead, towel bars, accessories
- FLOOR: Matching dark tile or contrasting geometric black-and-white pattern
- LIGHTING: LED strips, black downlights, dramatic accent lighting
- ACCENTS: Gold or brass accent on one element (mirror frame, shelf bracket, or towel ring), otherwise monochrome
- Overall: Dark, dramatic, high-contrast. Boutique hotel aesthetic.
- Keep all plumbing positions, windows, and room dimensions exactly as they appear in the photo.`,
  },
  {
    id: 'bath-coastal',
    name: 'Coastal Bath',
    shortDesc: 'White + blue + natural textures',
    category: 'bathroom',
    thumbnail: '🌊',
    colors: { primary: '#F5F8FA', secondary: '#6B99B8', accent: '#E8DCC8' },
    prompt: `Restyle the finishes in THIS bathroom to achieve a Coastal Bathroom look. Keep the exact same bathroom layout, fixture positions, vanity location, shower/tub position, and room shape. Only change surface finishes and fixtures:
- WALLS: White shiplap or beadboard wainscoting on lower half, soft blue or white paint above, or white tile with blue glass accent strip
- SHOWER: Same position — white subway tile or fish-scale tile in soft blue or seafoam, polished chrome fixtures
- VANITY: Same position — white painted vanity with beadboard panel detail, marble or quartz top, polished chrome widespread faucet
- MIRROR: White wood-framed or rope-framed mirror, beachy but refined
- FIXTURES: Polished chrome or brushed nickel, coastal-classic styling
- FLOOR: White hexagonal mosaic tile, or whitewashed wood-look porcelain plank
- LIGHTING: Chrome or glass sconces, nautical-inspired but not themed
- ACCENTS: Woven basket storage, glass jars, natural textures, sea glass colors, bright and breezy
- Overall: Light, airy, relaxed. Coastal elegance without being kitschy.
- Keep all plumbing positions, windows, and room dimensions exactly as they appear in the photo.`,
  },
  {
    id: 'bath-farmhouse',
    name: 'Farmhouse Bath',
    shortDesc: 'Shiplap + vintage hardware + rustic',
    category: 'bathroom',
    thumbnail: '🌿',
    colors: { primary: '#F5F0E8', secondary: '#6B7280', accent: '#292524' },
    prompt: `Restyle the finishes in THIS bathroom to achieve a Farmhouse Bathroom look. Keep the exact same bathroom layout, fixture positions, vanity location, shower/tub position, and room shape. Only change surface finishes and fixtures:
- WALLS: White shiplap or horizontal plank paneling full height, painted white or soft cream
- SHOWER: Same position — white subway tile with dark grout, glass panel door, oil-rubbed bronze or matte black fixtures
- VANITY: Same position — reclaimed wood or barnwood-style vanity with vessel or undermount white sink, matte black faucet
- MIRROR: Rustic wood-framed mirror or industrial black metal frame
- FIXTURES: Matte black or oil-rubbed bronze faucets, towel hooks (not bars), vintage-inspired
- FLOOR: Black and white hexagonal tile pattern, or wide plank wood-look porcelain in weathered gray
- LIGHTING: Black industrial cage sconces or vintage Edison-style wall lights
- ACCENTS: Wire baskets for storage, galvanized metal touches, cotton towels in neutral tones
- Overall: Rustic charm meets clean simplicity. Warm, inviting, lived-in feel.
- Keep all plumbing positions, windows, and room dimensions exactly as they appear in the photo.`,
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

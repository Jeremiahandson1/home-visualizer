// ═══════════════════════════════════════════════════════════════
// SAM (Segment Anything Model) Client — via Replicate
// ~$0.009 per segmentation (108 runs per $1)
//
// Zone identification is now done via MASK GEOMETRY ANALYSIS
// instead of GPT-4o vision. Zero additional API cost.
//
// Flow:
// 1. SAM 2 on Replicate → pixel mask from click point
// 2. Sharp analyzes mask shape/position → zone classification
// ═══════════════════════════════════════════════════════════════

const REPLICATE_API_TOKEN = process.env.REPLICATE_API_TOKEN;

// ─── Zone labels we recognize ─────────────────────────────
const EXTERIOR_ZONES = [
  'siding', 'roof', 'gutter', 'downspout', 'fascia', 'soffit',
  'front-door', 'garage-door', 'window', 'shutter', 'trim',
  'porch', 'railing', 'column', 'chimney', 'foundation',
  'deck', 'fence', 'mailbox', 'light-fixture',
];

const KITCHEN_ZONES = [
  'cabinets-upper', 'cabinets-lower', 'countertop', 'backsplash',
  'island', 'sink', 'faucet', 'hardware', 'flooring', 'lighting',
];

const BATHROOM_ZONES = [
  'vanity', 'countertop', 'mirror', 'shower-wall', 'shower-floor',
  'bathtub', 'toilet', 'flooring', 'faucet', 'lighting',
];

// ═══════════════════════════════════════════════════════════════
// MASK GEOMETRY CLASSIFIER
// Analyzes the SAM mask to determine what zone it represents
// based on shape, size, position — no vision API needed
// ═══════════════════════════════════════════════════════════════

/**
 * Analyze a binary mask image to extract geometric properties
 * @param {string} maskBase64 - Base64 PNG mask from SAM
 * @param {number} imageWidth - Original image width
 * @param {number} imageHeight - Original image height
 * @returns {Object} Geometric properties of the mask
 */
async function analyzeMaskGeometry(maskBase64, imageWidth, imageHeight) {
  const sharp = (await import('sharp')).default;
  const maskBuf = Buffer.from(maskBase64, 'base64');

  // Get mask dimensions
  const meta = await sharp(maskBuf).metadata();
  const mw = meta.width;
  const mh = meta.height;

  // Extract raw pixel data (grayscale)
  const { data, info } = await sharp(maskBuf)
    .grayscale()
    .raw()
    .toBuffer({ resolveWithObject: true });

  // Find bounding box and pixel count of the mask (non-zero pixels)
  let minX = mw, maxX = 0, minY = mh, maxY = 0;
  let maskPixels = 0;
  const totalPixels = mw * mh;

  for (let y = 0; y < mh; y++) {
    for (let x = 0; x < mw; x++) {
      const val = data[y * mw + x];
      if (val > 128) { // threshold — SAM masks are usually 0 or 255
        maskPixels++;
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      }
    }
  }

  if (maskPixels === 0) {
    return null; // empty mask
  }

  // Bounding box dimensions
  const bbWidth = maxX - minX + 1;
  const bbHeight = maxY - minY + 1;
  const bbCenterX = minX + bbWidth / 2;
  const bbCenterY = minY + bbHeight / 2;

  // Normalized values (0-1 range relative to image)
  const normCenterX = bbCenterX / mw;
  const normCenterY = bbCenterY / mh;
  const normTop = minY / mh;
  const normBottom = maxY / mh;
  const normLeft = minX / mw;
  const normRight = maxX / mw;

  // Shape metrics
  const aspectRatio = bbWidth / bbHeight;     // >1 = wide, <1 = tall
  const areaRatio = maskPixels / totalPixels;  // how much of the image this covers
  const fillRatio = maskPixels / (bbWidth * bbHeight); // how solid the mask is within its bbox
  const widthRatio = bbWidth / mw;             // how wide relative to image
  const heightRatio = bbHeight / mh;           // how tall relative to image

  return {
    // Bounding box (pixels)
    minX, maxX, minY, maxY,
    bbWidth, bbHeight,
    bbCenterX, bbCenterY,

    // Normalized position (0-1)
    normCenterX, normCenterY,
    normTop, normBottom,
    normLeft, normRight,

    // Shape
    aspectRatio,   // width/height
    areaRatio,     // mask area / image area
    fillRatio,     // mask area / bounding box area
    widthRatio,    // bbox width / image width
    heightRatio,   // bbox height / image height
    maskPixels,
    totalPixels,
  };
}

/**
 * Classify an exterior zone based on mask geometry
 * Uses a scoring system — each heuristic adds points to candidate zones
 *
 * Key heuristics:
 * - Roof: upper image, large area, wide
 * - Siding: large area, middle-lower, wide
 * - Window: small-medium, roughly square, middle area
 * - Front door: tall narrow, lower-center
 * - Garage door: large rectangle, lower portion
 * - Gutter: extremely thin horizontal strip near roofline
 * - Fascia/Soffit: thin strip below roofline
 * - Trim: thin strips, often near windows/doors
 * - Foundation: lower strip, horizontal
 * - Chimney: narrow vertical, upper portion
 * - Deck/Porch: lower portion, wide
 */
function classifyExteriorZone(geo, clickX, clickY, imageWidth, imageHeight) {
  const scores = {};
  EXTERIOR_ZONES.forEach(z => scores[z] = 0);

  const {
    aspectRatio, areaRatio, fillRatio,
    normCenterY, normTop, normBottom,
    widthRatio, heightRatio,
    normCenterX, normLeft, normRight,
  } = geo;

  // Click position (normalized)
  const clickNormX = clickX / imageWidth;
  const clickNormY = clickY / imageHeight;

  // ─── VERTICAL POSITION SCORING ─────────────────────────

  // Upper third of image (roof territory)
  if (normCenterY < 0.33) {
    scores['roof'] += 3;
    scores['chimney'] += 2;
    scores['fascia'] += 1;
    scores['soffit'] += 1;
    scores['gutter'] += 1;
  }

  // Middle third (siding, windows, doors)
  if (normCenterY >= 0.25 && normCenterY <= 0.75) {
    scores['siding'] += 2;
    scores['window'] += 2;
    scores['front-door'] += 1;
    scores['shutter'] += 1;
    scores['trim'] += 1;
    scores['garage-door'] += 1;
  }

  // Lower third (foundation, deck, garage)
  if (normCenterY > 0.66) {
    scores['foundation'] += 2;
    scores['deck'] += 2;
    scores['porch'] += 2;
    scores['garage-door'] += 1;
    scores['front-door'] += 1;
    scores['railing'] += 1;
  }

  // ─── AREA SCORING ──────────────────────────────────────

  // Very large area (>15% of image) → siding or roof
  if (areaRatio > 0.15) {
    scores['siding'] += 4;
    scores['roof'] += 4;
    // Decide between them based on vertical position
    if (normCenterY < 0.4) scores['roof'] += 3;
    else scores['siding'] += 3;
  }

  // Large area (5-15%)
  if (areaRatio > 0.05 && areaRatio <= 0.15) {
    scores['siding'] += 2;
    scores['roof'] += 2;
    scores['garage-door'] += 2;
    scores['deck'] += 1;
  }

  // Medium area (1-5%)
  if (areaRatio > 0.01 && areaRatio <= 0.05) {
    scores['window'] += 2;
    scores['front-door'] += 2;
    scores['garage-door'] += 2;
    scores['shutter'] += 1;
  }

  // Small area (0.2-1%)
  if (areaRatio > 0.002 && areaRatio <= 0.01) {
    scores['window'] += 3;
    scores['light-fixture'] += 2;
    scores['mailbox'] += 1;
    scores['downspout'] += 1;
  }

  // Tiny area (<0.2%)
  if (areaRatio <= 0.002) {
    scores['light-fixture'] += 3;
    scores['mailbox'] += 2;
    scores['downspout'] += 1;
  }

  // ─── SHAPE SCORING (aspect ratio) ─────────────────────

  // Very wide and thin (aspect > 5) → gutter, fascia, foundation
  if (aspectRatio > 5) {
    scores['gutter'] += 5;
    scores['fascia'] += 4;
    scores['soffit'] += 3;
    scores['foundation'] += 3;
    scores['railing'] += 2;
    // Upper = gutter/fascia, lower = foundation/railing
    if (normCenterY < 0.4) {
      scores['gutter'] += 3;
      scores['fascia'] += 2;
    } else {
      scores['foundation'] += 3;
      scores['railing'] += 2;
    }
  }

  // Wide (aspect 2-5)
  if (aspectRatio > 2 && aspectRatio <= 5) {
    scores['garage-door'] += 2;
    scores['porch'] += 1;
    scores['deck'] += 1;
    scores['soffit'] += 1;
    if (heightRatio < 0.08) {
      scores['gutter'] += 3;
      scores['fascia'] += 2;
      scores['trim'] += 2;
    }
  }

  // Roughly square (aspect 0.5-2)
  if (aspectRatio >= 0.5 && aspectRatio <= 2) {
    scores['window'] += 2;
    if (areaRatio < 0.05) scores['window'] += 2;
  }

  // Tall and narrow (aspect < 0.5) → door, downspout, chimney
  if (aspectRatio < 0.5) {
    scores['front-door'] += 4;
    scores['downspout'] += 3;
    scores['chimney'] += 2;
    scores['column'] += 2;
    // Doors are lower, chimneys are upper
    if (normCenterY > 0.5) {
      scores['front-door'] += 2;
      scores['column'] += 1;
    } else {
      scores['chimney'] += 3;
      scores['downspout'] += 1;
    }
  }

  // Very tall and narrow (aspect < 0.2) → downspout, column
  if (aspectRatio < 0.2) {
    scores['downspout'] += 4;
    scores['column'] += 3;
    scores['front-door'] -= 1; // doors aren't THAT narrow
  }

  // ─── THIN STRIP SCORING ────────────────────────────────
  // Height is very small relative to image = horizontal strip
  if (heightRatio < 0.05) {
    scores['gutter'] += 3;
    scores['fascia'] += 3;
    scores['soffit'] += 2;
    scores['trim'] += 2;
    scores['foundation'] += 1;
    // Penalize things that can't be this thin
    scores['siding'] -= 3;
    scores['roof'] -= 3;
    scores['window'] -= 2;
  }

  // Width is very small relative to image = vertical strip
  if (widthRatio < 0.05) {
    scores['downspout'] += 4;
    scores['column'] += 2;
    scores['trim'] += 2;
    // Penalize
    scores['siding'] -= 3;
    scores['roof'] -= 3;
  }

  // ─── FILL RATIO SCORING ────────────────────────────────
  // High fill ratio (>0.8) = solid rectangular shape
  if (fillRatio > 0.8) {
    scores['window'] += 1;
    scores['front-door'] += 1;
    scores['garage-door'] += 1;
  }

  // Low fill ratio (<0.5) = irregular shape
  if (fillRatio < 0.5) {
    scores['roof'] += 1; // roofs often have irregular masks (L-shaped, etc.)
    scores['siding'] += 1;
    scores['deck'] += 1;
  }

  // ─── WIDTH SPANNING ────────────────────────────────────
  // Spans most of the image width
  if (widthRatio > 0.7) {
    scores['roof'] += 2;
    scores['siding'] += 2;
    scores['foundation'] += 1;
    scores['gutter'] += 2;
    // Windows and doors don't span the whole image
    scores['window'] -= 3;
    scores['front-door'] -= 3;
  }

  // ─── CENTER POSITION (for doors) ───────────────────────
  // Doors tend to be roughly center-ish
  if (normCenterX > 0.3 && normCenterX < 0.7 && aspectRatio < 0.7 && areaRatio > 0.01) {
    scores['front-door'] += 2;
  }

  // ─── GARAGE DOOR specific ──────────────────────────────
  // Large, lower portion, wider than tall
  if (areaRatio > 0.03 && normCenterY > 0.5 && aspectRatio > 1.2 && aspectRatio < 4) {
    scores['garage-door'] += 3;
  }

  // ─── Find winner ───────────────────────────────────────
  let best = 'siding'; // fallback
  let bestScore = -Infinity;

  for (const [zone, score] of Object.entries(scores)) {
    if (score > bestScore) {
      bestScore = score;
      best = zone;
    }
  }

  // Log for debugging
  const top3 = Object.entries(scores)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([z, s]) => `${z}:${s}`)
    .join(', ');

  console.log(`[ZoneClassifier] click=(${clickX},${clickY}) area=${(areaRatio * 100).toFixed(1)}% aspect=${aspectRatio.toFixed(2)} yPos=${normCenterY.toFixed(2)} → ${best} (${top3})`);

  return best;
}

/**
 * Classify a kitchen zone based on mask geometry
 */
function classifyKitchenZone(geo, clickNormX, clickNormY) {
  const { aspectRatio, areaRatio, normCenterY, normTop, normBottom, widthRatio, heightRatio } = geo;

  // Upper portion = upper cabinets
  if (normCenterY < 0.35 && areaRatio > 0.03) return 'cabinets-upper';

  // Lower portion, large = lower cabinets or island
  if (normCenterY > 0.55 && areaRatio > 0.03) {
    // Island tends to be more centered and free-standing
    if (normTop > 0.5) return 'island';
    return 'cabinets-lower';
  }

  // Thin horizontal strip in middle = countertop or backsplash
  if (heightRatio < 0.15 && widthRatio > 0.3) {
    if (normCenterY < 0.45) return 'backsplash';
    return 'countertop';
  }

  // Very bottom = flooring
  if (normBottom > 0.9 && areaRatio > 0.05) return 'flooring';

  // Small = hardware, faucet, sink, lighting
  if (areaRatio < 0.01) {
    if (normCenterY < 0.2) return 'lighting';
    if (normCenterY > 0.5) return 'hardware';
    return 'faucet';
  }

  // Medium area in middle = sink
  if (areaRatio > 0.005 && areaRatio < 0.03 && normCenterY > 0.35 && normCenterY < 0.65) {
    return 'sink';
  }

  return 'cabinets-lower'; // fallback
}

/**
 * Classify a bathroom zone based on mask geometry
 */
function classifyBathroomZone(geo, clickNormX, clickNormY) {
  const { aspectRatio, areaRatio, normCenterY, normBottom, heightRatio, widthRatio } = geo;

  // Very bottom = flooring
  if (normBottom > 0.9 && areaRatio > 0.05) return 'flooring';

  // Upper area, roughly square = mirror
  if (normCenterY < 0.35 && aspectRatio > 0.7 && aspectRatio < 1.5 && areaRatio > 0.02) return 'mirror';

  // Large lower area = vanity or bathtub
  if (normCenterY > 0.5 && areaRatio > 0.05) {
    if (aspectRatio > 2) return 'bathtub';
    return 'vanity';
  }

  // Large wall area = shower wall
  if (areaRatio > 0.1) return 'shower-wall';

  // Small items
  if (areaRatio < 0.01) {
    if (normCenterY < 0.3) return 'lighting';
    return 'faucet';
  }

  // Medium lower = toilet
  if (areaRatio > 0.01 && areaRatio < 0.05 && normCenterY > 0.5) return 'toilet';

  return 'vanity'; // fallback
}

/**
 * Identify zone using mask geometry — NO vision API call needed
 * Cost: $0.00 (just CPU time with Sharp)
 *
 * @param {string} maskBase64 - The mask PNG from SAM
 * @param {number} clickX - Click X coordinate
 * @param {number} clickY - Click Y coordinate
 * @param {number} imageWidth - Original image width
 * @param {number} imageHeight - Original image height
 * @param {string} remodelType - 'exterior', 'kitchen', or 'bathroom'
 * @returns {string} Zone label
 */
export async function identifyZoneFromMask(maskBase64, clickX, clickY, imageWidth, imageHeight, remodelType = 'exterior') {
  const geo = await analyzeMaskGeometry(maskBase64, imageWidth, imageHeight);

  if (!geo) {
    console.warn('[ZoneClassifier] Empty mask, defaulting to siding');
    return 'siding';
  }

  const clickNormX = clickX / imageWidth;
  const clickNormY = clickY / imageHeight;

  if (remodelType === 'kitchen') {
    return classifyKitchenZone(geo, clickNormX, clickNormY);
  }

  if (remodelType === 'bathroom') {
    return classifyBathroomZone(geo, clickNormX, clickNormY);
  }

  return classifyExteriorZone(geo, clickX, clickY, imageWidth, imageHeight);
}

// ═══════════════════════════════════════════════════════════════
// LEGACY: GPT-4o vision zone identification (kept as fallback)
// Use identifyZoneFromMask instead — it's free and more accurate
// ═══════════════════════════════════════════════════════════════

/**
 * @deprecated Use identifyZoneFromMask instead
 */
export async function identifyZone(imageBase64, x, y, imageWidth, imageHeight, remodelType = 'exterior') {
  const zones = remodelType === 'kitchen' ? KITCHEN_ZONES
    : remodelType === 'bathroom' ? BATHROOM_ZONES
    : EXTERIOR_ZONES;

  let markedImage = imageBase64;
  try {
    const sharp = (await import('sharp')).default;
    const imgBuf = Buffer.from(imageBase64, 'base64');
    const meta = await sharp(imgBuf).metadata();
    const w = meta.width;
    const h = meta.height;

    const cx = Math.round(x);
    const cy = Math.round(y);
    const r = Math.max(12, Math.round(Math.min(w, h) * 0.025));
    const svg = Buffer.from(`<svg width="${w}" height="${h}">
      <circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="red" stroke-width="4"/>
      <circle cx="${cx}" cy="${cy}" r="${Math.round(r * 0.3)}" fill="red"/>
      <line x1="${cx - r * 1.5}" y1="${cy}" x2="${cx + r * 1.5}" y2="${cy}" stroke="red" stroke-width="3"/>
      <line x1="${cx}" y1="${cy - r * 1.5}" x2="${cx}" y2="${cy + r * 1.5}" stroke="red" stroke-width="3"/>
    </svg>`);

    const markedBuf = await sharp(imgBuf)
      .composite([{ input: svg, top: 0, left: 0 }])
      .jpeg({ quality: 80 })
      .toBuffer();

    markedImage = markedBuf.toString('base64');
  } catch (err) {
    console.error('Could not draw marker, using raw image:', err.message);
  }

  const xPct = Math.round((x / imageWidth) * 100);
  const yPct = Math.round((y / imageHeight) * 100);
  const hPos = xPct < 33 ? 'left side' : xPct > 66 ? 'right side' : 'center';
  const vPos = yPct < 33 ? 'upper' : yPct > 66 ? 'lower' : 'middle';

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: 'gpt-4o',
      max_tokens: 20,
      temperature: 0,
      messages: [{
        role: 'user',
        content: [
          {
            type: 'image_url',
            image_url: { url: `data:image/jpeg;base64,${markedImage}`, detail: 'high' },
          },
          {
            type: 'text',
            text: `This is a photo of a house ${remodelType}. There is a RED CROSSHAIR marker on the image (${vPos} ${hPos} area). What building element is directly at the red crosshair? Reply with ONLY one from: ${zones.join(', ')}`,
          },
        ],
      }],
    }),
  });

  const data = await response.json();
  const label = data.choices?.[0]?.message?.content?.trim().toLowerCase() || 'unknown';
  const matched = zones.find(z => label.includes(z)) || label;
  return matched;
}

// ═══════════════════════════════════════════════════════════════
// SAM SEGMENTATION (unchanged)
// ═══════════════════════════════════════════════════════════════

/**
 * Segment by click point using Replicate SAM 2
 */
export async function segmentByPoint(imageBase64, x, y) {
  if (!REPLICATE_API_TOKEN) throw new Error('REPLICATE_API_TOKEN not configured');

  const imageUri = `data:image/jpeg;base64,${imageBase64}`;

  const createRes = await fetch('https://api.replicate.com/v1/predictions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${REPLICATE_API_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      version: 'fe97b453a6455861e3bac769b441ca1f1086110da7466dbb65cf1eecfd60dc83',
      input: {
        image: imageUri,
        point_coords: `${x},${y}`,
        point_labels: '1',
        multimask_output: false,
      },
    }),
  });

  if (!createRes.ok) {
    const err = await createRes.text();
    throw new Error(`Replicate create failed: ${err}`);
  }

  const prediction = await createRes.json();
  const result = await pollPrediction(prediction.urls.get, 30000);

  if (result.status === 'failed') {
    throw new Error(result.error || 'SAM prediction failed');
  }

  const maskUrl = result.output?.combined_mask || result.output?.individual_masks?.[0];

  if (!maskUrl) {
    throw new Error('No mask returned from SAM');
  }

  const maskBase64 = await urlToBase64(maskUrl);
  return { maskUrl, maskBase64 };
}

/**
 * Grounded SAM — text-based segmentation
 */
export async function segmentByText(imageBase64, textPrompt) {
  if (!REPLICATE_API_TOKEN) throw new Error('REPLICATE_API_TOKEN not configured');

  const imageUri = `data:image/jpeg;base64,${imageBase64}`;

  const createRes = await fetch('https://api.replicate.com/v1/predictions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${REPLICATE_API_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      version: 'ee871c19efb1941f55f66a3d7d960428c8a5afcb77449547fe8e5a4ab820427e',
      input: {
        image: imageUri,
        text_prompt: textPrompt,
      },
    }),
  });

  if (!createRes.ok) {
    const err = await createRes.text();
    throw new Error(`Replicate create failed: ${err}`);
  }

  const prediction = await createRes.json();
  const result = await pollPrediction(prediction.urls.get, 30000);

  if (result.status === 'failed') {
    throw new Error(result.error || 'Grounded SAM failed');
  }

  return result.output;
}

async function pollPrediction(url, timeoutMs = 30000) {
  const start = Date.now();
  const interval = 1000;

  while (Date.now() - start < timeoutMs) {
    const res = await fetch(url, {
      headers: { 'Authorization': `Bearer ${REPLICATE_API_TOKEN}` },
    });
    const data = await res.json();

    if (data.status === 'succeeded' || data.status === 'failed') {
      return data;
    }

    await new Promise(r => setTimeout(r, interval));
  }

  throw new Error('SAM prediction timed out');
}

async function urlToBase64(url) {
  const res = await fetch(url);
  const buf = await res.arrayBuffer();
  return Buffer.from(buf).toString('base64');
}

// Map zone labels → product catalog category IDs
export const ZONE_TO_CATEGORY = {
  'siding': 'siding',
  'roof': 'roofing',
  'gutter': 'gutters',
  'downspout': 'gutters',
  'fascia': 'trim',
  'soffit': 'trim',
  'front-door': 'doors',
  'garage-door': 'garage',
  'window': 'windows',
  'shutter': 'shutters',
  'trim': 'trim',
  'porch': 'deck',
  'railing': 'deck',
  'column': 'exterior',
  'deck': 'deck',
  'fence': 'exterior',
  'chimney': 'exterior',
  'foundation': 'exterior',
  'light-fixture': 'exterior',
  'mailbox': 'exterior',
  'cabinets-upper': 'kitchen',
  'cabinets-lower': 'kitchen',
  'countertop': 'kitchen',
  'backsplash': 'kitchen',
  'island': 'kitchen',
  'sink': 'kitchen',
  'faucet': 'kitchen',
  'hardware': 'kitchen',
  'vanity': 'bathroom',
  'mirror': 'bathroom',
  'shower-wall': 'bathroom',
  'shower-floor': 'bathroom',
  'bathtub': 'bathroom',
  'toilet': 'bathroom',
};

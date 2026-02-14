// ═══════════════════════════════════════════════════════════════
// SAM (Segment Anything Model) Client — via Replicate
// ~$0.009 per segmentation (108 runs per $1)
// vs Roboflow at $4/credit
//
// Two steps:
// 1. SAM 2 on Replicate → pixel mask from click point
// 2. GPT-4o vision → identify what zone was clicked
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

/**
 * Segment by click point using Replicate SAM 2
 * User clicks (x,y) → returns mask of that object
 * Cost: ~$0.009 per call
 *
 * @param {string} imageBase64 - Base64 image
 * @param {number} x - Click X (image pixels)
 * @param {number} y - Click Y (image pixels)
 * @returns {{ maskUrl: string, maskBase64: string }}
 */
export async function segmentByPoint(imageBase64, x, y) {
  if (!REPLICATE_API_TOKEN) throw new Error('REPLICATE_API_TOKEN not configured');

  // Replicate wants a data URI or URL for the image
  const imageUri = `data:image/jpeg;base64,${imageBase64}`;

  // Start prediction
  const createRes = await fetch('https://api.replicate.com/v1/predictions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${REPLICATE_API_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      // SAM 2 model on Replicate
      version: 'fe97b453a6455861e3bac769b441ca1f1086110da7466dbb65cf1eecfd60dc83',
      input: {
        image: imageUri,
        point_coords: `${x},${y}`,
        point_labels: '1',              // 1 = foreground
        multimask_output: false,        // single best mask
      },
    }),
  });

  if (!createRes.ok) {
    const err = await createRes.text();
    throw new Error(`Replicate create failed: ${err}`);
  }

  const prediction = await createRes.json();

  // Poll for completion (typically 5-10 seconds)
  const result = await pollPrediction(prediction.urls.get, 30000);

  if (result.status === 'failed') {
    throw new Error(result.error || 'SAM prediction failed');
  }

  // Result contains mask URL(s)
  const maskUrl = result.output?.combined_mask || result.output?.individual_masks?.[0];

  if (!maskUrl) {
    throw new Error('No mask returned from SAM');
  }

  // Download mask as base64
  const maskBase64 = await urlToBase64(maskUrl);

  return { maskUrl, maskBase64 };
}

/**
 * Alternative: Use Grounded SAM for text-based segmentation
 * "gutters" → mask of all gutters
 * Model: schananas/grounded_sam on Replicate
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
      // Grounded SAM = Grounding DINO + SAM (text → mask)
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

/**
 * Poll Replicate prediction until complete
 */
async function pollPrediction(url, timeoutMs = 30000) {
  const start = Date.now();
  const interval = 1000; // Check every second

  while (Date.now() - start < timeoutMs) {
    const res = await fetch(url, {
      headers: { 'Authorization': `Bearer ${REPLICATE_API_TOKEN}` },
    });
    const data = await res.json();

    if (data.status === 'succeeded' || data.status === 'failed') {
      return data;
    }

    // Wait before next poll
    await new Promise(r => setTimeout(r, interval));
  }

  throw new Error('SAM prediction timed out');
}

/**
 * Download URL to base64
 */
async function urlToBase64(url) {
  const res = await fetch(url);
  const buf = await res.arrayBuffer();
  return Buffer.from(buf).toString('base64');
}

/**
 * Identify what zone the user clicked using GPT-4o vision
 * Draws a bright red crosshair on the image so the model can SEE the click point
 * Cost: ~$0.01
 */
export async function identifyZone(imageBase64, x, y, imageWidth, imageHeight, remodelType = 'exterior') {
  const zones = remodelType === 'kitchen' ? KITCHEN_ZONES
    : remodelType === 'bathroom' ? BATHROOM_ZONES
    : EXTERIOR_ZONES;

  // Draw a visible red crosshair marker on the image at the click point
  // This is critical — GPT-4o can't reliably map raw pixel coords to surfaces
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

  // Compute relative position for text hint
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
      model: 'gpt-4o-mini',
      max_tokens: 20,
      temperature: 0,
      messages: [{
        role: 'user',
        content: [
          {
            type: 'image_url',
            image_url: { url: `data:image/jpeg;base64,${markedImage}`, detail: 'auto' },
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

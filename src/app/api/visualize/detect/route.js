// ═══════════════════════════════════════════════════════════════
// POST /api/visualize/detect
// TWO-STEP detection:
//   1. GPT-4o vision → identifies surfaces with x,y positions
//   2. SAM 2 via Replicate → generates pixel-perfect masks per surface
//
// Returns: array of surfaces with category, label, position, AND maskBase64
//
// Cost: ~$0.01-0.03 (vision) + ~$0.01-0.03 per SAM call
// ═══════════════════════════════════════════════════════════════

import { NextResponse } from 'next/server';
import sharp from 'sharp';

const DETECTION_PROMPT = `You are an expert exterior home analyst. Study this house photo carefully and identify every visible exterior surface/element.

For each surface, return its CATEGORY, a short LABEL, and its approximate CENTER POSITION as x,y percentages (0-100) of the image dimensions.

CATEGORIES (use EXACTLY these strings):
- "siding" — main wall siding surfaces (lap siding, board & batten, shingles, stucco, brick, vinyl, etc.)
- "trim" — window trim, door trim, corner boards, fascia boards, decorative trim pieces
- "soffit" — soffit panels under roof overhangs
- "fascia" — fascia boards along roofline edges
- "gutters" — rain gutters and downspouts
- "windows" — window frames, sashes, glass areas
- "doors" — entry doors, garage doors, storm doors
- "roofing" — visible roofing material (shingles, metal, tile)
- "foundation" — visible foundation, concrete base, skirting ONLY if visible (not ground/snow/dirt)
- "railing" — porch railings, deck railings, balcony railings
- "columns" — porch columns, support posts
- "shutters" — window shutters (decorative panels beside windows)
- "paint" — painted accent areas
- "accent" — any other decorative exterior element

POSITIONING RULES:
- x=0 is left edge, x=100 is right edge
- y=0 is top edge, y=100 is bottom edge
- Place dots ONLY on the actual building surface, NEVER on sky, ground, snow, grass, or trees
- For siding: place the dot on the CENTER of each visible wall section (not at the edge)
- For windows: place the dot directly on the glass/frame of each window
- For doors: place the dot on the center of the door panel
- For roofing: place the dot on the visible roof surface (shingles/metal), not the sky above
- For trim: place the dot on visible trim boards around windows or at corners
- For foundation: ONLY include if you can clearly see a concrete/stone foundation strip. Do NOT guess.
- For shutters: place on each shutter panel beside windows

ACCURACY IS CRITICAL. Only identify surfaces you can clearly see. Do not guess or place dots on ambiguous areas.

Return ONLY valid JSON, no markdown, no explanation:
{
  "surfaces": [
    { "category": "siding", "label": "Front wall left", "x": 25, "y": 45 },
    { "category": "windows", "label": "Left window", "x": 22, "y": 40 },
    ...
  ]
}`;

export const maxDuration = 120; // Allow time for GPT-4o + SAM 2 calls

export async function POST(req) {
  try {
    const { imageBase64, withMasks = true } = await req.json();

    if (!imageBase64) {
      return NextResponse.json({ error: 'Missing imageBase64' }, { status: 400 });
    }

    const start = Date.now();

    // Get image dimensions for SAM 2 coordinate mapping
    let imageWidth = 1024;
    let imageHeight = 1024;
    try {
      const imgBuf = Buffer.from(imageBase64, 'base64');
      const imgMeta = await sharp(imgBuf).metadata();
      imageWidth = imgMeta.width || 1024;
      imageHeight = imgMeta.height || 1024;
    } catch (dimErr) {
      console.error('Failed to read image dimensions (non-fatal):', dimErr.message);
    }

    // ONE Claude vision call to detect all surfaces
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 2000,
        messages: [{
          role: 'user',
          content: [
            {
              type: 'image',
              source: {
                type: 'base64',
                media_type: 'image/jpeg',
                data: imageBase64,
              },
            },
            { type: 'text', text: DETECTION_PROMPT },
          ],
        }],
      }),
    });

    if (!res.ok) {
      const errText = await res.text();
      console.error('Detection API error:', res.status, errText);
      return NextResponse.json({ error: 'Detection failed' }, { status: 500 });
    }

    const data = await res.json();
    const content = data.content?.[0]?.text;

    if (!content) {
      return NextResponse.json({ error: 'No detection result' }, { status: 500 });
    }

    // Parse the JSON response
    let result;
    try {
      result = JSON.parse(content);
    } catch (e) {
      // Try to extract JSON from markdown code block
      const match = content.match(/\{[\s\S]*\}/);
      if (match) {
        try {
          result = JSON.parse(match[0]);
        } catch (e2) {
          console.error('Failed to parse extracted JSON:', match[0]);
          return NextResponse.json({ error: 'Invalid detection response' }, { status: 500 });
        }
      } else {
        console.error('Failed to parse detection result:', content);
        return NextResponse.json({ error: 'Invalid detection response' }, { status: 500 });
      }
    }

    // Validate and normalize surfaces
    const validCategories = new Set([
      'siding', 'trim', 'soffit', 'fascia', 'gutters', 'windows', 'doors',
      'roofing', 'foundation', 'railing', 'columns', 'shutters', 'paint', 'accent',
    ]);
    const surfaces = (Array.isArray(result.surfaces) ? result.surfaces : [])
      .filter(s => s && typeof s === 'object' && typeof s.x === 'number' && typeof s.y === 'number')
      .slice(0, 50) // Cap at 50 surfaces to prevent UI overload from AI hallucination
      .map((s, i) => ({
        id: `surface-${i}`,
        category: validCategories.has(s.category) ? s.category : 'accent',
        label: typeof s.label === 'string' ? s.label.slice(0, 100) : `Surface ${i + 1}`,
        x: Math.max(0, Math.min(100, Number(s.x) || 50)),
        y: Math.max(0, Math.min(100, Number(s.y) || 50)),
      }));

    // Group by category for summary
    const categories = {};
    surfaces.forEach(s => {
      if (!categories[s.category]) categories[s.category] = 0;
      categories[s.category]++;
    });

    // ─── Step 2: Generate SAM 2 masks for each unique category ──
    // Group surfaces by category → pick one representative point per category
    // This keeps SAM calls minimal (one per category, not one per surface)
    let surfacesWithMasks = surfaces;

    if (withMasks && process.env.REPLICATE_API_TOKEN) {
      try {
        // Get one representative point per category
        const categoryPoints = {};
        for (const s of surfaces) {
          if (!categoryPoints[s.category]) {
            categoryPoints[s.category] = s;
          }
        }

        // Run SAM 2 for each category in parallel (max 6 concurrent)
        const categoryEntries = Object.entries(categoryPoints);
        const maskResults = await Promise.allSettled(
          categoryEntries.map(([category, surface]) =>
            generateSAM2Mask(imageBase64, surface, imageWidth, imageHeight)
          )
        );

        // Map masks back to categories
        const categoryMasks = {};
        maskResults.forEach((result, i) => {
          if (result.status === 'fulfilled' && result.value) {
            categoryMasks[categoryEntries[i][0]] = result.value;
          }
        });

        // Attach mask to each surface based on its category
        surfacesWithMasks = surfaces.map(s => ({
          ...s,
          maskBase64: categoryMasks[s.category] || null,
        }));

        console.log(`SAM 2 masks generated: ${Object.keys(categoryMasks).length}/${categoryEntries.length} categories`);
      } catch (samErr) {
        // SAM 2 failure is non-fatal — surfaces still work without masks
        console.error('SAM 2 mask generation failed (non-fatal):', samErr.message);
        surfacesWithMasks = surfaces.map(s => ({ ...s, maskBase64: null }));
      }
    }

    const elapsed = Date.now() - start;

    return NextResponse.json({
      surfaces: surfacesWithMasks,
      categories,
      detectionTimeMs: elapsed,
      surfaceCount: surfacesWithMasks.length,
      masksGenerated: surfacesWithMasks.filter(s => s.maskBase64).length,
      imageWidth,
      imageHeight,
    });

  } catch (err) {
    console.error('Detection error:', err?.message, err?.stack?.split('\n').slice(0, 3).join(' | '));
    return NextResponse.json({ error: 'Detection failed' }, { status: 500 });
  }
}

// ─── SAM 2 mask generation via Replicate ──────────────────────
const REPLICATE_API_URL = 'https://api.replicate.com/v1/predictions';

async function generateSAM2Mask(imageBase64, surface, imageWidth, imageHeight) {
  const apiKey = process.env.REPLICATE_API_TOKEN;
  if (!apiKey) return null;

  // Convert percentage coordinates to pixel coordinates
  const pixelX = Math.round((surface.x / 100) * imageWidth);
  const pixelY = Math.round((surface.y / 100) * imageHeight);

  const createRes = await fetch(REPLICATE_API_URL, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      version: 'fe97b453a6455861e3bac769b441ca1f1086110da7466dbb65cf1eecfd60dc83',
      input: {
        image: `data:image/jpeg;base64,${imageBase64}`,
        point_coords: [[pixelX, pixelY]],
        point_labels: [1], // 1 = foreground
        multimask_output: false,
      },
    }),
  });

  if (!createRes.ok) {
    const errText = await createRes.text();
    console.error(`SAM 2 create failed for ${surface.category}:`, createRes.status, errText);
    return null;
  }

  const prediction = await createRes.json();
  const result = await pollSAM2(prediction.urls.get, apiKey);

  // Download mask image and convert to base64
  if (!result) return null;

  // Prefer individual_masks (one per point click) over combined_mask (all points merged)
  const maskUrl = typeof result === 'string' ? result
    : Array.isArray(result) ? result[0]
    : result?.individual_masks?.[0] || result?.combined_mask || result?.mask || result?.masks?.[0] || null;

  if (!maskUrl || typeof maskUrl !== 'string') {
    console.error(`SAM 2 unexpected output for ${surface.category}:`, JSON.stringify(result).slice(0, 200));
    return null;
  }

  const maskRes = await fetch(maskUrl);
  if (!maskRes.ok) return null;

  const maskBuf = Buffer.from(await maskRes.arrayBuffer());

  // Convert to binary mask (pure white/black, no partial transparency)
  // SAM 2 combined_mask can be a colored overlay — threshold it
  const { data: rawPixels, info } = await sharp(maskBuf)
    .grayscale()
    .resize(imageWidth, imageHeight, { fit: 'fill' })
    .raw()
    .toBuffer({ resolveWithObject: true });

  // Threshold: any pixel > 10 becomes 255 (white = edit), rest 0 (black = keep)
  const binary = Buffer.alloc(rawPixels.length);
  for (let i = 0; i < rawPixels.length; i++) {
    binary[i] = rawPixels[i] > 10 ? 255 : 0;
  }

  const normalizedMask = await sharp(binary, {
    raw: { width: info.width, height: info.height, channels: 1 },
  }).png().toBuffer();

  return normalizedMask.toString('base64');
}

async function pollSAM2(url, apiKey) {
  const maxWait = 45000;
  const interval = 2000;
  const start = Date.now();

  while (Date.now() - start < maxWait) {
    const res = await fetch(url, {
      headers: { 'Authorization': `Bearer ${apiKey}` },
    });
    if (!res.ok) return null;

    const data = await res.json();
    if (data.status === 'succeeded') return data.output;
    if (data.status === 'failed' || data.status === 'canceled') return null;

    await new Promise(r => setTimeout(r, interval));
  }
  return null;
}

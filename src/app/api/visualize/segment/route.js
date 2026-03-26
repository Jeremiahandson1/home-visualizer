// ═══════════════════════════════════════════════════════════════
// POST /api/visualize/segment
// SAM 2 segmentation via Replicate — pixel-perfect masks
//
// Modes:
//   1. Points mode: send point coordinates → get mask for that region
//   2. Auto mode: send multiple points → get mask for each
//
// Input:  { imageBase64, points: [{ x, y, label }], imageWidth, imageHeight }
// Output: { masks: [{ maskBase64, bbox, area, score }] }
//
// Cost: ~$0.01-0.03 per segmentation call via Replicate
// ═══════════════════════════════════════════════════════════════

import { NextResponse } from 'next/server';

export const maxDuration = 60;

const REPLICATE_API_URL = 'https://api.replicate.com/v1/predictions';

/**
 * Call SAM 2 on Replicate for point-based segmentation
 */
async function runSAM2(imageBase64, points, imageWidth, imageHeight) {
  const apiKey = process.env.REPLICATE_API_TOKEN;
  if (!apiKey) throw new Error('REPLICATE_API_TOKEN not configured');

  // Format points for SAM 2
  // points: [[x, y], ...] in pixel coordinates
  // labels: [1, ...] where 1 = foreground, 0 = background
  const pointCoords = points.map(p => [
    Math.round((p.x / 100) * (imageWidth || 1024)),
    Math.round((p.y / 100) * (imageHeight || 1024)),
  ]);
  const pointLabels = points.map(p => (p.label === 0 ? 0 : 1));

  // Create prediction using SAM 2
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
        point_coords: pointCoords,
        point_labels: pointLabels,
        multimask_output: false,
      },
    }),
  });

  if (!createRes.ok) {
    const errText = await createRes.text();
    console.error('Replicate create error:', createRes.status, errText);
    throw new Error(`Replicate API error: ${createRes.status}`);
  }

  const prediction = await createRes.json();

  // Poll for completion
  const result = await pollPrediction(prediction.urls.get, apiKey);
  return result;
}

/**
 * Poll Replicate prediction until complete (max 60s)
 */
async function pollPrediction(url, apiKey) {
  const maxWait = 60000;
  const interval = 2000;
  const start = Date.now();

  while (Date.now() - start < maxWait) {
    const res = await fetch(url, {
      headers: { 'Authorization': `Bearer ${apiKey}` },
    });

    if (!res.ok) throw new Error(`Poll failed: ${res.status}`);

    const data = await res.json();

    if (data.status === 'succeeded') {
      return data.output;
    }
    if (data.status === 'failed' || data.status === 'canceled') {
      throw new Error(`Prediction ${data.status}: ${data.error || 'unknown error'}`);
    }

    // Wait before polling again
    await new Promise(r => setTimeout(r, interval));
  }

  throw new Error('SAM 2 prediction timed out');
}

/**
 * Download mask image from Replicate URL and convert to base64
 */
async function fetchMaskAsBase64(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to fetch mask: ${res.status}`);
  const buf = Buffer.from(await res.arrayBuffer());
  return buf.toString('base64');
}

export async function POST(req) {
  try {
    const body = await req.json();
    const { imageBase64, points, imageWidth, imageHeight } = body;

    if (!imageBase64) {
      return NextResponse.json({ error: 'Missing imageBase64' }, { status: 400 });
    }
    if (!Array.isArray(points) || points.length === 0) {
      return NextResponse.json({ error: 'Missing points array' }, { status: 400 });
    }

    // Validate points
    for (const p of points) {
      if (typeof p.x !== 'number' || typeof p.y !== 'number') {
        return NextResponse.json({ error: 'Each point needs x and y (0-100)' }, { status: 400 });
      }
    }

    const start = Date.now();

    const output = await runSAM2(imageBase64, points, imageWidth, imageHeight);

    // SAM 2 on Replicate returns mask image URL(s)
    // Convert to base64 for our pipeline
    let masks = [];

    if (typeof output === 'string') {
      // Single mask URL
      const maskBase64 = await fetchMaskAsBase64(output);
      masks.push({ maskBase64, score: 1.0 });
    } else if (Array.isArray(output)) {
      // Multiple masks
      for (const item of output) {
        const url = typeof item === 'string' ? item : item?.url;
        if (url) {
          const maskBase64 = await fetchMaskAsBase64(url);
          masks.push({ maskBase64, score: item?.score || 1.0 });
        }
      }
    } else if (output && typeof output === 'object') {
      // SAM 2 returns { combined_mask, individual_masks } format
      if (output.combined_mask) {
        const maskBase64 = await fetchMaskAsBase64(output.combined_mask);
        masks.push({ maskBase64, score: 1.0 });
      } else if (output.individual_masks && Array.isArray(output.individual_masks)) {
        for (const url of output.individual_masks) {
          const maskBase64 = await fetchMaskAsBase64(url);
          masks.push({ maskBase64, score: 1.0 });
        }
      } else if (output.mask) {
        const maskBase64 = await fetchMaskAsBase64(output.mask);
        masks.push({ maskBase64, score: 1.0 });
      } else if (output.masks && Array.isArray(output.masks)) {
        for (const url of output.masks) {
          const maskBase64 = await fetchMaskAsBase64(url);
          masks.push({ maskBase64, score: 1.0 });
        }
      }
    }

    if (masks.length === 0) {
      console.error('SAM 2 output format unexpected:', JSON.stringify(output).slice(0, 500));
      return NextResponse.json({ error: 'No masks returned from SAM 2' }, { status: 500 });
    }

    return NextResponse.json({
      masks,
      segmentTimeMs: Date.now() - start,
      pointCount: points.length,
    });

  } catch (err) {
    console.error('Segment error:', err);
    return NextResponse.json({ error: err.message || 'Segmentation failed' }, { status: 500 });
  }
}

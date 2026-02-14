// ═══════════════════════════════════════════════════════════════
// POST /api/segment
// User clicks a point on their photo → returns mask + zone label
// Flow: click coords → Replicate SAM 2 → GPT-4o-mini zone ID → mask + category
// Cost: ~$0.014 per click ($0.009 SAM + $0.005 zone ID)
// ═══════════════════════════════════════════════════════════════

import { NextResponse } from 'next/server';
import { segmentByPoint, identifyZone, ZONE_TO_CATEGORY } from '@/lib/sam';

export async function POST(req) {
  try {
    const { imageBase64, x, y, imageWidth, imageHeight, remodelType, tenantSlug } = await req.json();

    if (!imageBase64 || x === undefined || y === undefined) {
      return NextResponse.json({ error: 'Missing imageBase64, x, or y' }, { status: 400 });
    }

    const start = Date.now();

    // Step 1: Get mask from Replicate SAM 2
    // Returns { maskUrl, maskBase64 } — already a PNG
    let maskBase64;

    try {
      const segResult = await segmentByPoint(imageBase64, Math.round(x), Math.round(y));
      maskBase64 = segResult.maskBase64;
    } catch (samErr) {
      console.error('SAM segmentation error:', samErr.message);
      return NextResponse.json({
        error: 'Could not segment that area. Try clicking on a more distinct surface.',
      }, { status: 422 });
    }

    if (!maskBase64) {
      return NextResponse.json({ error: 'No mask returned' }, { status: 422 });
    }

    // Step 2: Identify what zone was clicked (GPT-4o-mini vision)
    let zone = 'unknown';
    let category = 'exterior';

    try {
      zone = await identifyZone(
        imageBase64,
        Math.round(x),
        Math.round(y),
        imageWidth || 1024,
        imageHeight || 1024,
        remodelType || 'exterior'
      );
      category = ZONE_TO_CATEGORY[zone] || 'exterior';
    } catch (zoneErr) {
      console.error('Zone identification error:', zoneErr.message);
      // Non-fatal — user can still pick a product manually
    }

    const elapsed = Date.now() - start;

    return NextResponse.json({
      maskBase64,
      zone,
      category,
      timeMs: elapsed,
    });

  } catch (err) {
    console.error('Segment API error:', err);
    return NextResponse.json({ error: err.message || 'Segmentation failed' }, { status: 500 });
  }
}

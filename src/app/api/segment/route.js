// ═══════════════════════════════════════════════════════════════
// POST /api/segment
// User clicks a point on their photo → returns mask + zone label
//
// Flow: click coords → Replicate SAM 2 → mask geometry analysis → zone
// Cost: ~$0.009 per click (SAM only — zone ID is now free)
// ═══════════════════════════════════════════════════════════════

import { NextResponse } from 'next/server';
import { segmentByPoint, identifyZoneFromMask, ZONE_TO_CATEGORY } from '@/lib/sam';

export async function POST(req) {
  try {
    const { imageBase64, x, y, imageWidth, imageHeight, remodelType, tenantSlug } = await req.json();

    if (!imageBase64 || x === undefined || y === undefined) {
      return NextResponse.json({ error: 'Missing imageBase64, x, or y' }, { status: 400 });
    }

    const start = Date.now();

    // Step 1: Get mask from Replicate SAM 2
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

    // Step 2: Identify zone from mask geometry (FREE — no API call)
    let zone = 'siding';
    let category = 'siding';

    try {
      zone = await identifyZoneFromMask(
        maskBase64,
        Math.round(x),
        Math.round(y),
        imageWidth || 1024,
        imageHeight || 1024,
        remodelType || 'exterior'
      );
      category = ZONE_TO_CATEGORY[zone] || 'exterior';
    } catch (zoneErr) {
      console.error('Zone classification error:', zoneErr.message);
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

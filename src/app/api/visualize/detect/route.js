// ═══════════════════════════════════════════════════════════════
// POST /api/visualize/detect
// ONE GPT-4o vision call → identifies ALL exterior surfaces
// Returns: array of surfaces with category, label, and position
//
// Cost: ~$0.01-0.03 per detection (vision token cost)
// ═══════════════════════════════════════════════════════════════

import { NextResponse } from 'next/server';

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

export async function POST(req) {
  try {
    const { imageBase64 } = await req.json();

    if (!imageBase64) {
      return NextResponse.json({ error: 'Missing imageBase64' }, { status: 400 });
    }

    const start = Date.now();

    // ONE GPT-4o vision call to detect all surfaces
    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        temperature: 0,
        max_tokens: 2000,
        response_format: { type: 'json_object' },
        messages: [{
          role: 'user',
          content: [
            {
              type: 'image_url',
              image_url: {
                url: `data:image/jpeg;base64,${imageBase64}`,
                detail: 'high',
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
    const content = data.choices?.[0]?.message?.content;

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

    const elapsed = Date.now() - start;

    return NextResponse.json({
      surfaces,
      categories,
      detectionTimeMs: elapsed,
      surfaceCount: surfaces.length,
    });

  } catch (err) {
    console.error('Detection error:', err);
    return NextResponse.json({ error: err.message || 'Detection failed' }, { status: 500 });
  }
}

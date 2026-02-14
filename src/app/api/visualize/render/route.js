// ═══════════════════════════════════════════════════════════════
// POST /api/visualize/render
// Hover-style rendering: prompt-based material swaps
// No SAM masks needed — GPT-image understands "change the trim"
//
// Cost: ~$0.02-0.08 per render depending on quality
// ═══════════════════════════════════════════════════════════════

import { NextResponse } from 'next/server';

const STRUCTURE_ANCHOR = `CRITICAL: This is a REAL photograph of a house. You are EDITING it, not creating a new image.
Keep the EXACT same house structure, camera angle, perspective, lighting, sky, landscaping, and proportions.
ONLY change the specific materials/colors described below. Everything else must remain pixel-identical.
Maintain the exact same architectural style, roof shape, window positions, and overall composition.`;

export async function POST(req) {
  try {
    const {
      imageBase64,    // Original photo
      changes,        // Array of { category, materialName, materialBrand, materialColor }
      tenantSlug,
    } = await req.json();

    if (!imageBase64) {
      return NextResponse.json({ error: 'Missing imageBase64' }, { status: 400 });
    }
    if (!changes?.length) {
      return NextResponse.json({ error: 'No changes specified' }, { status: 400 });
    }

    const start = Date.now();

    // Build the prompt describing all material changes
    const prompt = buildRenderPrompt(changes);

    // Use OpenAI Responses API with image generation tool
    // This is smarter than the edits endpoint — it understands architectural elements
    const res = await fetch('https://api.openai.com/v1/responses', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        input: [{
          role: 'user',
          content: [
            {
              type: 'input_image',
              image_url: `data:image/jpeg;base64,${imageBase64}`,
            },
            {
              type: 'input_text',
              text: prompt,
            },
          ],
        }],
        tools: [{
          type: 'image_generation',
          quality: 'high',
          size: '1024x1024',
        }],
      }),
    });

    if (!res.ok) {
      const errText = await res.text();
      console.error('Render API error:', res.status, errText);
      return NextResponse.json({ error: 'Render failed' }, { status: 500 });
    }

    const data = await res.json();

    // Extract the generated image from the response
    let generatedBase64 = null;

    // The Responses API nests the image in output array
    if (data.output) {
      for (const block of data.output) {
        if (block.type === 'image_generation_call' && block.result) {
          generatedBase64 = block.result;
          break;
        }
        // Also check for nested content blocks
        if (block.content) {
          for (const item of block.content) {
            if (item.type === 'image' && item.image_url?.url) {
              // Extract base64 from data URL if present
              const match = item.image_url.url.match(/base64,(.+)/);
              if (match) generatedBase64 = match[1];
            }
          }
        }
      }
    }

    if (!generatedBase64) {
      console.error('No image in response:', JSON.stringify(data).slice(0, 500));
      return NextResponse.json({ error: 'No image generated' }, { status: 500 });
    }

    const elapsed = Date.now() - start;

    return NextResponse.json({
      generatedBase64,
      generationTimeMs: elapsed,
      changesApplied: changes.length,
      provider: 'openai-responses',
    });

  } catch (err) {
    console.error('Render error:', err);
    return NextResponse.json({ error: err.message || 'Render failed' }, { status: 500 });
  }
}

// ─── Build prompt describing all material changes ────────────
function buildRenderPrompt(changes) {
  const lines = changes.map((c, i) => {
    const product = [c.materialBrand, c.materialName].filter(Boolean).join(' ');
    const color = c.materialColor ? ` in ${c.materialColor} color` : '';
    const cat = (c.category || 'surface').replace(/-/g, ' ');
    return `${i + 1}. Change ALL ${cat} to ${product}${color}`;
  });

  return `${STRUCTURE_ANCHOR}

Make these material changes to the house exterior:
${lines.join('\n')}

IMPORTANT:
- Apply each change to ALL instances of that element (e.g., ALL trim pieces, ALL windows)
- Match the material texture and appearance realistically
- Maintain proper shadows and lighting on the new materials
- Keep the exact same house shape, landscaping, sky, and camera angle
- Do NOT change any elements not listed above`;
}

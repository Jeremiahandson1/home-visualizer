// ═══════════════════════════════════════════════════════════════
// POST /api/visualize/render
// Hover-style rendering: prompt-based material swaps
// No SAM masks needed — GPT-image understands "change the trim"
//
// Cost: ~$0.02-0.08 per render depending on quality
// ═══════════════════════════════════════════════════════════════

import { NextResponse } from 'next/server';

export const maxDuration = 60; // 60s timeout — medium quality renders take ~35-45s

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
      quality = 'medium',  // 'high' ~90s | 'medium' ~35-45s | 'low' ~15-20s
    } = await req.json();

    if (!imageBase64) {
      return NextResponse.json({ error: 'Missing imageBase64' }, { status: 400 });
    }
    if (!changes?.length) {
      return NextResponse.json({ error: 'No changes specified' }, { status: 400 });
    }

    const start = Date.now();

    // Detect input image dimensions to pick matching output size
    const outputSize = getOutputSize(imageBase64);

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
          quality,  // passed from client, default 'medium'
          size: outputSize,
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
      outputSize,
    });

  } catch (err) {
    console.error('Render error:', err);
    return NextResponse.json({ error: err.message || 'Render failed' }, { status: 500 });
  }
}

// ─── Detect input aspect ratio → pick closest API size ───────
// Supported: 1024x1024 (square), 1536x1024 (landscape), 1024x1536 (portrait)
function getOutputSize(base64) {
  try {
    const buf = Buffer.from(base64, 'base64');
    const dims = getJpegDimensions(buf) || getPngDimensions(buf);

    if (!dims) return '1536x1024'; // Default landscape for house photos

    const ratio = dims.width / dims.height;

    if (ratio > 1.2) return '1536x1024';      // Landscape
    if (ratio < 0.83) return '1024x1536';      // Portrait
    return '1024x1024';                         // Square-ish
  } catch {
    return '1536x1024'; // Default landscape
  }
}

function getJpegDimensions(buf) {
  if (buf[0] !== 0xFF || buf[1] !== 0xD8) return null; // Not JPEG
  let offset = 2;
  while (offset < buf.length - 1) {
    if (buf[offset] !== 0xFF) break;
    const marker = buf[offset + 1];
    // SOF markers (Start of Frame) contain dimensions
    if ((marker >= 0xC0 && marker <= 0xC3) || (marker >= 0xC5 && marker <= 0xC7) ||
        (marker >= 0xC9 && marker <= 0xCB) || (marker >= 0xCD && marker <= 0xCF)) {
      const height = buf.readUInt16BE(offset + 5);
      const width = buf.readUInt16BE(offset + 7);
      return { width, height };
    }
    const len = buf.readUInt16BE(offset + 2);
    offset += 2 + len;
  }
  return null;
}

function getPngDimensions(buf) {
  if (buf[0] !== 0x89 || buf[1] !== 0x50) return null; // Not PNG
  return {
    width: buf.readUInt32BE(16),
    height: buf.readUInt32BE(20),
  };
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

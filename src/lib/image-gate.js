// ═══════════════════════════════════════════════════════
// IMAGE QUALITY GATE
// Cheap check before expensive generation:
// 1. Client-side heuristics (aspect ratio, size)
// 2. AI vision check (~$0.002) to confirm it's a house exterior
// Falls back to "allow" if vision check fails/unavailable
// ═══════════════════════════════════════════════════════

const VISION_URL = 'https://api.openai.com/v1/chat/completions';
const VISION_MODEL = 'gpt-4o-mini'; // Cheapest vision model ~$0.002/check

/**
 * Server-side image validation before generation.
 * @param {string} imageBase64
 * @param {object} opts - { allowInterior: true } to accept interior photos
 * Returns { ok: true } or { ok: false, reason: string }
 */
export async function validateHomePhoto(imageBase64, opts = {}) {
  const { allowInterior = false } = opts;

  // 1. Basic heuristics (free)
  const heuristic = runHeuristics(imageBase64);
  if (!heuristic.ok) return heuristic;

  // 2. AI vision check (cheap — ~$0.002)
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return { ok: true, confidence: 'skipped', reason: 'no_api_key' };
  }

  try {
    const result = await checkWithVision(apiKey, imageBase64, allowInterior);
    return result;
  } catch (err) {
    console.error('[GATE] Vision check failed, allowing through:', err.message);
    return { ok: true, confidence: 'fallback', reason: err.message };
  }
}

/**
 * Free heuristics — catches obvious bad uploads before hitting the API.
 */
function runHeuristics(base64) {
  const bytes = (base64.length * 3) / 4;

  // Too small to be a useful photo
  if (bytes < 10000) {
    return { ok: false, reason: 'This image is too small. Please upload a higher resolution photo of your home.' };
  }

  // Check for common non-photo signatures
  try {
    const header = Buffer.from(base64.slice(0, 32), 'base64');
    const isJPEG = header[0] === 0xFF && header[1] === 0xD8;
    const isPNG = header[0] === 0x89 && header[1] === 0x50;
    const isWebP = header.length >= 12 && header[8] === 0x57 && header[9] === 0x45;

    if (!isJPEG && !isPNG && !isWebP) {
      return { ok: false, reason: 'Please upload a JPG, PNG, or WebP photo.' };
    }
  } catch (e) {
    // Can't parse header, let it through
  }

  return { ok: true };
}

/**
 * Cheap GPT-4o-mini vision call to classify the image.
 * Costs ~$0.002 vs $0.05-0.08 for generation.
 * Returns structured assessment.
 */
async function checkWithVision(apiKey, imageBase64, allowInterior = false) {
  const interiorRule = allowInterior
    ? `- Interior photos of kitchens, bathrooms, or rooms = is_home: true (interior renovations are allowed)
- Interior photos of closets, hallways, bedrooms, living rooms = is_home: true`
    : `- Interior photos = is_home: false, suggest they upload an exterior`;

  const response = await fetch(VISION_URL, {
    method: 'POST',
    headers: {
      'Authorization': 'Bearer ' + apiKey,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: VISION_MODEL,
      max_tokens: 100,
      messages: [
        {
          role: 'system',
          content: 'You analyze images for a home visualization tool. Respond ONLY with valid JSON, no other text.',
        },
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: `Is this a photo of a home space that could be used for a renovation visualization? Respond with JSON only:
{"is_home": true/false, "reason": "brief explanation", "type": "exterior|interior|not_a_building|screenshot|other"}

Rules:
- Exterior photos of houses, apartments, townhomes, condos = is_home: true
${interiorRule}
- Photos of pets, food, people, documents, screenshots = is_home: false
- Blurry but recognizable as a building or room = is_home: true
- Close-up of a wall/surface section = is_home: true (they want to visualize that surface)`,
            },
            {
              type: 'image_url',
              image_url: {
                url: 'data:image/jpeg;base64,' + imageBase64,
                detail: 'low', // Low detail = cheapest, enough for classification
              },
            },
          ],
        },
      ],
    }),
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error('Vision API error: ' + response.status + ' ' + errText);
  }

  const data = await response.json();
  const text = data.choices?.[0]?.message?.content || '';

  // Parse JSON from response
  try {
    // Handle markdown code blocks
    const cleaned = text.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();
    const result = JSON.parse(cleaned);

    if (result.is_home === true) {
      return { ok: true, confidence: 'verified', type: result.type };
    }

    // Provide helpful error message based on type
    const messages = {
      interior: "This looks like an interior photo. For best results, please upload an exterior photo of your home taken from the street or yard.",
      not_a_building: "We couldn't detect a building in this photo. Please upload a photo of your home's exterior.",
      screenshot: "This looks like a screenshot. Please upload an actual photo of your home.",
      other: "This doesn't appear to be a photo of a home. Please upload an exterior photo of your house.",
    };

    return {
      ok: false,
      reason: messages[result.type] || messages.other,
      type: result.type,
      aiReason: result.reason,
    };
  } catch (parseErr) {
    // Couldn't parse AI response — fail open
    console.error('[GATE] Could not parse vision response:', text);
    return { ok: true, confidence: 'parse_error' };
  }
}

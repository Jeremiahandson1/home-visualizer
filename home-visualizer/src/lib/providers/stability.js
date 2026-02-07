// ═══════════════════════════════════════════════════════
// STABILITY AI PROVIDER — Legacy Fallback
// Cheapest option (~$0.03-0.05), lowest quality
// Uses SDXL img2img — pattern matching, not language understanding
// ═══════════════════════════════════════════════════════

import sharp from 'sharp';
import { buildPrompt } from '../ai';

const API_URL = 'https://api.stability.ai/v1/generation/stable-diffusion-xl-1024-v1-0/image-to-image';

const COST_CENTS = 5;

async function preprocessImage(imageBuffer) {
  return await sharp(imageBuffer)
    .resize(1024, 1024, {
      fit: 'contain',
      background: { r: 255, g: 255, b: 255 },
    })
    .jpeg({ quality: 92 })
    .toBuffer();
}

/**
 * Generate visualization using Stability AI SDXL.
 *
 * This is the dumbest of the three providers — it doesn't understand
 * language, it just diffuses patterns. But it's cheap and reliable.
 *
 * image_strength controls how much the original is preserved:
 * - 0.0 = identical to original (no changes)
 * - 0.35-0.40 = sweet spot for material swaps
 * - 1.0 = completely ignore original
 */
export async function generateWithStability({ imageBuffer, project, material, overridePrompt }) {
  const { instruction, style, negative } = buildPrompt(project, material, overridePrompt);

  const processedImage = await preprocessImage(imageBuffer);

  // Stability needs a more descriptive prompt since it doesn't "understand"
  const prompt = `${style}, ${instruction}`;

  const formData = new FormData();
  formData.append('init_image', new Blob([processedImage], { type: 'image/jpeg' }), 'home.jpg');
  formData.append('text_prompts[0][text]', prompt);
  formData.append('text_prompts[0][weight]', '1');
  formData.append('text_prompts[1][text]', negative);
  formData.append('text_prompts[1][weight]', '-1');
  formData.append('cfg_scale', '7');
  formData.append('image_strength', '0.38');
  formData.append('samples', '1');
  formData.append('steps', '35');
  formData.append('style_preset', 'photographic');

  const response = await fetch(API_URL, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.STABILITY_API_KEY}`,
      'Accept': 'application/json',
    },
    body: formData,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(`Stability AI error ${response.status}: ${error.message || 'Unknown error'}`);
  }

  const result = await response.json();

  if (!result.artifacts?.[0]?.base64) {
    throw new Error('No image returned from Stability AI');
  }

  return {
    imageBase64: result.artifacts[0].base64,
    prompt,
    model: 'stable-diffusion-xl-1024-v1-0',
    costCents: COST_CENTS,
  };
}

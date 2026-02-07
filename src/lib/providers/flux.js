// ═══════════════════════════════════════════════════════
// FLUX KONTEXT MAX PROVIDER — Fallback
// Black Forest Labs API
// Best at surgical edits (change siding, keep everything else)
// ═══════════════════════════════════════════════════════

import sharp from 'sharp';
import { buildPrompt } from '../ai';

const API_URL = 'https://api.bfl.ml/v1/flux-kontext-max';
const RESULT_URL = 'https://api.bfl.ml/v1/get_result';

// Cost: ~$0.04-0.08 per generation
const COST_CENTS = 6;

async function preprocessImage(imageBuffer) {
  const processed = await sharp(imageBuffer)
    .resize(1024, 1024, {
      fit: 'contain',
      background: { r: 255, g: 255, b: 255 },
    })
    .jpeg({ quality: 92 })
    .toBuffer();

  return processed.toString('base64');
}

/**
 * Generate visualization using Flux Kontext Max.
 *
 * Flux Kontext works differently from OpenAI:
 * - It's an image-to-image model focused on precise, context-aware edits
 * - You provide an input image + text instruction
 * - It surgically modifies only what you ask while preserving everything else
 * - Especially strong at maintaining structural integrity
 *
 * The API is async — you submit a request, get a task ID, then poll for results.
 */
export async function generateWithFlux({ imageBuffer, project, material, overridePrompt }) {
  const { instruction } = buildPrompt(project, material, overridePrompt);
  const imageBase64 = await preprocessImage(imageBuffer);

  // Flux Kontext prompt format: direct instruction works best
  const prompt = [
    instruction,
    'Maintain photorealistic quality. This should look like a real photograph.',
    'Do not change the house structure, landscaping, sky, or anything not mentioned.',
  ].join(' ');

  // Step 1: Submit generation request
  const submitResponse = await fetch(API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Key': process.env.BFL_API_KEY,
    },
    body: JSON.stringify({
      prompt,
      input_image: imageBase64,
      aspect_ratio: '16:9',
      safety_tolerance: 6,
      output_format: 'jpeg',
    }),
  });

  if (!submitResponse.ok) {
    const error = await submitResponse.json().catch(() => ({}));
    throw new Error(`Flux submit error ${submitResponse.status}: ${error.detail || JSON.stringify(error)}`);
  }

  const { id: taskId } = await submitResponse.json();

  if (!taskId) {
    throw new Error('No task ID returned from Flux');
  }

  // Step 2: Poll for result (Flux is async)
  const maxWait = 60000; // 60 seconds max
  const pollInterval = 2000; // Check every 2 seconds
  const startTime = Date.now();

  while (Date.now() - startTime < maxWait) {
    const resultResponse = await fetch(`${RESULT_URL}?id=${taskId}`, {
      headers: { 'X-Key': process.env.BFL_API_KEY },
    });

    if (!resultResponse.ok) {
      throw new Error(`Flux poll error ${resultResponse.status}`);
    }

    const result = await resultResponse.json();

    if (result.status === 'Ready') {
      // Flux returns a URL to the generated image — we need to download it
      if (!result.result?.sample) {
        throw new Error('Flux returned Ready but no image URL');
      }

      const imageResponse = await fetch(result.result.sample);
      const imageArrayBuffer = await imageResponse.arrayBuffer();
      const base64 = Buffer.from(imageArrayBuffer).toString('base64');

      return {
        imageBase64: base64,
        prompt,
        model: 'flux-kontext-max',
        costCents: COST_CENTS,
      };
    }

    if (result.status === 'Error') {
      throw new Error(`Flux generation failed: ${result.error || 'Unknown error'}`);
    }

    // Still processing — wait and retry
    await new Promise(resolve => setTimeout(resolve, pollInterval));
  }

  throw new Error('Flux generation timed out after 60 seconds');
}

// ═══════════════════════════════════════════════════════════════
// OPENAI PROVIDER — Primary
// Uses Images Edit API for generation, Responses API for refinement
// ═══════════════════════════════════════════════════════════════

import sharp from 'sharp';
import { buildPrompt, buildRefinementPrompt } from '../ai';

const EDIT_URL = 'https://api.openai.com/v1/images/edits';
const RESPONSES_URL = 'https://api.openai.com/v1/responses';
const COST = { low: 2, medium: 5, high: 10, refine: 12 };

async function preprocessImage(imageBuffer) {
  return await sharp(imageBuffer)
    .resize(1536, 1024, { fit: 'inside', withoutEnlargement: true })
    .png()
    .toBuffer();
}

/**
 * Standard generation via Images Edit endpoint.
 */
export async function generateWithOpenAI({ imageBuffer, project, material, overridePrompt }) {
  const { instruction } = buildPrompt(project, material, overridePrompt);
  const processedImage = await preprocessImage(imageBuffer);

  const prompt = [
    instruction,
    '',
    'QUALITY DIRECTIVES:',
    '- Output must be indistinguishable from a real photograph.',
    '- Maintain exact structure, proportions, perspective.',
    '- Lighting and shadows consistent with original.',
    '- Show realistic material texture and depth.',
    '- Professional architectural photography quality.',
  ].join('\n');

  const formData = new FormData();
  formData.append('image', new Blob([processedImage], { type: 'image/png' }), 'home.png');
  formData.append('prompt', prompt);
  formData.append('model', 'gpt-image-1');
  formData.append('size', '1536x1024');
  formData.append('response_format', 'b64_json');

  const response = await fetch(EDIT_URL, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${process.env.OPENAI_API_KEY}` },
    body: formData,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(`OpenAI error ${response.status}: ${error.error?.message || JSON.stringify(error)}`);
  }

  const result = await response.json();
  if (!result.data?.[0]?.b64_json) throw new Error('No image returned from OpenAI');

  return {
    imageBase64: result.data[0].b64_json,
    prompt,
    model: 'gpt-image-1',
    costCents: COST.high,
  };
}

/**
 * Refinement via Responses API — multi-turn image editing.
 * Takes a previously generated image and applies an adjustment.
 *
 * @param {Object} opts
 * @param {Buffer} opts.imageBuffer     - The GENERATED image to refine (not original)
 * @param {string} opts.instruction     - Natural language refinement ("make trim darker")
 * @param {Object} opts.context         - { project, materialName, materialBrand }
 * @param {Buffer} [opts.originalImage] - Optional original photo for reference
 */
export async function refineWithOpenAI({ imageBuffer, instruction, context, originalImage }) {
  const processedImage = await preprocessImage(imageBuffer);
  const imageBase64 = processedImage.toString('base64');

  const refinementPrompt = buildRefinementPrompt(instruction, context);

  const inputContent = [
    {
      type: 'input_image',
      image_url: `data:image/png;base64,${imageBase64}`,
    },
    {
      type: 'input_text',
      text: refinementPrompt,
    },
  ];

  // Optionally include original photo for reference
  if (originalImage) {
    const origProcessed = await preprocessImage(originalImage);
    inputContent.unshift({
      type: 'input_image',
      image_url: `data:image/png;base64,${origProcessed.toString('base64')}`,
    });
    inputContent.push({
      type: 'input_text',
      text: 'The first image is the original unmodified photo for reference. The second image is the current visualization to refine.',
    });
  }

  const response = await fetch(RESPONSES_URL, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'gpt-4o',
      input: [{ role: 'user', content: inputContent }],
      tools: [{
        type: 'image_generation',
        quality: 'high',
        size: '1536x1024',
      }],
    }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(`OpenAI Refine error ${response.status}: ${error.error?.message || 'Unknown'}`);
  }

  const result = await response.json();
  const imageOutput = result.output?.find(o => o.type === 'image_generation_call');
  if (!imageOutput?.result) throw new Error('No image generated in refinement');

  return {
    imageBase64: imageOutput.result,
    prompt: refinementPrompt,
    model: 'gpt-4o-image',
    costCents: COST.refine,
  };
}

// ═══════════════════════════════════════════════════════════════
// OPENAI PROVIDER — Uses Responses API with GPT Image 1
// Upgraded: gpt-4o → gpt-image-1 for faster generation
// and better edit precision
// ═══════════════════════════════════════════════════════════════

import sharp from 'sharp';
import { buildPrompt, buildRefinementPrompt } from '../ai';

const RESPONSES_URL = 'https://api.openai.com/v1/responses';
const COST = { generate: 8, refine: 12 };

async function preprocessImage(imageBuffer) {
  return await sharp(imageBuffer)
    .resize(1024, 1024, { fit: 'inside', withoutEnlargement: true })
    .png()
    .toBuffer();
}

/**
 * Standard generation via Responses API with image_generation tool.
 * Uses gpt-image-1 for precise, targeted edits
 * that preserve the original house structure.
 */
export async function generateWithOpenAI({ imageBuffer, project, material, overridePrompt }) {
  const { instruction } = buildPrompt(project, material, overridePrompt);
  const processedImage = await preprocessImage(imageBuffer);
  const imageBase64 = processedImage.toString('base64');

  const prompt = [
    instruction,
    '',
    'QUALITY DIRECTIVES:',
    '- Output must be indistinguishable from a real photograph.',
    '- Maintain exact structure, proportions, perspective.',
    '- Lighting and shadows consistent with original.',
    '- Show realistic material texture and depth.',
    '- Professional architectural photography quality.',
    '- This is the photo of the house to transform. Apply the changes to THIS exact house.',
    '- ONLY change the specified materials — keep everything else identical.',
  ].join('\n');

  const response = await fetch(RESPONSES_URL, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'gpt-4o',
      input: [{
        role: 'user',
        content: [
          {
            type: 'input_image',
            image_url: `data:image/png;base64,${imageBase64}`,
          },
          {
            type: 'input_text',
            text: prompt,
          },
        ],
      }],
      tools: [{
        type: 'image_generation',
        size: '1024x1024',
      }],
    }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(`OpenAI error ${response.status}: ${error.error?.message || JSON.stringify(error)}`);
  }

  const result = await response.json();
  const imageOutput = result.output?.find(o => o.type === 'image_generation_call');
  if (!imageOutput?.result) throw new Error('No image returned from OpenAI');

  return {
    imageBase64: imageOutput.result,
    prompt,
    model: 'gpt-image-1',
    costCents: COST.generate,
  };
}

/**
 * Refinement via Responses API — multi-turn image editing.
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
        size: '1024x1024',
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
    model: 'gpt-image-1',
    costCents: COST.refine,
  };
}

// ═══════════════════════════════════════════════════════════════
// AI IMAGE GENERATION — Provider Abstraction + Prompt Engine
// Enhanced prompt system with architectural knowledge,
// material-specific rendering, iterative refinement, and
// batch generation capabilities
// ═══════════════════════════════════════════════════════════════

import { generateWithOpenAI, refineWithOpenAI } from './providers/openai';
import { generateWithFlux } from './providers/flux';
import { generateWithStability } from './providers/stability';

const PROVIDERS = {
  openai: generateWithOpenAI,
  flux: generateWithFlux,
  stability: generateWithStability,
};

const DEFAULT_PROVIDER = 'openai';

/**
 * Generate a home visualization using the configured AI provider.
 */
export async function generateVisualization(opts) {
  const providerName = opts.provider || process.env.AI_PROVIDER || DEFAULT_PROVIDER;
  const generateFn = PROVIDERS[providerName];
  if (!generateFn) throw new Error(`Unknown AI provider: ${providerName}`);

  const startTime = Date.now();

  // Try primary provider with 1 retry
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      if (attempt > 0) await new Promise(r => setTimeout(r, 1500));
      const result = await generateFn(opts);
      return { ...result, generationTimeMs: Date.now() - startTime, provider: providerName };
    } catch (error) {
      console.error(`[${providerName}] Attempt ${attempt + 1} failed:`, error.message);
      if (attempt === 0 && isRetryable(error)) continue;
      // Fall through to fallback chain
      break;
    }
  }

  // Fallback to other providers
  const fallbackOrder = ['openai', 'flux', 'stability'].filter(p => p !== providerName);
  for (const fallback of fallbackOrder) {
    if (!getFallbackKey(fallback)) continue;
    console.log(`Falling back to ${fallback}...`);
    try {
      const result = await PROVIDERS[fallback](opts);
      return { ...result, generationTimeMs: Date.now() - startTime, provider: fallback };
    } catch (e) { continue; }
  }
  throw new Error('All AI providers failed. Please try again.');
}

function isRetryable(error) {
  const msg = error.message?.toLowerCase() || '';
  return msg.includes('timeout') || msg.includes('rate') || msg.includes('503') || msg.includes('529') || msg.includes('overloaded');
}

/**
 * Refine an existing generation with a text instruction.
 * Uses OpenAI Responses API for multi-turn editing.
 * Includes retry with backoff (refinement has no fallback provider).
 */
export async function refineVisualization(opts) {
  const startTime = Date.now();
  const maxRetries = 2;
  let lastError;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      if (attempt > 0) {
        await new Promise(r => setTimeout(r, 1000 * attempt)); // 1s, 2s backoff
      }
      const result = await refineWithOpenAI(opts);
      return { ...result, generationTimeMs: Date.now() - startTime, provider: 'openai' };
    } catch (error) {
      lastError = error;
      console.error(`Refinement attempt ${attempt + 1} failed:`, error.message);
    }
  }
  throw new Error(lastError?.message || 'Refinement failed after retries. Please try again.');
}

/**
 * Generate from a style preset (Instant Design mode).
 * Uses the full style prompt instead of per-material prompts.
 * Includes fallback chain like generateVisualization.
 */
export async function generateFromStyle(opts) {
  const { imageBuffer, style, provider } = opts;
  const providerName = provider || process.env.AI_PROVIDER || DEFAULT_PROVIDER;

  const styleOpts = {
    imageBuffer,
    project: 'exterior',
    material: {
      brand: 'Mixed',
      name: style.name,
      type: 'Style Package',
      aiHint: '',
    },
    overridePrompt: style.prompt,
  };

  const startTime = Date.now();

  // Try primary provider
  try {
    const generateFn = PROVIDERS[providerName];
    if (!generateFn) throw new Error(`Unknown AI provider: ${providerName}`);
    const result = await generateFn(styleOpts);
    return { ...result, generationTimeMs: Date.now() - startTime, provider: providerName };
  } catch (error) {
    console.error(`[${providerName}] Style generation failed:`, error.message);

    // Fallback chain
    const fallbackOrder = ['openai', 'flux', 'stability'].filter(p => p !== providerName);
    for (const fallback of fallbackOrder) {
      if (!getFallbackKey(fallback)) continue;
      console.log(`Style generation: falling back to ${fallback}...`);
      try {
        const result = await PROVIDERS[fallback](styleOpts);
        return { ...result, generationTimeMs: Date.now() - startTime, provider: fallback };
      } catch (e) { continue; }
    }
    throw new Error('All AI providers failed. Please try again in a moment.');
  }
}

function getFallbackKey(provider) {
  switch (provider) {
    case 'openai': return process.env.OPENAI_API_KEY;
    case 'flux': return process.env.BFL_API_KEY;
    case 'stability': return process.env.STABILITY_API_KEY;
    default: return null;
  }
}

// ─── ENHANCED PROMPT ENGINE ──────────────────────────────

export function buildPrompt(project, material, overridePrompt) {
  if (overridePrompt) {
    return {
      instruction: overridePrompt + PHOTO_RULES,
      style: STYLE_DIRECTIVE,
      negative: NEGATIVE_PROMPT,
    };
  }

  const instruction = PROJECT_PROMPTS[project];
  if (!instruction) throw new Error(`Unknown project type: ${project}`);

  // Build the material-specific prompt
  let materialDesc = `${material.brand} ${material.name}`;
  if (material.type) materialDesc += ` (${material.type})`;

  let prompt = instruction(material, materialDesc);

  // Append AI hint if available (from custom materials or built-in aiHint)
  const hint = material.aiPromptHint || material.aiHint;
  if (hint) {
    prompt += `\nSpecific material rendering: ${hint}`;
  }

  prompt += PHOTO_RULES;

  return { instruction: prompt, style: STYLE_DIRECTIVE, negative: NEGATIVE_PROMPT };
}

/**
 * Build a combined prompt for multiple material selections.
 * @param {Array} selections - [{ category: 'siding', material: {...} }, ...]
 */
export function buildMultiPrompt(selections) {
  if (!selections || selections.length === 0) throw new Error('No selections provided');

  // Single selection — use standard prompt
  if (selections.length === 1) {
    const s = selections[0];
    return buildPrompt(s.category, s.material);
  }

  // Multiple selections — build combined prompt
  const changes = selections.map(s => {
    const mat = s.material;
    const desc = `${mat.brand} ${mat.name}${mat.type ? ` (${mat.type})` : ''}`;
    const promptFn = PROJECT_PROMPTS[s.category];
    if (!promptFn) return `Change ${s.category} to ${desc}.`;
    // Get just the material-specific instruction (first line area)
    const full = promptFn(mat, desc);
    return full;
  });

  const combinedPrompt = [
    'Make the following changes to this house simultaneously:',
    '',
    ...changes.map((c, i) => `CHANGE ${i + 1}:\n${c}`),
    '',
    'Apply ALL changes in a single result.',
    'Every change listed above must be visible in the output.',
    'Only change what is listed. Everything else stays identical.',
  ].join('\n') + PHOTO_RULES;

  return { instruction: combinedPrompt, style: STYLE_DIRECTIVE, negative: NEGATIVE_PROMPT };
}

const STYLE_DIRECTIVE = 'Professional architectural photography, photorealistic, natural daylight, high resolution DSLR, subtle HDR, real estate photography quality';

const NEGATIVE_PROMPT = 'blurry, distorted, cartoon, drawing, sketch, painting, unrealistic, oversaturated, artifacts, text, watermark, low quality, deformed, AI-looking, plastic, CGI render, video game screenshot, illustration';

const PHOTO_RULES = `

CRITICAL PHOTOREALISM RULES:
1. The result MUST be indistinguishable from a real photograph taken by a professional photographer.
2. Preserve the EXACT house structure — same shape, same proportions, same perspective angle, same number of stories.
3. Preserve ALL landscaping, trees, driveway, walkways, sky, neighboring structures, and surroundings EXACTLY as they are.
4. Lighting and shadows must be 100% consistent with the original photo's time of day and weather conditions.
5. New materials must show realistic texture, weathering, and depth appropriate to the material type.
6. Reflections in windows must be consistent with the environment.
7. Only change what was specifically requested. Everything else stays identical.
8. Material transitions and edges must look professionally installed — clean seams, proper flashing, appropriate trim.`;

const PROJECT_PROMPTS = {
  siding: (mat, desc) =>
    `Change the SIDING on this house to ${desc}.
Install the new siding as clean, professionally-installed ${mat.type || 'lap siding'} covering all siding areas.
The siding color should be accurately represented as ${mat.name} (${mat.color || ''}).
Keep the roof, windows, doors, trim, gutters, foundation, and all other elements exactly as they are.
Show proper J-channel at windows, starter strip at bottom, and clean corners.`,

  roofing: (mat, desc) =>
    `Change the ROOF on this house to ${desc}.
The new roofing should show ${mat.type || 'architectural shingles'} in ${mat.name} color, professionally installed.
Show realistic dimensional shingle shadow lines, proper ridge cap, clean hip and valley lines, and proper flashing at penetrations.
Keep the siding, windows, doors, trim, foundation, and all other elements exactly as they are.`,

  paint: (mat, desc) =>
    `Repaint the exterior of this house in ${desc}.
Apply the paint color (${mat.name}) to all painted surfaces — siding, trim areas that are currently painted.
The paint should look freshly applied but realistic — not glossy CGI. Show appropriate sheen for exterior latex paint.
Maintain all architectural details, just change the color. Keep unpainted materials (stone, brick, natural wood) as they are.
Keep roof, windows, doors, landscaping, and surroundings exactly as they are unless they are painted surfaces.`,

  windows: (mat, desc) => {
    const sub = mat.subcategory || 'windows';
    const prompts = {
      windows: `Replace the WINDOWS on this house with ${desc}.
Install ${mat.type || 'double-hung'} style windows with ${mat.name} frames throughout.
${mat.aiHint ? `Visual: ${mat.aiHint}` : ''}
Show proper window installation with appropriate casing, sill, and trim.
Glass should show realistic reflections consistent with the environment.
Keep the exact same window openings/sizes, just update the window units.
Keep siding, roof, doors, and all other elements exactly as they are.`,
      entry_doors: `Replace the FRONT DOOR with ${desc}.
${mat.aiHint ? `Visual: ${mat.aiHint}` : ''}
Show the new door properly fitted in the existing doorway with appropriate hardware, hinges, and weatherstripping.
Include any sidelights or transom if described. Door hardware should complement the style.
Keep windows, siding, roof, and all other elements exactly as they are.
Only change the front entry door.`,
      patio_doors: `Replace the PATIO DOOR / BACK DOOR with ${desc}.
${mat.aiHint ? `Visual: ${mat.aiHint}` : ''}
Show the new patio door system properly installed in the rear or side of the house.
Include appropriate tracks, handles, and weather sealing.
Show the door's relationship to the deck/patio area if visible.
Keep windows, siding, roof, front door, and all other elements exactly as they are.`,
    };
    return prompts[sub] || prompts.windows;
  },

  deck: (mat, desc) =>
    `Add a new ${desc} deck to this house.
The deck should be professionally built with ${mat.type || 'composite'} decking in ${mat.name} color.
Include a proper railing system, stairs if the deck is raised, and appropriate post foundations.
The deck should be proportionally sized for this house — not too large or too small.
Keep the existing house exactly as it is. The deck should complement the architecture.`,

  garage: (mat, desc) =>
    `Replace the garage door(s) on this house with ${desc}.
The new garage door should be ${mat.type || 'steel'} style in ${mat.name} finish.
Show proper installation with appropriate trim, weather sealing, and hardware.
Keep the exact same garage opening size. Keep all other elements exactly as they are.`,

  gutters: (mat, desc) => {
    const sub = mat.subcategory || 'gutters';
    const prompts = {
      trim: `Change the EXTERIOR TRIM on this house to ${desc}.
Replace all corner boards, window casings, door casing, and rake/gable trim with ${mat.name}.
${mat.aiHint ? `Visual: ${mat.aiHint}` : ''}
Show consistent trim profile on all corners, around every window and door frame.
Keep the siding, roof, soffit, fascia, gutters, and all other elements exactly as they are.
ONLY change the trim boards.`,
      soffit: `Change the SOFFIT (underside of eaves) on this house to ${desc}.
Install ${mat.name} soffit panels under all roof eaves and overhangs.
${mat.aiHint ? `Visual: ${mat.aiHint}` : ''}
Show the soffit panels visible under the eave overhangs around the entire house.
Keep the siding, roof, trim, fascia, gutters, and all other elements exactly as they are.
ONLY change the soffit panels.`,
      fascia: `Change the FASCIA BOARDS on this house to ${desc}.
Install ${mat.name} fascia along the entire roofline edge.
${mat.aiHint ? `Visual: ${mat.aiHint}` : ''}
Show the fascia board clearly visible as the finished edge along the roof, behind the gutters.
Keep the siding, roof, trim, soffit, gutters, and all other elements exactly as they are.
ONLY change the fascia boards.`,
      gutters: `Change the GUTTERS AND DOWNSPOUTS on this house to ${desc}.
Install ${mat.type || 'seamless aluminum'} gutters in ${mat.name} along all roof edges with matching downspouts at corners.
${mat.aiHint ? `Visual: ${mat.aiHint}` : ''}
Show proper gutter slope and professional downspout placement.
Keep the roof, siding, trim, soffit, fascia, and all other elements exactly as they are.
ONLY change the gutters and downspouts.`,
    };
    return prompts[sub] || prompts.gutters;
  },

  exterior: (mat, desc) =>
    `Transform this home's entire exterior into a ${mat.name} style.
Apply a cohesive ${mat.name} design language across the ENTIRE exterior:
- Siding material and color appropriate for ${mat.name} style
- Trim, corner boards, and fascia in complementary colors
- Window treatment appropriate for the style
- Entry and door treatment consistent with the style
- Roof material/color if a change is necessary for style cohesion
- All architectural accents and details consistent with ${mat.name}
Keep the same basic house structure and lot.`,

  kitchen: (mat, desc) => {
    const sub = mat.subcategory || 'cabinets';
    const prompts = {
      cabinets: `Change the KITCHEN CABINETS to ${desc}.
Install ${mat.name} cabinets on all cabinet fronts — uppers and lowers.
The cabinet style should be ${mat.type || 'shaker'} with the correct door profile and finish.
${mat.aiHint ? `Visual: ${mat.aiHint}` : ''}
Keep countertops, backsplash, flooring, appliances, fixtures, and layout exactly as they are.
Only change the cabinet doors, drawer fronts, and panels.`,
      countertops: `Change the KITCHEN COUNTERTOPS to ${desc}.
Replace all countertop surfaces with ${mat.name}.
${mat.aiHint ? `Visual: ${mat.aiHint}` : ''}
Show realistic edge profile, proper seams if needed, and consistent material across all counter areas.
Keep cabinets, backsplash, flooring, appliances, and fixtures exactly as they are.`,
      backsplash: `Change the KITCHEN BACKSPLASH to ${desc}.
Install ${mat.name} as the backsplash covering the wall area between countertops and upper cabinets.
${mat.aiHint ? `Visual: ${mat.aiHint}` : ''}
Show realistic tile pattern, grout lines, and proper termination at edges and corners.
Keep cabinets, countertops, flooring, appliances, and fixtures exactly as they are.`,
      hardware: `Change the KITCHEN HARDWARE to ${desc}.
Replace all cabinet pulls, knobs, and handles with ${mat.name} hardware.
${mat.aiHint ? `Visual: ${mat.aiHint}` : ''}
Also update the kitchen faucet to match the ${mat.name} finish.
Keep cabinets, countertops, backsplash, flooring, and appliances exactly as they are.`,
    };
    return prompts[sub] || prompts.cabinets;
  },

  bathroom: (mat, desc) => {
    const sub = mat.subcategory || 'tile';
    const prompts = {
      tile: `Change the BATHROOM WALL TILE to ${desc}.
Install ${mat.name} tile on the bathroom walls and shower walls.
${mat.aiHint ? `Visual: ${mat.aiHint}` : ''}
Show realistic tile pattern, grout lines, and proper installation detail.
Keep vanity, fixtures, floor, mirrors, and lighting exactly as they are.`,
      vanity: `Replace the BATHROOM VANITY with ${desc}.
Install a ${mat.name} vanity in place of the existing one.
${mat.aiHint ? `Visual: ${mat.aiHint}` : ''}
Include appropriate countertop, sink(s), and mirror above.
Keep wall tile, floor tile, shower, and overall layout exactly as they are.`,
      fixtures: `Change the BATHROOM FIXTURES to ${desc}.
Replace faucet(s), showerhead, towel bars, toilet paper holder, and other hardware with ${mat.name} finish.
${mat.aiHint ? `Visual: ${mat.aiHint}` : ''}
Keep the same fixture types and positions — only change the finish/material.
Keep tile, vanity, floor, and layout exactly as they are.`,
      shower: `Update the SHOWER with ${desc}.
${mat.aiHint ? `Visual: ${mat.aiHint}` : ''}
Show professional installation with proper waterproofing details, clean transitions, and appropriate hardware.
Keep wall tile, vanity, floor tile, and other elements exactly as they are.`,
      floor: `Change the BATHROOM FLOOR to ${desc}.
Install ${mat.name} as the bathroom floor tile/material.
${mat.aiHint ? `Visual: ${mat.aiHint}` : ''}
Show realistic pattern, proper grout lines, and clean transitions at walls and thresholds.
Keep wall tile, vanity, shower, fixtures, and other elements exactly as they are.`,
    };
    return prompts[sub] || prompts.tile;
  },

  flooring: (mat, desc) =>
    `Replace the FLOORING with ${desc}.
Install ${mat.type || 'hardwood'} flooring in ${mat.name} throughout the visible floor area.
${mat.aiHint ? `Visual: ${mat.aiHint}` : ''}
Show realistic plank/tile pattern, proper transitions at doorways, and appropriate baseboard molding.
Keep all walls, furniture, fixtures, and other elements exactly as they are.`,

  addition: (mat, desc) =>
    `Show this house with a new ${mat.name} ${mat.type || ''} addition.
The addition should be seamlessly integrated with the existing architecture, matching the current materials and style.
Keep the original house recognizable. Show realistic construction quality — proper roofline integration, matching siding, appropriate window placement.`,
};

// ─── REFINEMENT PROMPT BUILDER ───────────────────────────

export function buildRefinementPrompt(instruction, context) {
  return `You previously generated a home visualization. The homeowner wants this adjustment:

"${instruction}"

Context: The home was visualized with ${context.project} project type, using ${context.materialName} from ${context.materialBrand}.

Make ONLY the requested adjustment. Keep everything else from the previous generation exactly the same.
The result must look like a real photograph.`;
}

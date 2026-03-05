// ═══════════════════════════════════════════════════════
// DEMO MODE — Simulates AI generation when no API keys
// Applies a visual transformation to show the flow works
// ═══════════════════════════════════════════════════════

import sharp from 'sharp';

let _demoWarningLogged = false;

export function isDemoMode() {
  const isDemo = !process.env.OPENAI_API_KEY && !process.env.BFL_API_KEY && !process.env.STABILITY_API_KEY;
  if (isDemo && !_demoWarningLogged) {
    _demoWarningLogged = true;
    console.warn('[DEMO MODE] No AI API keys found (OPENAI_API_KEY, BFL_API_KEY, STABILITY_API_KEY). Running in demo mode — generations will be simulated. Set at least one key to enable real AI generation.');
  }
  return isDemo;
}

/**
 * Generate a demo "visualization" by applying a color shift + overlay.
 * This lets contractors experience the full flow without API costs.
 */
export async function generateDemoResult(imageBuffer, label) {
  const startTime = Date.now();

  // Get image metadata
  const meta = await sharp(imageBuffer).metadata();
  const w = Math.min(meta.width || 1024, 1024);
  const h = Math.min(meta.height || 768, 768);

  // Apply a warm color tint to simulate "new siding/paint"
  const tinted = await sharp(imageBuffer)
    .resize(w, h, { fit: 'inside', withoutEnlargement: true })
    .modulate({ brightness: 1.05, saturation: 1.15 })
    .tint({ r: 200, g: 180, b: 150 })
    .composite([{
      input: Buffer.from(`
        <svg width="${w}" height="${h}">
          <rect width="100%" height="100%" fill="rgba(0,0,0,0)" />
          <rect x="0" y="${h - 60}" width="100%" height="60" fill="rgba(0,0,0,0.7)" rx="0" />
          <text x="50%" y="${h - 25}" text-anchor="middle" fill="white" font-family="system-ui" font-size="18" font-weight="bold">
            DEMO MODE — Connect AI provider to go live
          </text>
        </svg>
      `),
      top: 0,
      left: 0,
    }])
    .jpeg({ quality: 85 })
    .toBuffer();

  const base64 = tinted.toString('base64');

  return {
    imageBase64: base64,
    model: 'demo',
    costCents: 0,
    generationTimeMs: Date.now() - startTime,
    provider: 'demo',
    isDemo: true,
  };
}

// ═══════════════════════════════════════════════════════════════
// IMAGE COMPOSITING — Surgical edit blending
// Takes original image + AI-generated image + SAM mask
// Returns: original pixels outside mask, AI pixels inside mask
// This is the key trick — OpenAI can go wild regenerating the
// whole image, but we only keep the masked zone
// ═══════════════════════════════════════════════════════════════

import sharp from 'sharp';

/**
 * Convert SAM grayscale mask to RGBA PNG for OpenAI edits API
 * 
 * SAM mask: white (255) = edit zone, black (0) = preserve
 * OpenAI edits API: transparent (alpha=0) = edit zone, opaque (alpha=255) = preserve
 * 
 * So we INVERT the grayscale values and use them as the alpha channel.
 * 
 * @param {string} maskBase64 - SAM grayscale mask (base64 PNG, white=edit)
 * @returns {string} RGBA mask as base64 PNG (transparent=edit)
 */
export async function convertMaskForOpenAI(maskBase64) {
  const maskBuf = Buffer.from(maskBase64, 'base64');

  // Read mask as single-channel grayscale raw pixels
  const { data, info } = await sharp(maskBuf)
    .grayscale()
    .raw()
    .toBuffer({ resolveWithObject: true });

  const { width, height } = info;

  // Build RGBA buffer: RGB=black, Alpha=INVERTED grayscale
  // white(255) → alpha=0 (transparent → OpenAI edits this area)
  // black(0) → alpha=255 (opaque → OpenAI preserves this area)
  const rgba = Buffer.alloc(width * height * 4);
  for (let i = 0; i < width * height; i++) {
    rgba[i * 4 + 0] = 0;               // R — black
    rgba[i * 4 + 1] = 0;               // G — black
    rgba[i * 4 + 2] = 0;               // B — black
    rgba[i * 4 + 3] = 255 - data[i];   // A — inverted mask
  }

  const result = await sharp(rgba, { raw: { width, height, channels: 4 } })
    .png()
    .toBuffer();

  return result.toString('base64');
}

/**
 * Composite: blend AI-generated region into original photo using mask
 * 
 * @param {Buffer|string} originalBase64 - Original photo (base64)
 * @param {Buffer|string} generatedBase64 - AI-generated full image (base64)
 * @param {Buffer|string} maskBase64 - Binary mask from SAM (base64, white=edit zone)
 * @param {number} feather - Edge feathering in pixels (smooth transition)
 * @returns {string} Result image as base64 JPEG
 */
export async function compositeWithMask(originalBase64, generatedBase64, maskBase64, feather = 3) {
  // Decode images
  const originalBuf = Buffer.from(originalBase64, 'base64');
  const generatedBuf = Buffer.from(generatedBase64, 'base64');
  const maskBuf = Buffer.from(maskBase64, 'base64');

  // Get dimensions from original
  const origMeta = await sharp(originalBuf).metadata();
  const { width, height } = origMeta;

  // Resize generated + mask to match original exactly
  // CRITICAL: .removeAlpha() ensures 3 channels even if OpenAI returns RGBA PNG
  const generatedResized = await sharp(generatedBuf)
    .resize(width, height, { fit: 'fill' })
    .removeAlpha()
    .raw()
    .toBuffer();

  // Process mask: resize, ensure grayscale, optionally feather edges
  let maskProcessed = sharp(maskBuf)
    .resize(width, height, { fit: 'fill' })
    .grayscale();

  // Apply gaussian blur for edge feathering (smooth blend at mask edges)
  if (feather > 0) {
    // Sigma for feathering — small blur smooths jagged edges
    const sigma = Math.max(0.5, feather);
    maskProcessed = maskProcessed.blur(sigma);
  }

  const maskRaw = await maskProcessed.raw().toBuffer();

  // Get original as raw pixels — also force 3 channels
  const originalRaw = await sharp(originalBuf)
    .resize(width, height, { fit: 'fill' })
    .removeAlpha()
    .raw()
    .toBuffer();

  // Composite: for each pixel, blend based on mask value
  // mask=255 (white) → use generated pixel
  // mask=0 (black) → use original pixel
  // mask=0-255 (feathered edge) → linear blend
  const channels = 3; // RGB
  const result = Buffer.alloc(width * height * channels);

  for (let i = 0; i < width * height; i++) {
    const maskVal = maskRaw[i]; // 0-255 grayscale
    const alpha = maskVal / 255; // 0.0 to 1.0

    for (let c = 0; c < channels; c++) {
      const idx = i * channels + c;
      result[idx] = Math.round(
        originalRaw[idx] * (1 - alpha) + generatedResized[idx] * alpha
      );
    }
  }

  // Encode result as JPEG
  const resultJpeg = await sharp(result, { raw: { width, height, channels } })
    .jpeg({ quality: 90 })
    .toBuffer();

  return resultJpeg.toString('base64');
}

/**
 * Create a PNG mask from polygon points (from SAM)
 * SAM sometimes returns polygon coordinates instead of bitmap masks
 * 
 * @param {number[][]} polygon - Array of [x, y] points
 * @param {number} width - Image width
 * @param {number} height - Image height
 * @returns {string} Mask as base64 PNG
 */
export async function polygonToMask(polygon, width, height) {
  // Create SVG path from polygon points
  const pathData = polygon.map((p, i) =>
    `${i === 0 ? 'M' : 'L'} ${p[0]} ${p[1]}`
  ).join(' ') + ' Z';

  const svg = `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
    <rect width="100%" height="100%" fill="black"/>
    <path d="${pathData}" fill="white"/>
  </svg>`;

  const maskBuf = await sharp(Buffer.from(svg))
    .png()
    .toBuffer();

  return maskBuf.toString('base64');
}

/**
 * Create mask from RLE (Run-Length Encoding) — common SAM output format
 * 
 * @param {object} rle - { counts: number[], size: [height, width] }
 * @returns {string} Mask as base64 PNG
 */
export async function rleToMask(rle, width, height) {
  const counts = rle.counts || rle;
  const pixels = Buffer.alloc(width * height, 0);

  let idx = 0;
  let val = 0; // Start with 0 (background)

  for (const count of counts) {
    for (let i = 0; i < count && idx < pixels.length; i++) {
      if (val === 1) pixels[idx] = 255;
      idx++;
    }
    val = 1 - val; // Toggle between 0 and 1
  }

  const maskBuf = await sharp(pixels, {
    raw: { width, height, channels: 1 },
  }).png().toBuffer();

  return maskBuf.toString('base64');
}

/**
 * Combine multiple masks into one (union)
 * Useful when user selects multiple zones before rendering
 * 
 * @param {string[]} maskBase64s - Array of base64 mask PNGs
 * @param {number} width
 * @param {number} height
 * @returns {string} Combined mask as base64
 */
export async function combineMasks(maskBase64s, width, height) {
  if (maskBase64s.length === 0) throw new Error('No masks to combine');
  if (maskBase64s.length === 1) return maskBase64s[0];

  // Start with first mask
  let combined = await sharp(Buffer.from(maskBase64s[0], 'base64'))
    .resize(width, height)
    .grayscale()
    .raw()
    .toBuffer();

  // OR each subsequent mask
  for (let m = 1; m < maskBase64s.length; m++) {
    const next = await sharp(Buffer.from(maskBase64s[m], 'base64'))
      .resize(width, height)
      .grayscale()
      .raw()
      .toBuffer();

    for (let i = 0; i < combined.length; i++) {
      combined[i] = Math.max(combined[i], next[i]);
    }
  }

  const resultBuf = await sharp(combined, {
    raw: { width, height, channels: 1 },
  }).png().toBuffer();

  return resultBuf.toString('base64');
}

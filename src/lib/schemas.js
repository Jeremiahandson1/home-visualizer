// ═══════════════════════════════════════════════════════
// REQUEST SCHEMAS — Zod validation for all API routes
// Import the relevant schema and call .safeParse(body)
// ═══════════════════════════════════════════════════════

import { z } from 'zod';

// ─── Shared primitives ────────────────────────────────
const base64Image = z.string()
  .min(100, 'Image data too short')
  .max(20_000_000, 'Image exceeds 15MB limit')
  .refine(s => /^[A-Za-z0-9+/]+=*$/.test(s.slice(0, 32)), 'Invalid base64');

const tenantSlug = z.string()
  .min(1, 'tenantSlug is required')
  .max(80)
  .regex(/^[a-z0-9-]+$/, 'tenantSlug must be lowercase alphanumeric with hyphens');

const materialId = z.string().min(1).max(120);

// ─── POST /api/visualize ─────────────────────────────
export const VisualizeSchema = z.object({
  imageBase64: base64Image,
  tenantSlug,
  // Multi-material mode
  selections: z.array(z.object({
    category:   z.string().min(1).max(60),
    materialId: materialId,
  })).max(5).optional(),
  // Legacy single-material mode
  project:    z.string().min(1).max(60).optional(),
  materialId: materialId.optional(),
}).refine(d => d.selections?.length || (d.project && d.materialId), {
  message: 'Provide either selections[] or project+materialId',
});

// ─── POST /api/visualize/render ──────────────────────
const MaterialChange = z.object({
  category:      z.string().min(1).max(60),
  materialName:  z.string().max(120).optional(),
  materialBrand: z.string().max(120).optional(),
  materialColor: z.string().max(80).optional(),
});

export const RenderSchema = z.object({
  imageBase64: base64Image,
  tenantSlug,
  changes:  z.array(MaterialChange).min(1).max(10),
  quality:  z.enum(['low', 'medium', 'high']).default('medium'),
});

// ─── POST /api/visualize/inpaint ─────────────────────
const Zone = z.object({
  maskBase64:    z.string().max(5_000_000).optional(),
  zone:          z.string().max(80).optional(),
  materialName:  z.string().max(120).optional(),
  materialBrand: z.string().max(120).optional(),
  materialColor: z.string().max(80).optional(),
});

export const InpaintSchema = z.object({
  imageBase64:  base64Image,
  tenantSlug,
  zones:        z.array(Zone).max(10).optional(),
  customPrompt: z.string().max(1000).optional(),
  imageWidth:   z.number().int().positive().max(4096).optional(),
  imageHeight:  z.number().int().positive().max(4096).optional(),
}).refine(d => d.zones?.length || d.customPrompt, {
  message: 'Provide either zones[] or customPrompt',
});

// ─── POST /api/visualize/style ───────────────────────
export const StyleSchema = z.object({
  imageBase64: base64Image,
  tenantSlug,
  styleId:     z.string().min(1).max(80),
});

// ─── POST /api/visualize/refine ──────────────────────
export const RefineSchema = z.object({
  imageBase64:         base64Image,
  originalImageBase64: base64Image.optional(),
  tenantSlug,
  instruction:         z.string().min(1).max(500),
});

// ─── POST /api/leads ─────────────────────────────────
export const LeadSchema = z.object({
  tenantId:          z.string().uuid(),
  name:              z.string().min(1).max(120),
  email:             z.string().email(),
  phone:             z.string().max(30).default(''),
  address:           z.string().max(200).default(''),
  notes:             z.string().max(1000).default(''),
  projectType:       z.string().max(60).default(''),
  materialId:        z.string().max(120).optional(),
  materialName:      z.string().max(120).optional(),
  materialBrand:     z.string().max(120).optional(),
  originalPhotoUrl:  z.string().url().optional(),
  generatedPhotoUrl: z.string().url().optional(),
  utm:               z.record(z.string()).optional(),
  referrer:          z.string().max(500).optional(),
});

// ─── POST /api/sessions ──────────────────────────────
export const SessionSchema = z.object({
  tenantId: z.string().uuid(),
  metadata: z.record(z.unknown()).optional(),
});

// ─── POST /api/share ─────────────────────────────────
export const ShareSchema = z.object({
  tenantId:          z.string().uuid().optional(),
  originalPhotoUrl:  z.string().url(),
  generatedPhotoUrl: z.string().url(),
  projectType:       z.string().max(60).default(''),
  materialBrand:     z.string().max(120).default(''),
  materialName:      z.string().max(120).default(''),
  styleName:         z.string().max(120).default(''),
});

// ─── Helper: parse + return 400 on failure ───────────
export function parseBody(schema, body) {
  const result = schema.safeParse(body);
  if (!result.success) {
    const message = result.error.errors
      .map(e => `${e.path.join('.')}: ${e.message}`)
      .join('; ');
    return { ok: false, error: message, data: null };
  }
  return { ok: true, error: null, data: result.data };
}

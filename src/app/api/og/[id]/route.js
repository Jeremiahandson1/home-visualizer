import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase';
import sharp from 'sharp';

// GET /api/og/[id] — Branded before/after OG image for social shares
// Returns a 1200×630 JPEG: left=original, right=generated, branding overlay
export const maxDuration = 30;

export async function GET(request, { params }) {
  const shareId = params.id;
  const supabase = getSupabaseAdmin();

  const { data, error } = await supabase
    .from('shares')
    .select('*, tenants(company_name, colors)')
    .eq('id', shareId)
    .single();

  if (error || !data?.original_photo_url || !data?.generated_photo_url) {
    return new NextResponse('Not found', { status: 404 });
  }

  try {
    const OG_W = 1200;
    const OG_H = 630;
    const HALF = OG_W / 2;          // 600px each side
    const LABEL_H = 48;
    const DIVIDER_W = 4;

    // ─── Fetch both photos in parallel ───────────────
    const [origBuf, genBuf] = await Promise.all([
      fetch(data.original_photo_url, { signal: AbortSignal.timeout(10000) }).then(r => {
        if (!r.ok) throw new Error(`Failed to fetch original: ${r.status}`);
        return r.arrayBuffer();
      }).then(Buffer.from),
      fetch(data.generated_photo_url, { signal: AbortSignal.timeout(10000) }).then(r => {
        if (!r.ok) throw new Error(`Failed to fetch generated: ${r.status}`);
        return r.arrayBuffer();
      }).then(Buffer.from),
    ]);

    // ─── Resize both to left/right halves ────────────
    const [leftImg, rightImg] = await Promise.all([
      sharp(origBuf).resize(HALF, OG_H, { fit: 'cover', position: 'centre' }).jpeg({ quality: 85 }).toBuffer(),
      sharp(genBuf).resize(HALF, OG_H, { fit: 'cover', position: 'centre' }).jpeg({ quality: 85 }).toBuffer(),
    ]);

    // ─── Brand colors from tenant config ─────────────
    const primary = data.tenants?.colors?.primary || '#B8860B';
    const companyName = data.tenants?.company_name || 'Twomiah Vision';
    const label = [data.material_brand, data.material_name, data.style_name]
      .filter(Boolean).join(' · ') || 'AI Visualization';

    // ─── Build SVG overlay (labels + divider + branding) ─
    const overlay = Buffer.from(`
      <svg width="${OG_W}" height="${OG_H}" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="fade-top" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stop-color="black" stop-opacity="0.55"/>
            <stop offset="100%" stop-color="black" stop-opacity="0"/>
          </linearGradient>
          <linearGradient id="fade-bottom" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stop-color="black" stop-opacity="0"/>
            <stop offset="100%" stop-color="black" stop-opacity="0.65"/>
          </linearGradient>
        </defs>

        <!-- Top gradient for label readability -->
        <rect x="0" y="0" width="${OG_W}" height="80" fill="url(#fade-top)"/>
        <!-- Bottom gradient for branding bar -->
        <rect x="0" y="${OG_H - 80}" width="${OG_W}" height="80" fill="url(#fade-bottom)"/>

        <!-- BEFORE label -->
        <rect x="16" y="14" width="90" height="30" rx="6" fill="rgba(0,0,0,0.55)"/>
        <text x="61" y="34" font-family="system-ui,sans-serif" font-size="14" font-weight="700"
          fill="white" text-anchor="middle">BEFORE</text>

        <!-- AFTER label (right half) -->
        <rect x="${HALF + 16}" y="14" width="82" height="30" rx="6" fill="${primary}ee"/>
        <text x="${HALF + 57}" y="34" font-family="system-ui,sans-serif" font-size="14" font-weight="700"
          fill="white" text-anchor="middle">AFTER</text>

        <!-- Center divider -->
        <rect x="${HALF - DIVIDER_W / 2}" y="0" width="${DIVIDER_W}" height="${OG_H}" fill="white" opacity="0.9"/>
        <!-- Divider accent dot -->
        <circle cx="${HALF}" cy="${OG_H / 2}" r="16" fill="${primary}"/>
        <text x="${HALF}" y="${OG_H / 2 + 5}" font-family="system-ui,sans-serif" font-size="14"
          font-weight="900" fill="white" text-anchor="middle">↔</text>

        <!-- Bottom branding bar -->
        <text x="20" y="${OG_H - 38}" font-family="system-ui,sans-serif" font-size="15"
          font-weight="700" fill="${primary}">${escapeXml(companyName)}</text>
        <text x="20" y="${OG_H - 18}" font-family="system-ui,sans-serif" font-size="13"
          fill="rgba(255,255,255,0.85)">${escapeXml(label)}</text>

        <!-- Powered by (bottom right) -->
        <text x="${OG_W - 16}" y="${OG_H - 18}" font-family="system-ui,sans-serif" font-size="11"
          fill="rgba(255,255,255,0.5)" text-anchor="end">Powered by Twomiah Vision</text>
      </svg>
    `);

    // ─── Composite: side-by-side + SVG overlay ────────
    const finalImage = await sharp({
      create: { width: OG_W, height: OG_H, channels: 3, background: { r: 20, g: 20, b: 20 } },
    })
      .composite([
        { input: leftImg,  top: 0, left: 0 },
        { input: rightImg, top: 0, left: HALF },
        { input: overlay,  top: 0, left: 0 },
      ])
      .jpeg({ quality: 88, mozjpeg: true })
      .toBuffer();

    return new NextResponse(finalImage, {
      status: 200,
      headers: {
        'Content-Type': 'image/jpeg',
        'Cache-Control': 'public, max-age=86400, s-maxage=86400, stale-while-revalidate=604800',
      },
    });

  } catch (err) {
    console.error('OG image error:', err);
    // Graceful fallback — proxy the generated photo rather than redirecting to an unvalidated URL
    if (data.generated_photo_url) {
      try {
        const url = new URL(data.generated_photo_url);
        const allowedHosts = ['.supabase.co', '.supabase.in'];
        const isAllowed = allowedHosts.some(h => url.hostname.endsWith(h));
        if (isAllowed && url.protocol === 'https:') {
          const fallbackRes = await fetch(data.generated_photo_url, { signal: AbortSignal.timeout(10000) });
          if (fallbackRes.ok) {
            const buf = Buffer.from(await fallbackRes.arrayBuffer());
            return new NextResponse(buf, {
              status: 200,
              headers: { 'Content-Type': 'image/jpeg', 'Cache-Control': 'public, max-age=3600' },
            });
          }
        }
      } catch { /* fallback failed, return 500 below */ }
    }
    return new NextResponse('Image generation failed', { status: 500 });
  }
}

function escapeXml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

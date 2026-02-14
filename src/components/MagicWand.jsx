'use client';

import { useState, useRef, useEffect, useCallback } from 'react';

// ═══════════════════════════════════════════════════════════════
// MAGIC WAND v2 — Batch zone editor
//
// Flow:
// 1. Tap surface → SAM mask → blue highlight → auto-opens picker
// 2. Pick product → zone saved → tap next surface
// 3. Repeat for all zones you want to change
// 4. Hit "Apply All" → ONE render → surgical composite
//
// Cost: ~$0.14 for a full 6-zone makeover vs $0.60 per-zone
// ═══════════════════════════════════════════════════════════════

export default function MagicWand({
  imageSrc,
  imageBase64,
  remodelType,
  tenantSlug,
  config,
  apiRef,               // parent passes useRef({}) — we populate with { setZoneMaterial, applyAll }
  enabledProjects,    // filtered project categories from Visualizer
  onZoneSelected,     // called when zone identified, parent shows product picker
  onRenderComplete,   // (newImageBase64) => void
  onRenderStart,      // () => void — parent can show loading
}) {
  const canvasRef = useRef(null);
  const imgRef = useRef(null);
  const containerRef = useRef(null);

  const [imageLoaded, setImageLoaded] = useState(false);
  const [segmenting, setSegmenting] = useState(false);

  // Batch zone state — accumulate multiple zones before rendering
  const [zoneEdits, setZoneEdits] = useState([]);
  // { id, zone, category, maskBase64, material: null, clickPoint: {x,y} }

  const [activeZoneIdx, setActiveZoneIdx] = useState(null);
  const [error, setError] = useState(null);
  const [rendering, setRendering] = useState(false);

  // Iteration — after first render, subsequent batches build on result
  const [currentBase64, setCurrentBase64] = useState(imageBase64);
  const [currentSrc, setCurrentSrc] = useState(imageSrc);
  const [iterationCount, setIterationCount] = useState(0);

  const c = config?.colors || {};
  const primary = c.primary || '#B8860B';
  const muted = c.muted || '#78716C';
  const border = c.border || '#E7E5E4';
  const surface = c.surface || '#FFFFFF';

  // ─── Canvas drawing ────────────────────────────────────
  const drawCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    const img = imgRef.current;
    if (!canvas || !img || !imageLoaded) return;

    const ctx = canvas.getContext('2d');
    const container = containerRef.current;
    const displayW = container?.clientWidth || img.naturalWidth;
    const scale = displayW / img.naturalWidth;
    const displayH = Math.round(img.naturalHeight * scale);

    canvas.width = displayW;
    canvas.height = displayH;

    // Draw photo
    ctx.drawImage(img, 0, 0, displayW, displayH);

    // Draw all zone masks
    zoneEdits.forEach((ze, idx) => {
      if (ze.maskBase64) {
        drawMask(ctx, ze.maskBase64, displayW, displayH, idx === activeZoneIdx, ze.material);
      }
    });

    // Segmenting spinner dot
    if (segmenting && zoneEdits.length > 0) {
      const last = zoneEdits[zoneEdits.length - 1];
      if (last.clickPoint) {
        const { x, y } = last.clickPoint;
        ctx.beginPath();
        ctx.arc(x, y, 14, 0, Math.PI * 2);
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 3;
        ctx.stroke();
      }
    }
  }, [imageLoaded, zoneEdits, activeZoneIdx, segmenting]);

  useEffect(() => { drawCanvas(); }, [drawCanvas]);
  useEffect(() => {
    const h = () => drawCanvas();
    window.addEventListener('resize', h);
    return () => window.removeEventListener('resize', h);
  }, [drawCanvas]);

  // ─── Draw individual mask with color coding ────────────
  function drawMask(ctx, maskB64, w, h, isActive, material) {
    const maskImg = new window.Image();
    maskImg.onload = () => {
      const tc = document.createElement('canvas');
      tc.width = w; tc.height = h;
      const tctx = tc.getContext('2d');
      tctx.drawImage(maskImg, 0, 0, w, h);
      const md = tctx.getImageData(0, 0, w, h);
      const px = md.data;

      const overlay = ctx.createImageData(w, h);

      // Color: blue if no product yet, green if product picked, bright if active
      const hasProduct = !!material;
      const r = hasProduct ? 34 : 59;
      const g = hasProduct ? 197 : 130;
      const b = hasProduct ? 94 : 246;
      const a = isActive ? 120 : 70;

      for (let i = 0; i < px.length; i += 4) {
        if (px[i] > 128) {
          overlay.data[i] = r;
          overlay.data[i + 1] = g;
          overlay.data[i + 2] = b;
          overlay.data[i + 3] = a;
        }
      }
      ctx.putImageData(overlay, 0, 0);

      // Border
      if (isActive) {
        ctx.strokeStyle = hasProduct ? '#22C55E' : '#3B82F6';
        ctx.lineWidth = 2;
        ctx.setLineDash([6, 4]);
        drawMaskEdge(ctx, md, w, h);
        ctx.setLineDash([]);
      }
    };
    maskImg.src = `data:image/png;base64,${maskB64}`;
  }

  function drawMaskEdge(ctx, maskData, w, h) {
    const px = maskData.data;
    ctx.beginPath();
    for (let y = 1; y < h - 1; y++) {
      for (let x = 1; x < w - 1; x++) {
        const idx = (y * w + x) * 4;
        if (px[idx] <= 128) continue;
        const nb = [
          px[((y-1)*w+x)*4], px[((y+1)*w+x)*4],
          px[(y*w+x-1)*4], px[(y*w+x+1)*4],
        ];
        if (nb.some(n => n <= 128)) ctx.rect(x, y, 1, 1);
      }
    }
    ctx.stroke();
  }

  // ─── Handle click — add new zone ───────────────────────
  const handleClick = async (e) => {
    if (segmenting || rendering) return;

    const canvas = canvasRef.current;
    const img = imgRef.current;
    if (!canvas || !img) return;

    const rect = canvas.getBoundingClientRect();
    const dispX = e.clientX - rect.left;
    const dispY = e.clientY - rect.top;
    const scX = img.naturalWidth / canvas.width;
    const scY = img.naturalHeight / canvas.height;
    const imgX = Math.round(dispX * scX);
    const imgY = Math.round(dispY * scY);

    setSegmenting(true);
    setError(null);

    // Add placeholder zone immediately (shows spinner at click point)
    const newZone = {
      id: Date.now(),
      zone: null,
      category: null,
      maskBase64: null,
      material: null,
      clickPoint: { x: dispX, y: dispY },
    };
    setZoneEdits(prev => [...prev, newZone]);

    try {
      const res = await fetch('/api/segment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageBase64: currentBase64,
          x: imgX, y: imgY,
          imageWidth: img.naturalWidth,
          imageHeight: img.naturalHeight,
          remodelType: remodelType || 'exterior',
          tenantSlug,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        // Remove placeholder
        setZoneEdits(prev => prev.filter(z => z.id !== newZone.id));
        setError(data.error || 'Could not detect that surface');
        return;
      }

      // Update placeholder with real data
      setZoneEdits(prev => prev.map(z =>
        z.id === newZone.id ? {
          ...z,
          zone: data.zone,
          category: data.category,
          maskBase64: data.maskBase64,
        } : z
      ));

      const idx = zoneEdits.length; // current length = new index
      setActiveZoneIdx(idx);

      // Tell parent to open product picker for this category
      onZoneSelected?.({
        zone: data.zone,
        category: data.category,
        maskBase64: data.maskBase64,
        zoneIdx: idx,
      });

    } catch (err) {
      setZoneEdits(prev => prev.filter(z => z.id !== newZone.id));
      setError('Failed to detect surface. Try a different spot.');
    } finally {
      setSegmenting(false);
    }
  };

  const handleTouch = (e) => {
    e.preventDefault();
    handleClick({ clientX: e.touches[0].clientX, clientY: e.touches[0].clientY });
  };

  // ─── Set material for a zone (called by parent) ────────
  const setZoneMaterial = useCallback((zoneIdx, material) => {
    setZoneEdits(prev => prev.map((z, i) =>
      i === zoneIdx ? { ...z, material } : z
    ));
  }, []);

  // ─── Remove a zone ────────────────────────────────────
  const removeZone = (idx) => {
    setZoneEdits(prev => prev.filter((_, i) => i !== idx));
    if (activeZoneIdx === idx) setActiveZoneIdx(null);
    else if (activeZoneIdx > idx) setActiveZoneIdx(a => a - 1);
  };

  // ─── Apply all — ONE render ────────────────────────────
  const applyAll = async () => {
    const ready = zoneEdits.filter(z => z.material && z.maskBase64);
    if (ready.length === 0) return;

    setRendering(true);
    setError(null);
    onRenderStart?.();

    try {
      const img = imgRef.current;
      const res = await fetch('/api/visualize/inpaint', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageBase64: currentBase64,
          zones: ready.map(z => ({
            maskBase64: z.maskBase64,
            zone: z.zone,
            materialName: z.material.name,
            materialBrand: z.material.brand,
            materialColor: z.material.color || z.material.colorHex,
          })),
          tenantSlug,
          imageWidth: img?.naturalWidth,
          imageHeight: img?.naturalHeight,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Render failed');
        return;
      }

      // Update for iteration
      setCurrentBase64(data.generatedBase64);
      setCurrentSrc(`data:image/jpeg;base64,${data.generatedBase64}`);
      setIterationCount(c => c + 1);

      // Clear zones for next round
      setZoneEdits([]);
      setActiveZoneIdx(null);

      // Notify parent
      onRenderComplete?.(data.generatedBase64);

    } catch (err) {
      setError('Render failed. Please try again.');
    } finally {
      setRendering(false);
    }
  };

  // ─── Reset ─────────────────────────────────────────────
  const resetAll = () => {
    setCurrentBase64(imageBase64);
    setCurrentSrc(imageSrc);
    setZoneEdits([]);
    setActiveZoneIdx(null);
    setIterationCount(0);
    setError(null);
  };

  const readyCount = zoneEdits.filter(z => z.material && z.maskBase64).length;
  const pendingCount = zoneEdits.filter(z => z.maskBase64 && !z.material).length;

  // ─── Expose API to parent via apiRef ─────────────────
  useEffect(() => {
    if (apiRef) {
      apiRef.current = { setZoneMaterial, applyAll, zoneEdits };
    }
  }, [setZoneMaterial, zoneEdits, apiRef]);

  return (
    <div ref={containerRef} className="w-full">

      {/* Toolbar */}
      <div className="flex items-center gap-2 mb-2 px-1">
        <div className="flex items-center gap-1.5 flex-1 min-w-0">
          <span className="text-sm" style={{ color: primary }}>✦</span>
          <span className="text-xs font-bold" style={{ color: primary }}>Magic Wand</span>
          {zoneEdits.length === 0 && (
            <span className="text-xs truncate" style={{ color: muted }}>— tap surfaces to mark them</span>
          )}
          {zoneEdits.length > 0 && (
            <span className="text-xs" style={{ color: muted }}>
              {readyCount} ready{pendingCount > 0 ? ` · ${pendingCount} need products` : ''}
            </span>
          )}
        </div>
        <div className="flex gap-1 flex-shrink-0">
          {iterationCount > 0 && (
            <button onClick={resetAll}
              className="text-xs px-2 py-1 rounded-lg border active:scale-95 transition"
              style={{ borderColor: border, color: muted }}>
              ↺ Original
            </button>
          )}
          {zoneEdits.length > 0 && (
            <button onClick={() => { setZoneEdits([]); setActiveZoneIdx(null); }}
              className="text-xs px-2 py-1 rounded-lg border active:scale-95 transition"
              style={{ borderColor: border, color: muted }}>
              ✕ Clear
            </button>
          )}
        </div>
      </div>

      {/* Canvas */}
      <div className="relative rounded-2xl overflow-hidden shadow-lg border" style={{ borderColor: border }}>
        <img ref={imgRef} src={currentSrc} alt="" className="hidden"
          onLoad={() => setImageLoaded(true)} />

        <canvas ref={canvasRef}
          onClick={handleClick}
          onTouchStart={handleTouch}
          className="w-full block"
          style={{ cursor: segmenting || rendering ? 'wait' : 'crosshair', touchAction: 'none' }}
        />

        {/* Loading */}
        {(segmenting || rendering) && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/20">
            <div className="bg-white rounded-xl px-4 py-3 shadow-xl flex items-center gap-3">
              <div className="w-5 h-5 border-2 border-t-transparent rounded-full animate-spin"
                style={{ borderColor: primary, borderTopColor: 'transparent' }} />
              <span className="text-sm font-medium">
                {rendering ? 'Rendering all changes...' : 'Detecting surface...'}
              </span>
            </div>
          </div>
        )}

        {/* Iteration badge */}
        {iterationCount > 0 && (
          <div className="absolute top-3 left-3 px-2 py-1 rounded-full text-xs font-bold text-white shadow"
            style={{ background: '#22C55E' }}>
            Round {iterationCount + 1}
          </div>
        )}
      </div>

      {/* Zone chips — shows all marked zones */}
      {zoneEdits.length > 0 && (
        <div className="mt-3 space-y-2">
          {zoneEdits.map((ze, idx) => (
            <div key={ze.id}
              className="flex items-center gap-2 px-3 py-2 rounded-xl border transition-all"
              style={{
                borderColor: idx === activeZoneIdx ? primary : border,
                background: idx === activeZoneIdx ? primary + '06' : surface,
                boxShadow: idx === activeZoneIdx ? `0 0 0 1px ${primary}30` : 'none',
              }}
              onClick={() => {
                setActiveZoneIdx(idx);
                if (!ze.material) {
                  onZoneSelected?.({ zone: ze.zone, category: ze.category, maskBase64: ze.maskBase64, zoneIdx: idx });
                }
              }}>

              {/* Zone color dot */}
              <div className="w-3.5 h-3.5 rounded-full flex-shrink-0"
                style={{ background: ze.material ? '#22C55E' : '#3B82F6' }} />

              {/* Zone label */}
              <div className="flex-1 min-w-0">
                <span className="text-sm font-semibold capitalize">
                  {ze.zone ? ze.zone.replace(/-/g, ' ') : 'Detecting...'}
                </span>
                {ze.material ? (
                  <span className="text-xs ml-2" style={{ color: muted }}>
                    → {ze.material.brand} {ze.material.name}
                  </span>
                ) : ze.zone ? (
                  <span className="text-xs ml-2" style={{ color: '#3B82F6' }}>
                    ← pick a product
                  </span>
                ) : null}
              </div>

              {/* Material swatch */}
              {ze.material && (
                <div className="w-6 h-6 rounded border flex-shrink-0"
                  style={{ background: ze.material.color || ze.material.colorHex || '#888', borderColor: border }} />
              )}

              {/* Remove */}
              <button onClick={(e) => { e.stopPropagation(); removeZone(idx); }}
                className="text-xs opacity-40 hover:opacity-100 flex-shrink-0">✕</button>
            </div>
          ))}

          {/* Apply All button */}
          {readyCount > 0 && (
            <button onClick={applyAll}
              disabled={rendering}
              className="w-full py-3 rounded-xl text-white font-bold text-sm disabled:opacity-50 active:scale-[0.98] transition shadow-lg"
              style={{ background: primary }}>
              {rendering
                ? 'Rendering...'
                : `Apply ${readyCount} Change${readyCount !== 1 ? 's' : ''} →`}
            </button>
          )}

          {/* Hint if some zones missing products */}
          {pendingCount > 0 && readyCount > 0 && (
            <p className="text-xs text-center" style={{ color: muted }}>
              {pendingCount} zone{pendingCount !== 1 ? 's' : ''} still need{pendingCount === 1 ? 's' : ''} a product — tap to select
            </p>
          )}
        </div>
      )}

      {/* Error */}
      {error && <p className="mt-2 text-xs text-red-600 px-1">{error}</p>}

      {/* Empty state hint */}
      {zoneEdits.length === 0 && !segmenting && (
        <p className="mt-3 text-xs text-center" style={{ color: muted + '80' }}>
          👆 Tap surfaces to mark them — siding, roof, gutters, windows, doors — then pick products and apply all at once
        </p>
      )}
    </div>
  );
}

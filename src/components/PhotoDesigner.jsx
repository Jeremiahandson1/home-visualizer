'use client';

import { useEffect, useRef, useState, useCallback } from 'react';

/**
 * Photo Designer — Click-to-change material visualization
 *
 * Flow:
 * 1. Photo loads onto canvas
 * 2. User selects a material (color or texture swatch)
 * 3. User clicks on a surface in the photo
 * 4. SAM 2 returns a precise mask for that surface (fallback: flood fill)
 * 5. Material color/texture is applied instantly via canvas compositing
 * 6. User can click multiple surfaces, undo, reset
 *
 * No AI generation. No waiting. Instant visual feedback.
 */

const CATEGORY_CONFIG = {
  siding:     { label: 'Siding',     order: 1 },
  trim:       { label: 'Trim',       order: 2 },
  windows:    { label: 'Windows',    order: 3 },
  doors:      { label: 'Doors',      order: 4 },
  roofing:    { label: 'Roofing',    order: 5 },
  shutters:   { label: 'Shutters',   order: 6 },
  gutters:    { label: 'Gutters',    order: 7 },
  soffit:     { label: 'Soffit',     order: 8 },
  fascia:     { label: 'Fascia',     order: 9 },
  foundation: { label: 'Foundation', order: 10 },
};

const CATEGORY_TO_MATERIAL = {
  siding: 'siding', trim: 'siding', soffit: 'siding', fascia: 'siding',
  gutters: 'gutters', windows: 'windows', doors: 'windows',
  roofing: 'roofing', foundation: 'siding', shutters: 'siding',
};

export default function PhotoDesigner({
  imageSrc,
  imageBase64,
  tenantSlug,
  config,
  onRenderComplete,
}) {
  const canvasRef = useRef(null);
  const imgRef = useRef(null);
  const [loaded, setLoaded] = useState(false);
  const [regions, setRegions] = useState([]);
  const [clicking, setClicking] = useState(false);
  const [activeCategory, setActiveCategory] = useState('siding');
  const [selectedMaterial, setSelectedMaterial] = useState(null);
  const [materials, setMaterials] = useState([]);
  const [loadingMaterials, setLoadingMaterials] = useState(false);

  const c = config?.colors || {};
  const primary = c.primary || '#B8860B';
  const border = c.border || '#E7E5E4';
  const muted = c.muted || '#78716C';

  const categories = Object.keys(CATEGORY_CONFIG)
    .sort((a, b) => CATEGORY_CONFIG[a].order - CATEGORY_CONFIG[b].order);

  // Load image
  useEffect(() => {
    const img = new window.Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      imgRef.current = img;
      setLoaded(true);
    };
    img.src = imageSrc;
  }, [imageSrc]);

  // Redraw when regions change or image loads
  useEffect(() => {
    if (loaded) drawScene();
  }, [regions, loaded]);

  // Load materials for active category
  useEffect(() => {
    if (activeCategory) loadMaterials(activeCategory);
  }, [activeCategory]);

  async function loadMaterials(category) {
    setLoadingMaterials(true);
    const tryCategories = [category];
    const mapped = CATEGORY_TO_MATERIAL[category];
    if (mapped && mapped !== category) tryCategories.push(mapped);

    for (const cat of tryCategories) {
      try {
        const params = new URLSearchParams({ category: cat });
        if (tenantSlug) params.set('tenant', tenantSlug);
        const res = await fetch(`/api/materials?${params}`);
        const data = await res.json();
        const mats = Array.isArray(data) ? data : (data.materials || []);
        if (mats.length > 0) {
          setMaterials(mats);
          setLoadingMaterials(false);
          return;
        }
      } catch { /* try next */ }
    }
    setMaterials([]);
    setLoadingMaterials(false);
  }

  function drawScene() {
    const canvas = canvasRef.current;
    const img = imgRef.current;
    if (!canvas || !img) return;

    const ctx = canvas.getContext('2d');
    const container = canvas.parentElement;
    const maxW = container.clientWidth;
    const maxH = container.clientHeight || 600;
    const scale = Math.min(maxW / img.width, maxH / img.height, 1);
    canvas.width = Math.round(img.width * scale);
    canvas.height = Math.round(img.height * scale);

    // Draw original photo
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

    // Apply each painted region
    for (const region of regions) {
      applyRegionToCanvas(ctx, region, canvas.width, canvas.height);
    }
  }

  function applyRegionToCanvas(ctx, region, canvasW, canvasH) {
    // Create temp canvas for the mask at canvas scale
    const maskCanvas = document.createElement('canvas');
    maskCanvas.width = canvasW;
    maskCanvas.height = canvasH;
    const maskCtx = maskCanvas.getContext('2d');

    // Scale mask to canvas size
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = region.maskWidth;
    tempCanvas.height = region.maskHeight;
    const tempCtx = tempCanvas.getContext('2d');
    tempCtx.putImageData(region.mask, 0, 0);
    maskCtx.drawImage(tempCanvas, 0, 0, canvasW, canvasH);

    const maskData = maskCtx.getImageData(0, 0, canvasW, canvasH);

    // Create color overlay only where mask is white
    const colorCanvas = document.createElement('canvas');
    colorCanvas.width = canvasW;
    colorCanvas.height = canvasH;
    const colorCtx = colorCanvas.getContext('2d');
    const colorImg = colorCtx.createImageData(canvasW, canvasH);

    const hex = region.color;
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);

    for (let i = 0; i < maskData.data.length; i += 4) {
      if (maskData.data[i] > 128) { // Red channel as mask
        colorImg.data[i] = r;
        colorImg.data[i + 1] = g;
        colorImg.data[i + 2] = b;
        colorImg.data[i + 3] = 160; // Semi-transparent
      }
    }
    colorCtx.putImageData(colorImg, 0, 0);

    // Blend onto main canvas
    ctx.save();
    ctx.globalAlpha = 0.55;
    ctx.drawImage(colorCanvas, 0, 0);
    ctx.restore();
  }

  async function handleCanvasClick(e) {
    if (!selectedMaterial || !canvasRef.current || !imgRef.current || clicking) return;

    setClicking(true);
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const clickX = Math.round((e.clientX - rect.left) * (canvas.width / rect.width));
    const clickY = Math.round((e.clientY - rect.top) * (canvas.height / rect.height));

    // Convert click to percentage for SAM 2
    const pctX = (clickX / canvas.width) * 100;
    const pctY = (clickY / canvas.height) * 100;

    let mask = null;
    let maskWidth = canvas.width;
    let maskHeight = canvas.height;

    // Try SAM 2 first for precise mask
    try {
      const segRes = await fetch('/api/visualize/segment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageBase64,
          points: [{ x: pctX, y: pctY, label: 1 }],
          imageWidth: imgRef.current.naturalWidth,
          imageHeight: imgRef.current.naturalHeight,
        }),
      });

      if (segRes.ok) {
        const segData = await segRes.json();
        if (segData.masks?.[0]?.maskBase64) {
          // Convert SAM 2 mask (base64 PNG) to ImageData
          mask = await base64MaskToImageData(segData.masks[0].maskBase64, canvas.width, canvas.height);
          maskWidth = canvas.width;
          maskHeight = canvas.height;
          console.log('SAM 2 mask applied');
        }
      }
    } catch (err) {
      console.error('SAM 2 failed, using flood fill:', err);
    }

    // Fallback: flood fill
    if (!mask) {
      const ctx = canvas.getContext('2d');
      mask = floodFillMask(ctx, clickX, clickY, canvas.width, canvas.height, 35);
      maskWidth = canvas.width;
      maskHeight = canvas.height;
      console.log('Flood fill mask applied');
    }

    const color = selectedMaterial.colorHex || selectedMaterial.color || '#888888';
    const label = `${CATEGORY_CONFIG[activeCategory]?.label || activeCategory}: ${selectedMaterial.name}`;

    setRegions(prev => [...prev, { mask, maskWidth, maskHeight, color, label, material: selectedMaterial }]);
    setClicking(false);
  }

  function undoLast() {
    setRegions(prev => prev.slice(0, -1));
  }

  function resetAll() {
    setRegions([]);
  }

  return (
    <div className="w-full">
      <div className="flex flex-col lg:flex-row gap-4 lg:gap-3 lg:items-start">

        {/* LEFT: Canvas */}
        <div className="w-full lg:w-[70%] lg:flex-shrink-0">
          <div className="relative rounded-2xl overflow-hidden shadow-lg border"
            style={{ borderColor: border }}>
            <canvas
              ref={canvasRef}
              onClick={handleCanvasClick}
              className="w-full block cursor-crosshair"
              style={{ cursor: selectedMaterial ? (clicking ? 'wait' : 'crosshair') : 'default' }}
            />

            {!loaded && (
              <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
                <div className="w-6 h-6 border-2 border-t-transparent rounded-full animate-spin"
                  style={{ borderColor: primary, borderTopColor: 'transparent' }} />
              </div>
            )}

            {clicking && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                <div className="bg-white rounded-xl px-4 py-3 shadow-lg flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-t-transparent rounded-full animate-spin"
                    style={{ borderColor: primary, borderTopColor: 'transparent' }} />
                  <span className="text-sm font-medium">Detecting surface...</span>
                </div>
              </div>
            )}

            {/* Instruction banner */}
            {loaded && !selectedMaterial && !regions.length && (
              <div className="absolute bottom-3 left-3 right-3 px-3 py-2 bg-black/60 rounded-lg text-xs text-white text-center">
                Select a material, then click on the photo to apply it
              </div>
            )}

            {loaded && selectedMaterial && !clicking && (
              <div className="absolute bottom-3 left-3 px-3 py-1.5 bg-black/60 rounded-lg text-xs text-white flex items-center gap-2">
                <span className="w-3 h-3 rounded border border-white/30"
                  style={{ background: selectedMaterial.colorHex || selectedMaterial.color || '#888' }} />
                Click a surface to apply {selectedMaterial.name}
              </div>
            )}

            {/* Undo / Reset */}
            {regions.length > 0 && !clicking && (
              <div className="absolute top-3 left-3 flex gap-1.5">
                <button onClick={undoLast}
                  className="px-3 py-1.5 rounded-full text-xs font-bold shadow-lg bg-white text-gray-600 border border-gray-200 active:scale-95 transition-all">
                  Undo
                </button>
                <button onClick={resetAll}
                  className="px-3 py-1.5 rounded-full text-xs font-bold shadow-lg bg-white text-gray-600 border border-gray-200 active:scale-95 transition-all">
                  Reset
                </button>
              </div>
            )}

            {/* Applied regions list */}
            {regions.length > 0 && (
              <div className="absolute top-3 right-3 flex flex-col gap-1">
                {regions.map((r, i) => (
                  <div key={i} className="flex items-center gap-1.5 px-2 py-1 bg-black/60 rounded-lg text-[10px] text-white">
                    <span className="w-2.5 h-2.5 rounded" style={{ backgroundColor: r.color }} />
                    {r.label}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* RIGHT: Picker panel */}
        <div className="w-full lg:w-[30%] lg:min-w-[280px] flex flex-col">

          {/* Category tabs */}
          <div className="flex flex-wrap gap-1.5 pb-1">
            {categories.map(cat => {
              const cfg = CATEGORY_CONFIG[cat];
              const isActive = cat === activeCategory;
              return (
                <button
                  key={cat}
                  onClick={() => { setActiveCategory(cat); setSelectedMaterial(null); }}
                  className="flex-shrink-0 px-2.5 py-1 rounded-full text-[11px] font-bold transition-all active:scale-95"
                  style={{
                    background: isActive ? primary : '#F5F5F4',
                    color: isActive ? 'white' : muted,
                    border: `1.5px solid ${isActive ? primary : border}`,
                  }}
                >
                  {cfg.label}
                </button>
              );
            })}
          </div>

          {/* Material grid */}
          <div className="mt-3 p-3 rounded-xl border flex-1 flex flex-col min-h-0"
            style={{ borderColor: primary + '25', background: primary + '04' }}>
            <div className="flex items-center justify-between mb-2 flex-shrink-0">
              <span className="text-xs font-bold capitalize" style={{ color: primary }}>
                {CATEGORY_CONFIG[activeCategory]?.label || activeCategory}
              </span>
              {selectedMaterial && (
                <span className="text-xs text-green-600 font-medium">
                  {selectedMaterial.name}
                </span>
              )}
            </div>

            {loadingMaterials ? (
              <div className="flex items-center gap-2 py-8 justify-center">
                <div className="w-4 h-4 border-2 border-t-transparent rounded-full animate-spin"
                  style={{ borderColor: primary, borderTopColor: 'transparent' }} />
                <span className="text-xs text-gray-500">Loading materials...</span>
              </div>
            ) : materials.length === 0 ? (
              <p className="text-xs text-gray-500 py-6 text-center">No materials found</p>
            ) : (
              <div className="grid grid-cols-4 sm:grid-cols-5 lg:grid-cols-3 xl:grid-cols-4 gap-1.5 overflow-y-auto flex-1 pr-0.5 max-h-[280px] lg:max-h-[calc(100vh-300px)]"
                style={{ scrollbarWidth: 'thin' }}>
                {materials.map((mat, i) => {
                  const isSelected = selectedMaterial?.name === mat.name && selectedMaterial?.brand === mat.brand;
                  return (
                    <button
                      key={`${mat.brand}-${mat.name}-${i}`}
                      onClick={() => setSelectedMaterial(mat)}
                      className="flex flex-col items-center gap-0.5 p-1 rounded-lg border transition-all active:scale-95"
                      style={{
                        borderColor: isSelected ? primary : border,
                        background: isSelected ? primary + '10' : 'white',
                        borderWidth: isSelected ? 2 : 1,
                      }}
                    >
                      <div className="w-full aspect-square rounded-md border border-gray-200"
                        style={{
                          background: mat.swatch
                            ? `url(${mat.swatch}) center/cover`
                            : (mat.colorHex || mat.color || '#E5E5E5'),
                        }}
                      />
                      <span className="text-[9px] font-semibold text-center leading-tight line-clamp-2 w-full px-0.5"
                        style={{ color: isSelected ? primary : '#374151' }}>
                        {mat.name}
                      </span>
                      {mat.brand && (
                        <span className="text-[8px] text-gray-400 text-center truncate w-full">
                          {mat.brand}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Convert base64 PNG mask to ImageData at target size ────────
async function base64MaskToImageData(maskBase64, targetW, targetH) {
  return new Promise((resolve) => {
    const img = new window.Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = targetW;
      canvas.height = targetH;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, targetW, targetH);
      resolve(ctx.getImageData(0, 0, targetW, targetH));
    };
    img.onerror = () => resolve(null);
    img.src = `data:image/png;base64,${maskBase64}`;
  });
}

// ─── Flood fill mask (fallback when SAM 2 unavailable) ──────────
function floodFillMask(ctx, clickX, clickY, width, height, tolerance) {
  const imageData = ctx.getImageData(0, 0, width, height);
  const mask = ctx.createImageData(width, height);
  const data = imageData.data;

  const idx = (clickY * width + clickX) * 4;
  const tr = data[idx], tg = data[idx + 1], tb = data[idx + 2];

  const visited = new Uint8Array(width * height);
  const queue = [clickX + clickY * width];
  visited[queue[0]] = 1;

  while (queue.length > 0) {
    const pos = queue.pop();
    const px = pos % width;
    const py = Math.floor(pos / width);
    const pi = pos * 4;

    const dr = data[pi] - tr;
    const dg = data[pi + 1] - tg;
    const db = data[pi + 2] - tb;
    const dist = Math.sqrt(dr * dr + dg * dg + db * db);

    if (dist <= tolerance) {
      mask.data[pi] = 255;
      mask.data[pi + 1] = 255;
      mask.data[pi + 2] = 255;
      mask.data[pi + 3] = 255;

      const neighbors = [
        px > 0 ? pos - 1 : -1,
        px < width - 1 ? pos + 1 : -1,
        py > 0 ? pos - width : -1,
        py < height - 1 ? pos + width : -1,
      ];
      for (const n of neighbors) {
        if (n >= 0 && !visited[n]) {
          visited[n] = 1;
          queue.push(n);
        }
      }
    }
  }

  return mask;
}

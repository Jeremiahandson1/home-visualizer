'use client';

import { useState, useRef, useEffect } from 'react';
import CompareSlider from './CompareSlider';

const PROGRESS_STAGES = [
  { pct: 10, label: 'Uploading your photo...',         delay: 0 },
  { pct: 20, label: 'Analyzing the space...',           delay: 2000 },
  { pct: 30, label: 'Detecting surfaces & features...', delay: 5000 },
  { pct: 40, label: 'Mapping material zones...',        delay: 9000 },
  { pct: 50, label: 'Applying new design...',           delay: 14000 },
  { pct: 60, label: 'Rendering new materials...',       delay: 20000 },
  { pct: 70, label: 'Adding realistic shadows...',      delay: 28000 },
  { pct: 80, label: 'Matching lighting conditions...',  delay: 36000 },
  { pct: 88, label: 'Refining details & edges...',      delay: 45000 },
  { pct: 94, label: 'Almost there — finalizing...',     delay: 52000 },
  { pct: 97, label: 'Just a few more seconds...',       delay: 58000 },
];

// ═══════════════════════════════════════════════════════════════
// DESIGN MODE v3 — Side-by-side layout
//
// Desktop: Photo (left 60%) | Picker panel (right 40%)
// Mobile: Photo on top, picker below
//
// Flow:
// 1. Photo loads → category tabs appear immediately
// 2. Pick a category → pick a material
// 3. Repeat → "Apply Changes" → render
// ═══════════════════════════════════════════════════════════════

const CATEGORY_CONFIG = {
  siding:     { label: 'Siding',     icon: '▦', order: 1 },
  trim:       { label: 'Trim',       icon: '▬', order: 2 },
  windows:    { label: 'Windows',    icon: '⊞', order: 3 },
  doors:      { label: 'Doors',      icon: '▯', order: 4 },
  roofing:    { label: 'Roofing',    icon: '⌂', order: 5 },
  shutters:   { label: 'Shutters',   icon: '║', order: 6 },
  gutters:    { label: 'Gutters',    icon: '⌐', order: 7 },
  soffit:     { label: 'Soffit',     icon: '▭', order: 8 },
  fascia:     { label: 'Fascia',     icon: '━', order: 9 },
  foundation: { label: 'Foundation', icon: '▩', order: 10 },
  railing:    { label: 'Railing',    icon: '╫', order: 11 },
  columns:    { label: 'Columns',    icon: '╽', order: 12 },
};

const CATEGORY_TO_MATERIAL = {
  siding: 'siding',
  trim: 'siding',
  soffit: 'siding',
  fascia: 'siding',
  gutters: 'gutters',
  windows: 'windows',
  doors: 'windows',
  roofing: 'roofing',
  foundation: 'siding',
  railing: 'siding',
  columns: 'siding',
  shutters: 'siding',
};

const DEFAULT_CATEGORIES = ['siding', 'trim', 'windows', 'doors', 'roofing', 'shutters', 'gutters', 'soffit', 'fascia'];

export default function DesignMode({
  originalSrc,
  imageSrc,
  imageBase64,
  tenantSlug,
  config,
  onRenderComplete,
  onRenderStart,
  enabledCategories,
}) {
  const [activeCategory, setActiveCategory] = useState(null);
  const [selectedMaterials, setSelectedMaterials] = useState({});
  const [materials, setMaterials] = useState([]);
  const [loadingMaterials, setLoadingMaterials] = useState(false);
  const [rendering, setRendering] = useState(false);
  const [renderResult, setRenderResult] = useState(null);
  const [showOriginal, setShowOriginal] = useState(false);
  const [renderError, setRenderError] = useState(null);
  const [currentBase64, setCurrentBase64] = useState(imageBase64);
  const [currentSrc, setCurrentSrc] = useState(imageSrc);
  const [iterationCount, setIterationCount] = useState(0);
  const [progressPct, setProgressPct] = useState(0);
  const [progressLabel, setProgressLabel] = useState('');
  const [elapsedSec, setElapsedSec] = useState(0);
  const [detectedSurfaces, setDetectedSurfaces] = useState([]);
  const [categoryMasks, setCategoryMasks] = useState({});
  const [detecting, setDetecting] = useState(false);
  const [imageDims, setImageDims] = useState({ w: 1024, h: 1024 });

  const imgRef = useRef(null);
  const containerRef = useRef(null);

  const c = config?.colors || {};
  const primary = c.primary || '#B8860B';
  const muted = c.muted || '#78716C';
  const border = c.border || '#E7E5E4';
  const surface = c.surface || '#FFFFFF';

  const categories = (enabledCategories || config?.categories || DEFAULT_CATEGORIES)
    .filter(cat => CATEGORY_CONFIG[cat])
    .sort((a, b) => (CATEGORY_CONFIG[a]?.order || 99) - (CATEGORY_CONFIG[b]?.order || 99));

  // Auto-detect surfaces + generate SAM 2 masks on mount
  useEffect(() => {
    if (imageBase64 && detectedSurfaces.length === 0 && !detecting) {
      detectSurfaces();
    }
  }, [imageBase64]);

  async function detectSurfaces() {
    setDetecting(true);
    try {
      const res = await fetch('/api/visualize/detect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageBase64, withMasks: true }),
      });
      const data = await res.json();
      if (!res.ok) console.error('Detect error:', data.error, data.debug);
      if (res.ok && data.surfaces) {
        setDetectedSurfaces(data.surfaces);
        if (data.imageWidth) setImageDims({ w: data.imageWidth, h: data.imageHeight });

        // Index masks by category for quick lookup
        const masks = {};
        for (const s of data.surfaces) {
          if (s.maskBase64 && !masks[s.category]) {
            masks[s.category] = s.maskBase64;
          }
        }
        setCategoryMasks(masks);
        console.log(`Detected ${data.surfaceCount} surfaces, ${data.masksGenerated || 0} with SAM 2 masks`);
      }
    } catch (err) {
      console.error('Surface detection failed (non-fatal):', err);
    } finally {
      setDetecting(false);
    }
  }

  useEffect(() => {
    if (!activeCategory && categories.length > 0) {
      setActiveCategory(categories[0]);
    }
  }, [categories]);

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
        if (config?.tenantId) params.set('tenant_id', config.tenantId);
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

  function selectMaterial(material) {
    setSelectedMaterials(prev => ({ ...prev, [activeCategory]: material }));
  }

  function removeMaterial(category) {
    setSelectedMaterials(prev => {
      const next = { ...prev };
      delete next[category];
      return next;
    });
  }

  // Crop-resize render to match original aspect ratio (no stretching)
  // Takes a square 1024x1024 render and center-crops it to match e.g. 4:3 original
  function cropToMatchAspect(base64, targetW, targetH) {
    return new Promise((resolve) => {
      const img = new window.Image();
      img.onload = () => {
        const srcW = img.naturalWidth;
        const srcH = img.naturalHeight;
        const targetRatio = targetW / targetH;
        const srcRatio = srcW / srcH;

        // Calculate crop region (center crop)
        let cropX = 0, cropY = 0, cropW = srcW, cropH = srcH;
        if (srcRatio > targetRatio) {
          // Source is wider — crop sides
          cropW = Math.round(srcH * targetRatio);
          cropX = Math.round((srcW - cropW) / 2);
        } else if (srcRatio < targetRatio) {
          // Source is taller — crop top/bottom
          cropH = Math.round(srcW / targetRatio);
          cropY = Math.round((srcH - cropH) / 2);
        }

        const canvas = document.createElement('canvas');
        canvas.width = targetW;
        canvas.height = targetH;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, cropX, cropY, cropW, cropH, 0, 0, targetW, targetH);
        resolve(canvas.toDataURL('image/jpeg', 0.92).split(',')[1]);
      };
      img.onerror = () => resolve(base64);
      img.src = base64.startsWith('data:') ? base64 : `data:image/jpeg;base64,${base64}`;
    });
  }

  // Measure original image dimensions on mount
  const [originalDims, setOriginalDims] = useState(null);
  useEffect(() => {
    const src = originalSrc || imageSrc;
    if (!src) return;
    const img = new window.Image();
    img.onload = () => setOriginalDims({ w: img.naturalWidth, h: img.naturalHeight });
    img.src = src;
  }, [originalSrc, imageSrc]);

  // Progress animation tied to rendering state
  useEffect(() => {
    if (!rendering) {
      setProgressPct(0); setProgressLabel(''); setElapsedSec(0);
      return;
    }
    const timers = PROGRESS_STAGES.map(({ pct, label, delay }) =>
      setTimeout(() => { setProgressPct(pct); setProgressLabel(label); }, delay)
    );
    const ticker = setInterval(() => setElapsedSec(s => s + 1), 1000);
    return () => { timers.forEach(clearTimeout); clearInterval(ticker); };
  }, [rendering]);

  async function applyDesign() {
    const changes = Object.entries(selectedMaterials).map(([category, mat]) => ({
      category,
      materialName: mat.name,
      materialBrand: mat.brand,
      materialColor: mat.color || mat.colorHex || mat.colorName,
    }));
    if (changes.length === 0) return;

    setRendering(true);
    setRenderError(null);
    onRenderStart?.();

    try {
      // Check if we have SAM 2 masks for any of the selected categories
      const zonesWithMasks = changes
        .filter(c => categoryMasks[c.category])
        .map(c => ({
          zone: c.category,
          maskBase64: categoryMasks[c.category],
          materialName: c.materialName,
          materialBrand: c.materialBrand,
          materialColor: c.materialColor,
        }));

      let data;

      if (zonesWithMasks.length > 0) {
        // USE INPAINT PIPELINE — surgical mask-based editing
        console.log(`Using SAM 2 masks for ${zonesWithMasks.length}/${changes.length} categories`);
        const res = await fetch('/api/visualize/inpaint', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            imageBase64: currentBase64,
            zones: zonesWithMasks,
            imageWidth: imageDims.w,
            imageHeight: imageDims.h,
            tenantSlug,
          }),
        });
        data = await res.json();
        if (!res.ok) { setRenderError(data.error || 'Render failed'); return; }
      } else {
        // FALLBACK — prompt-only render (no masks available)
        console.log('No SAM 2 masks available, falling back to prompt-only render');
        const res = await fetch('/api/visualize/render', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ imageBase64: currentBase64, changes, tenantSlug }),
        });
        data = await res.json();
        if (!res.ok) { setRenderError(data.error || 'Render failed'); return; }
      }

      // Crop render to match original photo's aspect ratio (no stretching)
      let newBase64 = data.generatedBase64;
      if (originalDims) {
        newBase64 = await cropToMatchAspect(newBase64, originalDims.w, originalDims.h);
      }

      setRenderResult(`data:image/jpeg;base64,${newBase64}`);
      setCurrentBase64(newBase64);
      setCurrentSrc(`data:image/jpeg;base64,${newBase64}`);
      setIterationCount(c => c + 1);
      setSelectedMaterials({});
      onRenderComplete?.(newBase64);
    } catch {
      setRenderError('Render failed. Please try again.');
    } finally {
      setRendering(false);
    }
  }

  function resetAll() {
    setCurrentBase64(imageBase64);
    setCurrentSrc(imageSrc);
    setRenderResult(null);
    setSelectedMaterials({});
    setIterationCount(0);
    setRenderError(null);
    setShowOriginal(false);
    // Re-detect surfaces on the original image
    setDetectedSurfaces([]);
    setCategoryMasks({});
  }

  const changeCount = Object.keys(selectedMaterials).length;
  const displaySrc = showOriginal ? imageSrc : (currentSrc || imageSrc);
  const selectedForCategory = activeCategory ? selectedMaterials[activeCategory] : null;

  // ─── RENDER ─────────────────────────────────────────────
  return (
    <div ref={containerRef} className="w-full">

      {/* ═══ SIDE-BY-SIDE: photo left, picker right ═══ */}
      <div className="flex flex-col lg:flex-row gap-4 lg:gap-3 lg:items-start">

        {/* ── LEFT: Photo ─────────────────────────────── */}
        <div className="w-full lg:w-[70%] lg:flex-shrink-0">
          <div className="relative rounded-2xl overflow-hidden shadow-lg border lg:sticky lg:top-4"
            style={{ borderColor: border }}>

            {/* Before render: plain image. After render: compare slider */}
            {iterationCount > 0 && !rendering ? (
              <div className="lg:max-h-[calc(100vh-240px)] overflow-hidden">
                <CompareSlider
                  beforeSrc={originalSrc || imageSrc}
                  afterSrc={currentSrc}
                  primaryColor={primary}
                  maxHeight="calc(100vh - 240px)"
                />
              </div>
            ) : (
              <img
                ref={imgRef}
                src={displaySrc}
                alt="House"
                className="w-full block lg:max-h-[calc(100vh-240px)] lg:object-contain"
              />
            )}

            {/* Rendering overlay — step-by-step progress */}
            {rendering && (() => {
              const currentStageIdx = PROGRESS_STAGES.reduce((acc, s, i) => progressPct >= s.pct ? i : acc, 0);
              return (
              <div className="absolute inset-0 flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(2px)' }}>
                <div className="bg-white rounded-2xl shadow-2xl w-[calc(100%-2rem)] max-w-sm mx-4 overflow-hidden">

                  {/* Header */}
                  <div className="px-4 pt-4 pb-3 border-b" style={{ borderColor: '#E7E5E4' }}>
                    <div className="flex items-center gap-2.5">
                      {/* Animated logo/spinner */}
                      <div className="relative flex-shrink-0 w-8 h-8">
                        <div className="absolute inset-0 rounded-full border-2 border-transparent animate-spin"
                          style={{ borderTopColor: primary, borderRightColor: primary + '40', animationDuration: '1.5s' }} />
                        <div className="absolute inset-1 rounded-full" style={{ background: primary + '15' }} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold" style={{ color: primary }}>AI Rendering · {elapsedSec < 60 ? `${elapsedSec}s` : `${Math.floor(elapsedSec/60)}m ${elapsedSec%60}s`}</p>
                        <p className="text-xs text-gray-500 truncate">
                          {Object.keys(selectedMaterials).length} change{Object.keys(selectedMaterials).length !== 1 ? 's' : ''}
                          {' · '}Step {currentStageIdx + 1} of {PROGRESS_STAGES.length}
                        </p>
                      </div>
                    </div>
                    {/* Progress bar */}
                    <div className="mt-2.5 h-2 rounded-full overflow-hidden" style={{ background: '#F5F5F4' }}>
                      <div className="h-full rounded-full transition-all duration-1000 ease-out"
                        style={{ width: `${progressPct}%`, background: `linear-gradient(90deg, ${primary}bb, ${primary})` }} />
                    </div>
                  </div>

                  {/* Step list */}
                  <div className="overflow-y-auto max-h-64">
                    {PROGRESS_STAGES.map((stage, i) => {
                      const isDone = progressPct > stage.pct;
                      const isActive = i === currentStageIdx;
                      return (
                        <div key={i}
                          className="flex items-center gap-2.5 px-4 py-2 transition-all duration-400"
                          style={{
                            background: isActive ? primary + '10' : isDone ? '#00000004' : 'transparent',
                            borderBottom: i < PROGRESS_STAGES.length - 1 ? '1px solid #F5F5F4' : 'none',
                          }}>
                          <div className="w-5 h-5 rounded-full flex-shrink-0 flex items-center justify-center text-[10px] font-bold transition-all duration-300"
                            style={{
                              background: isDone ? primary : isActive ? primary + '20' : '#F5F5F4',
                              color: isDone ? '#fff' : isActive ? primary : '#A8A29E',
                              boxShadow: isActive ? `0 0 0 3px ${primary}25` : 'none',
                            }}>
                            {isDone ? '✓' : i + 1}
                          </div>
                          <span className="text-xs flex-1 leading-tight"
                            style={{
                              color: isActive ? '#1C1917' : isDone ? '#A8A29E' : '#C4C0BD',
                              fontWeight: isActive ? 600 : 400,
                            }}>
                            {stage.label}
                          </span>
                          {isActive && (
                            <div className="flex gap-0.5 flex-shrink-0">
                              {[0,1,2].map(d => (
                                <div key={d} className="w-1 h-1 rounded-full animate-bounce"
                                  style={{ background: primary, animationDelay: `${d * 0.15}s` }} />
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
              );
            })()}

            {/* Reset button */}
            {iterationCount > 0 && !rendering && (
              <div className="absolute top-3 left-3 flex gap-1.5">
                <button
                  onClick={resetAll}
                  className="px-3 py-1.5 rounded-full text-xs font-bold shadow-lg transition-all active:scale-95 bg-white text-gray-600 border border-gray-200">
                  ↺ Reset
                </button>
              </div>
            )}

          </div>
        </div>

        {/* ── RIGHT: Picker panel ─────────────────────── */}
        <div className="w-full lg:w-[30%] lg:min-w-[280px] flex flex-col">

          {/* Detection status */}
          {detecting && (
            <div className="flex items-center gap-2 pb-2">
              <div className="w-3 h-3 border-2 border-t-transparent rounded-full animate-spin"
                style={{ borderColor: primary, borderTopColor: 'transparent' }} />
              <span className="text-[11px] text-gray-500">Analyzing surfaces for precise editing...</span>
            </div>
          )}

          {/* Category tabs */}
          <div className="flex flex-wrap gap-1.5 pb-1">
            {categories.map(cat => {
              const cfg = CATEGORY_CONFIG[cat];
              const isActive = cat === activeCategory;
              const hasProduct = !!selectedMaterials[cat];
              const hasMask = !!categoryMasks[cat];

              return (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  className="flex-shrink-0 px-2.5 py-1 rounded-full text-[11px] font-bold transition-all active:scale-95 flex items-center gap-1"
                  style={{
                    background: isActive ? primary : (hasProduct ? '#22C55E15' : '#F5F5F4'),
                    color: isActive ? 'white' : (hasProduct ? '#22C55E' : muted),
                    border: `1.5px solid ${isActive ? primary : (hasProduct ? '#22C55E50' : border)}`,
                  }}
                  title={hasMask ? 'Precise SAM 2 mask available' : 'No mask — will use AI prompt'}
                >
                  {hasProduct && !isActive && (
                    <svg width="10" height="10" viewBox="0 0 16 16" fill="#22C55E">
                      <path d="M13.5 4.5L6 12l-3.5-3.5L3.5 7.5 6 10l6.5-6.5z" />
                    </svg>
                  )}
                  {cfg.label}
                  {hasMask && !isActive && (
                    <span className="w-1.5 h-1.5 rounded-full inline-block" style={{ background: '#3B82F6' }}
                      title="SAM 2 mask ready" />
                  )}
                </button>
              );
            })}
          </div>

          {/* Selected materials chips */}
          {changeCount > 0 && (
            <div className="mt-2 flex flex-wrap gap-1.5">
              {Object.entries(selectedMaterials).map(([cat, mat]) => (
                <div key={cat}
                  className="flex items-center gap-1.5 px-2 py-1 rounded-lg text-xs border"
                  style={{ borderColor: '#22C55E50', background: '#22C55E08' }}>
                  <div className="w-3 h-3 rounded-sm border border-gray-300"
                    style={{ background: mat.colorHex || mat.color || '#ccc' }} />
                  <span className="font-semibold capitalize">{CATEGORY_CONFIG[cat]?.label}</span>
                  <span className="text-gray-500">→ {mat.name}</span>
                  <button onClick={() => removeMaterial(cat)}
                    className="ml-0.5 text-gray-400 hover:text-red-500 transition">✕</button>
                </div>
              ))}
            </div>
          )}

          {/* Material grid — scrollable, fills space */}
          {activeCategory && (
            <div className="mt-3 p-3 rounded-xl border flex-1 flex flex-col min-h-0" style={{
              borderColor: primary + '25',
              background: primary + '04',
            }}>
              <div className="flex items-center justify-between mb-2 flex-shrink-0">
                <span className="text-xs font-bold capitalize" style={{ color: primary }}>
                  {CATEGORY_CONFIG[activeCategory]?.label || activeCategory}
                </span>
                {selectedForCategory && (
                  <span className="text-xs text-green-600 font-medium">
                    ✓ {selectedForCategory.name}
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
                <p className="text-xs text-gray-500 py-6 text-center">
                  No materials found for this category
                </p>
              ) : (
                <div
                  className="grid grid-cols-4 sm:grid-cols-5 lg:grid-cols-3 xl:grid-cols-4 gap-1.5 overflow-y-auto flex-1 pr-0.5
                    max-h-[280px] lg:max-h-[calc(100vh-420px)]"
                  style={{ scrollbarWidth: 'thin' }}
                >
                  {materials.map((mat, i) => {
                    const isSelected = selectedForCategory?.name === mat.name
                      && selectedForCategory?.brand === mat.brand;

                    return (
                      <button
                        key={`${mat.brand}-${mat.name}-${i}`}
                        onClick={() => selectMaterial(mat)}
                        className="flex flex-col items-center gap-0.5 p-1 rounded-lg border transition-all active:scale-95"
                        style={{
                          borderColor: isSelected ? primary : border,
                          background: isSelected ? primary + '10' : 'white',
                          borderWidth: isSelected ? 2 : 1,
                          boxShadow: isSelected ? `0 0 0 1px ${primary}40` : 'none',
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
                          <span className="text-[8px] text-gray-400 text-center leading-tight truncate w-full">
                            {mat.brand}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* Apply button — pinned to bottom of panel */}
          {changeCount > 0 && !rendering && (
            <button
              onClick={applyDesign}
              className="mt-3 w-full py-3 rounded-xl font-bold text-white text-sm transition-all active:scale-[0.98] shadow-lg flex-shrink-0"
              style={{
                background: `linear-gradient(135deg, ${primary}, ${primary}DD)`,
                boxShadow: `0 4px 12px ${primary}40`,
              }}
            >
              Apply {changeCount} {changeCount === 1 ? 'Change' : 'Changes'}
            </button>
          )}

          {/* Error */}
          {renderError && (
            <div className="mt-2 p-2 rounded-lg bg-red-50 border border-red-200 flex-shrink-0">
              <p className="text-xs text-red-700">{renderError}</p>
              <button onClick={() => setRenderError(null)}
                className="text-xs text-red-600 font-bold mt-1 underline">
                Dismiss
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

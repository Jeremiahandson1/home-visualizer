'use client';

import { useState, useRef, useEffect, useCallback } from 'react';

// ═══════════════════════════════════════════════════════════════
// DESIGN MODE — Hover-style surface detection + material picker
//
// Flow:
// 1. Photo loads → auto-detect ALL surfaces via GPT-4o vision
// 2. Dots appear on image at each detected surface
// 3. Category tabs filter by surface type (Walls, Trim, etc.)
// 4. Pick a material → applies to all surfaces in that category
// 5. "Apply Design" → ONE render → result displayed
//
// No SAM. No click-per-zone. Just smart detection + rendering.
// ═══════════════════════════════════════════════════════════════

// Category display config
const CATEGORY_CONFIG = {
  walls:      { label: 'Walls',      icon: '▦', order: 1 },
  trim:       { label: 'Trim',       icon: '▬', order: 2 },
  soffit:     { label: 'Soffit',     icon: '▭', order: 3 },
  fascia:     { label: 'Fascia',     icon: '━', order: 4 },
  gutters:    { label: 'Gutters',    icon: '⌐', order: 5 },
  windows:    { label: 'Windows',    icon: '⊞', order: 6 },
  doors:      { label: 'Door',       icon: '▯', order: 7 },
  roof:       { label: 'Roof',       icon: '⌂', order: 8 },
  foundation: { label: 'Foundation', icon: '▩', order: 9 },
  railing:    { label: 'Railing',    icon: '╫', order: 10 },
  columns:    { label: 'Columns',    icon: '╽', order: 11 },
  shutters:   { label: 'Shutters',   icon: '║', order: 12 },
  accent:     { label: 'Accent',     icon: '✦', order: 13 },
};

// Map detected categories to material API categories (must match project IDs)
const CATEGORY_TO_MATERIAL = {
  walls: 'siding',
  trim: 'siding',       // trim products are usually under siding
  soffit: 'siding',
  fascia: 'siding',
  gutters: 'gutters',
  windows: 'windows',
  doors: 'windows',     // doors often grouped with windows
  roof: 'roofing',
  foundation: 'siding',
  railing: 'siding',
  columns: 'siding',
  shutters: 'siding',
  accent: 'paint',
};

export default function DesignMode({
  imageSrc,
  imageBase64,
  tenantSlug,
  config,
  onRenderComplete,
  onRenderStart,
}) {
  // Detection state
  const [surfaces, setSurfaces] = useState([]);
  const [detecting, setDetecting] = useState(false);
  const [detected, setDetected] = useState(false);
  const [detectError, setDetectError] = useState(null);

  // Category & selection state
  const [activeCategory, setActiveCategory] = useState(null);
  const [selectedMaterials, setSelectedMaterials] = useState({});
  // { "walls": { name: "Arctic White", brand: "James Hardie", color: "#F5F5F0", ... }, "trim": {...} }

  // Materials for picker
  const [materials, setMaterials] = useState([]);
  const [loadingMaterials, setLoadingMaterials] = useState(false);

  // Render state
  const [rendering, setRendering] = useState(false);
  const [renderResult, setRenderResult] = useState(null);
  const [showOriginal, setShowOriginal] = useState(false);

  // Image ref for sizing
  const imgRef = useRef(null);
  const containerRef = useRef(null);
  const [imgDims, setImgDims] = useState({ w: 0, h: 0 });

  const c = config?.colors || {};
  const primary = c.primary || '#B8860B';
  const muted = c.muted || '#78716C';
  const border = c.border || '#E7E5E4';
  const surface = c.surface || '#FFFFFF';

  // ─── Auto-detect surfaces on mount ──────────────────────
  useEffect(() => {
    if (imageBase64 && !detected && !detecting) {
      detectSurfaces();
    }
  }, [imageBase64]);

  async function detectSurfaces() {
    setDetecting(true);
    setDetectError(null);

    try {
      const res = await fetch('/api/visualize/detect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageBase64 }),
      });

      const data = await res.json();
      if (!res.ok) {
        setDetectError(data.error || 'Detection failed');
        return;
      }

      setSurfaces(data.surfaces || []);
      setDetected(true);

      // Auto-select first available category
      if (data.surfaces?.length > 0) {
        const cats = [...new Set(data.surfaces.map(s => s.category))];
        const sorted = cats.sort((a, b) =>
          (CATEGORY_CONFIG[a]?.order || 99) - (CATEGORY_CONFIG[b]?.order || 99)
        );
        setActiveCategory(sorted[0]);
      }
    } catch (err) {
      setDetectError('Failed to analyze photo');
    } finally {
      setDetecting(false);
    }
  }

  // ─── Load materials when category changes ───────────────
  useEffect(() => {
    if (activeCategory) {
      loadMaterials(activeCategory);
    }
  }, [activeCategory]);

  async function loadMaterials(category) {
    setLoadingMaterials(true);

    // Try exact category first (tenant might have 'trim', 'soffit' etc.)
    // Then fall back to mapped category
    const tryCategories = [category];
    const mapped = CATEGORY_TO_MATERIAL[category];
    if (mapped && mapped !== category) tryCategories.push(mapped);

    for (const cat of tryCategories) {
      try {
        const params = new URLSearchParams({ category: cat });
        if (config?.tenantId) params.set('tenant_id', config.tenantId);
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

  // ─── Select a material for the active category ──────────
  function selectMaterial(material) {
    setSelectedMaterials(prev => ({
      ...prev,
      [activeCategory]: material,
    }));
  }

  // ─── Remove material selection ──────────────────────────
  function removeMaterial(category) {
    setSelectedMaterials(prev => {
      const next = { ...prev };
      delete next[category];
      return next;
    });
  }

  // ─── Apply all changes → render ─────────────────────────
  async function applyDesign() {
    const changes = Object.entries(selectedMaterials).map(([category, mat]) => ({
      category,
      materialName: mat.name,
      materialBrand: mat.brand,
      materialColor: mat.color || mat.colorHex || mat.colorName,
    }));

    if (changes.length === 0) return;

    setRendering(true);
    onRenderStart?.();

    try {
      const res = await fetch('/api/visualize/render', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageBase64,
          changes,
          tenantSlug,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setDetectError(data.error || 'Render failed');
        return;
      }

      setRenderResult(`data:image/jpeg;base64,${data.generatedBase64}`);
      onRenderComplete?.(data.generatedBase64);
    } catch {
      setDetectError('Render failed. Please try again.');
    } finally {
      setRendering(false);
    }
  }

  // ─── Image load handler ─────────────────────────────────
  function handleImageLoad() {
    const img = imgRef.current;
    if (!img) return;
    setImgDims({ w: img.clientWidth, h: img.clientHeight });
  }

  useEffect(() => {
    function handleResize() {
      const img = imgRef.current;
      if (img) setImgDims({ w: img.clientWidth, h: img.clientHeight });
    }
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // ─── Derived state ──────────────────────────────────────
  const availableCategories = [...new Set(surfaces.map(s => s.category))].sort(
    (a, b) => (CATEGORY_CONFIG[a]?.order || 99) - (CATEGORY_CONFIG[b]?.order || 99)
  );

  const activeSurfaces = surfaces.filter(s => s.category === activeCategory);
  const changeCount = Object.keys(selectedMaterials).length;
  const displaySrc = showOriginal ? imageSrc : (renderResult || imageSrc);

  const selectedForCategory = activeCategory ? selectedMaterials[activeCategory] : null;

  // ─── Render ─────────────────────────────────────────────
  return (
    <div ref={containerRef} className="w-full">

      {/* ── Image with dots ────────────────────────────── */}
      <div className="relative rounded-2xl overflow-hidden shadow-lg border"
        style={{ borderColor: border }}>

        <img
          ref={imgRef}
          src={displaySrc}
          alt="House"
          className="w-full block"
          onLoad={handleImageLoad}
        />

        {/* Surface dots */}
        {detected && imgDims.w > 0 && surfaces.map(s => {
          const isActive = s.category === activeCategory;
          const hasProduct = !!selectedMaterials[s.category];
          const dotColor = hasProduct ? '#22C55E' : (isActive ? primary : '#9CA3AF');
          const dotSize = isActive ? 20 : 14;
          const dotOpacity = isActive ? 1 : 0.6;

          return (
            <button
              key={s.id}
              onClick={() => setActiveCategory(s.category)}
              className="absolute transition-all duration-200"
              style={{
                left: `${s.x}%`,
                top: `${s.y}%`,
                transform: 'translate(-50%, -50%)',
                zIndex: isActive ? 20 : 10,
              }}
              title={s.label}
            >
              <div
                className="rounded-full border-2 border-white shadow-lg transition-all duration-200 flex items-center justify-center"
                style={{
                  width: dotSize,
                  height: dotSize,
                  backgroundColor: dotColor,
                  opacity: dotOpacity,
                  boxShadow: isActive ? `0 0 0 3px ${primary}40, 0 2px 8px rgba(0,0,0,0.3)` : '0 2px 4px rgba(0,0,0,0.3)',
                }}
              >
                {hasProduct && (
                  <svg width="10" height="10" viewBox="0 0 16 16" fill="white">
                    <path d="M13.5 4.5L6 12l-3.5-3.5L3.5 7.5 6 10l6.5-6.5z" />
                  </svg>
                )}
              </div>
            </button>
          );
        })}

        {/* Detecting overlay */}
        {detecting && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/30">
            <div className="bg-white rounded-xl px-5 py-4 shadow-xl flex flex-col items-center gap-2">
              <div className="w-6 h-6 border-2 border-t-transparent rounded-full animate-spin"
                style={{ borderColor: primary, borderTopColor: 'transparent' }} />
              <span className="text-sm font-medium">Analyzing surfaces...</span>
              <span className="text-xs text-gray-500">Detecting walls, trim, windows...</span>
            </div>
          </div>
        )}

        {/* Rendering overlay */}
        {rendering && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/40">
            <div className="bg-white rounded-xl px-5 py-4 shadow-xl flex flex-col items-center gap-3 max-w-xs">
              <div className="w-8 h-8 border-3 border-t-transparent rounded-full animate-spin"
                style={{ borderColor: primary, borderTopColor: 'transparent', borderWidth: 3 }} />
              <div className="text-center">
                <div className="text-sm font-bold" style={{ color: primary }}>
                  Applying {changeCount} {changeCount === 1 ? 'change' : 'changes'}
                </div>
                {Object.entries(selectedMaterials).map(([cat, mat]) => (
                  <div key={cat} className="text-xs text-gray-500 mt-0.5">
                    {CATEGORY_CONFIG[cat]?.label}: {mat.brand} {mat.name}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Original / Result toggle */}
        {renderResult && !rendering && (
          <button
            onClick={() => setShowOriginal(!showOriginal)}
            className="absolute top-3 left-3 px-3 py-1.5 rounded-full text-xs font-bold text-white shadow-lg transition-all active:scale-95"
            style={{ background: showOriginal ? '#6B7280' : '#22C55E' }}>
            {showOriginal ? '◄ Original' : '✦ Design'}
          </button>
        )}
      </div>

      {/* ── Category tabs ──────────────────────────────── */}
      {detected && (
        <div className="mt-3 flex gap-1 overflow-x-auto pb-1 scrollbar-hide">
          {availableCategories.map(cat => {
            const cfg = CATEGORY_CONFIG[cat] || { label: cat, icon: '•' };
            const isActive = cat === activeCategory;
            const hasProduct = !!selectedMaterials[cat];

            return (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className="flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-bold transition-all active:scale-95 flex items-center gap-1.5"
                style={{
                  background: isActive ? primary : (hasProduct ? '#22C55E15' : '#F5F5F4'),
                  color: isActive ? 'white' : (hasProduct ? '#22C55E' : muted),
                  border: `1.5px solid ${isActive ? primary : (hasProduct ? '#22C55E50' : border)}`,
                }}
              >
                {hasProduct && !isActive && (
                  <svg width="10" height="10" viewBox="0 0 16 16" fill="#22C55E">
                    <path d="M13.5 4.5L6 12l-3.5-3.5L3.5 7.5 6 10l6.5-6.5z" />
                  </svg>
                )}
                {cfg.label}
              </button>
            );
          })}
        </div>
      )}

      {/* ── Selected materials summary ─────────────────── */}
      {changeCount > 0 && (
        <div className="mt-2 flex flex-wrap gap-1.5">
          {Object.entries(selectedMaterials).map(([cat, mat]) => (
            <div key={cat}
              className="flex items-center gap-1.5 px-2 py-1 rounded-lg text-xs border"
              style={{ borderColor: '#22C55E50', background: '#22C55E08' }}>
              <div className="w-3 h-3 rounded-sm border border-gray-300"
                style={{ background: mat.colorHex || mat.color || '#ccc' }} />
              <span className="font-medium capitalize">{CATEGORY_CONFIG[cat]?.label}</span>
              <span className="text-gray-500">→ {mat.name}</span>
              <button onClick={() => removeMaterial(cat)}
                className="ml-0.5 text-gray-400 hover:text-red-500 transition">✕</button>
            </div>
          ))}
        </div>
      )}

      {/* ── Material picker ────────────────────────────── */}
      {activeCategory && detected && (
        <div className="mt-3 p-3 rounded-xl border" style={{
          borderColor: primary + '30',
          background: primary + '05',
        }}>
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold capitalize" style={{ color: primary }}>
              Pick {CATEGORY_CONFIG[activeCategory]?.label || activeCategory}
            </span>
            <span className="text-xs" style={{ color: muted }}>
              {activeSurfaces.length} {activeSurfaces.length === 1 ? 'piece' : 'pieces'} detected
            </span>
          </div>

          {loadingMaterials ? (
            <div className="flex items-center gap-2 py-4 justify-center">
              <div className="w-4 h-4 border-2 border-t-transparent rounded-full animate-spin"
                style={{ borderColor: primary, borderTopColor: 'transparent' }} />
              <span className="text-xs text-gray-500">Loading materials...</span>
            </div>
          ) : materials.length === 0 ? (
            <p className="text-xs text-gray-500 py-3 text-center">
              No materials found for this category
            </p>
          ) : (
            <div className="grid grid-cols-4 gap-2 max-h-48 overflow-y-auto">
              {materials.map((mat, i) => {
                const isSelected = selectedForCategory?.name === mat.name
                  && selectedForCategory?.brand === mat.brand;

                return (
                  <button
                    key={`${mat.brand}-${mat.name}-${i}`}
                    onClick={() => selectMaterial(mat)}
                    className="flex flex-col items-center gap-1 p-1.5 rounded-lg border transition-all active:scale-95"
                    style={{
                      borderColor: isSelected ? primary : border,
                      background: isSelected ? primary + '10' : 'white',
                      borderWidth: isSelected ? 2 : 1,
                    }}
                  >
                    {/* Color swatch */}
                    <div className="w-full aspect-square rounded-md border border-gray-200"
                      style={{
                        background: mat.swatch
                          ? `url(${mat.swatch}) center/cover`
                          : (mat.colorHex || mat.color || '#E5E5E5'),
                      }}
                    />
                    <span className="text-[10px] font-medium text-center leading-tight line-clamp-2"
                      style={{ color: isSelected ? primary : '#374151' }}>
                      {mat.name}
                    </span>
                    {mat.brand && (
                      <span className="text-[9px] text-gray-400 text-center leading-tight truncate w-full">
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

      {/* ── Apply button ───────────────────────────────── */}
      {changeCount > 0 && !rendering && (
        <button
          onClick={applyDesign}
          className="mt-3 w-full py-3 rounded-xl font-bold text-white text-sm transition-all active:scale-[0.98] shadow-lg"
          style={{
            background: `linear-gradient(135deg, ${primary}, ${primary}DD)`,
            boxShadow: `0 4px 12px ${primary}40`,
          }}
        >
          Apply {changeCount} {changeCount === 1 ? 'Change' : 'Changes'}
        </button>
      )}

      {/* ── Error ──────────────────────────────────────── */}
      {detectError && (
        <div className="mt-2 p-2 rounded-lg bg-red-50 border border-red-200">
          <p className="text-xs text-red-700">{detectError}</p>
          <button onClick={() => { setDetectError(null); detectSurfaces(); }}
            className="text-xs text-red-600 font-bold mt-1 underline">
            Try again
          </button>
        </div>
      )}

      {/* ── Help text ──────────────────────────────────── */}
      {!detected && !detecting && (
        <p className="mt-3 text-center text-xs text-gray-400">
          Upload a photo to auto-detect surfaces
        </p>
      )}
    </div>
  );
}

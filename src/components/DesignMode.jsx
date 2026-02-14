'use client';

import { useState, useRef, useEffect } from 'react';

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
      const res = await fetch('/api/visualize/render', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageBase64: currentBase64, changes, tenantSlug }),
      });
      const data = await res.json();
      if (!res.ok) { setRenderError(data.error || 'Render failed'); return; }

      const newBase64 = data.generatedBase64;
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
        <div className="w-full lg:w-[75%] lg:flex-shrink-0">
          <div className="relative rounded-2xl overflow-hidden shadow-lg border lg:sticky lg:top-4"
            style={{ borderColor: border }}>

            <img
              ref={imgRef}
              src={displaySrc}
              alt="House"
              className="w-full block"
            />

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

            {/* Original / Design toggle + Reset */}
            {iterationCount > 0 && !rendering && (
              <div className="absolute top-3 left-3 flex gap-1.5">
                <button
                  onClick={() => setShowOriginal(!showOriginal)}
                  className="px-3 py-1.5 rounded-full text-xs font-bold text-white shadow-lg transition-all active:scale-95"
                  style={{ background: showOriginal ? '#6B7280' : '#22C55E' }}>
                  {showOriginal ? '◄ Original' : '✦ Design'}
                </button>
                <button
                  onClick={resetAll}
                  className="px-3 py-1.5 rounded-full text-xs font-bold shadow-lg transition-all active:scale-95 bg-white text-gray-600 border border-gray-200">
                  ↺ Reset
                </button>
              </div>
            )}

            {/* Iteration badge */}
            {iterationCount > 0 && !rendering && (
              <div className="absolute top-3 right-3 px-2.5 py-1 rounded-full text-xs font-bold text-white shadow"
                style={{ background: '#22C55E' }}>
                Round {iterationCount + 1}
              </div>
            )}
          </div>
        </div>

        {/* ── RIGHT: Picker panel ─────────────────────── */}
        <div className="w-full lg:w-[25%] lg:min-w-[240px] flex flex-col">

          {/* Category tabs */}
          <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-hide">
            {categories.map(cat => {
              const cfg = CATEGORY_CONFIG[cat];
              const isActive = cat === activeCategory;
              const hasProduct = !!selectedMaterials[cat];

              return (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  className="flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-bold transition-all active:scale-95 flex items-center gap-1"
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
                    max-h-[280px] lg:max-h-[calc(100vh-300px)]"
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

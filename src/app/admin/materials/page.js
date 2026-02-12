'use client';

import { useState, useEffect, useMemo } from 'react';
import { PROJECTS, MATERIALS, SUBCATEGORIES, COLOR_FAMILIES, TOTAL_PRODUCTS } from '@/lib/materials';

const CATEGORIES = PROJECTS.map(p => ({ id: p.id, label: p.label, icon: p.icon }));

const EMPTY_MATERIAL = {
  tenant_id: null,
  category: 'siding',
  subcategory: '',
  brand: '',
  name: '',
  color_name: '',
  color_hex: '#888888',
  color_family: 'gray',
  type: '',
  swatch_url: '',
  description: '',
  ai_prompt_hint: '',
  sort_order: 0,
};

export default function MaterialsPage() {
  // ─── State ───────────────────────────────
  const [activeTab, setActiveTab] = useState('catalog'); // 'catalog' | 'custom'
  const [activeCategory, setActiveCategory] = useState('siding');
  const [activeSubcat, setActiveSubcat] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterColor, setFilterColor] = useState('');
  const [filterBrand, setFilterBrand] = useState('');

  // Custom materials from DB
  const [customMaterials, setCustomMaterials] = useState([]);
  const [tenants, setTenants] = useState([]);
  const [loadingCustom, setLoadingCustom] = useState(true);

  // Edit modal
  const [editing, setEditing] = useState(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');

  // Bulk actions
  const [selectedIds, setSelectedIds] = useState(new Set());

  // ─── Load custom materials + tenants ─────
  useEffect(() => {
    Promise.all([
      fetch('/api/admin/materials').then(r => r.json()),
      fetch('/api/admin/tenants').then(r => r.json()),
    ]).then(([mats, tens]) => {
      setCustomMaterials(Array.isArray(mats) ? mats : []);
      setTenants(Array.isArray(tens) ? tens : []);
      setLoadingCustom(false);
    }).catch(() => setLoadingCustom(false));
  }, []);

  // ─── Built-in materials for current category ──
  const builtInMaterials = useMemo(() => {
    return (MATERIALS[activeCategory] || []).map(m => ({
      ...m,
      _source: 'builtin',
    }));
  }, [activeCategory]);

  // ─── Custom materials for current category ──
  const categoryCustom = useMemo(() => {
    return customMaterials
      .filter(m => m.category === activeCategory)
      .map(m => ({
        id: m.id,
        name: m.name,
        brand: m.brand,
        color: m.color_hex || '#888',
        accent: m.color_hex || '#666',
        colorFamily: m.color_family || 'gray',
        type: m.type || m.category,
        subcategory: m.subcategory || '',
        aiHint: m.ai_prompt_hint || '',
        description: m.description,
        swatch_url: m.swatch_url,
        tenant_id: m.tenant_id,
        tenantName: m.tenants?.company_name || null,
        active: m.active,
        sort_order: m.sort_order,
        _source: 'custom',
        _dbId: m.id,
      }));
  }, [customMaterials, activeCategory]);

  // ─── Combined for catalog view ──
  const allMaterials = useMemo(() => {
    if (activeTab === 'custom') return categoryCustom;
    return [...categoryCustom, ...builtInMaterials];
  }, [activeTab, categoryCustom, builtInMaterials]);

  // ─── Subcategories for current category ──
  const subcats = SUBCATEGORIES[activeCategory] || null;

  // ─── Filtered materials ──
  const filteredMaterials = useMemo(() => {
    return allMaterials.filter(m => {
      if (activeSubcat && m.subcategory && m.subcategory !== activeSubcat) return false;
      if (filterColor && m.colorFamily !== filterColor) return false;
      if (filterBrand && m.brand !== filterBrand) return false;
      if (searchTerm) {
        const s = searchTerm.toLowerCase();
        if (
          !m.name?.toLowerCase().includes(s) &&
          !m.brand?.toLowerCase().includes(s) &&
          !m.type?.toLowerCase().includes(s) &&
          !m.aiHint?.toLowerCase().includes(s)
        ) return false;
      }
      return true;
    });
  }, [allMaterials, activeSubcat, filterColor, filterBrand, searchTerm]);

  // ─── Brands in current view ──
  const availableBrands = useMemo(() => {
    const brands = [...new Set(allMaterials
      .filter(m => !activeSubcat || !m.subcategory || m.subcategory === activeSubcat)
      .map(m => m.brand)
    )].sort();
    return brands;
  }, [allMaterials, activeSubcat]);

  // ─── Category counts ──
  const categoryCounts = useMemo(() => {
    const counts = {};
    CATEGORIES.forEach(c => {
      const builtin = (MATERIALS[c.id] || []).length;
      const custom = customMaterials.filter(m => m.category === c.id).length;
      counts[c.id] = { builtin, custom, total: builtin + custom };
    });
    return counts;
  }, [customMaterials]);

  // ─── Handlers ────────────────────────────
  const resetFilters = () => {
    setActiveSubcat('');
    setSearchTerm('');
    setFilterColor('');
    setFilterBrand('');
  };

  const handleCategoryChange = (catId) => {
    setActiveCategory(catId);
    resetFilters();
  };

  const openNewMaterial = () => {
    setEditing({
      ...EMPTY_MATERIAL,
      category: activeCategory,
      subcategory: activeSubcat || '',
    });
    setSaveError('');
  };

  const openEditMaterial = (mat) => {
    if (mat._source === 'builtin') {
      // Can't edit built-in, but can duplicate as custom
      setEditing({
        ...EMPTY_MATERIAL,
        category: activeCategory,
        subcategory: mat.subcategory || '',
        brand: mat.brand,
        name: `${mat.name} (Custom)`,
        color_hex: mat.color,
        color_family: mat.colorFamily,
        type: mat.type,
        ai_prompt_hint: mat.aiHint,
      });
    } else {
      // Edit custom material
      const dbMat = customMaterials.find(m => m.id === mat._dbId);
      if (dbMat) {
        setEditing({ ...dbMat });
      }
    }
    setSaveError('');
  };

  const handleSave = async () => {
    setSaving(true);
    setSaveError('');

    const isNew = !editing.id;
    const url = isNew ? '/api/admin/materials' : `/api/admin/materials/${editing.id}`;
    const method = isNew ? 'POST' : 'PUT';

    const body = { ...editing };
    if (body.tenant_id === 'null' || body.tenant_id === '') body.tenant_id = null;

    try {
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const data = await res.json();

      if (!res.ok) {
        setSaveError(data.error || 'Failed to save');
        setSaving(false);
        return;
      }

      if (isNew) {
        setCustomMaterials(prev => [...prev, data]);
      } else {
        setCustomMaterials(prev => prev.map(m => m.id === data.id ? data : m));
      }
      setEditing(null);
    } catch (err) {
      setSaveError('Network error');
    }
    setSaving(false);
  };

  const handleDelete = async (mat) => {
    if (mat._source !== 'custom') return;
    if (!confirm(`Delete "${mat.brand} — ${mat.name}"?`)) return;

    try {
      await fetch(`/api/admin/materials/${mat._dbId}`, { method: 'DELETE' });
      setCustomMaterials(prev => prev.filter(m => m.id !== mat._dbId));
    } catch (err) {
      alert('Failed to delete');
    }
  };

  const handleDuplicate = (mat) => {
    setEditing({
      ...EMPTY_MATERIAL,
      category: activeCategory,
      subcategory: mat.subcategory || '',
      brand: mat.brand,
      name: `${mat.name} (copy)`,
      color_hex: mat.color || mat.color_hex || '#888888',
      color_family: mat.colorFamily || mat.color_family || 'gray',
      type: mat.type || '',
      ai_prompt_hint: mat.aiHint || mat.ai_prompt_hint || '',
    });
    setSaveError('');
  };

  // ─── Render ──────────────────────────────
  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-[1400px]">

      {/* ─── Header ─────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Materials Catalog</h1>
          <p className="text-sm text-stone-500 mt-1">
            {TOTAL_PRODUCTS} built-in products · {customMaterials.length} custom
          </p>
        </div>
        <button
          onClick={openNewMaterial}
          className="bg-amber-700 hover:bg-amber-600 text-white px-4 py-2.5 rounded-lg text-sm font-semibold transition flex items-center gap-2 self-start"
        >
          <span className="text-lg leading-none">+</span> Add Custom Material
        </button>
      </div>

      {/* ─── Tab Toggle ─────────────────── */}
      <div className="flex gap-1 mb-5 bg-stone-900 rounded-lg p-1 w-fit">
        <button
          onClick={() => setActiveTab('catalog')}
          className={`px-4 py-2 rounded-md text-sm font-medium transition ${
            activeTab === 'catalog' ? 'bg-stone-700 text-white' : 'text-stone-400 hover:text-stone-200'
          }`}
        >
          Full Catalog
        </button>
        <button
          onClick={() => setActiveTab('custom')}
          className={`px-4 py-2 rounded-md text-sm font-medium transition ${
            activeTab === 'custom' ? 'bg-stone-700 text-white' : 'text-stone-400 hover:text-stone-200'
          }`}
        >
          Custom Only
          {customMaterials.length > 0 && (
            <span className="ml-1.5 bg-amber-700/30 text-amber-400 text-xs px-1.5 py-0.5 rounded">{customMaterials.length}</span>
          )}
        </button>
      </div>

      {/* ─── Category Tabs ──────────────── */}
      <div className="flex gap-1 overflow-x-auto pb-2 mb-4 scrollbar-hide">
        {CATEGORIES.map(cat => (
          <button
            key={cat.id}
            onClick={() => handleCategoryChange(cat.id)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition ${
              activeCategory === cat.id
                ? 'bg-amber-700/20 text-amber-400 border border-amber-700/30'
                : 'text-stone-400 hover:text-stone-200 hover:bg-stone-800/50 border border-transparent'
            }`}
          >
            <span className="text-base">{cat.icon}</span>
            <span>{cat.label}</span>
            <span className={`text-xs px-1.5 py-0.5 rounded ${
              activeCategory === cat.id ? 'bg-amber-700/20 text-amber-400' : 'bg-stone-800 text-stone-500'
            }`}>
              {categoryCounts[cat.id]?.total || 0}
            </span>
          </button>
        ))}
      </div>

      {/* ─── Subcategory Pills ──────────── */}
      {subcats && (
        <div className="flex gap-2 mb-4 flex-wrap">
          <button
            onClick={() => setActiveSubcat('')}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition ${
              !activeSubcat ? 'bg-stone-200 text-stone-900' : 'bg-stone-800 text-stone-400 hover:text-stone-200'
            }`}
          >
            All
          </button>
          {subcats.map(sc => {
            const count = allMaterials.filter(m => m.subcategory === sc.id).length;
            return (
              <button
                key={sc.id}
                onClick={() => setActiveSubcat(activeSubcat === sc.id ? '' : sc.id)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium transition flex items-center gap-1.5 ${
                  activeSubcat === sc.id
                    ? 'bg-stone-200 text-stone-900'
                    : 'bg-stone-800 text-stone-400 hover:text-stone-200'
                }`}
              >
                {sc.icon && <span>{sc.icon}</span>}
                {sc.label}
                <span className="opacity-60">{count}</span>
              </button>
            );
          })}
        </div>
      )}

      {/* ─── Search & Filters ──────────── */}
      <div className="flex flex-wrap gap-3 mb-5">
        <div className="relative flex-1 min-w-[200px] max-w-md">
          <input
            type="text"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            placeholder="Search materials..."
            className="w-full bg-stone-900 border border-stone-700 rounded-lg pl-9 pr-3 py-2.5 text-sm text-white placeholder-stone-500 focus:outline-none focus:border-amber-600"
          />
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-500 text-sm">🔍</span>
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-stone-500 hover:text-stone-300 text-xs"
            >✕</button>
          )}
        </div>
        <select
          value={filterBrand}
          onChange={e => setFilterBrand(e.target.value)}
          className="bg-stone-900 border border-stone-700 rounded-lg px-3 py-2.5 text-sm text-stone-200 focus:outline-none focus:border-amber-600"
        >
          <option value="">All Brands</option>
          {availableBrands.map(b => <option key={b} value={b}>{b}</option>)}
        </select>
        <select
          value={filterColor}
          onChange={e => setFilterColor(e.target.value)}
          className="bg-stone-900 border border-stone-700 rounded-lg px-3 py-2.5 text-sm text-stone-200 focus:outline-none focus:border-amber-600"
        >
          <option value="">All Colors</option>
          {COLOR_FAMILIES.map(cf => <option key={cf.id} value={cf.id}>{cf.label}</option>)}
        </select>
        {(searchTerm || filterBrand || filterColor || activeSubcat) && (
          <button
            onClick={resetFilters}
            className="text-xs text-stone-500 hover:text-stone-300 px-3 py-2.5 transition"
          >
            Clear filters
          </button>
        )}
      </div>

      {/* ─── Results Count ─────────────── */}
      <div className="flex items-center justify-between mb-4">
        <p className="text-xs text-stone-500">
          {filteredMaterials.length} product{filteredMaterials.length !== 1 ? 's' : ''}
          {activeTab === 'catalog' && (
            <span>
              {' '}({filteredMaterials.filter(m => m._source === 'custom').length} custom, {filteredMaterials.filter(m => m._source === 'builtin').length} built-in)
            </span>
          )}
        </p>
      </div>

      {/* ─── Materials Grid ────────────── */}
      {filteredMaterials.length === 0 ? (
        <div className="bg-stone-900 border border-stone-800 rounded-xl p-12 text-center">
          <div className="text-3xl mb-3">📦</div>
          <p className="text-stone-400 text-sm mb-2">
            {activeTab === 'custom'
              ? 'No custom materials in this category yet.'
              : 'No materials match your filters.'}
          </p>
          {activeTab === 'custom' && (
            <button onClick={openNewMaterial} className="text-amber-400 hover:text-amber-300 text-sm font-medium">
              + Add one now
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
          {filteredMaterials.map((m, i) => (
            <MaterialCard
              key={`${m._source}-${m.id || i}`}
              material={m}
              onEdit={() => openEditMaterial(m)}
              onDuplicate={() => handleDuplicate(m)}
              onDelete={() => handleDelete(m)}
            />
          ))}
        </div>
      )}

      {/* ─── Edit/Create Modal ─────────── */}
      {editing && (
        <EditModal
          editing={editing}
          setEditing={setEditing}
          tenants={tenants}
          subcats={SUBCATEGORIES[editing.category] || null}
          saving={saving}
          saveError={saveError}
          onSave={handleSave}
          onClose={() => setEditing(null)}
        />
      )}
    </div>
  );
}


// ═══════════════════════════════════════════
// Material Card Component
// ═══════════════════════════════════════════
function MaterialCard({ material: m, onEdit, onDuplicate, onDelete }) {
  const [showActions, setShowActions] = useState(false);
  const isCustom = m._source === 'custom';

  return (
    <div
      className="group bg-stone-900 border border-stone-800 rounded-xl overflow-hidden hover:border-stone-600 transition relative"
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
    >
      {/* Color swatch */}
      <div
        className="h-16 w-full relative"
        style={{ background: m.color || m.color_hex || '#888' }}
      >
        {/* Custom badge */}
        {isCustom && (
          <span className="absolute top-1.5 left-1.5 bg-amber-600 text-white text-[9px] font-bold px-1.5 py-0.5 rounded">
            CUSTOM
          </span>
        )}
        {/* Tenant badge */}
        {m.tenantName && (
          <span className="absolute top-1.5 right-1.5 bg-blue-600/80 text-white text-[9px] font-bold px-1.5 py-0.5 rounded">
            {m.tenantName}
          </span>
        )}

        {/* Hover actions */}
        {showActions && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center gap-2">
            <button
              onClick={onEdit}
              className="bg-white/20 hover:bg-white/30 text-white text-xs px-2.5 py-1.5 rounded-md font-medium backdrop-blur-sm transition"
            >
              {isCustom ? 'Edit' : 'Duplicate'}
            </button>
            {isCustom && (
              <button
                onClick={onDelete}
                className="bg-red-500/30 hover:bg-red-500/50 text-white text-xs px-2.5 py-1.5 rounded-md font-medium backdrop-blur-sm transition"
              >
                Delete
              </button>
            )}
          </div>
        )}
      </div>

      {/* Info */}
      <div className="p-2.5">
        <div className="text-xs font-medium text-white truncate leading-tight">{m.name}</div>
        <div className="text-[10px] text-stone-500 truncate mt-0.5">{m.brand}</div>
        {m.type && (
          <div className="text-[10px] text-stone-600 truncate mt-0.5">{m.type}</div>
        )}
      </div>
    </div>
  );
}


// ═══════════════════════════════════════════
// Edit Modal Component
// ═══════════════════════════════════════════
function EditModal({ editing, setEditing, tenants, subcats, saving, saveError, onSave, onClose }) {
  const isNew = !editing.id;
  const categories = PROJECTS.map(p => ({ id: p.id, label: p.label }));

  // When category changes, update available subcats
  const currentSubcats = SUBCATEGORIES[editing.category] || null;

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div
        className="bg-stone-900 border border-stone-800 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-stone-800 flex items-center justify-between sticky top-0 bg-stone-900 z-10 rounded-t-2xl">
          <div>
            <h2 className="text-base font-bold text-white">{isNew ? 'Add Material' : 'Edit Material'}</h2>
            <p className="text-xs text-stone-500 mt-0.5">
              {isNew ? 'Create a custom material that supplements the built-in catalog' : 'Edit this custom material'}
            </p>
          </div>
          <button onClick={onClose} className="text-stone-500 hover:text-stone-300 text-lg w-8 h-8 flex items-center justify-center rounded-lg hover:bg-stone-800">✕</button>
        </div>

        {/* Form */}
        <div className="p-6 space-y-5">

          {/* Row 1: Category + Subcategory + Scope */}
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-medium text-stone-400 mb-1.5">Category *</label>
              <select
                value={editing.category}
                onChange={e => setEditing(p => ({ ...p, category: e.target.value, subcategory: '' }))}
                className="w-full bg-stone-800 border border-stone-700 rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-amber-600"
              >
                {categories.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
              </select>
            </div>
            {currentSubcats && (
              <div>
                <label className="block text-xs font-medium text-stone-400 mb-1.5">Subcategory</label>
                <select
                  value={editing.subcategory || ''}
                  onChange={e => setEditing(p => ({ ...p, subcategory: e.target.value }))}
                  className="w-full bg-stone-800 border border-stone-700 rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-amber-600"
                >
                  <option value="">None</option>
                  {currentSubcats.map(sc => <option key={sc.id} value={sc.id}>{sc.label}</option>)}
                </select>
              </div>
            )}
            <div>
              <label className="block text-xs font-medium text-stone-400 mb-1.5">Scope</label>
              <select
                value={editing.tenant_id || 'null'}
                onChange={e => setEditing(p => ({ ...p, tenant_id: e.target.value === 'null' ? null : e.target.value }))}
                className="w-full bg-stone-800 border border-stone-700 rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-amber-600"
              >
                <option value="null">🌐 All tenants</option>
                {tenants.map(t => <option key={t.id} value={t.id}>{t.company_name}</option>)}
              </select>
            </div>
          </div>

          {/* Row 2: Brand + Name + Type */}
          <div className="grid grid-cols-3 gap-4">
            <Field label="Brand *" value={editing.brand} onChange={v => setEditing(p => ({ ...p, brand: v }))} placeholder="James Hardie" />
            <Field label="Product Name *" value={editing.name} onChange={v => setEditing(p => ({ ...p, name: v }))} placeholder="Arctic White Lap" />
            <Field label="Type" value={editing.type} onChange={v => setEditing(p => ({ ...p, type: v }))} placeholder="Fiber Cement Lap" />
          </div>

          {/* Row 3: Color */}
          <div className="grid grid-cols-4 gap-4">
            <Field label="Color Name" value={editing.color_name} onChange={v => setEditing(p => ({ ...p, color_name: v }))} placeholder="Arctic White" />
            <div>
              <label className="block text-xs font-medium text-stone-400 mb-1.5">Color Hex</label>
              <div className="flex gap-2">
                <input
                  type="color"
                  value={editing.color_hex || '#888888'}
                  onChange={e => setEditing(p => ({ ...p, color_hex: e.target.value }))}
                  className="w-10 h-[38px] rounded border border-stone-700 bg-transparent cursor-pointer"
                />
                <input
                  type="text"
                  value={editing.color_hex || ''}
                  onChange={e => setEditing(p => ({ ...p, color_hex: e.target.value }))}
                  placeholder="#F5F5F0"
                  className="flex-1 bg-stone-800 border border-stone-700 rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-amber-600"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-stone-400 mb-1.5">Color Family</label>
              <select
                value={editing.color_family || 'gray'}
                onChange={e => setEditing(p => ({ ...p, color_family: e.target.value }))}
                className="w-full bg-stone-800 border border-stone-700 rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-amber-600"
              >
                {COLOR_FAMILIES.map(cf => <option key={cf.id} value={cf.id}>{cf.label}</option>)}
              </select>
            </div>
            <Field label="Sort Order" value={editing.sort_order} type="number" onChange={v => setEditing(p => ({ ...p, sort_order: parseInt(v) || 0 }))} placeholder="0" />
          </div>

          {/* Preview swatch */}
          <div className="flex items-center gap-4">
            <div className="w-20 h-12 rounded-lg border border-stone-700" style={{ background: editing.color_hex || '#888' }} />
            <div>
              <div className="text-sm text-white font-medium">{editing.name || 'Product Name'}</div>
              <div className="text-xs text-stone-500">{editing.brand || 'Brand'} · {editing.type || 'Type'}</div>
            </div>
          </div>

          {/* AI Prompt Hint */}
          <div>
            <label className="block text-xs font-medium text-stone-400 mb-1.5">
              AI Prompt Hint
              <span className="text-stone-600 font-normal ml-1">— Describe how this material looks for AI image generation</span>
            </label>
            <textarea
              value={editing.ai_prompt_hint || ''}
              onChange={e => setEditing(p => ({ ...p, ai_prompt_hint: e.target.value }))}
              placeholder="e.g. smooth horizontal lap siding, 8.25 inch exposure, clean lines, bright white fiber cement"
              rows={3}
              className="w-full bg-stone-800 border border-stone-700 rounded-lg px-3 py-2.5 text-sm text-white placeholder-stone-600 focus:outline-none focus:border-amber-600 resize-none"
            />
          </div>

          {/* Description */}
          <Field label="Description (optional)" value={editing.description} onChange={v => setEditing(p => ({ ...p, description: v }))} placeholder="Additional notes about this material" />

          {/* Swatch Image URL */}
          <Field label="Swatch Image URL (optional)" value={editing.swatch_url} onChange={v => setEditing(p => ({ ...p, swatch_url: v }))} placeholder="https://example.com/swatch.jpg" />
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-stone-800 flex items-center gap-3 sticky bottom-0 bg-stone-900 rounded-b-2xl">
          <button
            onClick={onSave}
            disabled={saving || !editing.brand || !editing.name}
            className="bg-amber-700 hover:bg-amber-600 disabled:opacity-40 disabled:hover:bg-amber-700 text-white px-6 py-2.5 rounded-lg text-sm font-semibold transition"
          >
            {saving ? 'Saving...' : isNew ? 'Create Material' : 'Save Changes'}
          </button>
          <button onClick={onClose} className="text-stone-400 hover:text-stone-200 text-sm px-3 py-2.5 transition">Cancel</button>
          {saveError && <p className="text-red-400 text-xs ml-2">{saveError}</p>}
        </div>
      </div>
    </div>
  );
}


// ═══════════════════════════════════════════
// Reusable Field Component
// ═══════════════════════════════════════════
function Field({ label, value, onChange, placeholder, type = 'text' }) {
  return (
    <div>
      <label className="block text-xs font-medium text-stone-400 mb-1.5">{label}</label>
      <input
        type={type}
        value={value || ''}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full bg-stone-800 border border-stone-700 rounded-lg px-3 py-2.5 text-sm text-white placeholder-stone-600 focus:outline-none focus:border-amber-600"
      />
    </div>
  );
}

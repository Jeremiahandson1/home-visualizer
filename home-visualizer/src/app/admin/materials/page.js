'use client';

import { useState, useEffect } from 'react';

const CATEGORIES = ['siding', 'roofing', 'paint', 'windows', 'deck', 'garage', 'gutters', 'exterior', 'kitchen', 'bathroom', 'flooring'];

const COLOR_FAMILIES = ['white', 'gray', 'black', 'blue', 'green', 'brown', 'red', 'yellow', 'beige'];

const EMPTY_MATERIAL = {
  tenant_id: null,
  category: 'siding',
  brand: '',
  name: '',
  color_name: '',
  color_hex: '#888888',
  color_family: 'gray',
  swatch_url: '',
  description: '',
  ai_prompt_hint: '',
  sort_order: 0,
};

export default function MaterialsPage() {
  const [materials, setMaterials] = useState([]);
  const [tenants, setTenants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterTenant, setFilterTenant] = useState('all');
  const [editing, setEditing] = useState(null); // material object or 'new'
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    Promise.all([
      fetch('/api/admin/materials').then(r => r.json()),
      fetch('/api/admin/tenants').then(r => r.json()),
    ]).then(([mats, tens]) => {
      setMaterials(mats);
      setTenants(tens);
      setLoading(false);
    });
  }, []);

  const filtered = materials.filter(m => {
    if (filterCategory !== 'all' && m.category !== filterCategory) return false;
    if (filterTenant === 'global' && m.tenant_id !== null) return false;
    if (filterTenant !== 'all' && filterTenant !== 'global' && m.tenant_id !== filterTenant) return false;
    return true;
  });

  const handleSave = async () => {
    setSaving(true);
    const isNew = !editing.id;
    const url = isNew ? '/api/admin/materials' : `/api/admin/materials/${editing.id}`;
    const method = isNew ? 'POST' : 'PUT';

    const body = { ...editing };
    if (body.tenant_id === 'null' || body.tenant_id === '') body.tenant_id = null;

    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    const data = await res.json();
    setSaving(false);

    if (res.ok) {
      if (isNew) {
        setMaterials(prev => [...prev, data]);
      } else {
        setMaterials(prev => prev.map(m => m.id === data.id ? data : m));
      }
      setEditing(null);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this material?')) return;
    await fetch(`/api/admin/materials/${id}`, { method: 'DELETE' });
    setMaterials(prev => prev.filter(m => m.id !== id));
  };

  const handleDuplicate = (mat) => {
    setEditing({
      ...mat,
      id: undefined,
      name: `${mat.name} (copy)`,
    });
  };

  return (
    <div className="p-8 max-w-6xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Materials</h1>
          <p className="text-sm text-stone-500 mt-1">
            Custom materials override built-in defaults. Global materials are available to all tenants.
          </p>
        </div>
        <button
          onClick={() => setEditing({ ...EMPTY_MATERIAL })}
          className="bg-amber-700 hover:bg-amber-600 text-white px-4 py-2 rounded-lg text-sm font-semibold transition"
        >
          + Add Material
        </button>
      </div>

      {/* Filters */}
      <div className="flex gap-3 mb-5">
        <select
          value={filterCategory}
          onChange={e => setFilterCategory(e.target.value)}
          className="bg-stone-800 border border-stone-700 rounded-lg px-3 py-2 text-sm text-stone-200 focus:outline-none"
        >
          <option value="all">All Categories</option>
          {CATEGORIES.map(c => <option key={c} value={c} className="capitalize">{c}</option>)}
        </select>
        <select
          value={filterTenant}
          onChange={e => setFilterTenant(e.target.value)}
          className="bg-stone-800 border border-stone-700 rounded-lg px-3 py-2 text-sm text-stone-200 focus:outline-none"
        >
          <option value="all">All Tenants</option>
          <option value="global">Global Only</option>
          {tenants.map(t => <option key={t.id} value={t.id}>{t.company_name}</option>)}
        </select>
      </div>

      {/* Materials table */}
      <div className="bg-stone-900 border border-stone-800 rounded-xl overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-stone-800 text-xs text-stone-500 uppercase tracking-wider">
              <th className="text-left px-5 py-3 font-semibold w-8">Color</th>
              <th className="text-left px-5 py-3 font-semibold">Brand / Name</th>
              <th className="text-left px-5 py-3 font-semibold">Category</th>
              <th className="text-left px-5 py-3 font-semibold">Scope</th>
              <th className="text-left px-5 py-3 font-semibold">AI Hint</th>
              <th className="px-5 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-800">
            {loading ? (
              [...Array(4)].map((_, i) => (
                <tr key={i}><td colSpan={6} className="px-5 py-4"><div className="h-5 bg-stone-800 rounded animate-pulse" /></td></tr>
              ))
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-5 py-8 text-center text-stone-500 text-sm">
                  No custom materials yet. Built-in defaults (James Hardie, GAF, Trex) are used automatically.
                </td>
              </tr>
            ) : (
              filtered.map(m => (
                <tr key={m.id} className="hover:bg-stone-800/30 transition">
                  <td className="px-5 py-3">
                    {m.color_hex ? (
                      <div className="w-6 h-6 rounded border border-stone-600" style={{ background: m.color_hex }} />
                    ) : m.swatch_url ? (
                      <img src={m.swatch_url} alt="" className="w-6 h-6 rounded border border-stone-600 object-cover" />
                    ) : (
                      <div className="w-6 h-6 rounded border border-stone-700 bg-stone-800" />
                    )}
                  </td>
                  <td className="px-5 py-3">
                    <div className="text-sm font-medium text-white">{m.brand}</div>
                    <div className="text-xs text-stone-400">{m.name} {m.color_name && `· ${m.color_name}`}</div>
                  </td>
                  <td className="px-5 py-3">
                    <span className="text-xs bg-stone-800 text-stone-300 px-2 py-0.5 rounded capitalize">{m.category}</span>
                  </td>
                  <td className="px-5 py-3 text-xs text-stone-400">
                    {m.tenant_id ? (m.tenants?.company_name || 'Tenant-specific') : (
                      <span className="text-amber-400">Global</span>
                    )}
                  </td>
                  <td className="px-5 py-3 text-xs text-stone-500 max-w-48 truncate">
                    {m.ai_prompt_hint || '—'}
                  </td>
                  <td className="px-5 py-3 text-right">
                    <div className="flex gap-2 justify-end">
                      <button onClick={() => setEditing({ ...m })} className="text-xs text-amber-400 hover:text-amber-300 font-medium">Edit</button>
                      <button onClick={() => handleDuplicate(m)} className="text-xs text-stone-500 hover:text-stone-300">Dupe</button>
                      <button onClick={() => handleDelete(m.id)} className="text-xs text-red-400 hover:text-red-300">Del</button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Edit/Create Modal */}
      {editing && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4" onClick={() => setEditing(null)}>
          <div className="bg-stone-900 border border-stone-800 rounded-2xl w-full max-w-lg max-h-[85vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="px-6 py-4 border-b border-stone-800 flex items-center justify-between">
              <h2 className="text-base font-bold text-white">{editing.id ? 'Edit Material' : 'Add Material'}</h2>
              <button onClick={() => setEditing(null)} className="text-stone-500 hover:text-stone-300 text-lg">✕</button>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-stone-400 mb-1">Category *</label>
                  <select
                    value={editing.category}
                    onChange={e => setEditing(p => ({ ...p, category: e.target.value }))}
                    className="w-full bg-stone-800 border border-stone-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none"
                  >
                    {CATEGORIES.map(c => <option key={c} value={c} className="capitalize">{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-stone-400 mb-1">Scope</label>
                  <select
                    value={editing.tenant_id || 'null'}
                    onChange={e => setEditing(p => ({ ...p, tenant_id: e.target.value === 'null' ? null : e.target.value }))}
                    className="w-full bg-stone-800 border border-stone-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none"
                  >
                    <option value="null">Global (all tenants)</option>
                    {tenants.map(t => <option key={t.id} value={t.id}>{t.company_name}</option>)}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <ModalField label="Brand *" value={editing.brand} onChange={v => setEditing(p => ({ ...p, brand: v }))} placeholder="James Hardie" />
                <ModalField label="Product Name *" value={editing.name} onChange={v => setEditing(p => ({ ...p, name: v }))} placeholder="HardiePlank Lap Siding" />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <ModalField label="Color Name" value={editing.color_name} onChange={v => setEditing(p => ({ ...p, color_name: v }))} placeholder="Iron Gray" />
                <div>
                  <label className="block text-xs font-medium text-stone-400 mb-1">Color Hex</label>
                  <div className="flex gap-2">
                    <input
                      type="color"
                      value={editing.color_hex || '#888888'}
                      onChange={e => setEditing(p => ({ ...p, color_hex: e.target.value }))}
                      className="w-10 h-9 rounded border border-stone-700 bg-transparent cursor-pointer"
                    />
                    <input
                      type="text"
                      value={editing.color_hex || ''}
                      onChange={e => setEditing(p => ({ ...p, color_hex: e.target.value }))}
                      placeholder="#5C5C5C"
                      className="flex-1 bg-stone-800 border border-stone-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none"
                    />
                  </div>
                </div>
                <ModalField label="Sort Order" value={editing.sort_order} type="number" onChange={v => setEditing(p => ({ ...p, sort_order: parseInt(v) || 0 }))} placeholder="0" />
                <div>
                  <label className="block text-xs font-medium text-stone-400 mb-1">Color Family</label>
                  <select
                    value={editing.color_family || 'gray'}
                    onChange={e => setEditing(p => ({ ...p, color_family: e.target.value }))}
                    className="w-full bg-stone-800 border border-stone-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none"
                  >
                    {COLOR_FAMILIES.map(cf => <option key={cf} value={cf}>{cf.charAt(0).toUpperCase() + cf.slice(1)}</option>)}
                  </select>
                </div>
              </div>

              <ModalField label="Swatch Image URL" value={editing.swatch_url} onChange={v => setEditing(p => ({ ...p, swatch_url: v }))} placeholder="https://..." />

              <div>
                <label className="block text-xs font-medium text-stone-400 mb-1">
                  AI Prompt Hint
                  <span className="text-stone-600 font-normal ml-1">— Extra detail for the AI about this material's appearance</span>
                </label>
                <textarea
                  value={editing.ai_prompt_hint || ''}
                  onChange={e => setEditing(p => ({ ...p, ai_prompt_hint: e.target.value }))}
                  placeholder="e.g. Horizontal 7-inch lap boards with smooth factory finish, subtle wood grain texture"
                  rows={2}
                  className="w-full bg-stone-800 border border-stone-700 rounded-lg px-3 py-2 text-sm text-white placeholder-stone-600 focus:outline-none resize-none"
                />
              </div>

              <ModalField label="Description" value={editing.description} onChange={v => setEditing(p => ({ ...p, description: v }))} placeholder="Fiber cement siding with ColorPlus finish" />
            </div>
            <div className="px-6 py-4 border-t border-stone-800 flex gap-3">
              <button
                onClick={handleSave}
                disabled={saving || !editing.brand || !editing.name}
                className="bg-amber-700 hover:bg-amber-600 disabled:opacity-40 text-white px-5 py-2 rounded-lg text-sm font-semibold transition"
              >
                {saving ? 'Saving...' : editing.id ? 'Save Changes' : 'Create Material'}
              </button>
              <button onClick={() => setEditing(null)} className="text-stone-400 hover:text-stone-200 text-sm">Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function ModalField({ label, value, onChange, placeholder, type = 'text' }) {
  return (
    <div>
      <label className="block text-xs font-medium text-stone-400 mb-1">{label}</label>
      <input
        type={type}
        value={value || ''}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full bg-stone-800 border border-stone-700 rounded-lg px-3 py-2 text-sm text-white placeholder-stone-600 focus:outline-none"
      />
    </div>
  );
}

'use client';

import { useState, useEffect } from 'react';

const MODES = [
  { id: 'inline', label: 'Inline', icon: '📄', desc: 'Embed directly on any page. Best for dedicated visualizer pages.' },
  { id: 'popup', label: 'Floating Button', icon: '💬', desc: 'Floating "Visualize Your Home" button on every page. Opens a popup.' },
  { id: 'button', label: 'Link Button', icon: '🔗', desc: 'A styled button that opens the visualizer in a new tab.' },
];

export default function EmbedPage() {
  const [tenants, setTenants] = useState([]);
  const [selectedTenant, setSelectedTenant] = useState('');
  const [selectedMode, setSelectedMode] = useState('popup');
  const [snippet, setSnippet] = useState(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    fetch('/api/admin/tenants').then(r => r.json()).then(setTenants);
  }, []);

  const generateSnippet = async () => {
    if (!selectedTenant) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/embed/snippet?slug=${selectedTenant}&mode=${selectedMode}`);
      const data = await res.json();
      setSnippet(data);
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  const copySnippet = () => {
    if (!snippet?.snippet) return;
    navigator.clipboard?.writeText(snippet.snippet);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold text-white mb-1">Embed Widget</h1>
      <p className="text-stone-400 text-sm mb-6">
        Generate embed code for contractor websites. One snippet — works on WordPress, Wix, Squarespace, or custom HTML.
      </p>

      {/* Tenant selector */}
      <div className="mb-4">
        <label className="block text-xs font-medium text-stone-400 mb-1">Contractor</label>
        <select
          value={selectedTenant}
          onChange={e => { setSelectedTenant(e.target.value); setSnippet(null); }}
          className="w-full bg-stone-800 border border-stone-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none"
        >
          <option value="">Select a tenant...</option>
          {tenants.map(t => (
            <option key={t.id} value={t.slug}>{t.company_name} ({t.slug})</option>
          ))}
        </select>
      </div>

      {/* Mode picker */}
      <div className="mb-6">
        <label className="block text-xs font-medium text-stone-400 mb-2">Embed Mode</label>
        <div className="grid grid-cols-3 gap-3">
          {MODES.map(m => (
            <button
              key={m.id}
              onClick={() => { setSelectedMode(m.id); setSnippet(null); }}
              className={`p-4 rounded-xl border-2 text-left transition-all ${
                selectedMode === m.id
                  ? 'border-amber-500 bg-amber-500/10'
                  : 'border-stone-700 bg-stone-800 hover:border-stone-600'
              }`}
            >
              <div className="text-2xl mb-2">{m.icon}</div>
              <p className="font-semibold text-sm text-white">{m.label}</p>
              <p className="text-xs text-stone-400 mt-1">{m.desc}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Generate */}
      <button
        onClick={generateSnippet}
        disabled={!selectedTenant || loading}
        className="w-full py-3 rounded-xl font-bold text-sm bg-amber-600 text-white hover:bg-amber-700 disabled:opacity-40 transition"
      >
        {loading ? 'Generating...' : 'Generate Embed Code'}
      </button>

      {/* Output */}
      {snippet && (
        <div className="mt-6">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs text-stone-400">{snippet.instructions}</p>
            <button
              onClick={copySnippet}
              className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-amber-600 text-white hover:bg-amber-700 transition"
            >
              {copied ? '✓ Copied!' : 'Copy Code'}
            </button>
          </div>
          <pre className="bg-stone-900 border border-stone-700 rounded-xl p-4 text-xs text-green-400 overflow-x-auto whitespace-pre-wrap font-mono">
            {snippet.snippet}
          </pre>

          {/* Preview */}
          <div className="mt-6">
            <p className="text-xs text-stone-400 mb-2">Preview URL</p>
            <a
              href={snippet.embedUrl}
              target="_blank"
              rel="noopener"
              className="text-sm text-amber-400 underline break-all"
            >
              {snippet.embedUrl}
            </a>
          </div>

          {/* Platform instructions */}
          <div className="mt-6 bg-stone-800 rounded-xl p-4 border border-stone-700">
            <p className="text-xs font-semibold text-stone-300 mb-2">Platform-specific instructions</p>
            <div className="space-y-2 text-xs text-stone-400">
              <p><strong className="text-stone-300">WordPress:</strong> Add a Custom HTML block and paste the code.</p>
              <p><strong className="text-stone-300">Wix:</strong> Add an "Embed a Widget" element and paste the code.</p>
              <p><strong className="text-stone-300">Squarespace:</strong> Add a Code Block and paste. For popup mode, add via Code Injection → Footer.</p>
              <p><strong className="text-stone-300">Custom HTML:</strong> Paste directly in your HTML file.</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

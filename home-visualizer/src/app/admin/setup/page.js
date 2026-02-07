'use client';

import { useState, useEffect } from 'react';

const STEPS = [
  { id: 'brand', label: 'Your Brand', icon: '🎨' },
  { id: 'colors', label: 'Colors', icon: '🖌️' },
  { id: 'notifications', label: 'Lead Alerts', icon: '🔔' },
  { id: 'embed', label: 'Go Live', icon: '🚀' },
];

const DEFAULT_COLORS = {
  primary: '#B8860B', bg: '#FDFBF7', text: '#1C1917', muted: '#78716C',
  surface: '#FFFFFF', border: '#E7E5E4',
};

export default function SetupPage() {
  const [tenants, setTenants] = useState([]);
  const [tenant, setTenant] = useState(null);
  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    company_name: '', logo_url: '', phone: '', website: '',
    lead_notify_email: '', crm_webhook_url: '',
    colors: DEFAULT_COLORS,
  });
  const [embedCode, setEmbedCode] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    fetch('/api/admin/tenants').then(r => r.json()).then(data => {
      setTenants(data);
      if (data.length > 0) {
        const t = data[0];
        setTenant(t);
        setForm({
          company_name: t.company_name || '',
          logo_url: t.logo_url || '',
          phone: t.phone || '',
          website: t.website || '',
          lead_notify_email: t.lead_notify_email || '',
          crm_webhook_url: t.crm_webhook_url || '',
          colors: t.colors || DEFAULT_COLORS,
        });
      }
    });
  }, []);

  const update = (key, val) => setForm(f => ({ ...f, [key]: val }));
  const updateColor = (key, val) => setForm(f => ({ ...f, colors: { ...f.colors, [key]: val } }));

  const saveAndNext = async () => {
    if (!tenant) return;
    setSaving(true);
    await fetch(`/api/admin/tenants/${tenant.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    });

    // Fetch embed code on last step transition
    if (step === 2) {
      const res = await fetch(`/api/embed/snippet?slug=${tenant.slug}&mode=inline`);
      const data = await res.json();
      setEmbedCode(data.snippet || '');
    }

    setSaving(false);
    setStep(s => Math.min(s + 1, STEPS.length - 1));
  };

  const copyEmbed = () => {
    navigator.clipboard?.writeText(embedCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!tenant) {
    return (
      <div className="p-8 max-w-2xl mx-auto">
        <p className="text-stone-500">Loading your account...</p>
      </div>
    );
  }

  const currentStep = STEPS[step];

  return (
    <div className="p-4 sm:p-8 max-w-2xl mx-auto">
      <h1 className="text-xl sm:text-2xl font-bold text-white mb-1">Get Started</h1>
      <p className="text-stone-400 text-sm mb-6">Set up your visualizer in 2 minutes.</p>

      {/* Progress */}
      <div className="flex items-center gap-1 mb-8">
        {STEPS.map((s, i) => (
          <div key={s.id} className="flex-1 flex items-center gap-1">
            <div className={`w-full h-1.5 rounded-full transition-all ${
              i <= step ? 'bg-amber-600' : 'bg-stone-800'
            }`} />
          </div>
        ))}
      </div>

      <div className="flex items-center gap-2 mb-5">
        <span className="text-2xl">{currentStep.icon}</span>
        <div>
          <p className="text-xs text-stone-500">Step {step + 1} of {STEPS.length}</p>
          <h2 className="text-lg font-bold text-white">{currentStep.label}</h2>
        </div>
      </div>

      {/* ─── Step 1: Brand ───────────────────── */}
      {step === 0 && (
        <div className="space-y-4">
          <Field label="Company Name" value={form.company_name} onChange={v => update('company_name', v)}
            placeholder="Claflin Construction" />
          <Field label="Logo URL" value={form.logo_url} onChange={v => update('logo_url', v)}
            placeholder="https://your-site.com/logo.png" help="Paste a direct link to your logo image" />
          <Field label="Phone" value={form.phone} onChange={v => update('phone', v)}
            placeholder="(715) 723-2687" />
          <Field label="Website" value={form.website} onChange={v => update('website', v)}
            placeholder="claflinconstruction.com" />

          {form.logo_url && (
            <div className="flex items-center gap-3 p-3 bg-stone-800 rounded-lg">
              <img src={form.logo_url} alt="Logo preview" className="h-10 object-contain"
                onError={e => { e.target.style.display = 'none'; }} />
              <span className="text-xs text-stone-400">Logo preview</span>
            </div>
          )}
        </div>
      )}

      {/* ─── Step 2: Colors ──────────────────── */}
      {step === 1 && (
        <div className="space-y-4">
          <p className="text-sm text-stone-400 mb-2">Match your website&apos;s color scheme. Your primary color is used for buttons and accents.</p>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            <ColorField label="Primary (buttons)" value={form.colors.primary} onChange={v => updateColor('primary', v)} />
            <ColorField label="Background" value={form.colors.bg} onChange={v => updateColor('bg', v)} />
            <ColorField label="Text" value={form.colors.text} onChange={v => updateColor('text', v)} />
          </div>

          {/* Live preview */}
          <div className="mt-4 rounded-xl overflow-hidden border border-stone-700" style={{ maxWidth: 360 }}>
            <div className="px-4 py-3 flex items-center gap-2" style={{ background: form.colors.bg, borderBottom: '1px solid ' + form.colors.border }}>
              {form.logo_url ? (
                <img src={form.logo_url} alt="" className="h-6 object-contain" onError={e => { e.target.style.display = 'none'; }} />
              ) : (
                <span className="font-bold text-sm" style={{ color: form.colors.primary }}>{form.company_name || 'Your Company'}</span>
              )}
            </div>
            <div className="px-4 py-5" style={{ background: form.colors.bg }}>
              <p className="text-sm font-bold mb-2" style={{ color: form.colors.text }}>See Your Home Transformed</p>
              <p className="text-xs mb-3" style={{ color: form.colors.muted }}>Upload a photo and pick a style</p>
              <button className="px-6 py-2 rounded-lg text-white text-xs font-bold" style={{ background: form.colors.primary }}>
                Choose Photo
              </button>
            </div>
          </div>

          {/* Quick presets */}
          <div>
            <p className="text-xs text-stone-500 mb-2">Quick presets</p>
            <div className="flex gap-2 flex-wrap">
              {[
                { label: 'Gold', primary: '#B8860B' },
                { label: 'Blue', primary: '#2563EB' },
                { label: 'Green', primary: '#059669' },
                { label: 'Red', primary: '#DC2626' },
                { label: 'Black', primary: '#1C1917' },
                { label: 'Navy', primary: '#1E3A5F' },
              ].map(p => (
                <button key={p.label} onClick={() => updateColor('primary', p.primary)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-stone-700 text-xs text-stone-300 hover:border-stone-500 transition">
                  <div className="w-3 h-3 rounded-full" style={{ background: p.primary }} />
                  {p.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ─── Step 3: Lead Alerts ─────────────── */}
      {step === 2 && (
        <div className="space-y-4">
          <p className="text-sm text-stone-400">Get notified instantly when a homeowner submits their design.</p>

          <Field label="Email for lead alerts" value={form.lead_notify_email}
            onChange={v => update('lead_notify_email', v)}
            placeholder="leads@company.com" help="Every new lead is emailed here in real-time" />

          <Field label="CRM Webhook URL (optional)" value={form.crm_webhook_url}
            onChange={v => update('crm_webhook_url', v)}
            placeholder="https://hooks.zapier.com/..."
            help="Send lead data to Zapier, HubSpot, Jobber, or any webhook" />

          <div className="bg-stone-800 rounded-xl p-4 mt-4">
            <p className="text-xs font-semibold text-stone-300 mb-2">What contractors receive</p>
            <div className="space-y-2 text-xs text-stone-400">
              <div className="flex items-start gap-2">
                <span className="text-green-400">✓</span>
                <span>Homeowner&apos;s name, email, phone, address</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-green-400">✓</span>
                <span>Link to their AI-generated design</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-green-400">✓</span>
                <span>Which materials/style they chose</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-green-400">✓</span>
                <span>UTM attribution (which ad/page drove the lead)</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─── Step 4: Go Live ─────────────────── */}
      {step === 3 && (
        <div className="space-y-4">
          <p className="text-sm text-stone-400">Copy this code and paste it into your website where you want the visualizer to appear.</p>

          {/* Embed code */}
          <div className="relative">
            <pre className="bg-stone-800 border border-stone-700 rounded-xl p-4 text-xs text-stone-300 overflow-x-auto max-h-48 whitespace-pre-wrap break-all">
              {embedCode || 'Loading...'}
            </pre>
            <button onClick={copyEmbed}
              className="absolute top-2 right-2 text-xs font-semibold px-3 py-1.5 rounded-lg bg-amber-700 text-white hover:bg-amber-600 transition">
              {copied ? '✓ Copied' : 'Copy'}
            </button>
          </div>

          {/* Platform instructions */}
          <div className="grid sm:grid-cols-3 gap-2">
            {[
              { platform: 'WordPress', instruction: 'Paste in a Custom HTML block or widget' },
              { platform: 'Wix', instruction: 'Add via Embed → Custom Code element' },
              { platform: 'Squarespace', instruction: 'Add a Code Block, paste the snippet' },
            ].map(p => (
              <div key={p.platform} className="bg-stone-800 rounded-lg p-3">
                <p className="text-xs font-semibold text-white">{p.platform}</p>
                <p className="text-[11px] text-stone-400 mt-1">{p.instruction}</p>
              </div>
            ))}
          </div>

          {/* Test link */}
          <div className="bg-amber-900/20 border border-amber-700/30 rounded-xl p-4">
            <p className="text-sm font-semibold text-amber-300 mb-1">Test it right now</p>
            <p className="text-xs text-stone-400 mb-2">Visit your live visualizer page:</p>
            <a href={`/${tenant.slug}`} target="_blank" rel="noopener"
              className="text-sm font-bold text-amber-400 hover:text-amber-300 no-underline">
              {typeof window !== 'undefined' ? window.location.origin : ''}
              /{tenant.slug} →
            </a>
          </div>

          {/* Done */}
          <div className="text-center pt-4">
            <a href="/admin"
              className="inline-block bg-amber-700 hover:bg-amber-600 text-white font-bold px-8 py-3 rounded-xl text-sm transition no-underline">
              Go to Dashboard →
            </a>
          </div>
        </div>
      )}

      {/* Navigation */}
      {step < 3 && (
        <div className="flex items-center justify-between mt-8 pt-4 border-t border-stone-800">
          <button onClick={() => setStep(s => Math.max(s - 1, 0))} disabled={step === 0}
            className="text-sm text-stone-500 disabled:opacity-30">← Back</button>
          <button onClick={saveAndNext} disabled={saving}
            className="bg-amber-700 hover:bg-amber-600 disabled:opacity-60 text-white font-bold px-6 py-2.5 rounded-xl text-sm transition">
            {saving ? 'Saving...' : step === 2 ? 'Generate Embed Code →' : 'Next →'}
          </button>
        </div>
      )}
    </div>
  );
}

function Field({ label, value, onChange, placeholder, help, type = 'text' }) {
  return (
    <div>
      <label className="block text-xs font-medium text-stone-400 mb-1">{label}</label>
      <input type={type} value={value || ''} onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full bg-stone-800 border border-stone-700 rounded-lg px-3 py-2.5 text-sm text-white placeholder-stone-600 focus:outline-none focus:border-amber-600" />
      {help && <p className="text-[11px] text-stone-600 mt-1">{help}</p>}
    </div>
  );
}

function ColorField({ label, value, onChange }) {
  return (
    <div>
      <label className="block text-xs font-medium text-stone-400 mb-1">{label}</label>
      <div className="flex items-center gap-2">
        <input type="color" value={value} onChange={e => onChange(e.target.value)}
          className="w-10 h-10 rounded-lg border border-stone-700 cursor-pointer bg-transparent" />
        <input type="text" value={value} onChange={e => onChange(e.target.value)}
          className="flex-1 bg-stone-800 border border-stone-700 rounded-lg px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-amber-600" />
      </div>
    </div>
  );
}

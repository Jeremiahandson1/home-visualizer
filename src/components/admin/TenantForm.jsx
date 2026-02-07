'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

const DEFAULT_COLORS = {
  primary: '#B8860B', primaryDark: '#8B6508', accent: '#1C1917',
  background: '#FDFBF7', surface: '#FFFFFF', text: '#1C1917',
  muted: '#78716C', border: '#E7E5E4',
};

const DEFAULT_FEATURES = {
  siding: true, roofing: true, deck: true,
  windows: true, addition: true, exterior: true,
};

export default function TenantForm({ tenant = null }) {
  const router = useRouter();
  const isNew = !tenant;

  const [form, setForm] = useState({
    slug: tenant?.slug || '',
    company_name: tenant?.company_name || '',
    tagline: tenant?.tagline || '',
    phone: tenant?.phone || '',
    email: tenant?.email || '',
    website: tenant?.website || '',
    logo_url: tenant?.logo_url || '',
    lead_notify_email: tenant?.lead_notify_email || '',
    crm_webhook_url: tenant?.crm_webhook_url || '',
    plan: tenant?.plan || 'starter',
    active: tenant?.active ?? true,
    colors: tenant?.colors || DEFAULT_COLORS,
    features: tenant?.features || DEFAULT_FEATURES,
  });

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const update = (key, val) => setForm(f => ({ ...f, [key]: val }));
  const updateColor = (key, val) => setForm(f => ({ ...f, colors: { ...f.colors, [key]: val } }));
  const toggleFeature = (key) => setForm(f => ({ ...f, features: { ...f.features, [key]: !f.features[key] } }));

  const handleSave = async () => {
    setSaving(true);
    setError('');

    const url = isNew ? '/api/admin/tenants' : `/api/admin/tenants/${tenant.id}`;
    const method = isNew ? 'POST' : 'PUT';

    try {
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Failed to save');
        setSaving(false);
        return;
      }

      router.push('/admin/tenants');
      router.refresh();
    } catch (err) {
      setError(err.message);
      setSaving(false);
    }
  };

  const handleDeactivate = async () => {
    if (!confirm(`Deactivate ${form.company_name}? Their visualizer will stop working.`)) return;
    await fetch(`/api/admin/tenants/${tenant.id}`, { method: 'DELETE' });
    router.push('/admin/tenants');
    router.refresh();
  };

  return (
    <div className="space-y-6">
      {error && (
        <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm rounded-lg px-4 py-3">
          {error}
        </div>
      )}

      {/* Company Info */}
      <Section title="Company Info">
        <div className="grid grid-cols-2 gap-4">
          <Field label="Company Name *" value={form.company_name} onChange={v => update('company_name', v)} placeholder="Claflin Construction" />
          <Field label="URL Slug *" value={form.slug} onChange={v => update('slug', v)} placeholder="claflin-construction" disabled={!isNew}
            help={isNew ? 'Used in URLs: yourdomain.com/claflin-construction' : 'Cannot be changed after creation'} />
          <Field label="Tagline" value={form.tagline} onChange={v => update('tagline', v)} placeholder="Chippewa Valley's Premier Contractor" />
          <Field label="Phone" value={form.phone} onChange={v => update('phone', v)} placeholder="(715) 723-2687" />
          <Field label="Email" value={form.email} onChange={v => update('email', v)} placeholder="info@company.com" />
          <Field label="Website" value={form.website} onChange={v => update('website', v)} placeholder="claflinconstruction.com" />
          <Field label="Logo URL" value={form.logo_url} onChange={v => update('logo_url', v)} placeholder="https://..." span={2} />
        </div>
      </Section>

      {/* Lead Routing */}
      <Section title="Lead Routing">
        <div className="grid grid-cols-2 gap-4">
          <Field label="Lead Notification Email" value={form.lead_notify_email} onChange={v => update('lead_notify_email', v)} placeholder="leads@company.com"
            help="New leads are emailed here instantly" />
          <Field label="CRM Webhook URL" value={form.crm_webhook_url} onChange={v => update('crm_webhook_url', v)} placeholder="https://hooks.buildpro.com/..."
            help="POST request with lead JSON on every submission" />
        </div>
      </Section>

      {/* Plan & Billing */}
      <Section title="Plan">
        <div className="flex gap-3">
          {['starter', 'pro', 'enterprise'].map(plan => (
            <button
              key={plan}
              onClick={() => update('plan', plan)}
              className={`px-5 py-2.5 rounded-lg text-sm font-semibold capitalize transition ${
                form.plan === plan
                  ? 'bg-amber-700 text-white'
                  : 'bg-stone-800 text-stone-400 hover:text-stone-200'
              }`}
            >
              {plan}
              <span className="block text-xs font-normal mt-0.5 opacity-70">
                {plan === 'starter' ? '50 gens/mo' : plan === 'pro' ? '200 gens/mo' : 'Unlimited'}
              </span>
            </button>
          ))}
        </div>
      </Section>

      {/* Enabled Features */}
      <Section title="Enabled Project Types">
        <div className="flex flex-wrap gap-2">
          {Object.keys(DEFAULT_FEATURES).map(key => (
            <button
              key={key}
              onClick={() => toggleFeature(key)}
              className={`px-4 py-2 rounded-lg text-sm font-medium capitalize transition ${
                form.features[key]
                  ? 'bg-green-500/15 text-green-400 border border-green-500/30'
                  : 'bg-stone-800 text-stone-500 border border-stone-700'
              }`}
            >
              {form.features[key] ? '✓ ' : ''}{key}
            </button>
          ))}
        </div>
      </Section>

      {/* Brand Colors */}
      <Section title="Brand Colors">
        <div className="grid grid-cols-4 gap-3">
          {Object.entries(form.colors).map(([key, val]) => (
            <div key={key} className="flex items-center gap-2">
              <input
                type="color"
                value={val}
                onChange={e => updateColor(key, e.target.value)}
                className="w-8 h-8 rounded border border-stone-700 cursor-pointer bg-transparent"
              />
              <div>
                <div className="text-xs text-stone-400 capitalize">{key.replace(/([A-Z])/g, ' $1')}</div>
                <div className="text-[10px] text-stone-600 font-mono">{val}</div>
              </div>
            </div>
          ))}
        </div>
        {/* Preview */}
        <div className="mt-4 rounded-xl overflow-hidden border border-stone-700" style={{ maxWidth: 320 }}>
          <div className="px-4 py-3" style={{ background: form.colors.accent, color: '#fff' }}>
            <div className="font-bold text-sm">{form.company_name || 'Company Name'}</div>
            <div className="text-[10px] opacity-60">{form.tagline || 'Tagline'}</div>
          </div>
          <div className="px-4 py-4" style={{ background: form.colors.background }}>
            <div className="text-xs font-semibold mb-2" style={{ color: form.colors.text }}>Preview</div>
            <button className="px-4 py-1.5 rounded-md text-xs text-white font-semibold" style={{ background: form.colors.primary }}>
              Button
            </button>
          </div>
        </div>
      </Section>

      {/* Actions */}
      <div className="flex items-center gap-3 pt-4 border-t border-stone-800">
        <button
          onClick={handleSave}
          disabled={saving || !form.company_name || !form.slug}
          className="bg-amber-700 hover:bg-amber-600 disabled:opacity-40 text-white px-6 py-2.5 rounded-lg text-sm font-semibold transition"
        >
          {saving ? 'Saving...' : isNew ? 'Create Tenant' : 'Save Changes'}
        </button>
        <button
          onClick={() => router.push('/admin/tenants')}
          className="text-stone-400 hover:text-stone-200 px-4 py-2.5 text-sm transition"
        >
          Cancel
        </button>
        {!isNew && (
          <button
            onClick={handleDeactivate}
            className="ml-auto text-red-400 hover:text-red-300 text-sm transition"
          >
            {form.active ? 'Deactivate' : 'Already Inactive'}
          </button>
        )}
      </div>
    </div>
  );
}

function Section({ title, children }) {
  return (
    <div className="bg-stone-900 border border-stone-800 rounded-xl p-5">
      <h2 className="text-sm font-semibold text-white mb-4">{title}</h2>
      {children}
    </div>
  );
}

function Field({ label, value, onChange, placeholder, help, disabled, span, type = 'text' }) {
  return (
    <div className={span === 2 ? 'col-span-2' : ''}>
      <label className="block text-xs font-medium text-stone-400 mb-1">{label}</label>
      <input
        type={type}
        value={value || ''}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        disabled={disabled}
        className="w-full bg-stone-800 border border-stone-700 rounded-lg px-3 py-2 text-sm text-white placeholder-stone-600 focus:outline-none focus:border-amber-600 disabled:opacity-50 disabled:cursor-not-allowed"
      />
      {help && <p className="text-[11px] text-stone-600 mt-1">{help}</p>}
    </div>
  );
}

'use client';

import { useState, useEffect } from 'react';

export default function FunnelPage() {
  const [tenants, setTenants] = useState([]);
  const [selectedTenant, setSelectedTenant] = useState('all');
  const [range, setRange] = useState('30');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/admin/tenants').then(r => r.json()).then(setTenants);
  }, []);

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams({ range });
    if (selectedTenant !== 'all') params.set('tenant', selectedTenant);
    fetch('/api/admin/funnel?' + params)
      .then(r => r.json())
      .then(d => { setData(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, [selectedTenant, range]);

  const funnelSteps = data ? [
    { label: 'Page Views', count: data.pageViews, pct: 100 },
    { label: 'Photos Uploaded', count: data.uploads, pct: data.pageViews ? Math.round((data.uploads / data.pageViews) * 100) : 0 },
    { label: 'Designs Generated', count: data.generations, pct: data.pageViews ? Math.round((data.generations / data.pageViews) * 100) : 0 },
    { label: 'Refinements', count: data.refinements, pct: data.pageViews ? Math.round((data.refinements / data.pageViews) * 100) : 0 },
    { label: 'Leads Submitted', count: data.leads, pct: data.pageViews ? Math.round((data.leads / data.pageViews) * 100) : 0 },
    { label: 'Shared', count: data.shares, pct: data.pageViews ? Math.round((data.shares / data.pageViews) * 100) : 0 },
  ] : [];

  const stepToStep = data && data.uploads > 0 ? [
    { from: 'Upload', to: 'Generate', rate: Math.round((data.generations / data.uploads) * 100) },
    { from: 'Generate', to: 'Lead', rate: data.generations > 0 ? Math.round((data.leads / data.generations) * 100) : 0 },
  ] : [];

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-2xl font-bold text-white mb-1">Conversion Funnel</h1>
      <p className="text-stone-400 text-sm mb-6">
        Track how homeowners move through the visualizer — from page view to lead submission.
      </p>

      {/* Filters */}
      <div className="flex gap-3 mb-6">
        <select value={selectedTenant} onChange={e => setSelectedTenant(e.target.value)}
          className="bg-stone-800 border border-stone-700 rounded-lg px-3 py-2 text-sm text-white">
          <option value="all">All tenants</option>
          {tenants.map(t => (
            <option key={t.id} value={t.id}>{t.company_name}</option>
          ))}
        </select>
        <select value={range} onChange={e => setRange(e.target.value)}
          className="bg-stone-800 border border-stone-700 rounded-lg px-3 py-2 text-sm text-white">
          <option value="7">Last 7 days</option>
          <option value="30">Last 30 days</option>
          <option value="90">Last 90 days</option>
        </select>
      </div>

      {loading ? (
        <div className="text-center py-16 text-stone-500">Loading analytics...</div>
      ) : !data ? (
        <div className="text-center py-16 text-stone-500">No data available</div>
      ) : (
        <>
          {/* Key metrics */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
            <MetricCard label="Page Views" value={data.pageViews} />
            <MetricCard label="Leads" value={data.leads} highlight />
            <MetricCard
              label="Visit → Lead"
              value={data.pageViews ? (data.leads / data.pageViews * 100).toFixed(1) + '%' : '0%'}
            />
            <MetricCard
              label="Generate → Lead"
              value={data.generations ? (data.leads / data.generations * 100).toFixed(1) + '%' : '0%'}
              highlight
            />
          </div>

          {/* Visual funnel */}
          <div className="bg-stone-900 border border-stone-800 rounded-2xl p-6 mb-8">
            <h2 className="text-sm font-semibold text-stone-400 mb-4">Funnel</h2>
            <div className="space-y-2">
              {funnelSteps.map((step, i) => (
                <div key={step.label} className="flex items-center gap-3">
                  <div className="w-32 text-xs text-stone-400 text-right shrink-0">{step.label}</div>
                  <div className="flex-1 h-8 rounded-lg overflow-hidden bg-stone-800 relative">
                    <div
                      className="h-full rounded-lg transition-all duration-700"
                      style={{
                        width: step.pct + '%',
                        background: i === funnelSteps.length - 2
                          ? '#10B981'  // Leads = green
                          : i === 0 ? '#B8860B' : '#B8860B' + (90 - i * 15).toString(16),
                        minWidth: step.count > 0 ? '2px' : '0',
                      }}
                    />
                    <span className="absolute inset-0 flex items-center px-3 text-xs font-semibold text-white">
                      {step.count.toLocaleString()} {step.pct < 100 ? '(' + step.pct + '%)' : ''}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Step-to-step conversion */}
          {stepToStep.length > 0 && (
            <div className="bg-stone-900 border border-stone-800 rounded-2xl p-6 mb-8">
              <h2 className="text-sm font-semibold text-stone-400 mb-4">Step-to-Step Conversion</h2>
              <div className="grid grid-cols-2 gap-4">
                {stepToStep.map(s => (
                  <div key={s.from + s.to} className="text-center">
                    <div className="text-3xl font-bold text-white">{s.rate}%</div>
                    <div className="text-xs text-stone-400 mt-1">{s.from} → {s.to}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Provider stats */}
          {data.providerBreakdown && Object.keys(data.providerBreakdown).length > 0 && (
            <div className="bg-stone-900 border border-stone-800 rounded-2xl p-6">
              <h2 className="text-sm font-semibold text-stone-400 mb-4">AI Provider Usage</h2>
              <div className="space-y-2">
                {Object.entries(data.providerBreakdown).map(([provider, count]) => (
                  <div key={provider} className="flex items-center justify-between text-sm">
                    <span className="text-stone-300 capitalize">{provider}</span>
                    <span className="text-stone-400">{count} generations</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

function MetricCard({ label, value, highlight }) {
  return (
    <div className="bg-stone-900 border border-stone-800 rounded-xl p-4">
      <div className={'text-2xl font-bold ' + (highlight ? 'text-amber-400' : 'text-white')}>
        {typeof value === 'number' ? value.toLocaleString() : value}
      </div>
      <div className="text-xs text-stone-400 mt-1">{label}</div>
    </div>
  );
}

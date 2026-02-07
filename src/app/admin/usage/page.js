'use client';

import { useState, useEffect } from 'react';

export default function UsagePage() {
  const [tenants, setTenants] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [selectedTenant, setSelectedTenant] = useState('all');
  const [days, setDays] = useState(30);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/admin/tenants')
      .then(r => r.json())
      .then(d => { setTenants(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  // Fetch analytics when filters change
  useEffect(() => {
    const params = new URLSearchParams({ days: days.toString() });
    if (selectedTenant !== 'all') params.set('tenant_id', selectedTenant);

    fetch(`/api/analytics?${params}`)
      .then(r => r.json())
      .then(setAnalytics)
      .catch(() => setAnalytics(null));
  }, [selectedTenant, days]);

  const activeTenants = tenants.filter(t => t.active);
  const totalGens = tenants.reduce((s, t) => s + (t.monthGenerations || 0), 0);
  const totalLeads = tenants.reduce((s, t) => s + (t.totalLeads || 0), 0);

  const planPrices = { starter: 99, pro: 249, enterprise: 499 };
  const monthlyRevenue = activeTenants.reduce((s, t) => s + (planPrices[t.plan] || 0), 0);
  const avgCostPerGen = 0.08;
  const monthlyAICost = totalGens * avgCostPerGen;

  const funnel = analytics?.funnel || {};

  return (
    <div className="p-8 max-w-6xl">
      <h1 className="text-2xl font-bold text-white mb-6">Usage & Revenue</h1>

      {/* Revenue overview */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard label="Monthly Revenue" value={`$${monthlyRevenue.toLocaleString()}`} sub={`${activeTenants.length} active tenants`} color="text-green-400" />
        <StatCard label="AI Cost" value={`$${monthlyAICost.toFixed(2)}`} sub={`${totalGens} generations`} color="text-red-400" />
        <StatCard label="Gross Margin" value={monthlyRevenue > 0 ? `${((1 - monthlyAICost / monthlyRevenue) * 100).toFixed(0)}%` : '—'} sub={`$${(monthlyRevenue - monthlyAICost).toFixed(2)} profit`} color="text-amber-400" />
        <StatCard label="Total Leads" value={totalLeads} sub="all time" color="text-blue-400" />
      </div>

      {/* Analytics Funnel */}
      <div className="bg-stone-900 border border-stone-800 rounded-xl mb-6">
        <div className="px-5 py-4 border-b border-stone-800 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-white">Conversion Funnel</h2>
          <div className="flex gap-2">
            <select
              value={selectedTenant}
              onChange={e => setSelectedTenant(e.target.value)}
              className="bg-stone-800 border border-stone-700 rounded-lg px-3 py-1.5 text-xs text-stone-200 focus:outline-none"
            >
              <option value="all">All Tenants</option>
              {tenants.map(t => <option key={t.id} value={t.id}>{t.company_name}</option>)}
            </select>
            <select
              value={days}
              onChange={e => setDays(parseInt(e.target.value))}
              className="bg-stone-800 border border-stone-700 rounded-lg px-3 py-1.5 text-xs text-stone-200 focus:outline-none"
            >
              <option value="7">Last 7 days</option>
              <option value="30">Last 30 days</option>
              <option value="90">Last 90 days</option>
            </select>
          </div>
        </div>

        {analytics ? (
          <div className="p-5">
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 mb-6">
              <FunnelStep label="Page Views" count={funnel.pageViews || 0} rate={null} color="bg-blue-500" />
              <FunnelStep label="Uploads" count={funnel.uploads || 0} rate={funnel.uploadRate} color="bg-cyan-500" />
              <FunnelStep label="Generations" count={funnel.generations || 0} rate={funnel.generateRate} color="bg-amber-500" />
              <FunnelStep label="Shares" count={funnel.shares || 0} rate={null} color="bg-purple-500" />
              <FunnelStep label="Leads" count={funnel.leads || 0} rate={funnel.overallRate} color="bg-green-500" isLast />
            </div>

            {/* Conversion rates */}
            <div className="grid sm:grid-cols-3 gap-4">
              <ConversionCard from="View" to="Upload" rate={funnel.uploadRate} />
              <ConversionCard from="Upload" to="Generate" rate={funnel.generateRate} />
              <ConversionCard from="View" to="Lead" rate={funnel.overallRate} highlight />
            </div>
          </div>
        ) : (
          <div className="p-8 text-center text-stone-500 text-sm">
            {loading ? 'Loading analytics...' : 'No analytics data yet. Data appears after homeowners start using visualizers.'}
          </div>
        )}
      </div>

      {/* Per-tenant breakdown */}
      <div className="bg-stone-900 border border-stone-800 rounded-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-stone-800">
          <h2 className="text-sm font-semibold text-white">Tenant Breakdown</h2>
        </div>
        <table className="w-full">
          <thead>
            <tr className="border-b border-stone-800 text-xs text-stone-500 uppercase tracking-wider">
              <th className="text-left px-5 py-3 font-semibold">Tenant</th>
              <th className="text-left px-5 py-3 font-semibold">Plan</th>
              <th className="text-right px-5 py-3 font-semibold">Revenue</th>
              <th className="text-right px-5 py-3 font-semibold">Generations</th>
              <th className="text-right px-5 py-3 font-semibold">AI Cost</th>
              <th className="text-right px-5 py-3 font-semibold">Margin</th>
              <th className="text-right px-5 py-3 font-semibold">Leads</th>
              <th className="text-right px-5 py-3 font-semibold">Usage</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-800">
            {loading ? (
              [...Array(3)].map((_, i) => (
                <tr key={i}><td colSpan={8} className="px-5 py-4"><div className="h-5 bg-stone-800 rounded animate-pulse" /></td></tr>
              ))
            ) : tenants.length === 0 ? (
              <tr><td colSpan={8} className="px-5 py-8 text-center text-stone-500 text-sm">No tenants yet</td></tr>
            ) : (
              tenants.map(t => {
                const revenue = planPrices[t.plan] || 0;
                const cost = (t.monthGenerations || 0) * avgCostPerGen;
                const margin = revenue > 0 ? ((1 - cost / revenue) * 100).toFixed(0) : '—';
                const usagePct = t.monthly_gen_limit > 0 ? ((t.monthGenerations || 0) / t.monthly_gen_limit * 100).toFixed(0) : 0;

                return (
                  <tr key={t.id} className={`${t.active ? '' : 'opacity-40'}`}>
                    <td className="px-5 py-3">
                      <div className="text-sm font-medium text-white">{t.company_name}</div>
                      <div className="text-xs text-stone-500">{t.slug}</div>
                    </td>
                    <td className="px-5 py-3 text-sm text-stone-400 capitalize">{t.plan}</td>
                    <td className="px-5 py-3 text-right text-sm text-green-400">${revenue}/mo</td>
                    <td className="px-5 py-3 text-right text-sm text-stone-300">{t.monthGenerations || 0}</td>
                    <td className="px-5 py-3 text-right text-sm text-red-400">${cost.toFixed(2)}</td>
                    <td className="px-5 py-3 text-right text-sm text-stone-300">{margin}%</td>
                    <td className="px-5 py-3 text-right text-sm text-stone-300">{t.totalLeads}</td>
                    <td className="px-5 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <div className="w-16 h-1.5 bg-stone-800 rounded-full overflow-hidden">
                          <div className="h-full rounded-full transition-all"
                            style={{ width: `${Math.min(usagePct, 100)}%`, background: usagePct > 80 ? '#ef4444' : usagePct > 50 ? '#f59e0b' : '#22c55e' }} />
                        </div>
                        <span className="text-xs text-stone-500 w-8 text-right">{usagePct}%</span>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      <div className="mt-6 bg-stone-900/50 border border-stone-800 rounded-xl p-5 text-xs text-stone-500">
        <strong className="text-stone-400">Cost assumptions:</strong> OpenAI GPT Image avg $0.08/gen.
        Revenue based on plan prices: Starter $99, Pro $249, Enterprise $499.
        Actual costs vary by provider and quality settings.
      </div>
    </div>
  );
}

function StatCard({ label, value, sub, color }) {
  return (
    <div className="bg-stone-900 border border-stone-800 rounded-xl p-5">
      <div className="text-xs text-stone-500 mb-2">{label}</div>
      <div className={`text-2xl font-bold ${color}`}>{value}</div>
      <div className="text-xs text-stone-600 mt-1">{sub}</div>
    </div>
  );
}

function FunnelStep({ label, count, rate, color, isLast }) {
  return (
    <div className="text-center">
      <div className={`h-1.5 ${color} rounded-full mb-3`} />
      <div className="text-lg font-bold text-white">{count.toLocaleString()}</div>
      <div className="text-xs text-stone-500 mt-0.5">{label}</div>
      {rate !== null && (
        <div className="text-[10px] text-stone-600 mt-1">{rate}% overall</div>
      )}
    </div>
  );
}

function ConversionCard({ from, to, rate, highlight }) {
  return (
    <div className={`rounded-lg p-3.5 border ${highlight ? 'border-amber-500/30 bg-amber-500/5' : 'border-stone-800 bg-stone-800/30'}`}>
      <div className="text-xs text-stone-500">{from} → {to}</div>
      <div className={`text-xl font-bold mt-1 ${highlight ? 'text-amber-400' : 'text-stone-200'}`}>
        {rate || '0'}%
      </div>
    </div>
  );
}

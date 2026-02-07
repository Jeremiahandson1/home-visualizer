'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/admin/stats')
      .then(r => r.json())
      .then(d => { setStats(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  if (loading) return <Loading />;
  if (!stats) return <div className="p-8 text-stone-500">Failed to load stats</div>;

  const { overview: o, recentLeads, topTenants } = stats;

  const cards = [
    { label: 'Active Tenants', value: o.activeTenants, sub: `${o.totalTenants} total`, color: 'bg-blue-500/15 text-blue-400' },
    { label: 'Leads This Month', value: o.monthLeads, sub: `${o.totalLeads} all time`, color: 'bg-green-500/15 text-green-400' },
    { label: 'Generations', value: o.monthGenerations, sub: o.currentMonth, color: 'bg-amber-500/15 text-amber-400' },
    { label: 'AI Cost', value: `$${(o.monthCostCents / 100).toFixed(2)}`, sub: 'this month', color: 'bg-purple-500/15 text-purple-400' },
  ];

  return (
    <div className="p-8 max-w-6xl">
      <h1 className="text-2xl font-bold text-white mb-6">Dashboard</h1>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {cards.map((c, i) => (
          <div key={i} className="bg-stone-900 border border-stone-800 rounded-xl p-5">
            <div className={`inline-flex px-2.5 py-1 rounded-md text-xs font-semibold mb-3 ${c.color}`}>
              {c.label}
            </div>
            <div className="text-2xl font-bold text-white">{c.value}</div>
            <div className="text-xs text-stone-500 mt-1">{c.sub}</div>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Recent Leads */}
        <div className="lg:col-span-2 bg-stone-900 border border-stone-800 rounded-xl">
          <div className="flex items-center justify-between px-5 py-4 border-b border-stone-800">
            <h2 className="font-semibold text-white text-sm">Recent Leads</h2>
            <Link href="/admin/leads" className="text-xs text-amber-400 hover:text-amber-300 no-underline">
              View all →
            </Link>
          </div>
          <div className="divide-y divide-stone-800">
            {recentLeads.length === 0 ? (
              <div className="p-5 text-stone-500 text-sm">No leads yet</div>
            ) : (
              recentLeads.map(lead => (
                <div key={lead.id} className="px-5 py-3 flex items-center gap-3">
                  <StatusDot status={lead.status} />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-stone-200 truncate">{lead.name}</div>
                    <div className="text-xs text-stone-500">
                      {lead.tenants?.company_name} · {lead.project_type}
                    </div>
                  </div>
                  <div className="text-xs text-stone-500">
                    {timeAgo(lead.created_at)}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Top Tenants */}
        <div className="bg-stone-900 border border-stone-800 rounded-xl">
          <div className="flex items-center justify-between px-5 py-4 border-b border-stone-800">
            <h2 className="font-semibold text-white text-sm">Top Tenants</h2>
            <span className="text-xs text-stone-500">{o.currentMonth}</span>
          </div>
          <div className="divide-y divide-stone-800">
            {topTenants.length === 0 ? (
              <div className="p-5 text-stone-500 text-sm">No usage yet</div>
            ) : (
              topTenants.map((t, i) => (
                <div key={i} className="px-5 py-3 flex items-center justify-between">
                  <div>
                    <div className="text-sm font-medium text-stone-200">{t.company}</div>
                    <div className="text-xs text-stone-500">{t.generations} generations</div>
                  </div>
                  <div className="text-xs font-mono text-stone-400">
                    ${(t.costCents / 100).toFixed(2)}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function StatusDot({ status }) {
  const colors = {
    new: 'bg-blue-400', contacted: 'bg-amber-400', quoted: 'bg-purple-400',
    won: 'bg-green-400', lost: 'bg-stone-500',
  };
  return <div className={`w-2 h-2 rounded-full shrink-0 ${colors[status] || 'bg-stone-500'}`} />;
}

function timeAgo(date) {
  const diff = Date.now() - new Date(date).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

function Loading() {
  return (
    <div className="p-8">
      <div className="h-8 w-40 bg-stone-800 rounded-lg animate-pulse mb-6" />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[...Array(4)].map((_, i) => <div key={i} className="h-28 bg-stone-800 rounded-xl animate-pulse" />)}
      </div>
    </div>
  );
}

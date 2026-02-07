'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function TenantsPage() {
  const [tenants, setTenants] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/admin/tenants')
      .then(r => r.json())
      .then(d => { setTenants(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const planBadge = {
    starter: 'bg-stone-700 text-stone-300',
    pro: 'bg-amber-700/20 text-amber-400',
    enterprise: 'bg-purple-700/20 text-purple-400',
  };

  return (
    <div className="p-8 max-w-6xl">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-white">Tenants</h1>
        <Link
          href="/admin/tenants/new"
          className="bg-amber-700 hover:bg-amber-600 text-white px-4 py-2 rounded-lg text-sm font-semibold transition no-underline"
        >
          + Add Tenant
        </Link>
      </div>

      <div className="bg-stone-900 border border-stone-800 rounded-xl overflow-hidden overflow-x-auto">
        <table className="w-full min-w-[640px]">
          <thead>
            <tr className="border-b border-stone-800 text-xs text-stone-500 uppercase tracking-wider">
              <th className="text-left px-5 py-3 font-semibold">Company</th>
              <th className="text-left px-5 py-3 font-semibold">Slug</th>
              <th className="text-left px-5 py-3 font-semibold">Plan</th>
              <th className="text-right px-5 py-3 font-semibold">Gens/Mo</th>
              <th className="text-right px-5 py-3 font-semibold">Leads</th>
              <th className="text-center px-5 py-3 font-semibold">Status</th>
              <th className="px-5 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-800">
            {loading ? (
              [...Array(3)].map((_, i) => (
                <tr key={i}>
                  <td colSpan={7} className="px-5 py-4">
                    <div className="h-5 bg-stone-800 rounded animate-pulse" />
                  </td>
                </tr>
              ))
            ) : tenants.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-5 py-8 text-center text-stone-500 text-sm">
                  No tenants yet. Add your first contractor.
                </td>
              </tr>
            ) : (
              tenants.map(t => (
                <tr key={t.id} className="hover:bg-stone-800/30 transition">
                  <td className="px-5 py-3">
                    <div className="font-medium text-sm text-white">{t.company_name}</div>
                    <div className="text-xs text-stone-500">{t.email}</div>
                  </td>
                  <td className="px-5 py-3">
                    <code className="text-xs text-stone-400 bg-stone-800 px-2 py-0.5 rounded">{t.slug}</code>
                  </td>
                  <td className="px-5 py-3">
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded capitalize ${planBadge[t.plan] || planBadge.starter}`}>
                      {t.plan}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-right">
                    <span className="text-sm text-stone-300">{t.monthGenerations}</span>
                    <span className="text-xs text-stone-600">/{t.monthly_gen_limit}</span>
                  </td>
                  <td className="px-5 py-3 text-right text-sm text-stone-300">{t.totalLeads}</td>
                  <td className="px-5 py-3 text-center">
                    <div className={`w-2 h-2 rounded-full mx-auto ${t.active ? 'bg-green-400' : 'bg-stone-600'}`} />
                  </td>
                  <td className="px-5 py-3 text-right">
                    <Link
                      href={`/admin/tenants/${t.id}`}
                      className="text-xs text-amber-400 hover:text-amber-300 no-underline font-medium"
                    >
                      Edit →
                    </Link>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

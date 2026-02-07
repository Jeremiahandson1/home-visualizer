'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import TenantForm from '@/components/admin/TenantForm';

export default function EditTenantPage() {
  const { id } = useParams();
  const [tenant, setTenant] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/admin/tenants/${id}`)
      .then(r => r.json())
      .then(d => { setTenant(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="p-8 max-w-3xl">
        <div className="h-8 w-60 bg-stone-800 rounded-lg animate-pulse mb-6" />
        <div className="space-y-4">
          {[...Array(4)].map((_, i) => <div key={i} className="h-32 bg-stone-800 rounded-xl animate-pulse" />)}
        </div>
      </div>
    );
  }

  if (!tenant) {
    return <div className="p-8 text-stone-500">Tenant not found</div>;
  }

  return (
    <div className="p-8 max-w-3xl">
      <div className="flex items-center gap-3 mb-6">
        <h1 className="text-2xl font-bold text-white">{tenant.company_name}</h1>
        <span className={`text-xs px-2 py-0.5 rounded font-semibold ${tenant.active ? 'bg-green-500/15 text-green-400' : 'bg-red-500/15 text-red-400'}`}>
          {tenant.active ? 'Active' : 'Inactive'}
        </span>
      </div>

      {/* Quick stats */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        <div className="bg-stone-900 border border-stone-800 rounded-lg p-3">
          <div className="text-xs text-stone-500">Total Leads</div>
          <div className="text-lg font-bold text-white">{tenant.leadCount}</div>
        </div>
        <div className="bg-stone-900 border border-stone-800 rounded-lg p-3">
          <div className="text-xs text-stone-500">This Month</div>
          <div className="text-lg font-bold text-white">
            {tenant.usageHistory?.[0]?.generation_count || 0} gens
          </div>
        </div>
        <div className="bg-stone-900 border border-stone-800 rounded-lg p-3">
          <div className="text-xs text-stone-500">Visualizer URL</div>
          <a href={`/${tenant.slug}`} target="_blank" className="text-sm text-amber-400 hover:text-amber-300 no-underline">
            /{tenant.slug} ↗
          </a>
        </div>
      </div>

      <TenantForm tenant={tenant} />

      {/* Stripe Billing */}
      {tenant.stripe_customer_id && (
        <div className="mt-6 bg-stone-900 border border-stone-800 rounded-xl p-5">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-semibold text-white">Billing</h2>
              <p className="text-xs text-stone-500 mt-0.5">
                Customer: {tenant.stripe_customer_id.slice(0, 18)}...
              </p>
            </div>
            <button
              onClick={async () => {
                const res = await fetch('/api/billing/portal', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ tenant_id: tenant.id }),
                });
                const data = await res.json();
                if (data.url) window.open(data.url, '_blank');
              }}
              className="bg-stone-800 hover:bg-stone-700 text-stone-200 px-4 py-2 rounded-lg text-xs font-semibold transition"
            >
              Manage Billing →
            </button>
          </div>
        </div>
      )}

      {/* Recent leads for this tenant */}
      {tenant.recentLeads?.length > 0 && (
        <div className="mt-8 bg-stone-900 border border-stone-800 rounded-xl">
          <div className="px-5 py-4 border-b border-stone-800">
            <h2 className="text-sm font-semibold text-white">Recent Leads</h2>
          </div>
          <div className="divide-y divide-stone-800">
            {tenant.recentLeads.slice(0, 10).map(lead => (
              <div key={lead.id} className="px-5 py-3 flex items-center gap-3">
                <div className={`w-2 h-2 rounded-full shrink-0 ${
                  { new: 'bg-blue-400', contacted: 'bg-amber-400', quoted: 'bg-purple-400', won: 'bg-green-400', lost: 'bg-stone-500' }[lead.status]
                }`} />
                <div className="flex-1 min-w-0">
                  <div className="text-sm text-stone-200">{lead.name} · {lead.email}</div>
                  <div className="text-xs text-stone-500 capitalize">{lead.project_type} · {lead.material_name || '—'}</div>
                </div>
                <div className="text-xs text-stone-500 capitalize">{lead.status}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

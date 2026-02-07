'use client';

import { useState, useEffect, useCallback } from 'react';

const STATUSES = ['all', 'new', 'contacted', 'quoted', 'won', 'lost'];
const STATUS_COLORS = {
  new: 'bg-blue-500/15 text-blue-400 border-blue-500/30',
  contacted: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
  quoted: 'bg-purple-500/15 text-purple-400 border-purple-500/30',
  won: 'bg-green-500/15 text-green-400 border-green-500/30',
  lost: 'bg-stone-700/50 text-stone-400 border-stone-600',
};

export default function LeadsPage() {
  const [leads, setLeads] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [statusFilter, setStatusFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(null);

  const fetchLeads = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({ page: page.toString(), status: statusFilter });
    const res = await fetch(`/api/admin/leads?${params}`);
    const data = await res.json();
    setLeads(data.leads || []);
    setTotal(data.total || 0);
    setTotalPages(data.totalPages || 1);
    setLoading(false);
  }, [page, statusFilter]);

  useEffect(() => { fetchLeads(); }, [fetchLeads]);

  const updateStatus = async (leadId, newStatus) => {
    await fetch(`/api/admin/leads/${leadId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: newStatus }),
    });
    // Update locally
    setLeads(prev => prev.map(l => l.id === leadId ? { ...l, status: newStatus } : l));
  };

  return (
    <div className="p-8 max-w-6xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Leads</h1>
          <p className="text-sm text-stone-500 mt-1">{total} total leads</p>
        </div>
      </div>

      {/* Status filters */}
      <div className="flex gap-1.5 mb-5">
        {STATUSES.map(s => (
          <button
            key={s}
            onClick={() => { setStatusFilter(s); setPage(1); }}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold capitalize transition ${
              statusFilter === s
                ? 'bg-amber-700 text-white'
                : 'bg-stone-800 text-stone-400 hover:text-stone-200'
            }`}
          >
            {s}
          </button>
        ))}
      </div>

      {/* Leads table */}
      <div className="bg-stone-900 border border-stone-800 rounded-xl overflow-hidden overflow-x-auto">
        <table className="w-full min-w-[640px]">
          <thead>
            <tr className="border-b border-stone-800 text-xs text-stone-500 uppercase tracking-wider">
              <th className="text-left px-5 py-3 font-semibold">Lead</th>
              <th className="text-left px-5 py-3 font-semibold">Contractor</th>
              <th className="text-left px-5 py-3 font-semibold">Project</th>
              <th className="text-left px-5 py-3 font-semibold">Status</th>
              <th className="text-left px-5 py-3 font-semibold">Date</th>
              <th className="px-5 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-800">
            {loading ? (
              [...Array(5)].map((_, i) => (
                <tr key={i}><td colSpan={6} className="px-5 py-4"><div className="h-5 bg-stone-800 rounded animate-pulse" /></td></tr>
              ))
            ) : leads.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-5 py-8 text-center text-stone-500 text-sm">
                  No leads found
                </td>
              </tr>
            ) : (
              leads.map(lead => [
                <tr
                  key={lead.id}
                  className="hover:bg-stone-800/30 transition cursor-pointer"
                  onClick={() => setExpanded(expanded === lead.id ? null : lead.id)}
                >
                    <td className="px-5 py-3">
                      <div className="text-sm font-medium text-white">{lead.name}</div>
                      <div className="text-xs text-stone-500">{lead.email}</div>
                    </td>
                    <td className="px-5 py-3 text-sm text-stone-400">
                      {lead.tenants?.company_name || '—'}
                    </td>
                    <td className="px-5 py-3">
                      <div className="text-sm text-stone-300 capitalize">{lead.project_type}</div>
                      <div className="text-xs text-stone-500">{lead.material_brand} {lead.material_name}</div>
                    </td>
                    <td className="px-5 py-3">
                      <select
                        value={lead.status}
                        onChange={e => { e.stopPropagation(); updateStatus(lead.id, e.target.value); }}
                        onClick={e => e.stopPropagation()}
                        className={`text-xs font-semibold px-2.5 py-1 rounded-md border capitalize bg-transparent cursor-pointer focus:outline-none ${STATUS_COLORS[lead.status]}`}
                      >
                        {STATUSES.filter(s => s !== 'all').map(s => (
                          <option key={s} value={s} className="bg-stone-900 text-stone-200">{s}</option>
                        ))}
                      </select>
                    </td>
                    <td className="px-5 py-3 text-xs text-stone-500">
                      {new Date(lead.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-5 py-3 text-xs text-stone-600">
                      {expanded === lead.id ? '▲' : '▼'}
                    </td>
                  </tr>,
                  expanded === lead.id && (
                    <tr key={`${lead.id}-detail`}>
                      <td colSpan={6} className="px-5 py-4 bg-stone-800/30">
                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
                          <div>
                            <div className="text-xs text-stone-500 mb-0.5">Phone</div>
                            <div className="text-stone-300">{lead.phone || '—'}</div>
                          </div>
                          <div>
                            <div className="text-xs text-stone-500 mb-0.5">Address</div>
                            <div className="text-stone-300">{lead.address || '—'}</div>
                          </div>
                          <div>
                            <div className="text-xs text-stone-500 mb-0.5">Material</div>
                            <div className="text-stone-300">{lead.material_brand} {lead.material_name || '—'}</div>
                          </div>
                          <div>
                            <div className="text-xs text-stone-500 mb-0.5">Notes</div>
                            <div className="text-stone-300">{lead.notes || '—'}</div>
                          </div>
                        </div>
                        {/* Attribution */}
                        {(lead.utm && Object.keys(lead.utm).length > 0) || lead.referrer ? (
                          <div className="mt-3 pt-3 border-t border-stone-700/50">
                            <div className="text-xs text-stone-500 mb-1 font-semibold">Attribution</div>
                            <div className="flex flex-wrap gap-2">
                              {lead.utm?.source && (
                                <span className="text-xs px-2 py-0.5 rounded bg-amber-500/10 text-amber-400">
                                  source: {lead.utm.source}
                                </span>
                              )}
                              {lead.utm?.medium && (
                                <span className="text-xs px-2 py-0.5 rounded bg-amber-500/10 text-amber-400">
                                  medium: {lead.utm.medium}
                                </span>
                              )}
                              {lead.utm?.campaign && (
                                <span className="text-xs px-2 py-0.5 rounded bg-amber-500/10 text-amber-400">
                                  campaign: {lead.utm.campaign}
                                </span>
                              )}
                              {lead.referrer && (
                                <span className="text-xs px-2 py-0.5 rounded bg-stone-700 text-stone-400 truncate max-w-[200px]" title={lead.referrer}>
                                  ref: {lead.referrer}
                                </span>
                              )}
                              {lead.utm?.ab && Object.entries(lead.utm.ab).map(([exp, variant]) => (
                                <span key={exp} className="text-xs px-2 py-0.5 rounded bg-purple-500/10 text-purple-400">
                                  {exp}: {variant}
                                </span>
                              ))}
                            </div>
                          </div>
                        ) : null}
                        {(lead.original_photo_url || lead.generated_photo_url) && (
                          <div className="flex gap-3 mt-3">
                            {lead.original_photo_url && (
                              <a href={lead.original_photo_url} target="_blank" className="text-xs text-amber-400 hover:text-amber-300 no-underline">
                                View Original ↗
                              </a>
                            )}
                            {lead.generated_photo_url && (
                              <a href={lead.generated_photo_url} target="_blank" className="text-xs text-amber-400 hover:text-amber-300 no-underline">
                                View Generated ↗
                              </a>
                            )}
                          </div>
                        )}
                      </td>
                    </tr>
                  ),
                ].filter(Boolean))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-4">
          <div className="text-xs text-stone-500">
            Page {page} of {totalPages}
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-3 py-1.5 rounded-lg text-xs font-medium bg-stone-800 text-stone-300 hover:bg-stone-700 disabled:opacity-30 transition"
            >
              ← Prev
            </button>
            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="px-3 py-1.5 rounded-lg text-xs font-medium bg-stone-800 text-stone-300 hover:bg-stone-700 disabled:opacity-30 transition"
            >
              Next →
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

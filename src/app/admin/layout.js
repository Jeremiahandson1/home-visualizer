'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';

export default function AdminLayout({ children }) {
  const [authed, setAuthed] = useState(null);
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [mobileNav, setMobileNav] = useState(false);
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    fetch('/api/admin/auth').then(r => r.json()).then(d => setAuthed(d.authenticated));
  }, []);

  // Close mobile nav on route change
  useEffect(() => { setMobileNav(false); }, [pathname]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoginError('');
    const res = await fetch('/api/admin/auth', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password }),
    });
    if (res.ok) setAuthed(true);
    else setLoginError('Wrong password');
  };

  const handleLogout = async () => {
    await fetch('/api/admin/auth', { method: 'DELETE' });
    setAuthed(false);
  };

  if (authed === null) {
    return (
      <div className="min-h-screen bg-stone-950 flex items-center justify-center">
        <div className="text-stone-500 text-sm">Loading...</div>
      </div>
    );
  }

  if (!authed) {
    return (
      <div className="min-h-screen bg-stone-950 flex items-center justify-center p-4">
        <form onSubmit={handleLogin} className="w-full max-w-sm">
          <div className="bg-stone-900 border border-stone-800 rounded-2xl p-8">
            <div className="text-center mb-6">
              <div className="w-12 h-12 rounded-xl bg-amber-700 flex items-center justify-center text-white font-bold text-xl mx-auto mb-3">B</div>
              <h1 className="text-white font-bold text-xl">Twomiah Vision</h1>
              <p className="text-stone-500 text-sm mt-1">Admin Dashboard</p>
            </div>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)}
              placeholder="Admin password" autoFocus
              className="w-full bg-stone-800 border border-stone-700 rounded-lg px-4 py-3 text-white text-sm focus:outline-none focus:border-amber-600 mb-3" />
            {loginError && <p className="text-red-400 text-xs mb-3">{loginError}</p>}
            <button type="submit" className="w-full bg-amber-700 hover:bg-amber-600 text-white font-semibold py-3 rounded-lg text-sm transition">
              Sign In
            </button>
          </div>
        </form>
      </div>
    );
  }

  const nav = [
    { href: '/admin', label: 'Dashboard', icon: '◫' },
    { href: '/admin/setup', label: 'Setup', icon: '⚙' },
    { href: '/admin/tenants', label: 'Tenants', icon: '◧' },
    { href: '/admin/leads', label: 'Leads', icon: '◉' },
    { href: '/admin/materials', label: 'Materials', icon: '◆' },
    { href: '/admin/usage', label: 'Usage', icon: '◈' },
    { href: '/admin/funnel', label: 'Funnel', icon: '▽' },
    { href: '/admin/embed', label: 'Embed Widget', icon: '◳' },
  ];

  const isActive = (href) => {
    if (href === '/admin') return pathname === '/admin';
    return pathname.startsWith(href);
  };

  return (
    <div className="min-h-screen bg-stone-950 text-stone-200">

      {/* ——— Mobile header ——————————————————————— */}
      <div className="lg:hidden flex items-center justify-between px-4 py-3 border-b border-stone-800 sticky top-0 bg-stone-950 z-40">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-amber-700 flex items-center justify-center text-white font-bold text-xs">B</div>
          <span className="font-bold text-sm text-white">Admin</span>
        </div>
        <button onClick={() => setMobileNav(!mobileNav)}
          className="w-9 h-9 flex items-center justify-center rounded-lg text-stone-400 hover:bg-stone-800 transition">
          {mobileNav ? '✕' : '☰'}
        </button>
      </div>

      {/* ——— Mobile nav dropdown ————————————————— */}
      {mobileNav && (
        <div className="lg:hidden fixed inset-0 top-[52px] bg-stone-950/95 backdrop-blur-sm z-30">
          <nav className="p-4 space-y-1">
            {nav.map(n => (
              <Link key={n.href} href={n.href}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition no-underline ${
                  isActive(n.href) ? 'bg-amber-700/15 text-amber-400' : 'text-stone-400'
                }`}>
                <span className="text-lg">{n.icon}</span>
                {n.label}
              </Link>
            ))}
            <button onClick={handleLogout}
              className="w-full text-left px-4 py-3 text-sm text-stone-500 rounded-xl mt-4">
              Sign Out
            </button>
          </nav>
        </div>
      )}

      <div className="flex">
        {/* ——— Desktop sidebar ——————————————————— */}
        <aside className="hidden lg:flex w-56 border-r border-stone-800 flex-col shrink-0 sticky top-0 h-screen">
          <div className="p-5 border-b border-stone-800">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-amber-700 flex items-center justify-center text-white font-bold text-sm">B</div>
              <div>
                <div className="font-bold text-sm text-white">Twomiah Vision</div>
                <div className="text-[10px] text-stone-500 uppercase tracking-wider">Admin</div>
              </div>
            </div>
          </div>
          <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
            {nav.map(n => (
              <Link key={n.href} href={n.href}
                className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition no-underline ${
                  isActive(n.href) ? 'bg-amber-700/15 text-amber-400' : 'text-stone-400 hover:text-stone-200 hover:bg-stone-800/50'
                }`}>
                <span className="text-base">{n.icon}</span>
                {n.label}
              </Link>
            ))}
          </nav>
          <div className="p-3 border-t border-stone-800">
            <button onClick={handleLogout}
              className="w-full text-left px-3 py-2 text-sm text-stone-500 hover:text-stone-300 transition rounded-lg hover:bg-stone-800/50">
              Sign Out
            </button>
          </div>
        </aside>

        {/* ——— Main content —————————————————————— */}
        <main className="flex-1 min-w-0 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
}

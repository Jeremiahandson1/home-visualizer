'use client';

import Visualizer from '@/components/Visualizer';

// Public demo page — no tenant needed, uses demo mode
// Accessible at /demo for landing page embed and direct links
export default function DemoPage() {
  const demoConfig = {
    tenantId: null,
    slug: 'demo',
    companyName: 'HomeVisualizer Demo',
    tagline: 'See what your home could look like',
    phone: '',
    email: '',
    website: '',
    logo: null,
    colors: {
      primary: '#B8860B',
      bg: '#FDFBF7',
      text: '#1C1917',
      muted: '#78716C',
      surface: '#FFFFFF',
      border: '#E7E5E4',
    },
    features: {
      siding: true,
      roofing: true,
      deck: true,
      windows: true,
      exterior: true,
    },
    plan: 'demo',
  };

  return (
    <div>
      <Visualizer config={demoConfig} />
      {/* Demo banner */}
      <div className="fixed top-0 left-0 right-0 z-50 bg-stone-900 text-white text-center py-2 px-4 text-xs font-medium">
        This is a demo.{' '}
        <a href="/signup" className="text-amber-400 underline font-bold">
          Get this on your website →
        </a>
      </div>
    </div>
  );
}

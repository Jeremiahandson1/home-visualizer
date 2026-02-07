/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '**.supabase.co' },
      { protocol: 'https', hostname: '**.supabase.in' },
    ],
  },
  // Required for Stripe webhook raw body parsing
  experimental: {
    serverActions: {
      bodySizeLimit: '15mb',
    },
  },
  async headers() {
    return [
      {
        // Allow embedding as iframe on any contractor site
        source: '/embed/:path*',
        headers: [
          { key: 'X-Frame-Options', value: 'ALLOWALL' },
          { key: 'Content-Security-Policy', value: 'frame-ancestors *' },
        ],
      },
      {
        // Allow tenant pages to be embedded too (inline embed mode)
        source: '/:slug',
        headers: [
          { key: 'Content-Security-Policy', value: 'frame-ancestors *' },
        ],
      },
      {
        // Allow demo page embedding on landing page
        source: '/demo',
        headers: [
          { key: 'Content-Security-Policy', value: 'frame-ancestors *' },
        ],
      },
      {
        // Allow embed.js to be loaded from any domain
        source: '/embed.js',
        headers: [
          { key: 'Access-Control-Allow-Origin', value: '*' },
          { key: 'Cache-Control', value: 'public, max-age=3600' },
        ],
      },
      {
        // CORS for analytics endpoint (fire-and-forget from embeds)
        source: '/api/analytics',
        headers: [
          { key: 'Access-Control-Allow-Origin', value: '*' },
          { key: 'Access-Control-Allow-Methods', value: 'POST' },
          { key: 'Access-Control-Allow-Headers', value: 'Content-Type' },
        ],
      },
    ];
  },
};

module.exports = nextConfig;

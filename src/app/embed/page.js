import { getSupabaseAdmin } from '@/lib/supabase';
import Visualizer from '@/components/Visualizer';

export default async function EmbedPage({ searchParams }) {
  const slug = searchParams?.tenant;

  if (!slug) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-stone-50">
        <p className="text-stone-600">Missing tenant parameter. Use: /embed?tenant=your-slug</p>
      </div>
    );
  }

  const supabase = getSupabaseAdmin();
  const { data: tenant, error } = await supabase
    .from('tenants')
    .select('id, slug, company_name, tagline, phone, email, website, logo_url, colors, features, plan')
    .eq('slug', slug)
    .eq('active', true)
    .single();

  if (error || !tenant) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-stone-50">
        <p className="text-stone-600">Visualizer not found.</p>
      </div>
    );
  }

  const config = {
    tenantId: tenant.id,
    slug: tenant.slug,
    companyName: tenant.company_name,
    tagline: tenant.tagline || '',
    phone: tenant.phone || '',
    email: tenant.email || '',
    website: tenant.website || '',
    logo: tenant.logo_url,
    colors: tenant.colors || {},
    features: tenant.features || {},
    plan: tenant.plan || 'starter',
  };

  return (
    <>
      <Visualizer config={config} />
      <EmbedResizer />
    </>
  );
}

// Client component that sends postMessage for auto-resize
function EmbedResizer() {
  return (
    <script dangerouslySetInnerHTML={{ __html: `
      (function() {
        var last = 0;
        function send() {
          var h = document.documentElement.scrollHeight;
          if (h !== last) {
            last = h;
            window.parent.postMessage({ type: 'hv-resize', height: h }, '*');
          }
        }
        var obs = new ResizeObserver(send);
        obs.observe(document.body);
        send();
      })();
    `}} />
  );
}

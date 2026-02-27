import { getSupabaseAdmin } from '@/lib/supabase';
import Visualizer from '@/components/Visualizer';

export const dynamic = 'force-dynamic';
// Generate metadata per-tenant for SEO
export async function generateMetadata({ params }) {
  const { tenant: slug } = params;
  const supabase = getSupabaseAdmin();
  const { data: tenant } = await supabase
    .from('tenants')
    .select('company_name, tagline')
    .eq('slug', slug)
    .eq('active', true)
    .single();

  if (!tenant) {
    return { title: 'Not Found' };
  }

  return {
    title: `Twomiah Vision — ${tenant.company_name}`,
    description: `See what your home could look like with ${tenant.company_name}. Upload a photo and preview real materials instantly.`,
    openGraph: {
      title: `Visualize Your Dream Home — ${tenant.company_name}`,
      description: `AI-powered home visualization. See real products on your house before construction begins.`,
    },
  };
}

export default async function TenantPage({ params }) {
  const { tenant: slug } = params;
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
        <div className="text-center">
          <h1 className="font-display text-2xl font-bold text-stone-900 mb-2">Not Found</h1>
          <p className="text-stone-600">This visualizer page doesn't exist.</p>
        </div>
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

  return <Visualizer config={config} />;
}

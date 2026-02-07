import { getSupabaseAdmin } from '@/lib/supabase';
import CompareSlider from '@/components/CompareSlider';

export async function generateMetadata({ params }) {
  const supabase = getSupabaseAdmin();
  const { data } = await supabase
    .from('shares')
    .select('*, tenants(company_name)')
    .eq('id', params.id)
    .single();

  const company = data?.tenants?.company_name || 'HomeVisualizer';
  const material = [data?.material_brand, data?.material_name].filter(Boolean).join(' ') || data?.style_name || 'New Design';
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://homevisualizer.ai';
  const ogImage = data?.generated_photo_url || '';
  const pageUrl = baseUrl + '/share/' + params.id;

  return {
    title: material + ' \u2014 ' + company + ' Home Visualization',
    description: 'See this home transformed with ' + material + '. AI-powered visualization by ' + company + '.',
    openGraph: {
      title: material + ' \u2014 ' + company,
      description: 'See this home transformed with ' + material + '. AI-powered home visualization.',
      images: ogImage ? [{ url: ogImage, width: 1024, height: 1024, alt: material + ' visualization' }] : [],
      type: 'website',
      url: pageUrl,
    },
    twitter: {
      card: 'summary_large_image',
      title: material + ' \u2014 ' + company,
      description: 'See this home transformed with ' + material + '.',
      images: ogImage ? [ogImage] : [],
    },
  };
}

export default async function SharePage({ params }) {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from('shares')
    .select('*, tenants(company_name, slug, phone, website, colors, logo_url)')
    .eq('id', params.id)
    .single();

  if (error || !data) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-stone-50">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-2">Design Not Found</h1>
          <p className="text-stone-600">This shared visualization may have expired.</p>
        </div>
      </div>
    );
  }

  // Increment view count (fire and forget)
  supabase.from('shares').update({ view_count: (data.view_count || 0) + 1 }).eq('id', params.id).then(() => {});

  const tenant = data.tenants;
  const c = tenant?.colors || { primary: '#B8860B', bg: '#FDFBF7', text: '#1C1917' };
  const company = tenant?.company_name || 'HomeVisualizer';
  const material = [data.material_brand, data.material_name].filter(Boolean).join(' ') || data.style_name || 'New Design';
  const projectLabel = data.project_type ? data.project_type.charAt(0).toUpperCase() + data.project_type.slice(1) : 'Exterior';

  return (
    <div className="min-h-screen" style={{ background: c.bg, color: c.text }}>
      <header className="border-b py-4 px-6" style={{ borderColor: (c.text || '#1C1917') + '15' }}>
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          {tenant?.logo_url ? (
            <img src={tenant.logo_url} alt={company} className="h-10 object-contain" />
          ) : (
            <h1 className="text-xl font-bold" style={{ color: c.primary }}>{company}</h1>
          )}
          {tenant?.slug && (
            <a
              href={`/${tenant.slug}`}
              className="text-sm font-semibold px-4 py-2 rounded-lg text-white"
              style={{ background: c.primary }}
            >
              Design Your Home →
            </a>
          )}
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8">
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold mb-1">
            {projectLabel} Visualization: {material}
          </h2>
          <p className="text-sm" style={{ color: (c.text || '#1C1917') + '60' }}>
            Drag the slider to compare before and after
          </p>
        </div>

        <div className="rounded-2xl overflow-hidden shadow-2xl mb-8">
          <CompareSlider
            beforeSrc={data.original_photo_url}
            afterSrc={data.generated_photo_url}
            primaryColor={c.primary}
          />
        </div>

        <div className="text-center space-y-4">
          <div
            className="rounded-xl p-6 inline-block"
            style={{ background: (c.primary || '#B8860B') + '10', border: `2px solid ${(c.primary || '#B8860B')}30` }}
          >
            <h3 className="text-lg font-bold mb-1">Want this for your home?</h3>
            <p className="text-sm mb-4" style={{ color: (c.text || '#1C1917') + '70' }}>
              Upload your own photo and see it transformed instantly
            </p>
            {tenant?.slug && (
              <a
                href={`/${tenant.slug}`}
                className="inline-block px-8 py-3 rounded-xl font-bold text-white text-lg"
                style={{ background: c.primary }}
              >
                Try It Free →
              </a>
            )}
          </div>

          {(tenant?.phone || tenant?.website) && (
            <div className="text-sm" style={{ color: (c.text || '#1C1917') + '60' }}>
              <p className="font-semibold">{company}</p>
              {tenant.phone && <p>{tenant.phone}</p>}
              {tenant.website && (
                <a href={`https://${tenant.website}`} target="_blank" rel="noopener" className="underline">{tenant.website}</a>
              )}
            </div>
          )}
        </div>
      </main>

      <footer className="text-center py-4 text-xs" style={{ color: (c.text || '#1C1917') + '30' }}>
        Powered by HomeVisualizer AI · {data.view_count || 0} views
      </footer>
    </div>
  );
}

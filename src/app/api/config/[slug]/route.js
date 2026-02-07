import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase';

export async function GET(request, { params }) {
  try {
    const { slug } = params;

    const supabase = getSupabaseAdmin();

    const { data: tenant, error } = await supabase
      .from('tenants')
      .select('id, slug, company_name, tagline, phone, email, website, logo_url, colors, features, plan')
      .eq('slug', slug)
      .eq('active', true)
      .single();

    if (error || !tenant) {
      return NextResponse.json({ error: 'Tenant not found' }, { status: 404 });
    }

    return NextResponse.json({
      tenantId: tenant.id,
      company: tenant.company_name,
      slug: tenant.slug,
      tagline: tenant.tagline,
      phone: tenant.phone,
      email: tenant.email,
      website: tenant.website,
      logo: tenant.logo_url,
      colors: tenant.colors,
      features: tenant.features,
      poweredBy: tenant.plan !== 'enterprise',
    });

  } catch (error) {
    console.error('Config fetch error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

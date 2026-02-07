import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase';

// GET /api/og/[id] — Generate an OG image for a shared design
// Returns a composite before/after image optimized for social cards
export async function GET(request, { params }) {
  const shareId = params.id;

  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from('shares')
    .select('*, tenants(company_name, colors)')
    .eq('id', shareId)
    .single();

  if (error || !data) {
    return new NextResponse('Not found', { status: 404 });
  }

  // For now, redirect to the generated photo directly
  // This is the simplest approach that works with all social platforms
  // A future enhancement would use sharp/canvas to create a composite
  if (data.generated_photo_url) {
    return NextResponse.redirect(data.generated_photo_url);
  }

  return new NextResponse('No image', { status: 404 });
}

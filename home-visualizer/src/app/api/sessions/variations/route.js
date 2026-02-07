import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase';

// PATCH /api/sessions/variations — toggle favorite, add rating
export async function PATCH(request) {
  try {
    const { variationId, isFavorite, rating } = await request.json();

    if (!variationId) {
      return NextResponse.json({ error: 'variationId required' }, { status: 400 });
    }

    const supabase = getSupabaseAdmin();
    const updates = {};
    if (typeof isFavorite === 'boolean') updates.is_favorite = isFavorite;
    if (typeof rating === 'number' && rating >= 1 && rating <= 5) updates.rating = rating;

    const { data, error } = await supabase
      .from('design_variations')
      .update(updates)
      .eq('id', variationId)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// DELETE /api/sessions/variations — remove a variation
export async function DELETE(request) {
  try {
    const { variationId } = await request.json();

    if (!variationId) {
      return NextResponse.json({ error: 'variationId required' }, { status: 400 });
    }

    const supabase = getSupabaseAdmin();
    const { error } = await supabase
      .from('design_variations')
      .delete()
      .eq('id', variationId);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ deleted: true });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

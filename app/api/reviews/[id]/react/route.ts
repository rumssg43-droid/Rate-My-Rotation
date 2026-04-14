import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient, createServerClient } from '@/lib/supabase';

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Sign in to react' }, { status: 401 });

  const { reaction, token } = await req.json();
  if (!['agree', 'disagree'].includes(reaction)) {
    return NextResponse.json({ error: 'Invalid reaction' }, { status: 400 });
  }

  const service = createServiceClient();

  // Verify the user has access to this review
  const { data: review } = await service
    .from('reviews')
    .select('rotation_id, rotations(deanery, training_level)')
    .eq('id', params.id)
    .single();

  if (!review) return NextResponse.json({ error: 'Review not found' }, { status: 404 });

  const rotation = (review as any).rotations;
  const { data: accessToken } = await service
    .from('access_tokens')
    .select('id')
    .eq('token', token)
    .eq('deanery', rotation.deanery)
    .or(`training_level.eq.${rotation.training_level},is_deanery_bundle.eq.true`)
    .single();

  if (!accessToken) return NextResponse.json({ error: 'No access' }, { status: 403 });

  // Upsert: update if already reacted, insert if new
  const { data: existing } = await service
    .from('review_reactions')
    .select('id, reaction')
    .eq('review_id', params.id)
    .eq('user_id', user.id)
    .single();

  if (existing) {
    if (existing.reaction === reaction) {
      // Toggle off — remove reaction
      await service.from('review_reactions').delete().eq('id', existing.id);
      return NextResponse.json({ reaction: null });
    } else {
      // Switch reaction
      await service.from('review_reactions').update({ reaction }).eq('id', existing.id);
      return NextResponse.json({ reaction });
    }
  } else {
    await service.from('review_reactions').insert({ review_id: params.id, user_id: user.id, reaction });
    return NextResponse.json({ reaction });
  }
}

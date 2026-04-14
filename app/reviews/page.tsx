import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { createServerClient, createServiceClient } from '@/lib/supabase';
import { Review } from '@/types';
import ReviewsContent from './ReviewsContent';

interface Props {
  searchParams: Promise<{ token?: string }>;
}

export default async function ReviewsPage({ searchParams }: Props) {
  const params = await searchParams;
  const cookieStore = await cookies();
  const service = createServiceClient();

  let user: any = null;
  try {
    const supabase = await createServerClient();
    const { data } = await supabase.auth.getUser();
    user = data.user;
  } catch {}

  let accessToken: any = null;

  if (user) {
    const tokenParam = params.token;
    if (tokenParam) {
      const { data } = await service
        .from('access_tokens')
        .select('*')
        .eq('token', tokenParam)
        .eq('user_id', user.id)
        .single();
      accessToken = data;
    }
    if (!accessToken && !params.token) {
      redirect('/my-purchases');
    }
  }

  if (!accessToken) {
    const token = params.token || cookieStore.get('access_token')?.value;
    if (!token) redirect('/browse');

    const { data } = await service
      .from('access_tokens')
      .select('*')
      .eq('token', token)
      .single();

    accessToken = data;
  }

  if (!accessToken) redirect('/browse');
  if (accessToken.expires_at && new Date(accessToken.expires_at) < new Date()) {
    redirect('/browse');
  }

  if (user && !accessToken.user_id) {
    await service.from('access_tokens').update({ user_id: user.id }).eq('id', accessToken.id);
  }

  let query = service
    .from('reviews')
    .select('*, rotations(*)')
    .eq('rotations.deanery', accessToken.deanery)
    .eq('is_approved', true);

  if (!accessToken.is_deanery_bundle) {
    query = query.eq('rotations.training_level', accessToken.training_level);
  }

  const { data: reviews } = await query.order('created_at', { ascending: false });
  const reviewIds = (reviews || []).map((r: any) => r.id);

  const reactionsMap: Record<string, { agree: number; disagree: number; userReaction: 'agree' | 'disagree' | null }> = {};
  if (reviewIds.length > 0) {
    const { data: reactions } = await service
      .from('review_reactions')
      .select('review_id, reaction, user_id')
      .in('review_id', reviewIds);

    for (const r of reactions || []) {
      if (!reactionsMap[r.review_id]) reactionsMap[r.review_id] = { agree: 0, disagree: 0, userReaction: null };
      if (r.reaction === 'agree') reactionsMap[r.review_id].agree++;
      else reactionsMap[r.review_id].disagree++;
      if (user && r.user_id === user.id) reactionsMap[r.review_id].userReaction = r.reaction;
    }
  }

  const commentCounts: Record<string, number> = {};
  if (reviewIds.length > 0) {
    const { data: counts } = await service
      .from('review_comments')
      .select('review_id')
      .in('review_id', reviewIds)
      .eq('is_flagged', false);

    for (const c of counts || []) {
      commentCounts[c.review_id] = (commentCounts[c.review_id] || 0) + 1;
    }
  }

  const label = accessToken.is_deanery_bundle ? 'All pathways' : accessToken.training_level;

  return (
    <ReviewsContent
      reviews={(reviews as Review[]) || []}
      deanery={accessToken.deanery}
      trainingLevel={label}
      token={accessToken.token}
      userId={user?.id || null}
      reactionsMap={reactionsMap}
      commentCounts={commentCounts}
    />
  );
}

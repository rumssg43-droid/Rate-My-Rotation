import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient, createServerClient } from '@/lib/supabase';

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  // Requires a valid access token to read comments
  const token = req.headers.get('x-access-token') || new URL(req.url).searchParams.get('token');
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const service = createServiceClient();
  const { data: accessToken } = await service
    .from('access_tokens')
    .select('id')
    .eq('token', token)
    .single();
  if (!accessToken) return NextResponse.json({ error: 'Invalid token' }, { status: 401 });

  const { data: comments } = await service
    .from('review_comments')
    .select('id, content, user_id, created_at')
    .eq('review_id', params.id)
    .eq('is_flagged', false)
    .order('created_at', { ascending: true });

  // Pseudonymise: show "Dr. XXXX" derived from user_id
  const pseudonymised = (comments || []).map(c => ({
    id: c.id,
    content: c.content,
    author: 'Dr. ' + c.user_id.slice(-4).toUpperCase(),
    created_at: c.created_at,
  }));

  return NextResponse.json({ comments: pseudonymised });
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  // Must be logged in
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Sign in to comment' }, { status: 401 });

  // Must have a valid access token for the review's deanery+pathway
  const { content, token } = await req.json();
  if (!content?.trim()) return NextResponse.json({ error: 'Comment cannot be empty' }, { status: 400 });
  if (content.length > 1000) return NextResponse.json({ error: 'Comment too long' }, { status: 400 });

  const service = createServiceClient();

  // Verify token grants access to the review
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

  if (!accessToken) return NextResponse.json({ error: 'Access token does not cover this review' }, { status: 403 });

  const { data: comment, error } = await service
    .from('review_comments')
    .insert({ review_id: params.id, user_id: user.id, content: content.trim() })
    .select('id, content, user_id, created_at')
    .single();

  if (error) return NextResponse.json({ error: 'Failed to post comment' }, { status: 500 });

  return NextResponse.json({
    comment: {
      id: comment.id,
      content: comment.content,
      author: 'Dr. ' + comment.user_id.slice(-4).toUpperCase(),
      created_at: comment.created_at,
    }
  });
}

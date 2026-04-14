import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const token = searchParams.get('token');

  if (!token) {
    return NextResponse.json({ error: 'Token required' }, { status: 401 });
  }

  const supabase = createServiceClient();

  const { data: accessToken } = await supabase
    .from('access_tokens')
    .select('*')
    .eq('token', token)
    .single();

  if (!accessToken) {
    return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
  }

  if (accessToken.expires_at && new Date(accessToken.expires_at) < new Date()) {
    return NextResponse.json({ error: 'Token expired' }, { status: 401 });
  }

  const { data: reviews } = await supabase
    .from('reviews')
    .select('*, rotations(*)')
    .eq('rotations.deanery', accessToken.deanery)
    .eq('rotations.specialty', accessToken.specialty)
    .eq('is_approved', true)
    .order('created_at', { ascending: false });

  return NextResponse.json({ reviews: reviews || [] });
}

import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const q = searchParams.get('q') || '';

  if (q.length < 2) {
    return NextResponse.json({ trusts: [] });
  }

  const supabase = createServiceClient();
  const { data } = await supabase
    .from('rotations')
    .select('trust')
    .ilike('trust', `%${q}%`)
    .limit(10);

  const trusts = [...new Set((data || []).map(r => r.trust))];
  return NextResponse.json({ trusts });
}

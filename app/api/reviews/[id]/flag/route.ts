import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase';

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const supabase = createServiceClient();
  const { error } = await supabase
    .from('reviews')
    .update({ is_flagged: true })
    .eq('id', params.id);

  if (error) {
    return NextResponse.json({ error: 'Failed to flag review' }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}

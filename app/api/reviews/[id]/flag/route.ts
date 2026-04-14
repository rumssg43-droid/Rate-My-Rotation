import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase';

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = createServiceClient();
  const { error } = await supabase
    .from('reviews')
    .update({ is_flagged: true })
    .eq('id', id);

  if (error) {
    return NextResponse.json({ error: 'Failed to flag review' }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}

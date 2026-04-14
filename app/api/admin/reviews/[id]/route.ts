import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase';

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const adminSecret = req.headers.get('x-admin-secret');
  if (adminSecret !== process.env.ADMIN_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;
  const { action } = await req.json();
  const supabase = createServiceClient();

  if (action === 'remove') {
    await supabase.from('reviews').update({ is_approved: false, is_flagged: false }).eq('id', id);
  } else if (action === 'approve') {
    await supabase.from('reviews').update({ is_approved: true, is_flagged: false }).eq('id', id);
  }

  return NextResponse.json({ success: true });
}

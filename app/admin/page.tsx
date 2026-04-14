import { createServiceClient } from '@/lib/supabase';
import AdminPanel from './AdminPanel';
import { redirect } from 'next/navigation';

export default async function AdminPage({ searchParams }: { searchParams: Promise<{ secret?: string }> }) {
  const params = await searchParams;
  if (params.secret !== process.env.ADMIN_SECRET) {
    redirect('/');
  }

  const supabase = createServiceClient();

  const [{ data: reviews }, { data: referrals }, { data: tokens }] = await Promise.all([
    supabase.from('reviews').select('*, rotations(*)').order('created_at', { ascending: false }),
    supabase.from('referrals').select('*').eq('payout_status', 'pending'),
    supabase.from('access_tokens').select('amount_paid_pence, deanery, training_level, created_at'),
  ]);

  return (
    <AdminPanel
      reviews={reviews || []}
      referrals={referrals || []}
      tokens={tokens || []}
      secret={params.secret!}
    />
  );
}

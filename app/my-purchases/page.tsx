import { redirect } from 'next/navigation';
import { createServerClient } from '@/lib/supabase';
import { createServiceClient } from '@/lib/supabase';
import Link from 'next/link';

export default async function MyPurchasesPage() {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login?message=Sign+in+to+view+your+purchases.');
  }

  const service = createServiceClient();
  const { data: tokens } = await service
    .from('access_tokens')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  return (
    <div className="max-w-3xl mx-auto px-4 py-10">
      <h1 className="text-2xl font-bold text-gray-900 mb-2">My Purchases</h1>
      <p className="text-gray-500 text-sm mb-8">All the rotations you&apos;ve unlocked access to.</p>

      {tokens && tokens.length > 0 ? (
        <div className="space-y-3">
          {tokens.map((t: any) => (
            <Link
              key={t.id}
              href={`/reviews?token=${t.token}`}
              className="flex items-center justify-between border rounded-xl px-5 py-4 hover:border-blue-500 hover:bg-blue-50 transition-colors"
            >
              <div>
                <p className="font-semibold text-gray-900">{t.training_level}</p>
                <p className="text-sm text-blue-600">{t.deanery}</p>
              </div>
              <span className="text-sm text-gray-400">View reviews →</span>
            </Link>
          ))}
        </div>
      ) : (
        <div className="text-center py-16 text-gray-400">
          <p className="mb-4">You haven&apos;t purchased any reviews yet.</p>
          <Link href="/browse" className="inline-block bg-blue-700 text-white px-6 py-2 rounded-lg text-sm font-semibold hover:bg-blue-800">
            Browse Rotations
          </Link>
        </div>
      )}
    </div>
  );
}

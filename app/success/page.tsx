import { cookies } from 'next/headers';
import { createServerClient, createServiceClient } from '@/lib/supabase';
import Link from 'next/link';
import LoginForm from '../login/LoginForm';

interface Props {
  searchParams: Promise<{ token?: string }>;
}

export default async function SuccessPage({ searchParams }: Props) {
  const params = await searchParams;
  const token = params.token;
  const cookieStore = await cookies();

  if (token) {
    cookieStore.set('pending_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 30,
    });
  }

  let user: any = null;
  try {
    const supabase = await createServerClient();
    const { data } = await supabase.auth.getUser();
    user = data.user;
  } catch {}

  if (user && token) {
    const service = createServiceClient();
    await service
      .from('access_tokens')
      .update({ user_id: user.id })
      .eq('token', token)
      .is('user_id', null);

    cookieStore.set('pending_token', '', { maxAge: 0 });
  }

  const reviewsUrl = token ? `/reviews?token=${token}` : '/browse';

  return (
    <div className="max-w-md mx-auto px-4 py-16">
      <div className="text-center mb-8">
        <div className="text-5xl mb-4">✅</div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Payment Successful!</h1>
        <p className="text-gray-500 text-sm">Your access has been unlocked.</p>
      </div>

      {user ? (
        <div className="text-center">
          <p className="text-sm text-gray-500 mb-6">Access saved to your account.</p>
          <Link href={reviewsUrl} className="inline-block bg-blue-700 text-white px-8 py-3 rounded-lg font-semibold hover:bg-blue-800">
            View Reviews →
          </Link>
        </div>
      ) : (
        <div>
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-5 mb-6">
            <p className="font-semibold text-blue-900 mb-1 text-sm">Save access to your account</p>
            <p className="text-xs text-blue-700">Enter your email to get a magic link. Your purchase will be tied to your account so you can always get back in — no token URLs to lose.</p>
          </div>
          <LoginForm next={reviewsUrl} />
          <div className="mt-4 text-center">
            <Link href={reviewsUrl} className="text-sm text-gray-400 hover:text-gray-600 underline">
              Skip — just show me the reviews
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}

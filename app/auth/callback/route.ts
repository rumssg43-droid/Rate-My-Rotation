import { NextRequest, NextResponse } from 'next/server';
import { createServerClient as createSSRClient } from '@supabase/ssr';
import { createServiceClient } from '@/lib/supabase';
import { cookies } from 'next/headers';

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const next = searchParams.get('next'); // e.g. /reviews?token=SESSION_ID

  const cookieStore = await cookies();

  const supabase = createSSRClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll(); },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          );
        },
      },
    }
  );

  if (code) {
    const { data: { user }, error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error && user) {
      // If there's a pending token, link it to this user
      const pendingToken = cookieStore.get('pending_token')?.value;
      if (pendingToken) {
        const service = createServiceClient();
        await service
          .from('access_tokens')
          .update({ user_id: user.id })
          .eq('token', pendingToken)
          .is('user_id', null);

        cookieStore.set('pending_token', '', { maxAge: 0 });
      }

      const redirectTo = next || '/my-purchases';
      return NextResponse.redirect(`${origin}${redirectTo}`);
    }
  }

  return NextResponse.redirect(`${origin}/login?message=Sign-in+link+expired.+Please+try+again.`);
}

import LoginForm from './LoginForm';

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string; message?: string }> }) {
  const params = await searchParams;
  return (
    <div className="max-w-md mx-auto px-4 py-20">
      <h1 className="text-2xl font-bold text-gray-900 mb-2">Sign in</h1>
      <p className="text-gray-500 mb-8 text-sm">
        We&apos;ll send a magic link to your email — no password needed.
      </p>
      {params.message && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg px-4 py-3 text-sm text-blue-700 mb-6">
          {params.message}
        </div>
      )}
      <LoginForm next={params.next} />
    </div>
  );
}

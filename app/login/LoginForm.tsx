'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase-browser';

export default function LoginForm({ next }: { next?: string }) {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');

    const supabase = createClient();
    const appUrl = window.location.origin;
    const redirectTo = next
      ? `${appUrl}/auth/callback?next=${encodeURIComponent(next)}`
      : `${appUrl}/auth/callback`;

    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: redirectTo },
    });

    setLoading(false);
    if (error) {
      setError(error.message);
    } else {
      setSent(true);
    }
  }

  if (sent) {
    return (
      <div className="text-center py-6">
        <div className="text-4xl mb-4">📬</div>
        <p className="font-semibold text-gray-900 mb-2">Check your inbox</p>
        <p className="text-sm text-gray-500">We sent a magic link to <strong>{email}</strong>. Click it to sign in.</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Email address</label>
        <input
          type="email"
          required
          value={email}
          onChange={e => setEmail(e.target.value)}
          placeholder="you@example.com"
          className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <button
        type="submit"
        disabled={loading}
        className="w-full bg-blue-700 text-white py-2.5 rounded-lg text-sm font-semibold hover:bg-blue-800 disabled:opacity-50"
      >
        {loading ? 'Sending...' : 'Send magic link'}
      </button>
    </form>
  );
}

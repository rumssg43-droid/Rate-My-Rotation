import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import Link from 'next/link';
import { createServerClient } from '@/lib/supabase';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Rate My Rotation',
  description: 'Anonymous reviews of medical training rotations in the UK',
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  let user = null;
  try {
    const supabase = await createServerClient();
    const { data } = await supabase.auth.getUser();
    user = data.user;
  } catch {
    // Supabase not yet configured
  }

  return (
    <html lang="en">
      <body className={inter.className}>
        <nav className="border-b bg-white sticky top-0 z-50">
          <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
            <Link href="/" className="text-xl font-bold text-blue-700">Rate My Rotation</Link>
            <div className="flex items-center gap-5 text-sm font-medium">
              <Link href="/submit" className="text-gray-600 hover:text-blue-700">Submit Review</Link>
            </div>
          </div>
        </nav>
        <main>{children}</main>
        <footer className="border-t mt-20 py-8 text-center text-sm text-gray-400">
          <p>Rate My Rotation — Anonymous reviews for UK medical training</p>
        </footer>
      </body>
    </html>
  );
}

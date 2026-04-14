'use client';

import { useSearchParams } from 'next/navigation';
import { useState, Suspense } from 'react';
import { PRICE_PENCE, BUNDLE_PRICE_PENCE } from '@/lib/constants';

function CheckoutContent() {
  const params = useSearchParams();
  const deanery = params.get('deanery') || '';
  const trainingLevel = params.get('training_level') || '';
  const isBundle = params.get('bundle') === 'true';
  const [loading, setLoading] = useState(false);

  const pricePence = isBundle ? BUNDLE_PRICE_PENCE : PRICE_PENCE;
  const priceDisplay = `£${pricePence / 100}`;

  async function handleCheckout() {
    setLoading(true);
    try {
      const res = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ deanery, training_level: trainingLevel, bundle: isBundle }),
      });
      const { url } = await res.json();
      if (url) window.location.href = url;
    } finally {
      setLoading(false);
    }
  }

  const isValid = deanery && (isBundle || trainingLevel);

  return (
    <div className="max-w-md mx-auto px-4 py-20 text-center">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Access Reviews</h1>

      <div className="bg-gray-50 rounded-xl p-6 mb-6 text-left space-y-2">
        <p className="text-sm text-gray-500">You&apos;re purchasing access to</p>
        {isBundle ? (
          <>
            <p className="text-lg font-bold text-gray-900">All training pathways</p>
            <p className="text-blue-600 font-medium">{deanery}</p>
            <p className="text-xs text-gray-400 mt-1">Includes FY1, FY2, IMT, CST, ST3+ and all other pathways in this deanery.</p>
          </>
        ) : (
          <>
            <p className="text-lg font-bold text-gray-900">{trainingLevel}</p>
            <p className="text-blue-600 font-medium">{deanery}</p>
          </>
        )}
      </div>

      <div className="text-4xl font-bold text-gray-900 mb-1">{priceDisplay}</div>
      <p className="text-sm text-gray-400 mb-8">One-time payment. Permanent access.</p>

      <button
        onClick={handleCheckout}
        disabled={loading || !isValid}
        className="w-full bg-blue-700 text-white py-3 rounded-lg font-semibold hover:bg-blue-800 disabled:opacity-50"
      >
        {loading ? 'Redirecting...' : `Pay ${priceDisplay} with Stripe →`}
      </button>
      <p className="text-xs text-gray-400 mt-4">Powered by Stripe. Secure payment processing.</p>
    </div>
  );
}

export default function CheckoutPage() {
  return (
    <Suspense>
      <CheckoutContent />
    </Suspense>
  );
}

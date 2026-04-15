import { NextRequest, NextResponse } from 'next/server';
import { getStripe } from '@/lib/stripe';
import { PRICE_PENCE, BUNDLE_PRICE_PENCE } from '@/lib/constants';

export async function POST(req: NextRequest) {
  const { deanery, training_level, bundle } = await req.json();

  if (!deanery || (!bundle && !training_level)) {
    return NextResponse.json({ error: 'Missing parameters' }, { status: 400 });
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  const isBundle = !!bundle;
  const pricePence = isBundle ? BUNDLE_PRICE_PENCE : PRICE_PENCE;

  const productName = isBundle
    ? `Rate My Rotation — ${deanery} (All pathways)`
    : `Rate My Rotation — ${training_level} (${deanery})`;

  const description = isBundle
    ? `Unlimited access to all training pathways in the ${deanery} deanery.`
    : `Unlimited access to all ${training_level} reviews in the ${deanery} deanery.`;

  const cancelUrl = isBundle
    ? `${appUrl}/checkout?deanery=${encodeURIComponent(deanery)}&bundle=true`
    : `${appUrl}/checkout?deanery=${encodeURIComponent(deanery)}&training_level=${encodeURIComponent(training_level)}`;

  const session = await getStripe().checkout.sessions.create({
    payment_method_types: ['card'],
    line_items: [
      {
        price_data: {
          currency: 'gbp',
          product_data: { name: productName, description },
          unit_amount: pricePence,
        },
        quantity: 1,
      },
    ],
    mode: 'payment',
    success_url: `${appUrl}/success?token={CHECKOUT_SESSION_ID}`,
    cancel_url: cancelUrl,
    metadata: {
      deanery,
      training_level: training_level || '',
      is_bundle: isBundle ? 'true' : 'false',
    },
  });

  return NextResponse.json({ url: session.url });
}

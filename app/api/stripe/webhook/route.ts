import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { createServiceClient } from '@/lib/supabase';

export async function POST(req: NextRequest) {
  const payload = await req.text();
  const sig = req.headers.get('stripe-signature')!;

  let event;
  try {
    event = stripe.webhooks.constructEvent(payload, sig, process.env.STRIPE_WEBHOOK_SECRET!);
  } catch (err) {
    return NextResponse.json({ error: 'Webhook error' }, { status: 400 });
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as any;
    const { deanery, training_level, is_bundle } = session.metadata;
    const supabase = createServiceClient();

    // token = Stripe session ID (Stripe substitutes {CHECKOUT_SESSION_ID} in success_url)
    await supabase.from('access_tokens').upsert({
      token: session.id,
      stripe_payment_id: session.payment_intent || session.id,
      deanery,
      training_level: training_level || null,
      is_deanery_bundle: is_bundle === 'true',
      amount_paid_pence: session.amount_total,
    }, { onConflict: 'token' });
  }

  return NextResponse.json({ received: true });
}

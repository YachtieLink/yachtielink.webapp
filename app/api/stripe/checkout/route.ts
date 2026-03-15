import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe/client';
import { createClient } from '@/lib/supabase/server';

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await req.json();
  const plan = body?.plan as 'monthly' | 'annual' | undefined;

  if (plan !== 'monthly' && plan !== 'annual') {
    return NextResponse.json({ error: 'Invalid plan' }, { status: 400 });
  }

  // Fetch user record
  const { data: userRecord } = await supabase
    .from('users')
    .select('stripe_customer_id, email, full_name')
    .eq('id', user.id)
    .single();

  let stripeCustomerId = userRecord?.stripe_customer_id as string | null;

  // Create Stripe Customer if not yet linked
  if (!stripeCustomerId) {
    const customer = await stripe.customers.create({
      email: user.email,
      name: userRecord?.full_name ?? undefined,
      metadata: { supabase_user_id: user.id },
    });
    stripeCustomerId = customer.id;

    await supabase
      .from('users')
      .update({ stripe_customer_id: stripeCustomerId })
      .eq('id', user.id);
  }

  const priceId =
    plan === 'annual'
      ? process.env.STRIPE_PRO_ANNUAL_PRICE_ID
      : process.env.STRIPE_PRO_MONTHLY_PRICE_ID;

  if (!priceId) {
    return NextResponse.json({ error: 'Price ID not configured' }, { status: 500 });
  }

  const session = await stripe.checkout.sessions.create({
    customer: stripeCustomerId,
    mode: 'subscription',
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${process.env.NEXT_PUBLIC_SITE_URL}/app/insights?upgraded=true`,
    cancel_url: `${process.env.NEXT_PUBLIC_SITE_URL}/app/insights`,
    subscription_data: {
      metadata: { supabase_user_id: user.id },
    },
  });

  return NextResponse.json({ url: session.url });
}

import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe/client';
import { createClient } from '@/lib/supabase/server';
import { createServiceClient } from '@/lib/supabase/admin';

const FOUNDING_MEMBER_CAP = 100;

/**
 * Resolves which monthly price ID to use.
 * Returns the founding price (€6.99) if:
 *   - STRIPE_PRO_FOUNDING_PRICE_ID is configured
 *   - Active founding subscriber count is still < 100
 * Otherwise falls back to the standard monthly price (€8.99).
 */
async function resolveMonthlyPriceId(): Promise<string> {
  const foundingPriceId = process.env.STRIPE_PRO_FOUNDING_PRICE_ID;
  const standardPriceId = process.env.STRIPE_PRO_MONTHLY_PRICE_ID;

  if (!standardPriceId) throw new Error('STRIPE_PRO_MONTHLY_PRICE_ID is not set');
  if (!foundingPriceId) return standardPriceId;

  // Count active Pro subscribers currently tagged as founding members
  const admin = createServiceClient();
  const { count } = await admin
    .from('users')
    .select('id', { count: 'exact', head: true })
    .eq('subscription_status', 'pro')
    .eq('founding_member', true);

  return (count ?? 0) < FOUNDING_MEMBER_CAP ? foundingPriceId : standardPriceId;
}

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

  let priceId: string;
  let isFoundingPrice = false;

  if (plan === 'annual') {
    priceId = process.env.STRIPE_PRO_ANNUAL_PRICE_ID ?? '';
    if (!priceId) return NextResponse.json({ error: 'Annual price ID not configured' }, { status: 500 });
  } else {
    priceId = await resolveMonthlyPriceId();
    isFoundingPrice = priceId === process.env.STRIPE_PRO_FOUNDING_PRICE_ID;
  }

  const session = await stripe.checkout.sessions.create({
    customer: stripeCustomerId,
    mode: 'subscription',
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${process.env.NEXT_PUBLIC_SITE_URL}/app/insights?upgraded=true`,
    cancel_url: `${process.env.NEXT_PUBLIC_SITE_URL}/app/insights`,
    subscription_data: {
      metadata: {
        supabase_user_id: user.id,
        founding_member: isFoundingPrice ? 'true' : 'false',
      },
    },
  });

  return NextResponse.json({ url: session.url });
}

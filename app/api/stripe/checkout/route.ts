import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe/client';
import { createClient } from '@/lib/supabase/server';
import { createServiceClient } from '@/lib/supabase/admin';
import { validateBody } from '@/lib/validation/validate';
import { checkoutSchema } from '@/lib/validation/schemas';
import { applyRateLimit } from '@/lib/rate-limit/helpers';

const FOUNDING_MEMBER_CAP = 100;

/**
 * Returns the current founding member count (across both monthly and annual).
 * Used to gate both founding price IDs behind the same 100-slot cap.
 */
async function getFoundingMemberCount(): Promise<number> {
  const admin = createServiceClient();
  const { count } = await admin
    .from('users')
    .select('id', { count: 'exact', head: true })
    .eq('subscription_status', 'pro')
    .eq('founding_member', true);
  return count ?? 0;
}

/**
 * Resolves which monthly price ID to use.
 * Returns the founding price (€4.99) if slots remain, otherwise standard (€8.99).
 */
async function resolveMonthlyPriceId(): Promise<string> {
  const foundingPriceId = process.env.STRIPE_PRO_FOUNDING_PRICE_ID;
  const standardPriceId = process.env.STRIPE_PRO_MONTHLY_PRICE_ID;

  if (!standardPriceId) throw new Error('STRIPE_PRO_MONTHLY_PRICE_ID is not set');
  if (!foundingPriceId) return standardPriceId;

  const count = await getFoundingMemberCount();
  return count < FOUNDING_MEMBER_CAP ? foundingPriceId : standardPriceId;
}

/**
 * Resolves which annual price ID to use.
 * Returns the founding annual price (€49.99) if slots remain, otherwise standard (€69.99).
 */
async function resolveAnnualPriceId(): Promise<string> {
  const foundingAnnualPriceId = process.env.STRIPE_PRO_FOUNDING_ANNUAL_PRICE_ID;
  const standardAnnualPriceId = process.env.STRIPE_PRO_ANNUAL_PRICE_ID;

  if (!standardAnnualPriceId) throw new Error('STRIPE_PRO_ANNUAL_PRICE_ID is not set');
  if (!foundingAnnualPriceId) return standardAnnualPriceId;

  const count = await getFoundingMemberCount();
  return count < FOUNDING_MEMBER_CAP ? foundingAnnualPriceId : standardAnnualPriceId;
}

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Rate limit by IP to prevent spam checkout sessions
  const limited = await applyRateLimit(req, 'auth');
  if (limited) return limited;

  const result = await validateBody(req, checkoutSchema);
  if ('error' in result) return result.error;
  const { plan } = result.data;

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
    priceId = await resolveAnnualPriceId();
    isFoundingPrice = priceId === process.env.STRIPE_PRO_FOUNDING_ANNUAL_PRICE_ID;
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

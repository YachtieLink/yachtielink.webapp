import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe/client';
import { createServiceClient } from '@/lib/supabase/admin';
import { sendSubscriptionWelcomeEmail } from '@/lib/email/subscription-welcome';
import { sendPaymentFailedEmail } from '@/lib/email/payment-failed';

// Must be nodejs runtime to access raw request body for signature verification
export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  const body = await req.text();
  const signature = req.headers.get('stripe-signature');

  if (!signature) {
    return NextResponse.json({ error: 'No signature' }, { status: 400 });
  }

  let event;
  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!,
    );
  } catch (err) {
    console.error('Webhook signature verification failed:', err);
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  const supabase = createServiceClient();

  switch (event.type) {
    case 'customer.subscription.created':
    case 'customer.subscription.updated': {
      const subscription = event.data.object;
      const userId = subscription.metadata?.supabase_user_id;
      if (!userId) {
        console.error('Webhook: missing supabase_user_id on subscription', subscription.id);
        break;
      }

      const isActive = ['active', 'trialing'].includes(subscription.status);
      const interval = subscription.items.data[0]?.price.recurring?.interval;
      const plan = interval === 'year' ? 'annual' : 'monthly';

      await supabase.from('users').update({
        subscription_status: isActive ? 'pro' : 'free',
        subscription_plan: isActive ? plan : null,
        subscription_ends_at: isActive
          ? new Date((subscription as any).current_period_end * 1000).toISOString()
          : null,
        show_watermark: !isActive,
      }).eq('id', userId);

      // Send welcome email on new subscription
      if (event.type === 'customer.subscription.created' && isActive) {
        const { data: userRecord } = await supabase
          .from('users')
          .select('email, display_name, full_name')
          .eq('id', userId)
          .single();

        if (userRecord?.email) {
          await sendSubscriptionWelcomeEmail({
            email: userRecord.email,
            name: userRecord.full_name ?? userRecord.display_name ?? 'there',
          }).catch((err) => console.error('Welcome email failed:', err));
        }
      }

      break;
    }

    case 'customer.subscription.deleted': {
      const subscription = event.data.object;
      const userId = subscription.metadata?.supabase_user_id;
      if (!userId) {
        console.error('Webhook: missing supabase_user_id on deleted subscription', subscription.id);
        break;
      }

      await supabase.from('users').update({
        subscription_status: 'free',
        subscription_plan: null,
        subscription_ends_at: null,
        show_watermark: true,
        custom_subdomain: null,
        template_id: null,
      }).eq('id', userId);

      break;
    }

    case 'invoice.payment_failed': {
      const invoice = event.data.object;
      const customerId = invoice.customer as string;

      const { data: userRecord } = await supabase
        .from('users')
        .select('id, email, display_name, full_name')
        .eq('stripe_customer_id', customerId)
        .single();

      if (userRecord?.email) {
        // Log but do NOT downgrade — Stripe retries automatically
        console.error(`Payment failed for user ${userRecord.id}`);
        await sendPaymentFailedEmail({
          email: userRecord.email,
          name: userRecord.full_name ?? userRecord.display_name ?? 'there',
        }).catch((err) => console.error('Payment failed email failed:', err));
      }

      break;
    }
  }

  return NextResponse.json({ received: true });
}

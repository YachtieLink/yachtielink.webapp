import { sendNotifyEmail } from './notify';

interface PaymentFailedParams {
  email: string;
  name: string;
}

export async function sendPaymentFailedEmail({ email, name }: PaymentFailedParams): Promise<void> {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://yachtie.link';

  await sendNotifyEmail({
    to: email,
    subject: 'Payment failed for your Crew Pro subscription',
    html: `
      <div style="font-family:sans-serif;max-width:560px;margin:0 auto;padding:32px 24px">
        <h1 style="font-size:20px;margin-bottom:8px">Payment failed, ${name}</h1>
        <p style="color:#475569">
          We couldn&apos;t process your latest payment for Crew Pro.
          Please update your payment method to keep your Pro features active.
        </p>
        <p style="color:#475569">
          We&apos;ll retry automatically — no action needed if your card details are correct.
        </p>
        <a href="${siteUrl}/api/stripe/portal"
           style="display:inline-block;margin-top:24px;padding:12px 24px;background:#0D7377;color:#fff;border-radius:8px;text-decoration:none;font-weight:600">
          Update Payment Method
        </a>
        <p style="color:#94a3b8;font-size:12px;margin-top:24px">
          If you need help, reply to this email or contact hello@yachtie.link.
        </p>
      </div>
    `,
    text: `Hi ${name},\n\nWe couldn't process your Crew Pro payment. Please update your payment method at ${siteUrl}/app/more.\n\nWe'll retry automatically.`,
  });
}

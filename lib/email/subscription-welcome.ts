import { sendNotifyEmail } from './notify';

interface WelcomeEmailParams {
  email: string;
  name: string;
}

export async function sendSubscriptionWelcomeEmail({ email, name }: WelcomeEmailParams): Promise<void> {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://yachtie.link';

  await sendNotifyEmail({
    to: email,
    subject: 'Welcome to Crew Pro',
    html: `
      <div style="font-family:sans-serif;max-width:560px;margin:0 auto;padding:32px 24px">
        <h1 style="font-size:22px;margin-bottom:8px">Welcome to Crew Pro, ${name}!</h1>
        <p style="color:#475569">You now have access to:</p>
        <ul style="color:#475569;line-height:2">
          <li>Profile analytics — see who views your profile</li>
          <li>Premium CV templates (Classic Navy, Modern Minimal)</li>
          <li>No watermark on exported CVs</li>
          <li>Cert document manager + expiry reminders</li>
          <li>Custom subdomain: your-handle.yachtie.link</li>
          <li>20 endorsement requests per day (vs 10)</li>
        </ul>
        <a href="${siteUrl}/app/insights"
           style="display:inline-block;margin-top:24px;padding:12px 24px;background:#0D7377;color:#fff;border-radius:8px;text-decoration:none;font-weight:600">
          Explore your new features
        </a>
      </div>
    `,
    text: `Welcome to Crew Pro, ${name}!\n\nYou now have access to premium templates, analytics, cert manager, custom subdomain, watermark removal, and 20 endorsement requests/day.\n\nExplore: ${siteUrl}/app/insights`,
  });
}

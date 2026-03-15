import { sendNotifyEmail } from './notify';

interface AnalyticsNudgeParams {
  email: string;
  name: string;
  viewCount: number;
}

export async function sendAnalyticsNudgeEmail({
  email,
  name,
  viewCount,
}: AnalyticsNudgeParams): Promise<void> {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://yachtie.link';

  await sendNotifyEmail({
    to: email,
    subject: `Your profile got ${viewCount} views this week`,
    html: `
      <div style="font-family:sans-serif;max-width:560px;margin:0 auto;padding:32px 24px">
        <h1 style="font-size:20px;margin-bottom:8px">People are finding you, ${name}</h1>
        <p style="color:#475569">
          Your YachtieLink profile received <strong>${viewCount} views</strong> in the last 7 days.
        </p>
        <p style="color:#475569">
          Upgrade to Crew Pro to see exactly who&apos;s viewing your profile, track PDF downloads,
          and get detailed analytics over time.
        </p>
        <a href="${siteUrl}/app/insights"
           style="display:inline-block;margin-top:24px;padding:12px 24px;background:#0D7377;color:#fff;border-radius:8px;text-decoration:none;font-weight:600">
          See your analytics
        </a>
        <p style="color:#94a3b8;font-size:12px;margin-top:24px">
          You&apos;re receiving this because your profile is getting above-average attention.
          We only send this once.
        </p>
      </div>
    `,
    text: `Hi ${name},\n\nYour YachtieLink profile got ${viewCount} views this week. Upgrade to Pro to see full analytics: ${siteUrl}/app/insights`,
  });
}

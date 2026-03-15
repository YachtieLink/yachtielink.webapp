import { sendNotifyEmail } from './notify';

interface CertExpiryEmailParams {
  email: string;
  name: string;
  certName: string;
  expiryDate: string;
  daysUntilExpiry: number;
}

export async function sendCertExpiryEmail({
  email,
  name,
  certName,
  expiryDate,
  daysUntilExpiry,
}: CertExpiryEmailParams): Promise<void> {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://yachtie.link';
  const expFormatted = new Date(expiryDate).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  await sendNotifyEmail({
    to: email,
    subject: `Your ${certName} expires in ${daysUntilExpiry} days`,
    html: `
      <div style="font-family:sans-serif;max-width:560px;margin:0 auto;padding:32px 24px">
        <h1 style="font-size:20px;margin-bottom:8px">Cert expiry reminder</h1>
        <p style="color:#475569">Hi ${name},</p>
        <p style="color:#475569">
          Your <strong>${certName}</strong> expires on <strong>${expFormatted}</strong>
          (${daysUntilExpiry} days away).
        </p>
        <p style="color:#475569">
          Log in to manage your certifications and upload a renewal when you&apos;re ready.
        </p>
        <a href="${siteUrl}/app/certs"
           style="display:inline-block;margin-top:24px;padding:12px 24px;background:#0D7377;color:#fff;border-radius:8px;text-decoration:none;font-weight:600">
          Manage Certifications
        </a>
      </div>
    `,
    text: `Hi ${name},\n\nYour ${certName} expires on ${expFormatted} (${daysUntilExpiry} days away).\n\nManage your certs: ${siteUrl}/app/certs`,
  });
}

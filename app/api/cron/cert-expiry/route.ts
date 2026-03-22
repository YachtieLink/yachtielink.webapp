import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/admin';
import { sendCertExpiryEmail } from '@/lib/email/cert-expiry';
import { handleApiError } from '@/lib/api/errors';

export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
  try {
    // Verify request is from Vercel Cron — secret is mandatory
    const cronSecret = req.headers.get('authorization');
    if (!process.env.CRON_SECRET || cronSecret !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = createServiceClient();
    const now = new Date();

    // 60-day window
    const in60 = new Date();
    in60.setDate(in60.getDate() + 60);

    // Find Pro users' certs expiring within 60 days where reminder hasn't been sent
    const { data: certsDue } = await supabase
      .from('certifications')
      .select(`
        id,
        user_id,
        custom_cert_name,
        expires_at,
        expiry_reminder_60d_sent,
        expiry_reminder_30d_sent,
        certification_types ( name ),
        users!inner (
          id, email, full_name, display_name, subscription_status
        )
      `)
      .lte('expires_at', in60.toISOString())
      .gt('expires_at', now.toISOString())
      .eq('users.subscription_status', 'pro');

    if (!certsDue?.length) {
      return NextResponse.json({ sent: 0 });
    }

    const sent60dIds: string[] = [];
    const sent30dIds: string[] = [];
    const emailPromises: Promise<void>[] = [];

    for (const cert of certsDue) {
      const user = (cert as any).users;
      if (!user?.email) continue;

      const expiryDate = new Date(cert.expires_at!);
      const daysLeft = Math.ceil((expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      const certName = (cert as any).certification_types?.name ?? cert.custom_cert_name ?? 'Certification';
      const name = user.full_name ?? user.display_name ?? 'there';

      // 60-day reminder: only for certs 31-60 days out
      if (daysLeft > 30 && daysLeft <= 60 && !cert.expiry_reminder_60d_sent) {
        emailPromises.push(
          sendCertExpiryEmail({ email: user.email, name, certName, expiryDate: cert.expires_at!, daysUntilExpiry: daysLeft })
        );
        sent60dIds.push(cert.id);
      }
      // 30-day reminder: for certs 1-30 days out
      else if (daysLeft <= 30 && !cert.expiry_reminder_30d_sent) {
        emailPromises.push(
          sendCertExpiryEmail({ email: user.email, name, certName, expiryDate: cert.expires_at!, daysUntilExpiry: daysLeft })
        );
        sent30dIds.push(cert.id);
      }
    }

    // Fire emails in parallel
    await Promise.allSettled(emailPromises);

    // Batch update flags
    if (sent60dIds.length > 0) {
      await supabase.from('certifications').update({ expiry_reminder_60d_sent: true }).in('id', sent60dIds);
    }
    if (sent30dIds.length > 0) {
      await supabase.from('certifications').update({ expiry_reminder_30d_sent: true }).in('id', sent30dIds);
    }

    return NextResponse.json({ sent: sent60dIds.length + sent30dIds.length });
  } catch (e) {
    return handleApiError(e);
  }
}

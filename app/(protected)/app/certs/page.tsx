/**
 * /app/certs — Certification Document Manager
 *
 * Free users: see their certs, nudge banner to upgrade for expiry tracking.
 * Pro users: expiry alerts, status filtering, document upload/replace.
 */
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { getProStatus } from '@/lib/stripe/pro';
import { CertsClient } from '@/components/certs/CertsClient';
import { ProUpsellCard } from '@/components/ui/ProUpsellCard';
import { SectionVisibilityToggle } from '@/components/profile/SectionVisibilityToggle';

export default async function CertsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/welcome');

  const [proStatus, { data: certs }] = await Promise.all([
    getProStatus(user.id),
    supabase
      .from('certifications')
      .select(`
        id,
        custom_cert_name,
        issued_at,
        expires_at,
        document_url,
        expiry_reminder_60d_sent,
        expiry_reminder_30d_sent,
        certification_types ( name, short_name, category )
      `)
      .eq('user_id', user.id)
      .order('expires_at', { ascending: true, nullsFirst: false }),
  ]);

  return (
    <div className="flex flex-col gap-4 pb-24">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-[var(--color-text-primary)]">Certifications</h1>
        <Link
          href="/app/certification/new"
          className="text-sm font-medium text-[var(--color-teal-700)] dark:text-[var(--color-teal-400)]"
        >
          + Add
        </Link>
      </div>

      {!proStatus.isPro && (
        <ProUpsellCard
          variant="banner"
          feature="cert expiry tracking and email reminders"
          description="Know before your tickets lapse — automated alerts keep you compliant and ready for the next contract"
          context="certs"
        />
      )}

      <CertsClient
        userId={user.id}
        certs={(certs ?? []) as any}
        isPro={proStatus.isPro}
      />

      <SectionVisibilityToggle sectionKey="certifications" label="Certifications" />
    </div>
  );
}

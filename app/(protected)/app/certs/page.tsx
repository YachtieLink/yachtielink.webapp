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
        <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 rounded-2xl px-4 py-3 flex items-start justify-between gap-3">
          <p className="text-sm text-amber-800 dark:text-amber-300">
            Upgrade to Pro for expiry tracking and email reminders.
          </p>
          <Link
            href="/app/settings/plan"
            className="text-xs font-semibold text-amber-800 dark:text-amber-300 underline flex-shrink-0"
          >
            Upgrade
          </Link>
        </div>
      )}

      <CertsClient
        userId={user.id}
        certs={(certs ?? []) as any}
        isPro={proStatus.isPro}
      />
    </div>
  );
}

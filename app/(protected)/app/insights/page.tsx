/**
 * Insights page — Crew Pro analytics hub.
 *
 * Free users: teaser cards + upgrade CTA (gated behind profile completeness).
 * Pro users: real analytics with time-series charts + plan management.
 */
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { Lock } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { createClient } from '@/lib/supabase/server';
import { getProStatus } from '@/lib/stripe/pro';
import { AnalyticsChart } from '@/components/insights/AnalyticsChart';
import { UpgradeCTA } from '@/components/insights/UpgradeCTA';
import { InsightsUpgradedToast } from '@/components/insights/InsightsUpgradedToast';
import { ManagePortalButton } from '@/components/insights/ManagePortalButton';
import { PageTransition } from '@/components/ui/PageTransition';

type TimeRange = '7' | '30' | 'all';

interface Props {
  searchParams: Promise<{ upgraded?: string; range?: string }>;
}

export default async function InsightsPage({ searchParams }: Props) {
  const sp = await searchParams;
  const upgraded = sp.upgraded === 'true';
  const range = (['7', '30', 'all'].includes(sp.range ?? '') ? sp.range : '30') as TimeRange;
  const days = range === 'all' ? 365 : Number(range);

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/welcome');

  const [{ data: profile }, proStatus, { data: attachments }, { data: certs }] = await Promise.all([
    supabase
      .from('users')
      .select('primary_role, bio, profile_photo_url, subscription_plan, subscription_ends_at, stripe_customer_id')
      .eq('id', user.id)
      .single(),
    getProStatus(user.id),
    supabase.from('attachments').select('id').eq('user_id', user.id).is('deleted_at', null).limit(1),
    supabase.from('certifications').select('id').eq('user_id', user.id).limit(1),
  ]);

  const milestones = {
    roleSet:  !!profile?.primary_role,
    hasYacht: (attachments?.length ?? 0) > 0,
    bioSet:   !!profile?.bio,
    hasCert:  (certs?.length ?? 0) > 0,
    hasPhoto: !!profile?.profile_photo_url,
  };
  const completedCount = Object.values(milestones).filter(Boolean).length;
  const profileComplete = completedCount >= 5;

  // Founding member slots remaining (for free users only)
  let foundingSlotsLeft: number | null = null;
  if (!proStatus.isPro && process.env.STRIPE_PRO_FOUNDING_PRICE_ID) {
    const { count: foundingCount } = await supabase
      .from('users')
      .select('id', { count: 'exact', head: true })
      .eq('subscription_status', 'pro')
      .eq('founding_member', true);
    foundingSlotsLeft = Math.max(0, 100 - (foundingCount ?? 0));
  }

  // Pro analytics data
  type TimeseriesRow = { day: string; event_count: number };
  type SummaryRow = { event_type: string; event_count: number };

  let viewsData: { day: string; count: number }[] = [];
  let downloadsData: { day: string; count: number }[] = [];
  let sharesData: { day: string; count: number }[] = [];
  let summaryMap: Record<string, number> = {};
  let expiringCertCount = 0;

  if (proStatus.isPro) {
    const sixtyDays = new Date();
    sixtyDays.setDate(sixtyDays.getDate() + 60);

    const [viewsRes, downloadsRes, sharesRes, summaryRes, certsExpRes] = await Promise.all([
      supabase.rpc('get_analytics_timeseries', { p_user_id: user.id, p_event_type: 'profile_view', p_days: days }),
      supabase.rpc('get_analytics_timeseries', { p_user_id: user.id, p_event_type: 'pdf_download', p_days: days }),
      supabase.rpc('get_analytics_timeseries', { p_user_id: user.id, p_event_type: 'link_share',   p_days: days }),
      supabase.rpc('get_analytics_summary',    { p_user_id: user.id, p_days: days }),
      supabase
        .from('certifications')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .lte('expires_at', sixtyDays.toISOString())
        .gt('expires_at', new Date().toISOString()),
    ]);

    const toChart = (rows: TimeseriesRow[] | null) =>
      (rows ?? []).map((r) => ({ day: r.day, count: Number(r.event_count) }));

    viewsData     = toChart(viewsRes.data);
    downloadsData = toChart(downloadsRes.data);
    sharesData    = toChart(sharesRes.data);
    summaryMap    = Object.fromEntries(
      (summaryRes.data as SummaryRow[] ?? []).map((r) => [r.event_type, Number(r.event_count)])
    );
    expiringCertCount = certsExpRes.count ?? 0;
  }

  return (
    <PageTransition className="flex flex-col gap-4 pb-24 -mx-4 px-4 md:-mx-6 md:px-6 bg-[var(--color-coral-50)]">
      {upgraded && <InsightsUpgradedToast isPro={proStatus.isPro} />}

      <div className="flex items-center justify-between">
        <h1 className="text-[28px] font-bold tracking-tight text-[var(--color-text-primary)]">Insights</h1>
        {proStatus.isPro && (
          <span className="text-xs font-semibold bg-[var(--color-sand-100)] text-[var(--color-sand-400)] px-2.5 py-1 rounded-full">
            Pro ✓
          </span>
        )}
      </div>

      {proStatus.isPro ? (
        <>
          <div className="flex gap-2">
            {(['7', '30', 'all'] as const).map((r) => (
              <Link
                key={r}
                href={`/app/insights?range=${r}`}
                className={`flex-1 text-center py-2 rounded-xl text-sm font-medium transition-colors ${
                  range === r
                    ? 'bg-[var(--color-teal-700)] text-white'
                    : 'bg-[var(--color-surface-raised)] text-[var(--color-text-primary)]'
                }`}
              >
                {r === '7' ? '7 days' : r === '30' ? '30 days' : 'All time'}
              </Link>
            ))}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <AnalyticsCard title="Profile Views" count={summaryMap['profile_view'] ?? 0} data={viewsData} color="var(--chart-1)" />
            </div>
            <AnalyticsCard title="PDF Downloads" count={summaryMap['pdf_download'] ?? 0} data={downloadsData} color="var(--chart-2)" />
            <AnalyticsCard title="Link Shares"   count={summaryMap['link_share']   ?? 0} data={sharesData}    color="var(--chart-3)" />

            <div className="card-soft rounded-2xl p-4">
              <div className="flex flex-col gap-2">
                <p className="text-sm font-semibold text-[var(--color-text-primary)]">Cert Document Manager</p>
                {expiringCertCount > 0 ? (
                  <p className="text-xs text-amber-600 dark:text-amber-400">
                    ⚠ {expiringCertCount} cert{expiringCertCount > 1 ? 's' : ''} expiring within 60 days
                  </p>
                ) : (
                  <p className="text-xs text-[var(--color-text-secondary)]">All certs up to date</p>
                )}
                <Link href="/app/certs">
                  <Button variant="ghost" size="sm">Manage</Button>
                </Link>
              </div>
            </div>

            <div className="card-soft rounded-2xl p-4">
              <p className="text-sm font-semibold text-[var(--color-text-primary)] mb-0.5">
                Crew Pro · {profile?.subscription_plan === 'annual' ? 'Annual' : 'Monthly'}
              </p>
              {proStatus.endsAt && (
                <p className="text-xs text-[var(--color-text-secondary)] mb-3">
                  Renews {new Date(proStatus.endsAt).toLocaleDateString('en-GB', {
                    day: 'numeric', month: 'short', year: 'numeric',
                  })}
                </p>
              )}
              {profile?.stripe_customer_id && <ManagePortalButton />}
            </div>
          </div>
        </>
      ) : (
        <>
          <TeaserCard title="Profile Views"         subtitle="See how many people viewed your profile" />
          <TeaserCard title="PDF Downloads"         subtitle="Track how often your CV is downloaded" />
          <TeaserCard title="Link Shares"           subtitle="See how often your profile link is shared" />
          <TeaserCard title="Premium Templates"     subtitle="2 additional PDF styles (Classic Navy, Modern Minimal)" />
          <TeaserCard title="Cert Document Manager" subtitle="Expiry tracking + email reminders" />

          {!profileComplete ? (
            <div className="card-soft rounded-2xl p-4 text-center">
              <p className="text-sm font-semibold text-[var(--color-text-primary)] mb-1">
                Finish setting up your profile first
              </p>
              <p className="text-xs text-[var(--color-text-secondary)] mb-4">
                Complete your profile ({completedCount}/5 steps done) before upgrading — you&apos;ll get more out of Pro analytics with an active profile.
              </p>
              <Link
                href="/app/profile"
                className="inline-block px-5 py-2.5 rounded-xl bg-[var(--color-teal-700)] text-white text-sm font-semibold"
              >
                Complete profile
              </Link>
            </div>
          ) : (
            <UpgradeCTA foundingSlotsLeft={foundingSlotsLeft} />
          )}
        </>
      )}
    </PageTransition>
  );
}

function TeaserCard({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div className="card-soft rounded-2xl p-4 flex items-center justify-between">
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-[var(--color-text-primary)]">{title}</p>
        <p className="text-xs text-[var(--color-text-tertiary)] mt-0.5">{subtitle}</p>
      </div>
      <span className="shrink-0 flex items-center gap-1.5 text-xs font-medium text-[var(--color-sand-400)] bg-[var(--color-sand-100)] px-2.5 py-1 rounded-full ml-3">
        <Lock size={12} />
        Pro
      </span>
    </div>
  );
}

function AnalyticsCard({
  title,
  count,
  data,
  color,
}: {
  title: string;
  count: number;
  data: { day: string; count: number }[];
  color: string;
}) {
  return (
    <div className="card-soft rounded-2xl p-4">
      <div className="flex items-baseline justify-between mb-3">
        <p className="text-sm font-semibold text-[var(--color-text-primary)]">{title}</p>
        <span className="text-2xl font-bold text-[var(--color-text-primary)]">{count}</span>
      </div>
      <AnalyticsChart data={data} color={color} />
    </div>
  );
}

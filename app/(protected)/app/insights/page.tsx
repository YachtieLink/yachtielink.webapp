/**
 * Insights page — Crew Pro analytics hub.
 *
 * Free users: teaser cards + upgrade CTA (gated behind profile completeness).
 * Pro users: real analytics with time-series charts + plan management.
 */
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { getProStatus } from '@/lib/stripe/pro';
import { AnalyticsChart } from '@/components/insights/AnalyticsChart';
import { UpgradeCTA } from '@/components/insights/UpgradeCTA';
import { InsightsUpgradedToast } from '@/components/insights/InsightsUpgradedToast';
import { ManagePortalButton } from '@/components/insights/ManagePortalButton';

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

  const [{ data: profile }, proStatus] = await Promise.all([
    supabase
      .from('users')
      .select('primary_role, bio, profile_photo_url, subscription_plan, subscription_ends_at, stripe_customer_id')
      .eq('id', user.id)
      .single(),
    getProStatus(user.id),
  ]);

  // Wheel A completeness
  const [{ data: attachments }, { data: certs }] = await Promise.all([
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
        .lte('expiry_date', sixtyDays.toISOString())
        .gt('expiry_date', new Date().toISOString()),
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
    <div className="flex flex-col gap-4 pb-24">
      {upgraded && <InsightsUpgradedToast isPro={proStatus.isPro} />}

      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-[var(--foreground)]">Insights</h1>
        {proStatus.isPro && (
          <span className="text-xs font-semibold bg-[var(--teal-700)] text-white px-2.5 py-1 rounded-full">
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
                    ? 'bg-[var(--teal-700)] text-white'
                    : 'bg-[var(--muted)] text-[var(--foreground)]'
                }`}
              >
                {r === '7' ? '7 days' : r === '30' ? '30 days' : 'All time'}
              </Link>
            ))}
          </div>

          <AnalyticsCard title="Profile Views" count={summaryMap['profile_view'] ?? 0} data={viewsData}     color="#0D7377" />
          <AnalyticsCard title="PDF Downloads" count={summaryMap['pdf_download'] ?? 0} data={downloadsData} color="#0D9488" />
          <AnalyticsCard title="Link Shares"   count={summaryMap['link_share']   ?? 0} data={sharesData}    color="#14B8A6" />

          <div className="bg-[var(--card)] rounded-2xl p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-[var(--foreground)]">Cert Document Manager</p>
                {expiringCertCount > 0 ? (
                  <p className="text-xs text-amber-600 dark:text-amber-400 mt-0.5">
                    ⚠ {expiringCertCount} cert{expiringCertCount > 1 ? 's' : ''} expiring within 60 days
                  </p>
                ) : (
                  <p className="text-xs text-[var(--muted-foreground)] mt-0.5">All certs up to date</p>
                )}
              </div>
              <Link href="/app/certs" className="text-sm font-medium text-[var(--teal-700)] dark:text-[var(--teal-400)]">
                Manage →
              </Link>
            </div>
          </div>

          <div className="bg-[var(--card)] rounded-2xl p-4">
            <p className="text-sm font-semibold text-[var(--foreground)] mb-0.5">
              Crew Pro · {profile?.subscription_plan === 'annual' ? 'Annual' : 'Monthly'}
            </p>
            {proStatus.endsAt && (
              <p className="text-xs text-[var(--muted-foreground)] mb-3">
                Renews {new Date(proStatus.endsAt).toLocaleDateString('en-GB', {
                  day: 'numeric', month: 'short', year: 'numeric',
                })}
              </p>
            )}
            {profile?.stripe_customer_id && <ManagePortalButton />}
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
            <div className="bg-[var(--card)] rounded-2xl p-5 text-center">
              <p className="text-sm font-semibold text-[var(--foreground)] mb-1">
                Finish setting up your profile first
              </p>
              <p className="text-xs text-[var(--muted-foreground)] mb-4">
                Complete your profile ({completedCount}/5 steps done) before upgrading — you&apos;ll get more out of Pro analytics with an active profile.
              </p>
              <Link
                href="/app/profile"
                className="inline-block px-5 py-2.5 rounded-xl bg-[var(--teal-700)] text-white text-sm font-semibold"
              >
                Complete profile
              </Link>
            </div>
          ) : (
            <UpgradeCTA />
          )}
        </>
      )}
    </div>
  );
}

function TeaserCard({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div className="bg-[var(--card)] rounded-2xl p-4 flex items-center justify-between opacity-70">
      <div>
        <p className="text-sm font-semibold text-[var(--foreground)]">{title}</p>
        <p className="text-xs text-[var(--muted-foreground)] mt-0.5">{subtitle}</p>
      </div>
      <span className="text-[var(--muted-foreground)] text-lg ml-3 flex-shrink-0">🔒</span>
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
    <div className="bg-[var(--card)] rounded-2xl p-4">
      <div className="flex items-baseline justify-between mb-3">
        <p className="text-sm font-semibold text-[var(--foreground)]">{title}</p>
        <span className="text-2xl font-bold text-[var(--foreground)]">{count}</span>
      </div>
      <AnalyticsChart data={data} color={color} />
    </div>
  );
}

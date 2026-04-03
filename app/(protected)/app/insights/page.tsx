/**
 * Insights page — Career analytics dashboard.
 *
 * Pro users: real analytics with sparklines, trends, Who Viewed You.
 * Free users: career snapshot + coaching + blurred analytics + upgrade CTA.
 * Coral wayfinding throughout.
 */
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { getProStatus } from '@/lib/stripe/pro'
import { MetricCard } from '@/components/insights/MetricCard'
import { TimeRangeSelector } from '@/components/insights/TimeRangeSelector'
import { CareerSnapshot } from '@/components/insights/CareerSnapshot'
import { WhoViewedYou } from '@/components/insights/WhoViewedYou'
import { UpgradeCTA } from '@/components/insights/UpgradeCTA'
import { InsightsUpgradedToast } from '@/components/insights/InsightsUpgradedToast'
import { PageTransition } from '@/components/ui/PageTransition'
type TimeRange = '7' | '30' | 'all'

interface Props {
  searchParams: Promise<{ upgraded?: string; range?: string }>
}

export default async function InsightsPage({ searchParams }: Props) {
  const sp = await searchParams
  const upgraded = sp.upgraded === 'true'
  const range = (['7', '30', 'all'].includes(sp.range ?? '') ? sp.range : '30') as TimeRange
  const days = range === 'all' ? 365 : Number(range)

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/welcome')

  const [proStatus, seaTimeRes, { data: attachments }, { data: certs }, { data: profile }] = await Promise.all([
    getProStatus(user.id),
    supabase.rpc('get_sea_time', { p_user_id: user.id }),
    supabase.from('attachments').select('id').eq('user_id', user.id).is('deleted_at', null),
    supabase.from('certifications').select('id').eq('user_id', user.id),
    supabase
      .from('users')
      .select('profile_photo_url, bio, primary_role')
      .eq('id', user.id)
      .single(),
  ])

  const seaTime = seaTimeRes.data as { total_days: number; yacht_count: number }[] | null
  const seaTimeDays = seaTime?.[0]?.total_days ?? 0
  const yachtCount = seaTime?.[0]?.yacht_count ?? 0
  const certCount = certs?.length ?? 0

  // Profile strength for coaching
  const strengthScore = [
    !!profile?.profile_photo_url,
    !!profile?.primary_role,
    !!profile?.bio,
    (attachments?.length ?? 0) > 0,
    certCount > 0,
  ].filter(Boolean).length
  const strengthPct = Math.round((strengthScore / 5) * 100)
  const strengthNext = !profile?.profile_photo_url
    ? { label: 'Add a profile photo', href: '/app/profile/photos' }
    : !profile?.bio
    ? { label: 'Write your bio', href: '/app/about/edit' }
    : certCount === 0
    ? { label: 'Add certifications', href: '/app/certification/new' }
    : null

  // ─── Pro Analytics Data ────────────────────────────────────────────────

  type TimeseriesRow = { day: string; event_count: number }
  type SummaryRow = { event_type: string; event_count: number }

  let viewsData: { day: string; count: number }[] = []
  let downloadsData: { day: string; count: number }[] = []
  let sharesData: { day: string; count: number }[] = []
  let savesData: { day: string; count: number }[] = []
  let summaryMap: Record<string, number> = {}

  if (proStatus.isPro) {
    const [viewsRes, downloadsRes, sharesRes, savesRes, summaryRes] = await Promise.all([
      supabase.rpc('get_analytics_timeseries', { p_user_id: user.id, p_event_type: 'profile_view', p_days: days }),
      supabase.rpc('get_analytics_timeseries', { p_user_id: user.id, p_event_type: 'pdf_download', p_days: days }),
      supabase.rpc('get_analytics_timeseries', { p_user_id: user.id, p_event_type: 'link_share', p_days: days }),
      supabase.rpc('get_analytics_timeseries', { p_user_id: user.id, p_event_type: 'profile_save', p_days: days }),
      supabase.rpc('get_analytics_summary', { p_user_id: user.id, p_days: days }),
    ])

    const toChart = (rows: TimeseriesRow[] | null) =>
      (rows ?? []).map((r) => ({ day: r.day, count: Number(r.event_count) }))

    viewsData = toChart(viewsRes.data)
    downloadsData = toChart(downloadsRes.data)
    sharesData = toChart(sharesRes.data)
    savesData = toChart(savesRes.data)
    summaryMap = Object.fromEntries(
      (summaryRes.data as SummaryRow[] ?? []).map((r) => [r.event_type, Number(r.event_count)])
    )
  }

  // Founding member slots (free users)
  let foundingSlotsLeft: number | null = null
  if (!proStatus.isPro && process.env.STRIPE_PRO_FOUNDING_PRICE_ID) {
    const { count: foundingCount } = await supabase
      .from('users')
      .select('id', { count: 'exact', head: true })
      .eq('subscription_status', 'pro')
      .eq('founding_member', true)
    foundingSlotsLeft = Math.max(0, 100 - (foundingCount ?? 0))
  }

  return (
    <PageTransition className="flex flex-col gap-4 pb-24 -mx-4 px-4 md:-mx-6 md:px-6 bg-[var(--color-coral-50)]">
      {upgraded && <InsightsUpgradedToast isPro={proStatus.isPro} />}

      <div className="flex items-center justify-between pt-2">
        <h1 className="text-[28px] font-serif tracking-tight text-[var(--color-text-primary)]">
          Career Insights
        </h1>
        {proStatus.isPro && (
          <span className="text-xs font-semibold bg-[var(--color-sand-100)] text-[var(--color-sand-400)] px-2.5 py-1 rounded-full">
            Pro ✓
          </span>
        )}
      </div>

      {proStatus.isPro ? (
        <>
          {/* Time range selector */}
          <TimeRangeSelector currentRange={range} />

          {/* Metric cards grid */}
          <div className="grid grid-cols-2 gap-3">
            {/* Hero metric — Profile Views */}
            <MetricCard
              title="Profile Views"
              value={summaryMap['profile_view'] ?? 0}
              data={viewsData}
              variant="hero"
            />
            <MetricCard
              title="Downloads"
              value={summaryMap['pdf_download'] ?? 0}
              data={downloadsData}
            />
            <MetricCard
              title="Shares"
              value={summaryMap['link_share'] ?? 0}
              data={sharesData}
            />
            <MetricCard
              title="Saves"
              value={summaryMap['profile_save'] ?? 0}
              data={savesData}
            />
          </div>

          {/* Who Viewed You */}
          <WhoViewedYou viewers={[]} totalCount={0} range={range} />
        </>
      ) : (
        <>
          {/* Career snapshot — always valuable */}
          <CareerSnapshot
            seaTimeDays={seaTimeDays}
            yachtCount={yachtCount}
            certCount={certCount}
          />

          {/* Profile Strength coaching */}
          <div className="card-soft rounded-2xl p-4">
            <div className="flex items-center gap-3 mb-2">
              <div className="shrink-0">
                <svg width="48" height="48" viewBox="0 0 48 48">
                  <circle cx="24" cy="24" r="18" fill="none" stroke="var(--color-border)" strokeWidth="4" />
                  <circle
                    cx="24" cy="24" r="18"
                    fill="none"
                    stroke="var(--color-coral-500)"
                    strokeWidth="4"
                    strokeDasharray={`${(strengthPct / 100) * 2 * Math.PI * 18} ${2 * Math.PI * 18}`}
                    strokeLinecap="round"
                    transform="rotate(-90 24 24)"
                  />
                  <text x="24" y="28" textAnchor="middle" fontSize="12" fontWeight="700" fill="var(--color-text-primary)">
                    {strengthPct}%
                  </text>
                </svg>
              </div>
              <div>
                <p className="text-sm font-semibold text-[var(--color-text-primary)]">
                  Profile Strength
                </p>
                <p className="text-xs text-[var(--color-text-secondary)]">
                  {strengthPct >= 100 ? 'All squared away' : strengthPct >= 60 ? 'Looking good' : 'Getting started'}
                </p>
              </div>
            </div>
            {strengthNext && (
              <div className="flex items-center justify-between gap-3 p-3 rounded-xl bg-[var(--color-surface-raised)]">
                <p className="text-xs text-[var(--color-text-secondary)]">{strengthNext.label}</p>
                <Link href={strengthNext.href} className="text-xs font-medium text-[var(--color-interactive)] hover:underline shrink-0">
                  Go →
                </Link>
              </div>
            )}
          </div>

          {/* Blurred real analytics */}
          <div className="relative">
            <div className="blur-sm select-none pointer-events-none">
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2 card-soft rounded-2xl p-4">
                  <p className="text-sm font-semibold text-[var(--color-text-primary)] mb-1">Profile Views</p>
                  <p className="text-2xl font-bold text-[var(--color-text-primary)]">—</p>
                  <div className="h-12 bg-[var(--color-surface-raised)] rounded mt-2" />
                </div>
                <div className="card-soft rounded-2xl p-4">
                  <p className="text-sm font-semibold text-[var(--color-text-primary)]">Downloads</p>
                  <p className="text-xl font-bold text-[var(--color-text-primary)]">—</p>
                </div>
                <div className="card-soft rounded-2xl p-4">
                  <p className="text-sm font-semibold text-[var(--color-text-primary)]">Shares</p>
                  <p className="text-xl font-bold text-[var(--color-text-primary)]">—</p>
                </div>
              </div>
            </div>
          </div>

          {/* Blurred Who Viewed You */}
          <WhoViewedYou viewers={[]} totalCount={0} blurred range={range} />

          {/* Upgrade CTA */}
          <div className="card-soft rounded-2xl p-4 text-center">
            <p className="text-sm font-medium text-[var(--color-text-primary)] mb-1">
              See who&apos;s viewing your profile and what&apos;s working
            </p>
            <p className="text-xs text-[var(--color-text-secondary)] mb-3">
              Real analytics help you stand out to captains and agents
            </p>
            <Link href="/app/settings/plan">
              <span className="inline-block px-5 py-2.5 rounded-xl bg-[var(--color-teal-700)] text-white text-sm font-medium hover:bg-[var(--color-teal-700)]/90 transition-colors">
                Upgrade to Crew Pro
              </span>
            </Link>
          </div>

          <UpgradeCTA foundingSlotsLeft={foundingSlotsLeft} />
        </>
      )}
    </PageTransition>
  )
}

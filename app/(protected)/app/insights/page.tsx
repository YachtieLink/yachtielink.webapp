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
import { FirstVisitCard } from '@/components/ui/FirstVisitCard'
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

      <div className="flex items-center justify-between pt-2" data-tour="insights-page">
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
          <FirstVisitCard
            storageKey="yl_first_visit_insights_pro"
            accentColor="coral"
            icon="📊"
            title="Your analytics dashboard"
            description="Views, downloads, shares, and saves — track how your profile performs over time."
          />

          {/* Time range selector */}
          <TimeRangeSelector currentRange={range} />

          {(() => {
            const totalEvents = (summaryMap['profile_view'] ?? 0) + (summaryMap['pdf_download'] ?? 0) + (summaryMap['link_share'] ?? 0) + (summaryMap['profile_save'] ?? 0)

            // Pro empty analytics state — no activity yet
            if (totalEvents === 0) {
              return (
                <div className="flex flex-col items-center text-center py-8 gap-4">
                  <div className="h-16 w-16 rounded-full bg-[var(--color-coral-100)] flex items-center justify-center">
                    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--color-coral-500)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M18 20V10" /><path d="M12 20V4" /><path d="M6 20v-6" />
                    </svg>
                  </div>
                  <div>
                    <h2 className="text-lg font-serif tracking-tight text-[var(--color-text-primary)] mb-1">
                      Share your profile to start seeing analytics
                    </h2>
                    <p className="text-sm text-[var(--color-text-secondary)] leading-relaxed max-w-[280px] mx-auto">
                      Views, downloads, and shares will appear here once people discover your profile.
                    </p>
                  </div>
                  <Link
                    href="/app/profile"
                    className="px-4 py-2.5 rounded-xl text-sm font-medium bg-[var(--color-interactive)] text-white text-center hover:opacity-90 transition-opacity"
                  >
                    View Profile
                  </Link>
                </div>
              )
            }

            // Pro warm state — has analytics
            return (
              <>
                <div className="grid grid-cols-2 gap-3">
                  <MetricCard
                    title="Profile Views"
                    value={summaryMap['profile_view'] ?? 0}
                    data={viewsData}
                    variant="hero"
                    tooltip="People who visited your public profile"
                  />
                  <MetricCard
                    title="Downloads"
                    value={summaryMap['pdf_download'] ?? 0}
                    data={downloadsData}
                    tooltip="Times your CV was downloaded"
                  />
                  <MetricCard
                    title="Shares"
                    value={summaryMap['link_share'] ?? 0}
                    data={sharesData}
                    tooltip="Times you shared your profile link"
                  />
                  <MetricCard
                    title="Saves"
                    value={summaryMap['profile_save'] ?? 0}
                    data={savesData}
                    tooltip="Times someone saved your profile"
                  />
                </div>

                <WhoViewedYou viewers={[]} totalCount={0} range={range} />
              </>
            )
          })()}
        </>
      ) : (
        <>
          <FirstVisitCard
            storageKey="yl_first_visit_insights_free"
            accentColor="coral"
            icon="📊"
            title="Career Insights"
            description="See how your profile performs. Upgrade to Pro to see who's viewing you and track downloads."
          />

          {/* Career snapshot — coaching state when all zeros */}
          {seaTimeDays === 0 && yachtCount === 0 && certCount === 0 ? (
            <div className="card-soft rounded-2xl p-4 flex flex-col items-center text-center gap-3">
              <div className="h-12 w-12 rounded-full bg-[var(--color-coral-100)] flex items-center justify-center">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--color-coral-500)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
                </svg>
              </div>
              <p className="text-sm text-[var(--color-text-secondary)] leading-relaxed max-w-[260px]">
                Upload your CV or add experience to see your career snapshot
              </p>
              <Link
                href="/app/cv/upload"
                className="px-4 py-2 rounded-xl text-xs font-medium bg-[var(--color-interactive)] text-white hover:opacity-90 transition-opacity"
              >
                Upload CV
              </Link>
            </div>
          ) : (
            <CareerSnapshot
              seaTimeDays={seaTimeDays}
              yachtCount={yachtCount}
              certCount={certCount}
            />
          )}

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

          <UpgradeCTA foundingSlotsLeft={foundingSlotsLeft} />
        </>
      )}
    </PageTransition>
  )
}

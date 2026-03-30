import { redirect } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { PageHeader } from '@/components/ui/PageHeader'
import { createClient } from '@/lib/supabase/server'
import { CrewCard } from '@/components/yacht/CrewCard'
import { YachtEndorsements } from '@/components/yacht/YachtEndorsements'
import { formatTenure } from '@/lib/sea-time'

interface PageProps {
  params: Promise<{ id: string }>
}

interface CrewMember {
  id: string
  display_name: string | null
  full_name: string
  profile_photo_url: string | null
  primary_role: string | null
  handle: string | null
}

interface CrewRow {
  id: string
  role_label: string
  started_at: string
  ended_at: string | null
  users: CrewMember | CrewMember[]
}

interface ColleagueRow {
  colleague_id: string
  shared_yachts: string[]
}

interface EndorsementRow {
  id: string
  endorser_id: string
  recipient_id: string
}

interface EndorsementCrossRef {
  id: string
  content: string
  created_at: string
  endorser: CrewMember
  recipient: CrewMember
}

export default async function YachtDetailPage({ params }: PageProps) {
  const { id } = await params
  const supabase = await createClient()

  const { data: { user: authUser } } = await supabase.auth.getUser()
  if (!authUser) redirect('/welcome')
  const user = authUser

  // Parallel fetch — all independent queries
  const [yachtRes, crewRes, endorsementCrossRefsRes, endorsementCountRes, avgTenureRes, colleaguesRes, userEndorsementsRes] =
    await Promise.all([
      // 1. Yacht details
      supabase.from('yachts')
        .select('id, name, yacht_type, length_meters, flag_state, year_built, is_established, cover_photo_url, created_at')
        .eq('id', id).single(),

      // 2. Crew list — with handle for profile links
      supabase.from('attachments')
        .select(`id, role_label, started_at, ended_at,
          users!inner(id, display_name, full_name, profile_photo_url, primary_role, handle)`)
        .eq('yacht_id', id).is('deleted_at', null)
        .order('started_at', { ascending: false }),

      // 3. Endorsement cross-references on this yacht
      supabase.from('endorsements')
        .select(`id, content, created_at,
          endorser:users!endorser_id(id, display_name, full_name, profile_photo_url, handle),
          recipient:users!recipient_id(id, display_name, full_name, profile_photo_url, handle)`)
        .eq('yacht_id', id).is('deleted_at', null)
        .order('created_at', { ascending: false })
        .limit(10),

      // 4. Endorsement count (RPC)
      supabase.rpc('get_yacht_endorsement_count', { p_yacht_id: id }),

      // 5. Average tenure (RPC)
      supabase.rpc('get_yacht_avg_tenure_days', { p_yacht_id: id }),

      // 6. Current user's colleagues (for mutual connection badges)
      supabase.rpc('get_colleagues', { p_user_id: user.id }),

      // 7. Endorsements involving current user (for endorsement relationship badges)
      supabase.from('endorsements')
        .select('id, endorser_id, recipient_id')
        .or(`endorser_id.eq.${user.id},recipient_id.eq.${user.id}`)
        .is('deleted_at', null),
    ])

  const yacht = yachtRes.data
  if (!yacht) redirect('/app/profile')

  const crew = (crewRes.data as unknown as CrewRow[]) ?? []
  const endorsementCrossRefs = (endorsementCrossRefsRes.data as unknown as EndorsementCrossRef[]) ?? []
  const endorsementCount = (endorsementCountRes.data as number) ?? 0
  const avgTenureDays = (avgTenureRes.data as number) ?? 0
  const colleagueRows = (colleaguesRes.data as ColleagueRow[]) ?? []
  const userEndorsements = (userEndorsementsRes.data as EndorsementRow[]) ?? []

  // Build lookup maps
  const colleagueYachtMap = new Map<string, string[]>()
  for (const row of colleagueRows) {
    colleagueYachtMap.set(row.colleague_id, row.shared_yachts)
  }

  // Yacht names for shared yacht badges (need to fetch)
  const allSharedYachtIds = new Set<string>()
  for (const row of colleagueRows) {
    for (const yachtId of row.shared_yachts) {
      if (yachtId !== id) allSharedYachtIds.add(yachtId)
    }
  }

  let yachtNameMap = new Map<string, string>()
  if (allSharedYachtIds.size > 0) {
    const { data: yachtNames } = await supabase
      .from('yachts')
      .select('id, name')
      .in('id', Array.from(allSharedYachtIds))
    if (yachtNames) {
      yachtNameMap = new Map(yachtNames.map((y: { id: string; name: string }) => [y.id, y.name]))
    }
  }

  // Endorsement relationship lookup
  const endorsementRelationMap = new Map<string, 'endorsed_you' | 'you_endorsed' | 'mutual'>()
  for (const e of userEndorsements) {
    const otherId = e.endorser_id === user.id ? e.recipient_id : e.endorser_id
    const existing = endorsementRelationMap.get(otherId)
    if (e.endorser_id === user.id && e.recipient_id !== user.id) {
      endorsementRelationMap.set(otherId, existing === 'endorsed_you' ? 'mutual' : 'you_endorsed')
    } else if (e.recipient_id === user.id && e.endorser_id !== user.id) {
      endorsementRelationMap.set(otherId, existing === 'you_endorsed' ? 'mutual' : 'endorsed_you')
    }
  }

  // Split crew into current vs alumni
  const currentCrew = crew.filter(c => !c.ended_at)
  const alumni = crew.filter(c => !!c.ended_at)
  const crewCount = crew.length

  const userHasAttachment = crew.some(c => {
    const member = Array.isArray(c.users) ? c.users[0] : c.users
    return member?.id === user.id
  })

  function formatYear(y: number | null) { return y ? String(y) : null }
  function formatLength(l: number | null) { return l ? `${l}m` : null }

  const metaParts = [
    yacht.yacht_type,
    formatLength(yacht.length_meters),
    yacht.flag_state,
    formatYear(yacht.year_built),
  ].filter(Boolean)

  function getMember(c: CrewRow): CrewMember | null {
    return Array.isArray(c.users) ? c.users[0] : c.users
  }

  function getCrewCardProps(c: CrewRow) {
    const member = getMember(c)
    if (!member) return null

    const sharedYachts = colleagueYachtMap.get(member.id) ?? []
    const otherSharedYachtNames = sharedYachts
      .filter(yid => yid !== id)
      .map(yid => yachtNameMap.get(yid))
      .filter((n): n is string => !!n)

    return {
      name: member.display_name || member.full_name,
      handle: member.handle,
      profilePhotoUrl: member.profile_photo_url,
      roleLabel: c.role_label,
      startDate: c.started_at,
      endDate: c.ended_at,
      isCurrentUser: member.id === user.id,
      otherSharedYachts: otherSharedYachtNames,
      endorsementRelation: endorsementRelationMap.get(member.id) ?? null,
    }
  }

  // Stats
  const stats: Array<{ value: string; label: string }> = [
    { value: String(crewCount), label: crewCount === 1 ? 'crew member' : 'crew members' },
    ...(avgTenureDays > 0 ? [{ value: formatTenure(avgTenureDays), label: 'avg tenure' }] : []),
    ...(endorsementCount > 0 ? [{ value: String(endorsementCount), label: endorsementCount === 1 ? 'endorsement' : 'endorsements' }] : []),
    ...(yacht.length_meters ? [{ value: `${yacht.length_meters}m`, label: 'length' }] : []),
  ]

  const useGrid = stats.length > 3

  return (
    <div className="min-h-screen bg-[var(--color-surface)] pb-24">
      {/* Cover photo */}
      <div className="relative w-full aspect-[16/9] bg-[var(--color-surface-raised)]">
        {yacht.cover_photo_url ? (
          <Image
            src={yacht.cover_photo_url}
            alt={yacht.name}
            fill
            className="object-cover"
            sizes="100vw"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <span className="text-4xl opacity-20">⚓</span>
          </div>
        )}
        {userHasAttachment && (
          <Link
            href={`/app/yacht/${id}/photo`}
            className="absolute bottom-3 right-3 bg-black/50 text-white text-xs px-3 py-1.5 rounded-full backdrop-blur-sm hover:bg-black/70 transition-colors"
          >
            {yacht.cover_photo_url ? 'Change photo' : '+ Add photo'}
          </Link>
        )}
      </div>

      <div className="px-4 pt-5">
        <PageHeader
          backHref="/app/profile"
          title={yacht.name}
          subtitle={metaParts.length > 0 ? metaParts.join(' · ') : undefined}
          actions={yacht.is_established ? (
            <span className="shrink-0 text-xs bg-[var(--color-interactive)]/10 text-[var(--color-interactive)] px-2 py-0.5 rounded-full font-medium">
              Established
            </span>
          ) : undefined}
        />

        {/* Stats row */}
        <dl className={useGrid
          ? 'grid grid-cols-2 gap-3 md:grid-cols-4 mb-6'
          : 'flex gap-4 mb-6'
        }>
          {stats.map((stat) => (
            <div key={stat.label} className="bg-[var(--color-surface-raised)] rounded-2xl px-4 py-3 flex-1 text-center">
              <dd className="text-2xl font-bold text-[var(--color-text-primary)]">{stat.value}</dd>
              <dt className="text-xs text-[var(--color-text-secondary)] mt-0.5">{stat.label}</dt>
            </div>
          ))}
        </dl>

        {/* Current Crew */}
        {currentCrew.length > 0 && (
          <div className="mb-4">
            <h2 className="font-semibold text-[var(--color-text-primary)] mb-2">Current Crew</h2>
            <div className="divide-y divide-[var(--color-border)]">
              {currentCrew.map(c => {
                const props = getCrewCardProps(c)
                if (!props) return null
                return <CrewCard key={c.id} {...props} />
              })}
            </div>
          </div>
        )}

        {/* Alumni */}
        {alumni.length > 0 && (
          <div className="mb-4">
            <h2 className="font-semibold text-[var(--color-text-primary)] mb-2">Alumni</h2>
            <div className="divide-y divide-[var(--color-border)]">
              {alumni.map(c => {
                const props = getCrewCardProps(c)
                if (!props) return null
                return <CrewCard key={c.id} {...props} />
              })}
            </div>
          </div>
        )}

        {/* Add attachment CTA for current user if not already attached */}
        {!userHasAttachment && (
          <Link
            href="/app/attachment/new"
            className="mt-4 block w-full text-center py-3 rounded-2xl border border-[var(--color-interactive)] text-[var(--color-interactive)] text-sm font-medium hover:bg-[var(--color-interactive)]/5 transition-colors"
          >
            + Add this yacht to my profile
          </Link>
        )}

        {/* Endorsement cross-references */}
        <YachtEndorsements
          endorsements={endorsementCrossRefs}
          totalCount={endorsementCount}
        />
      </div>
    </div>
  )
}

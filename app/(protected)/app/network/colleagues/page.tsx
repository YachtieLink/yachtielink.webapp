import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { PageHeader } from '@/components/ui/PageHeader'
import { PageTransition } from '@/components/ui/PageTransition'
import { ColleagueExplorer } from '@/components/network/ColleagueExplorer'

interface ColleagueRow {
  colleague_id: string
  shared_yachts: string[]
}

interface UserProfile {
  id: string
  full_name: string
  display_name: string | null
  profile_photo_url: string | null
  primary_role: string | null
  handle: string | null
}

interface Yacht {
  id: string
  name: string
}

interface AttachmentRow {
  user_id: string
  yacht_id: string
  role_label: string | null
}

interface EndorsementRow {
  id: string
  endorser_id: string | null  // nullable: ghost endorsements have null endorser_id
  recipient_id: string
  yacht_id: string
}

export default async function ColleaguesPage() {
  const supabase = await createClient()

  const { data: { user: authUser } } = await supabase.auth.getUser()
  if (!authUser) redirect('/welcome')
  const user = authUser

  // Phase 1: Get colleagues + endorsements in parallel
  const [colleaguesRes, endorsementsRes] = await Promise.all([
    supabase.rpc('get_colleagues', { p_user_id: user.id }),
    supabase.from('endorsements')
      .select('id, endorser_id, recipient_id, yacht_id')
      .or(`endorser_id.eq.${user.id},recipient_id.eq.${user.id}`)
      .not('endorser_id', 'is', null)  // exclude ghost endorsements (null endorser_id)
      .is('deleted_at', null),
  ])

  const colleagueRows = (colleaguesRes.data as ColleagueRow[]) ?? []
  const endorsements = (endorsementsRes.data as EndorsementRow[]) ?? []

  if (colleagueRows.length === 0) {
    return (
      <PageTransition className="flex flex-col gap-4 pb-24">
        <PageHeader backHref="/app/network" title="Your Network" />
        <div className="text-center py-12">
          <p className="text-4xl mb-3">🤝</p>
          <p className="text-sm text-[var(--color-text-secondary)] mb-4">
            Your colleague list will populate once you and a crewmate have both attached the same yacht.
          </p>
          <Link
            href="/app/attachment/new"
            className="inline-block text-sm text-[var(--color-interactive)] font-medium hover:underline"
          >
            + Add a yacht
          </Link>
        </div>
      </PageTransition>
    )
  }

  // Phase 2: Fetch profiles, yacht names, and role labels
  const colleagueIds = colleagueRows.map(r => r.colleague_id)
  const allYachtIds = Array.from(new Set(colleagueRows.flatMap(r => r.shared_yachts)))

  const [profilesRes, yachtsRes, attachmentsRes] = await Promise.all([
    supabase.from('users')
      .select('id, full_name, display_name, profile_photo_url, primary_role, handle')
      .in('id', colleagueIds),
    supabase.from('yachts')
      .select('id, name')
      .in('id', allYachtIds),
    supabase.from('attachments')
      .select('user_id, yacht_id, role_label')
      .in('yacht_id', allYachtIds)
      .in('user_id', [...colleagueIds, user.id])
      .is('deleted_at', null),
  ])

  const profileMap = new Map<string, UserProfile>(
    ((profilesRes.data as UserProfile[]) ?? []).map(p => [p.id, p])
  )
  const yachtMap = new Map<string, Yacht>(
    ((yachtsRes.data as Yacht[]) ?? []).map(y => [y.id, y])
  )

  // Build role label lookup: userId-yachtId -> role_label
  const roleLabelMap = new Map<string, string>()
  for (const att of (attachmentsRes.data as AttachmentRow[]) ?? []) {
    if (att.role_label) {
      roleLabelMap.set(`${att.user_id}-${att.yacht_id}`, att.role_label)
    }
  }

  // Build endorsement relationship lookup
  const endorsementRelationMap = new Map<string, 'endorsed_you' | 'you_endorsed' | 'mutual'>()
  const endorsedByUserOnYacht = new Set<string>() // "colleagueId-yachtId"
  for (const e of endorsements) {
    // Null guard: the query filters ghost endorsements (.not('endorser_id', 'is', null))
    // but the type reflects the schema's nullable column — skip defensively.
    if (!e.endorser_id) continue
    const otherId = e.endorser_id === user.id ? e.recipient_id : e.endorser_id
    const existing = endorsementRelationMap.get(otherId)
    if (e.endorser_id === user.id) {
      endorsementRelationMap.set(otherId, existing === 'endorsed_you' ? 'mutual' : 'you_endorsed')
      endorsedByUserOnYacht.add(`${e.recipient_id}-${e.yacht_id}`)
    } else {
      endorsementRelationMap.set(otherId, existing === 'you_endorsed' ? 'mutual' : 'endorsed_you')
    }
  }

  // Build yacht groups
  const yachtGroupMap = new Map<string, {
    yacht: Yacht
    colleagues: Map<string, {
      id: string; name: string; handle: string | null; photoUrl: string | null
      role: string | null; theirRoleOnYacht: string | null
      sharedYachtCount: number
      endorsementStatus: 'mutual' | 'endorsed_you' | 'you_endorsed' | null
      canEndorse: boolean
    }>
  }>()

  for (const row of colleagueRows) {
    const profile = profileMap.get(row.colleague_id)
    if (!profile) continue

    for (const yachtId of row.shared_yachts) {
      const yacht = yachtMap.get(yachtId)
      if (!yacht) continue

      if (!yachtGroupMap.has(yachtId)) {
        yachtGroupMap.set(yachtId, { yacht, colleagues: new Map() })
      }

      const group = yachtGroupMap.get(yachtId)!
      if (!group.colleagues.has(profile.id)) {
        group.colleagues.set(profile.id, {
          id: profile.id,
          name: profile.display_name || profile.full_name,
          handle: profile.handle,
          photoUrl: profile.profile_photo_url,
          role: profile.primary_role,
          theirRoleOnYacht: roleLabelMap.get(`${profile.id}-${yachtId}`) ?? null,
          sharedYachtCount: row.shared_yachts.length,
          endorsementStatus: endorsementRelationMap.get(profile.id) ?? null,
          canEndorse: !endorsedByUserOnYacht.has(`${profile.id}-${yachtId}`),
        })
      }
    }
  }

  // Sort by colleague count descending
  const yachtGroups = Array.from(yachtGroupMap.values())
    .map(g => ({ yacht: g.yacht, colleagues: Array.from(g.colleagues.values()) }))
    .sort((a, b) => b.colleagues.length - a.colleagues.length)

  const totalEndorsements = endorsements.length

  return (
    <PageTransition className="flex flex-col gap-4 pb-24">
      <PageHeader backHref="/app/network" title="Your Network" />

      <ColleagueExplorer
        yachtGroups={yachtGroups}
        totalColleagues={colleagueIds.length}
        totalYachts={allYachtIds.length}
        totalEndorsements={totalEndorsements}
      />
    </PageTransition>
  )
}

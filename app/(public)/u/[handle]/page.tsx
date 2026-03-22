/**
 * /u/:handle — Public profile page (Phase 1A Profile Robustness: Bumble-style redesign)
 * Server-rendered, SEO-optimised, shareable.
 */
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { getUserByHandle, getExtendedProfileSections, getSavedStatus } from '@/lib/queries/profile'
import { PublicProfileContent } from '@/components/public/PublicProfileContent'

interface Props {
  params: Promise<{ handle: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { handle } = await params
  const user = await getUserByHandle(handle)
  if (!user) return { title: 'Profile Not Found' }

  const name = user.display_name || user.full_name
  const description = user.bio || `${name} — ${user.primary_role || 'Yacht Professional'} on YachtieLink`

  return {
    title: `${name} — YachtieLink`,
    description,
    openGraph: {
      title: `${name} — ${user.primary_role || 'Yacht Professional'}`,
      description,
      images: [{ url: `/api/og?handle=${handle}`, width: 1200, height: 630 }],
      type: 'profile',
      url: `https://yachtie.link/u/${handle}`,
    },
    twitter: {
      card: user.profile_photo_url ? 'summary_large_image' : 'summary',
      title: `${name} — YachtieLink`,
      description,
    },
  }
}

export default async function PublicProfilePage({ params }: Props) {
  const { handle } = await params
  const supabase = await createClient()

  const user = await getUserByHandle(handle)
  if (!user) notFound()

  // Record profile view (fire-and-forget)
  void supabase.rpc('record_profile_event', {
    p_user_id: user.id,
    p_event_type: 'profile_view',
  }).then(() => {})

  // Fetch all data in parallel
  const [attRes, certRes, endRes, extended, { data: { user: viewer } }, { data: profilePhotos }, seaTimeRes] = await Promise.all([
    supabase
      .from('attachments')
      .select(`
        id, role_label, started_at, ended_at,
        yachts ( id, name, yacht_type, length_meters, flag_state )
      `)
      .eq('user_id', user.id)
      .is('deleted_at', null)
      .order('started_at', { ascending: false }),
    supabase
      .from('certifications')
      .select(`
        id, custom_cert_name, issued_at, expires_at,
        certification_types ( name, category )
      `)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false }),
    supabase
      .from('endorsements')
      .select(`
        id, content, created_at, endorser_role_label, recipient_role_label,
        endorser:endorser_id ( display_name, full_name, profile_photo_url ),
        yacht:yachts!yacht_id ( name )
      `)
      .eq('recipient_id', user.id)
      .is('deleted_at', null)
      .order('created_at', { ascending: false }),
    getExtendedProfileSections(user.id),
    supabase.auth.getUser(),
    supabase
      .from('user_photos')
      .select('id, photo_url, sort_order')
      .eq('user_id', user.id)
      .order('sort_order'),
    supabase.rpc('get_sea_time', { p_user_id: user.id }),
  ])

  const seaTime = seaTimeRes.data as { total_days: number; yacht_count: number }[] | null
  const seaTimeTotalDays = seaTime?.[0]?.total_days ?? 0
  const seaTimeYachtCount = seaTime?.[0]?.yacht_count ?? 0

  // Viewer relationship logic
  type MutualColleague = {
    id: string; name: string; photoUrl: string | null
    throughYachtWithProfile: string; throughYachtWithViewer: string
  }
  type ViewerRelationship = {
    isOwnProfile: boolean; sharedYachtIds: string[]; mutualColleagues: MutualColleague[]
  }
  let viewerRelationship: ViewerRelationship = {
    isOwnProfile: false, sharedYachtIds: [], mutualColleagues: [],
  }
  let savedStatus: { id: string; folder_id: string | null } | null = null

  if (viewer) {
    if (viewer.id === user.id) {
      viewerRelationship.isOwnProfile = true
    } else {
      const [savedRes, viewerAttsRes] = await Promise.all([
        getSavedStatus(viewer.id, user.id),
        supabase.from('attachments').select('yacht_id, yachts ( id, name )').eq('user_id', viewer.id).is('deleted_at', null),
      ])
      savedStatus = savedRes

      const profileYachtIds = (attRes.data ?? []).map((a: any) => a.yachts?.id).filter(Boolean) as string[]
      const viewerAtts = viewerAttsRes.data ?? []
      const viewerYachtIds = viewerAtts.map((a: any) => a.yachts?.id).filter(Boolean) as string[]

      const profileYachtIdSet = new Set(profileYachtIds)
      for (const yId of viewerYachtIds) {
        if (profileYachtIdSet.has(yId) && !viewerRelationship.sharedYachtIds.includes(yId)) {
          viewerRelationship.sharedYachtIds.push(yId)
        }
      }

      if (profileYachtIds.length > 0 && viewerYachtIds.length > 0) {
        const { data: profileColleagueAtts } = await supabase
          .from('attachments')
          .select('user_id, yacht_id, yachts ( id, name )')
          .in('yacht_id', profileYachtIds)
          .neq('user_id', user.id)
          .neq('user_id', viewer.id)
          .is('deleted_at', null)

        const colleagueToProfileYacht = new Map<string, string>()
        for (const pc of profileColleagueAtts ?? []) {
          if (!colleagueToProfileYacht.has(pc.user_id)) {
            colleagueToProfileYacht.set(pc.user_id, (pc as any).yachts?.name ?? '')
          }
        }

        const candidateIds = [...colleagueToProfileYacht.keys()]
        if (candidateIds.length > 0) {
          const { data: mutualAtts } = await supabase
            .from('attachments')
            .select('user_id, yachts ( id, name )')
            .in('user_id', candidateIds)
            .in('yacht_id', viewerYachtIds)
            .is('deleted_at', null)

          const mutualColleagueIds = [...new Set((mutualAtts ?? []).map((a: any) => a.user_id))]
          if (mutualColleagueIds.length > 0) {
            const { data: mutualUsers } = await supabase
              .from('users')
              .select('id, display_name, full_name, profile_photo_url')
              .in('id', mutualColleagueIds)

            for (const mu of mutualUsers ?? []) {
              const viewerSideAtt = (mutualAtts ?? []).find((a: any) => a.user_id === mu.id)
              viewerRelationship.mutualColleagues.push({
                id: mu.id,
                name: (mu.display_name ?? mu.full_name) as string,
                photoUrl: mu.profile_photo_url as string | null,
                throughYachtWithProfile: colleagueToProfileYacht.get(mu.id) ?? '',
                throughYachtWithViewer: (viewerSideAtt as any)?.yachts?.name ?? '',
              })
            }
          }
        }
      }
    }
  }

  const sectionVisibility = (user.section_visibility ?? {}) as Record<string, boolean>

  // Strip contact fields server-side when hidden — prevents PII leaking into serialised HTML
  const sanitisedUser = {
    ...user,
    phone: user.show_phone ? user.phone : null,
    whatsapp: user.show_whatsapp ? user.whatsapp : null,
    email: user.show_email ? user.email : null,
  }

  return (
    <div className="min-h-screen bg-[var(--color-surface-raised)]">
      <PublicProfileContent
        user={sanitisedUser as any}
        attachments={(attRes.data as any) ?? []}
        certifications={(certRes.data as any) ?? []}
        endorsements={(endRes.data as any) ?? []}
        profilePhotos={profilePhotos ?? []}
        hobbies={extended.hobbies as any}
        education={extended.education as any}
        skills={extended.skills as any}
        gallery={(extended.gallery as any) ?? []}
        isFoundingMember={user.founding_member === true}
        isLoggedIn={!!viewer}
        viewerRelationship={viewerRelationship}
        sectionVisibility={sectionVisibility}
        savedStatus={savedStatus}
        seaTimeTotalDays={seaTimeTotalDays}
        seaTimeYachtCount={seaTimeYachtCount}
      />
    </div>
  )
}

/**
 * /u/:handle — Public profile page
 * Server-rendered, SEO-optimised, shareable.
 */
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { PublicProfileContent } from '@/components/public/PublicProfileContent'

interface Props {
  params: Promise<{ handle: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { handle } = await params
  const supabase = await createClient()
  const { data: user } = await supabase
    .from('users')
    .select('full_name, display_name, primary_role, profile_photo_url, bio')
    .eq('handle', handle.toLowerCase())
    .single()

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

  // Phase 1: fetch user by handle
  const userRes = await supabase
    .from('users')
    .select(`
      id, full_name, display_name, handle, primary_role, departments,
      bio, profile_photo_url,
      phone, whatsapp, email, location_country, location_city,
      show_phone, show_whatsapp, show_email, show_location,
      founding_member, subscription_status
    `)
    .eq('handle', handle.toLowerCase())
    .single()

  const user = userRes.data
  if (!user) notFound()

  // Record profile view (fire-and-forget — don't block page render)
  void supabase.rpc('record_profile_event', {
    p_user_id: user.id,
    p_event_type: 'profile_view',
  }).then(() => {})

  // Phase 2: fetch related data in parallel now that we have user.id
  const [attRes, certRes, endRes] = await Promise.all([
    supabase
      .from('attachments')
      .select(`
        id, role_label, started_at, ended_at,
        yachts ( id, name, yacht_type, length_m, flag_state )
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
  ])

  // Phase 3: viewer relationship (logged-in user viewing someone else's profile)
  const { data: { user: viewer } } = await supabase.auth.getUser()

  type MutualColleague = {
    id: string
    name: string
    photoUrl: string | null
    throughYachtWithProfile: string
    throughYachtWithViewer: string
  }
  type ViewerRelationship = {
    isOwnProfile: boolean
    sharedYachtIds: string[]
    mutualColleagues: MutualColleague[]
  }

  let viewerRelationship: ViewerRelationship = {
    isOwnProfile: false,
    sharedYachtIds: [],
    mutualColleagues: [],
  }

  if (viewer) {
    if (viewer.id === user.id) {
      viewerRelationship.isOwnProfile = true
    } else {
      const profileYachtIds = (attRes.data ?? [])
        .map((a: any) => a.yachts?.id)
        .filter(Boolean) as string[]

      // Fetch viewer's full attachment history
      const { data: viewerAtts } = await supabase
        .from('attachments')
        .select('yacht_id, yachts ( id, name )')
        .eq('user_id', viewer.id)
        .is('deleted_at', null)

      const viewerYachtIds = (viewerAtts ?? [])
        .map((a: any) => a.yachts?.id)
        .filter(Boolean) as string[]

      // Build viewer yacht name lookup
      const viewerYachtNames = new Map<string, string>(
        (viewerAtts ?? [])
          .filter((a: any) => a.yachts?.id)
          .map((a: any) => [a.yachts.id as string, a.yachts.name as string])
      )

      // Direct: yachts in common between viewer and profile
      const profileYachtIdSet = new Set(profileYachtIds)
      for (const yId of viewerYachtIds) {
        if (profileYachtIdSet.has(yId) && !viewerRelationship.sharedYachtIds.includes(yId)) {
          viewerRelationship.sharedYachtIds.push(yId)
        }
      }

      // 2nd degree: find people who worked on profile's yachts, then check if they
      // also worked on any of the viewer's yachts
      if (profileYachtIds.length > 0 && viewerYachtIds.length > 0) {
        // Who worked with the profile subject? (profile's colleagues)
        const { data: profileColleagueAtts } = await supabase
          .from('attachments')
          .select('user_id, yacht_id, yachts ( id, name )')
          .in('yacht_id', profileYachtIds)
          .neq('user_id', user.id)
          .neq('user_id', viewer.id)
          .is('deleted_at', null)

        // Map: colleagueId -> first yacht name they share with profile
        const colleagueToProfileYacht = new Map<string, string>()
        for (const pc of profileColleagueAtts ?? []) {
          if (!colleagueToProfileYacht.has(pc.user_id)) {
            colleagueToProfileYacht.set(pc.user_id, (pc as any).yachts?.name ?? '')
          }
        }

        const candidateIds = [...colleagueToProfileYacht.keys()]
        if (candidateIds.length > 0) {
          // Which of those candidates also worked on viewer's yachts?
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

  return (
    <div className="min-h-screen bg-[var(--color-surface-raised)]">
      <div className="mx-auto max-w-[640px] lg:max-w-4xl px-4 py-8">
        <PublicProfileContent
          user={user as any}
          attachments={(attRes.data as any) ?? []}
          certifications={(certRes.data as any) ?? []}
          endorsements={(endRes.data as any) ?? []}
          isFoundingMember={user.founding_member === true}
          isPro={user.subscription_status === 'pro'}
          isLoggedIn={!!viewer}
          viewerRelationship={viewerRelationship}
        />
      </div>
    </div>
  )
}

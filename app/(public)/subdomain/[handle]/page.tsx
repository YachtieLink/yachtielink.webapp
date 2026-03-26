/**
 * /subdomain/:handle — Pro subdomain route
 * Reached via middleware rewrite when {handle}.yachtie.link is visited.
 * Pro users: renders full public profile (reuses PublicProfileContent).
 * Non-Pro / unknown handle: renders the reserved landing page.
 */
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import {
  getUserByHandle,
  getPublicProfileSections,
  getExtendedProfileSections,
  getViewerRelationship,
} from '@/lib/queries/profile'
import type { ProfilePhoto, Hobby, Education, Skill, GalleryItem, MutualColleague } from '@/lib/queries/types'
import { PublicProfileContent } from '@/components/public/PublicProfileContent'
import { ReservedPage } from './reserved'

/** Check Pro status with expiry (mirrors getProStatus logic without a second query) */
function isActivePro(user: { subscription_status: string | null; subscription_ends_at: string | null }) {
  return (
    user.subscription_status === 'pro' &&
    (!user.subscription_ends_at || new Date(user.subscription_ends_at) > new Date())
  )
}

interface Props {
  params: Promise<{ handle: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { handle } = await params
  const user = await getUserByHandle(handle)

  // Always point canonical to the /u/ path
  const canonical = `https://yachtie.link/u/${handle}`

  if (!user || !isActivePro(user) || user.subdomain_suspended) {
    return {
      title: `${handle}.yachtie.link — Reserved`,
      robots: { index: false, follow: false },
      alternates: { canonical },
    }
  }

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
      url: canonical,
    },
    twitter: {
      card: user.profile_photo_url ? 'summary_large_image' : 'summary',
      title: `${name} — YachtieLink`,
      description,
    },
    alternates: { canonical },
  }
}

export default async function SubdomainPage({ params }: Props) {
  const { handle } = await params
  const supabase = await createClient()

  const user = await getUserByHandle(handle)

  // Unknown handle, non-Pro, or suspended → reserved page
  if (!user || !isActivePro(user) || user.subdomain_suspended) {
    return <ReservedPage handle={handle} hasUser={!!user} />
  }

  // Pro user → render full public profile (same as /u/[handle])
  void supabase.rpc('record_profile_event', {
    p_user_id: user.id,
    p_event_type: 'profile_view',
  }).then(() => {})

  const [
    { attachments, certifications, endorsements },
    extended,
    { data: { user: viewer } },
    seaTimeRes,
  ] = await Promise.all([
    getPublicProfileSections(user.id),
    getExtendedProfileSections(user.id),
    supabase.auth.getUser(),
    supabase.rpc('get_sea_time', { p_user_id: user.id }),
  ])

  const seaTime = seaTimeRes.data as { total_days: number; yacht_count: number }[] | null
  const seaTimeTotalDays = seaTime?.[0]?.total_days ?? 0
  const seaTimeYachtCount = seaTime?.[0]?.yacht_count ?? 0

  const profileYachtIds = attachments
    .map((a) => a.yachts?.id)
    .filter(Boolean) as string[]

  let viewerRelationship = { isOwnProfile: false, sharedYachtIds: [] as string[], mutualColleagues: [] as MutualColleague[] }
  let savedStatus: { id: string; folder_id: string | null } | null = null
  let age: number | null = null

  if (viewer) {
    const result = await getViewerRelationship(viewer.id, user.id, profileYachtIds)
    viewerRelationship = result.relationship
    savedStatus = result.savedStatus
  }

  if (user.show_dob && viewer) {
    const { data: dobRow } = await supabase
      .from('users')
      .select('dob')
      .eq('id', user.id)
      .single()
    if (dobRow?.dob) {
      age = Math.floor((Date.now() - new Date(dobRow.dob).getTime()) / (365.25 * 86400000))
    }
  }

  const sectionVisibility = (user.section_visibility ?? {}) as Record<string, boolean>

  const sanitisedUser = {
    ...user,
    phone: user.show_phone ? user.phone : null,
    whatsapp: user.show_whatsapp ? user.whatsapp : null,
    email: user.show_email ? user.email : null,
  }

  return (
    <div className="min-h-screen bg-[var(--color-surface-raised)]">
      <PublicProfileContent
        user={sanitisedUser}
        attachments={attachments}
        certifications={certifications}
        endorsements={endorsements}
        profilePhotos={extended.photos as ProfilePhoto[]}
        hobbies={extended.hobbies as Hobby[]}
        education={extended.education as Education[]}
        skills={extended.skills as Skill[]}
        gallery={extended.gallery as unknown as GalleryItem[]}
        isFoundingMember={user.founding_member === true}
        isLoggedIn={!!viewer}
        viewerRelationship={viewerRelationship}
        sectionVisibility={sectionVisibility}
        savedStatus={savedStatus}
        seaTimeTotalDays={seaTimeTotalDays}
        seaTimeYachtCount={seaTimeYachtCount}
        age={age}
      />
    </div>
  )
}

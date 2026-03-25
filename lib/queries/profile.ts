import { cache } from 'react'
import { createClient } from '@/lib/supabase/server'
import type {
  PublicAttachment, PublicCertification, PublicEndorsement,
  CvAttachment, CvCertification, CvEndorsement,
  MutualColleague, ViewerRelationship,
} from './types'

export type { PublicAttachment, PublicCertification, PublicEndorsement } from './types'
export type { ProfilePhoto, Hobby, Education, Skill, GalleryItem } from './types'
export type { MutualColleague, ViewerRelationship } from './types'
export type { CvAttachment, CvCertification, CvEndorsement } from './types'

export type SectionVisibility = {
  about: boolean
  experience: boolean
  endorsements: boolean
  certifications: boolean
  hobbies: boolean
  education: boolean
  skills: boolean
  photos: boolean
  gallery: boolean
}

export type SocialLink = {
  platform: 'instagram' | 'linkedin' | 'tiktok' | 'youtube' | 'x' | 'facebook' | 'website'
  url: string
}

/**
 * Fetch a user's full private profile by ID.
 * Cached per request via React.cache() — multiple callers in the same render
 * tree (e.g. layout + page) share one round trip.
 */
export const getUserById = cache(async (userId: string) => {
  const supabase = await createClient()
  const { data } = await supabase
    .from('users')
    .select(`
      id, full_name, display_name, handle, bio, profile_photo_url,
      primary_role, departments, onboarding_complete,
      phone, whatsapp, email, location_country, location_city,
      show_phone, show_whatsapp, show_email, show_location,
      subscription_status, subscription_plan, subscription_ends_at,
      stripe_customer_id, founding_member, show_watermark, template_id,
      ai_summary, ai_summary_edited, section_visibility, social_links,
      home_country, languages, dob, smoke_pref, appearance_note,
      travel_docs, license_info, show_dob, show_home_country
    `)
    .eq('id', userId)
    .single()
  return data
})

/**
 * Fetch a public profile by handle (lowercase).
 * Cached per request — generateMetadata and the page function both call this
 * and share one round trip.
 */
export const getUserByHandle = cache(async (handle: string) => {
  const supabase = await createClient()
  const { data } = await supabase
    .from('users')
    .select(`
      id, full_name, display_name, handle, bio, profile_photo_url,
      primary_role, departments,
      phone, whatsapp, email, location_country, location_city,
      show_phone, show_whatsapp, show_email, show_location,
      founding_member, ai_summary, section_visibility, social_links,
      cv_public, cv_public_source, latest_pdf_path, cv_storage_path,
      home_country, languages, available_for_work,
      smoke_pref, appearance_note, travel_docs, license_info, show_dob, show_home_country
    `)
    .eq('handle', handle.toLowerCase())
    .single()
  return data
})

/**
 * Fetch the three profile sections for the authenticated user's private profile
 * page. Runs all three queries in parallel.
 */
export async function getProfileSections(userId: string) {
  const supabase = await createClient()
  const [attRes, certRes, endRes] = await Promise.all([
    supabase
      .from('attachments')
      .select(`
        id, role_label, started_at, ended_at,
        yachts ( id, name, yacht_type, flag_state )
      `)
      .eq('user_id', userId)
      .is('deleted_at', null)
      .order('started_at', { ascending: false }),
    supabase
      .from('certifications')
      .select(`
        id, custom_cert_name, issued_at, expires_at, document_url,
        certification_types ( name, short_name, category )
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false }),
    supabase
      .from('endorsements')
      .select(`
        id, content, created_at, yacht_id,
        endorser:endorser_id ( display_name, full_name, handle ),
        yachts ( name )
      `)
      .eq('recipient_id', userId)
      .is('deleted_at', null)
      .order('created_at', { ascending: false }),
  ])
  return {
    attachments: attRes.data ?? [],
    certifications: certRes.data ?? [],
    endorsements: endRes.data ?? [],
  }
}

/**
 * Fetch extended profile sections (Phase 1A Profile Robustness): hobbies, education, skills,
 * user photos (gallery), and work gallery. Runs all in parallel.
 */
export async function getExtendedProfileSections(userId: string) {
  const supabase = await createClient()
  const [hobbiesRes, educationRes, skillsRes, photosRes, galleryRes] = await Promise.all([
    supabase
      .from('user_hobbies')
      .select('id, name, emoji, sort_order')
      .eq('user_id', userId)
      .order('sort_order'),
    supabase
      .from('user_education')
      .select('id, institution, qualification, field_of_study, started_at, ended_at, sort_order')
      .eq('user_id', userId)
      .order('sort_order'),
    supabase
      .from('user_skills')
      .select('id, name, category, sort_order')
      .eq('user_id', userId)
      .order('sort_order'),
    supabase
      .from('user_photos')
      .select('id, photo_url, sort_order')
      .eq('user_id', userId)
      .order('sort_order'),
    supabase
      .from('user_gallery')
      .select('id, image_url, caption, yacht_id, sort_order, yachts ( name )')
      .eq('user_id', userId)
      .order('sort_order'),
  ])
  return {
    hobbies: hobbiesRes.data ?? [],
    education: educationRes.data ?? [],
    skills: skillsRes.data ?? [],
    photos: photosRes.data ?? [],
    gallery: galleryRes.data ?? [],
  }
}

/**
 * Check whether the current authenticated user has saved a given profile.
 */
export async function getSavedStatus(viewerUserId: string, profileUserId: string) {
  const supabase = await createClient()
  const { data } = await supabase
    .from('saved_profiles')
    .select('id, folder_id')
    .eq('user_id', viewerUserId)
    .eq('saved_user_id', profileUserId)
    .single()
  return data ?? null
}

/**
 * Fetch the current user's saved profiles, paginated.
 */
export async function getSavedProfiles(userId: string, folderId?: string | null, page = 1, limit = 20) {
  const supabase = await createClient()
  let query = supabase
    .from('saved_profiles')
    .select(`
      id, folder_id, created_at,
      saved_user:saved_user_id (
        id, display_name, full_name, handle, profile_photo_url, primary_role
      )
    `, { count: 'exact' })
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .range((page - 1) * limit, page * limit - 1)

  if (folderId !== undefined) {
    if (folderId === null) {
      query = query.is('folder_id', null)
    } else {
      query = query.eq('folder_id', folderId)
    }
  }

  const { data, count } = await query
  return { results: data ?? [], total: count ?? 0 }
}

/**
 * Fetch the current user's profile folders.
 */
export async function getProfileFolders(userId: string) {
  const supabase = await createClient()
  const { data } = await supabase
    .from('profile_folders')
    .select('id, name, emoji, sort_order')
    .eq('user_id', userId)
    .order('sort_order')
  return data ?? []
}

/**
 * Fetch the endorser's role on a specific yacht (for endorsement display).
 */
export async function getEndorserRoleOnYacht(endorserUserId: string, yachtId: string) {
  const supabase = await createClient()
  const { data } = await supabase
    .from('attachments')
    .select('role_label')
    .eq('user_id', endorserUserId)
    .eq('yacht_id', yachtId)
    .is('deleted_at', null)
    .order('started_at', { ascending: false })
    .limit(1)
    .single()
  return data?.role_label ?? null
}

// ── Public Profile Sections ────────────────────────────────────────────────

/**
 * Fetch the three core sections for public profile display.
 * Returns typed arrays — replaces inline queries + `any[]` casts in page.tsx.
 */
export async function getPublicProfileSections(userId: string) {
  const supabase = await createClient()
  const [attRes, certRes, endRes] = await Promise.all([
    supabase
      .from('attachments')
      .select(`
        id, role_label, started_at, ended_at,
        yachts ( id, name, yacht_type, length_meters, flag_state )
      `)
      .eq('user_id', userId)
      .is('deleted_at', null)
      .order('started_at', { ascending: false }),
    supabase
      .from('certifications')
      .select(`
        id, custom_cert_name, issued_at, expires_at,
        certification_types ( name, category )
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false }),
    supabase
      .from('endorsements')
      .select(`
        id, content, created_at, endorser_role_label, recipient_role_label,
        endorser:endorser_id ( id, display_name, full_name, profile_photo_url ),
        yacht:yachts!yacht_id ( name )
      `)
      .eq('recipient_id', userId)
      .is('deleted_at', null)
      .order('created_at', { ascending: false }),
  ])
  return {
    attachments: (attRes.data ?? []) as unknown as PublicAttachment[],
    certifications: (certRes.data ?? []) as unknown as PublicCertification[],
    endorsements: (endRes.data ?? []) as unknown as PublicEndorsement[],
  }
}

// ── CV Sections ────────────────────────────────────────────────────────────

/**
 * Fetch all six CV sections for HTML CV rendering.
 * Used by public CV view, owner preview, and PDF generation.
 */
export async function getCvSections(userId: string) {
  const supabase = await createClient()
  const [attRes, certRes, endRes, eduRes, skillsRes, hobbiesRes] = await Promise.all([
    supabase
      .from('attachments')
      .select(`
        id, role_label, started_at, ended_at, employment_type, yacht_program, description, cruising_area,
        yachts ( id, name, yacht_type, length_meters, flag_state, builder )
      `)
      .eq('user_id', userId)
      .is('deleted_at', null)
      .order('started_at', { ascending: false }),
    supabase
      .from('certifications')
      .select(`
        id, custom_cert_name, issued_at, expires_at, issuing_body,
        certification_types ( name, category )
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false }),
    supabase
      .from('endorsements')
      .select(`
        id, content, created_at,
        endorser:endorser_id ( display_name, full_name ),
        yacht:yachts!yacht_id ( name )
      `)
      .eq('recipient_id', userId)
      .is('deleted_at', null)
      .order('created_at', { ascending: false })
      .limit(3),
    supabase
      .from('user_education')
      .select('id, institution, qualification, field_of_study, started_at, ended_at')
      .eq('user_id', userId)
      .order('sort_order'),
    supabase
      .from('user_skills')
      .select('id, name')
      .eq('user_id', userId)
      .order('sort_order'),
    supabase
      .from('user_hobbies')
      .select('id, name')
      .eq('user_id', userId)
      .order('sort_order'),
  ])
  return {
    attachments: (attRes.data ?? []) as unknown as CvAttachment[],
    certifications: (certRes.data ?? []) as unknown as CvCertification[],
    endorsements: (endRes.data ?? []) as unknown as CvEndorsement[],
    education: (eduRes.data ?? []) as unknown as Array<{ id: string; institution: string; qualification: string | null; field_of_study: string | null; started_at: string | null; ended_at: string | null }>,
    skills: (skillsRes.data ?? []) as unknown as Array<{ id: string; name: string }>,
    hobbies: (hobbiesRes.data ?? []) as unknown as Array<{ id: string; name: string }>,
  }
}

// ── Viewer Relationship ────────────────────────────────────────────────────

/**
 * Compute the viewer's relationship to a profile owner.
 * Determines: own profile, shared yachts (colleague), mutual colleagues (2nd connection).
 * Extracted from app/(public)/u/[handle]/page.tsx to eliminate inline query logic.
 */
export async function getViewerRelationship(
  viewerId: string,
  profileUserId: string,
  profileYachtIds: string[],
): Promise<{ relationship: ViewerRelationship; savedStatus: { id: string; folder_id: string | null } | null }> {
  const supabase = await createClient()

  if (viewerId === profileUserId) {
    return {
      relationship: { isOwnProfile: true, sharedYachtIds: [], mutualColleagues: [] },
      savedStatus: null,
    }
  }

  const [savedStatus, viewerAttsRes] = await Promise.all([
    getSavedStatus(viewerId, profileUserId),
    supabase
      .from('attachments')
      .select('yacht_id, yachts ( id, name )')
      .eq('user_id', viewerId)
      .is('deleted_at', null),
  ])

  const viewerAtts = viewerAttsRes.data ?? []
  type AttWithYacht = { yacht_id: string; yachts: { id: string; name: string } | null }
  const viewerYachtIds = (viewerAtts as unknown as AttWithYacht[])
    .map((a) => a.yachts?.id)
    .filter(Boolean) as string[]

  // Shared yachts (direct colleague)
  const profileYachtIdSet = new Set(profileYachtIds)
  const sharedYachtIds: string[] = []
  for (const yId of viewerYachtIds) {
    if (profileYachtIdSet.has(yId) && !sharedYachtIds.includes(yId)) {
      sharedYachtIds.push(yId)
    }
  }

  // Mutual colleagues (2nd connections)
  const mutualColleagues: MutualColleague[] = []
  if (profileYachtIds.length > 0 && viewerYachtIds.length > 0) {
    const { data: profileColleagueAtts } = await supabase
      .from('attachments')
      .select('user_id, yacht_id, yachts ( id, name )')
      .in('yacht_id', profileYachtIds)
      .neq('user_id', profileUserId)
      .neq('user_id', viewerId)
      .is('deleted_at', null)

    type ColleagueAtt = { user_id: string; yacht_id: string; yachts: { id: string; name: string } | null }
    const colleagueToProfileYacht = new Map<string, string>()
    for (const pc of (profileColleagueAtts ?? []) as unknown as ColleagueAtt[]) {
      if (!colleagueToProfileYacht.has(pc.user_id)) {
        colleagueToProfileYacht.set(pc.user_id, pc.yachts?.name ?? '')
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

      type MutualAtt = { user_id: string; yachts: { id: string; name: string } | null }
      const typedMutualAtts = (mutualAtts ?? []) as unknown as MutualAtt[]
      const mutualColleagueIds = [...new Set(typedMutualAtts.map((a) => a.user_id))]

      if (mutualColleagueIds.length > 0) {
        const { data: mutualUsers } = await supabase
          .from('users')
          .select('id, display_name, full_name, profile_photo_url')
          .in('id', mutualColleagueIds)

        for (const mu of mutualUsers ?? []) {
          const viewerSideAtt = typedMutualAtts.find((a) => a.user_id === mu.id)
          mutualColleagues.push({
            id: mu.id,
            name: (mu.display_name ?? mu.full_name) as string,
            photoUrl: mu.profile_photo_url as string | null,
            throughYachtWithProfile: colleagueToProfileYacht.get(mu.id) ?? '',
            throughYachtWithViewer: viewerSideAtt?.yachts?.name ?? '',
          })
        }
      }
    }
  }

  return {
    relationship: { isOwnProfile: false, sharedYachtIds, mutualColleagues },
    savedStatus,
  }
}

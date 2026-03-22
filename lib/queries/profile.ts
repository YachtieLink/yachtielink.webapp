import { cache } from 'react'
import { createClient } from '@/lib/supabase/server'

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
      ai_summary, ai_summary_edited, section_visibility, social_links
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
      cv_public, cv_public_source, latest_pdf_path, cv_storage_path
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

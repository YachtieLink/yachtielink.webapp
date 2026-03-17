import { cache } from 'react'
import { createClient } from '@/lib/supabase/server'

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
      stripe_customer_id, founding_member, show_watermark, template_id
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
      show_phone, show_whatsapp, show_email, show_location
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

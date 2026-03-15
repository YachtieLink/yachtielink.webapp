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
      images: user.profile_photo_url ? [{ url: user.profile_photo_url }] : [],
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

  // Parallel data fetching
  const [userRes, attachmentsRes, certsRes, endorsementsRes] = await Promise.all([
    supabase
      .from('users')
      .select(`
        id, full_name, display_name, handle, primary_role, departments,
        bio, profile_photo_url,
        phone, whatsapp, email, location_country, location_city,
        phone_visible, whatsapp_visible, email_visible, location_visible
      `)
      .eq('handle', handle.toLowerCase())
      .single(),
    // Defer these until we have the user ID — but since we're fetching by handle,
    // we need the user first. Use a two-phase approach.
    Promise.resolve(null),
    Promise.resolve(null),
    Promise.resolve(null),
  ])

  const user = userRes.data
  if (!user) notFound()

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

  return (
    <div className="min-h-screen bg-[var(--color-surface-raised)]">
      <div className="mx-auto max-w-[640px] px-4 py-8">
        <PublicProfileContent
          user={user as any}
          attachments={(attRes.data as any) ?? []}
          certifications={(certRes.data as any) ?? []}
          endorsements={(endRes.data as any) ?? []}
          showQrCode
        />
      </div>
    </div>
  )
}

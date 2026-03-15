import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { PublicProfileContent } from '@/components/public/PublicProfileContent'
import { CvActions } from '@/components/cv/CvActions'

export default async function CvPage() {
  const supabase = await createClient()

  const { data: { user: authUser } } = await supabase.auth.getUser()
  if (!authUser) redirect('/welcome')

  // Fetch user profile with CV/PDF columns
  const { data: profile } = await supabase
    .from('users')
    .select(`
      id, full_name, display_name, handle, primary_role, departments,
      bio, profile_photo_url,
      phone, whatsapp, email, location_country, location_city,
      show_phone, show_whatsapp, show_email, show_location,
      latest_pdf_path, latest_pdf_generated_at, subscription_status
    `)
    .eq('id', authUser.id)
    .single()

  if (!profile) redirect('/onboarding')

  // Fetch related data in parallel
  const [attRes, certRes, endRes] = await Promise.all([
    supabase
      .from('attachments')
      .select(`
        id, role_label, started_at, ended_at,
        yachts ( id, name, yacht_type, length_m, flag_state )
      `)
      .eq('user_id', profile.id)
      .is('deleted_at', null)
      .order('started_at', { ascending: false }),
    supabase
      .from('certifications')
      .select(`
        id, custom_cert_name, issued_at, expires_at,
        certification_types ( name, category )
      `)
      .eq('user_id', profile.id)
      .order('created_at', { ascending: false }),
    supabase
      .from('endorsements')
      .select(`
        id, content, created_at, endorser_role_label, recipient_role_label,
        endorser:endorser_id ( display_name, full_name, profile_photo_url ),
        yacht:yachts!yacht_id ( name )
      `)
      .eq('recipient_id', profile.id)
      .is('deleted_at', null)
      .order('created_at', { ascending: false }),
  ])

  return (
    <div className="flex flex-col gap-4 pb-24">
      {/* Actions card */}
      <CvActions
        handle={profile.handle!}
        hasPdf={!!profile.latest_pdf_path}
        pdfGeneratedAt={profile.latest_pdf_generated_at}
        isPro={profile.subscription_status === 'pro'}
      />

      {/* Public profile preview */}
      <div className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-raised)] p-4">
        <h2 className="text-xs font-semibold uppercase tracking-wide text-[var(--color-text-tertiary)] mb-4">
          Public Profile Preview
        </h2>
        <PublicProfileContent
          user={profile as any}
          attachments={(attRes.data as any) ?? []}
          certifications={(certRes.data as any) ?? []}
          endorsements={(endRes.data as any) ?? []}
        />
      </div>
    </div>
  )
}

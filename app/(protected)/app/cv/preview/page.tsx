import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { CvPreview } from '@/components/cv/CvPreview'
import { PageTransition } from '@/components/ui/PageTransition'
import { PageHeader } from '@/components/ui/PageHeader'

export default async function CvPreviewPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/welcome')

  const [profileRes, attRes, certRes, endRes, eduRes, skillsRes, hobbiesRes] = await Promise.all([
    supabase.from('users').select(`
      id, full_name, display_name, handle, primary_role, departments, bio, profile_photo_url,
      phone, whatsapp, email, contact_email, location_country, location_city,
      show_phone, show_whatsapp, show_email, show_location,
      dob, home_country, smoke_pref, appearance_note, travel_docs, license_info, languages, show_dob
    `).eq('id', user.id).single(),
    supabase.from('attachments').select('id, role_label, started_at, ended_at, employment_type, yacht_program, description, cruising_area, yachts(id, name, yacht_type, length_meters, flag_state, builder)').eq('user_id', user.id).is('deleted_at', null).order('started_at', { ascending: false }),
    supabase.from('certifications').select('id, custom_cert_name, issued_at, expires_at, issuing_body, certification_types(name, category)').eq('user_id', user.id).order('created_at', { ascending: false }),
    supabase.from('endorsements').select('id, content, created_at, endorser:endorser_id(display_name, full_name), yacht:yachts!yacht_id(name)').eq('recipient_id', user.id).is('deleted_at', null).order('created_at', { ascending: false }).limit(3),
    supabase.from('user_education').select('id, institution, qualification, field_of_study, started_at, ended_at').eq('user_id', user.id).order('sort_order'),
    supabase.from('user_skills').select('id, name').eq('user_id', user.id).order('sort_order'),
    supabase.from('user_hobbies').select('id, name').eq('user_id', user.id).order('sort_order'),
  ])

  if (!profileRes.data) redirect('/onboarding')

  return (
    <PageTransition className="flex flex-col gap-4 pb-24">
      <PageHeader backHref="/app/cv" title="CV Preview" />
      <CvPreview
        mode="owner"
        user={profileRes.data}
        attachments={attRes.data ?? []}
        certifications={certRes.data ?? []}
        endorsements={endRes.data ?? []}
        education={eduRes.data ?? []}
        skills={skillsRes.data ?? []}
        hobbies={hobbiesRes.data ?? []}
      />
    </PageTransition>
  )
}

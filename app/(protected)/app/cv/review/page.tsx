import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { CvImportWizard } from '@/components/cv/CvImportWizard'

interface Props {
  searchParams: Promise<{ path?: string }>
}

export default async function CvReviewPage({ searchParams }: Props) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/welcome')

  const params = await searchParams
  const storagePath = params.path

  // If no path, redirect to upload
  if (!storagePath) redirect('/app/cv/upload')

  // Fetch everything the wizard needs in parallel
  const [profileRes, attachmentsRes, certsRes, educationRes, skillsRes, hobbiesRes] = await Promise.all([
    supabase.from('users').select(`
      full_name, display_name, bio, primary_role,
      phone, location_country, location_city,
      dob, home_country, smoke_pref, appearance_note,
      travel_docs, license_info, languages
    `).eq('id', user.id).single(),
    supabase.from('attachments').select('id, role_label, started_at, ended_at, yacht_id, yachts(id, name, yacht_type, length_meters, flag_state, builder)').eq('user_id', user.id).is('deleted_at', null),
    supabase.from('certifications').select('id, custom_cert_name, issued_at, expires_at, issuing_body, certification_types(name, category)').eq('user_id', user.id),
    supabase.from('user_education').select('id, institution, qualification, field_of_study, started_at, ended_at').eq('user_id', user.id),
    supabase.from('user_skills').select('name').eq('user_id', user.id),
    supabase.from('user_hobbies').select('name').eq('user_id', user.id),
  ])

  return (
    <div className="flex flex-col gap-4 pb-24">
      <CvImportWizard
        userId={user.id}
        storagePath={storagePath}
        existingProfile={profileRes.data ?? {}}
        existingAttachments={attachmentsRes.data ?? []}
        existingCerts={certsRes.data ?? []}
        existingEducation={educationRes.data ?? []}
        existingSkills={(skillsRes.data ?? []).map(s => s.name)}
        existingHobbies={(hobbiesRes.data ?? []).map(h => h.name)}
      />
    </div>
  )
}

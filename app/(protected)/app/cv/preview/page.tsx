import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getCvSections } from '@/lib/queries/profile'
import { CvPreview } from '@/components/cv/CvPreview'
import { PageTransition } from '@/components/ui/PageTransition'
import { PageHeader } from '@/components/ui/PageHeader'

export default async function CvPreviewPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/welcome')

  const [profileRes, sections] = await Promise.all([
    supabase.from('users').select(`
      id, full_name, display_name, handle, primary_role, departments, bio, profile_photo_url,
      phone, whatsapp, email, contact_email, location_country, location_city,
      show_phone, show_whatsapp, show_email, show_location,
      dob, home_country, smoke_pref, appearance_note, travel_docs, license_info, languages, show_dob
    `).eq('id', user.id).single(),
    getCvSections(user.id),
  ])

  if (!profileRes.data) redirect('/onboarding')

  return (
    <PageTransition className="flex flex-col gap-4 pb-24">
      <PageHeader backHref="/app/cv" title="CV Preview" />
      <CvPreview
        mode="owner"
        user={profileRes.data}
        attachments={sections.attachments}
        certifications={sections.certifications}
        endorsements={sections.endorsements}
        education={sections.education}
        skills={sections.skills}
        hobbies={sections.hobbies}
      />
    </PageTransition>
  )
}

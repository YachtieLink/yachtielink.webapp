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
  const [profileRes, skillsRes, hobbiesRes] = await Promise.all([
    supabase.from('users').select(`
      full_name, display_name, bio, primary_role,
      phone, location_country, location_city,
      dob, home_country, smoke_pref, appearance_note,
      travel_docs, license_info, languages
    `).eq('id', user.id).single(),
    supabase.from('user_skills').select('name').eq('user_id', user.id),
    supabase.from('user_hobbies').select('name').eq('user_id', user.id),
  ])

  return (
    <div className="flex flex-col gap-4 pb-24">
      <CvImportWizard
        userId={user.id}
        storagePath={storagePath}
        existingProfile={profileRes.data ?? {}}
        existingSkills={(skillsRes.data ?? []).map(s => s.name)}
        existingHobbies={(hobbiesRes.data ?? []).map(h => h.name)}
      />
    </div>
  )
}

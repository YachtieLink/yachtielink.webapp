import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { CvReviewClient } from '@/components/cv/CvReviewClient'

export default async function CvReviewPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/welcome')

  // Fetch existing profile data so review screen can show what will be updated vs already set
  const { data: profile } = await supabase
    .from('users')
    .select('full_name, bio, primary_role, location_country, location_city')
    .eq('id', user.id)
    .single()

  return (
    <div className="flex flex-col gap-4 pb-24">
      <CvReviewClient
        userId={user.id}
        existingProfile={{
          full_name: profile?.full_name ?? null,
          bio: profile?.bio ?? null,
          primary_role: profile?.primary_role ?? null,
          location_country: profile?.location_country ?? null,
          location_city: profile?.location_city ?? null,
        }}
      />
    </div>
  )
}

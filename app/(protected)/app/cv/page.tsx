import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { CvActions } from '@/components/cv/CvActions'
import { CvDetailsCard } from '@/components/cv/CvDetailsCard'
import { PageTransition } from '@/components/ui/PageTransition'

export default async function CvPage() {
  const supabase = await createClient()

  const { data: { user: authUser } } = await supabase.auth.getUser()
  if (!authUser) redirect('/welcome')

  const { data: profile } = await supabase
    .from('users')
    .select('id, handle, full_name, display_name, primary_role, departments, profile_photo_url, latest_pdf_path, cv_storage_path, cv_public, cv_public_source, subscription_status')
    .eq('id', authUser.id)
    .single()

  if (!profile) redirect('/onboarding')

  if (!profile.handle) {
    redirect('/app/profile/settings')
  }

  return (
    <PageTransition className="flex flex-col gap-4 pb-24 -mx-4 px-4 md:-mx-6 md:px-6 bg-[var(--color-amber-50)]">
      <h1 className="text-[28px] font-serif tracking-tight text-[var(--color-text-primary)]">CV &amp; Sharing</h1>
      <CvDetailsCard />
      <CvActions
        handle={profile.handle}
        userId={profile.id}
        hasGeneratedPdf={!!profile.latest_pdf_path}
        hasUploadedCv={!!profile.cv_storage_path}
        cvPublic={profile.cv_public ?? true}
        cvPublicSource={(profile.cv_public_source as 'generated' | 'uploaded') ?? 'generated'}
        isPro={profile.subscription_status === 'pro'}
        displayName={profile.display_name || profile.full_name}
        primaryRole={profile.primary_role}
        departments={profile.departments}
        profilePhotoUrl={profile.profile_photo_url}
      />
    </PageTransition>
  )
}

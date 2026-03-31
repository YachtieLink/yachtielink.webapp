import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { isProFromRecord } from '@/lib/stripe/pro-shared'
import { CvActions } from '@/components/cv/CvActions'
import { CvDetailsCard } from '@/components/cv/CvDetailsCard'
import { CvImportCard } from '@/components/cv/CvImportCard'
import { PageTransition } from '@/components/ui/PageTransition'

export default async function CvPage() {
  const supabase = await createClient()

  const { data: { user: authUser } } = await supabase.auth.getUser()
  if (!authUser) redirect('/welcome')

  const { data: profile } = await supabase
    .from('users')
    .select('id, handle, latest_pdf_path, latest_pdf_generated_at, updated_at, cv_storage_path, cv_parsed_at, cv_public, cv_public_source, subscription_status, subscription_ends_at')
    .eq('id', authUser.id)
    .single()

  if (!profile) redirect('/onboarding')

  if (!profile.handle) {
    redirect('/app/profile/settings')
  }

  return (
    <PageTransition className="flex flex-col gap-4 pb-24 -mx-4 px-4 md:-mx-6 md:px-6 bg-[var(--color-amber-50)]">
      <h1 className="text-[28px] font-serif tracking-tight text-[var(--color-text-primary)]">My CV</h1>
      <CvImportCard
        hasUploadedCv={!!profile.cv_storage_path}
        cvParsedAt={profile.cv_parsed_at as string | null}
      />
      <CvActions
        hasGeneratedPdf={!!profile.latest_pdf_path}
        pdfGeneratedAt={profile.latest_pdf_generated_at as string | null}
        pdfStale={!!(profile.latest_pdf_generated_at && profile.updated_at && new Date(profile.updated_at) > new Date(profile.latest_pdf_generated_at))}
        hasUploadedCv={!!profile.cv_storage_path}
        cvPublic={profile.cv_public ?? true}
        cvPublicSource={(profile.cv_public_source as 'generated' | 'uploaded') ?? 'generated'}
        isPro={isProFromRecord(profile)}
      />
      <CvDetailsCard />
    </PageTransition>
  )
}

import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { isProFromRecord } from '@/lib/stripe/pro-shared'
import { CvActions } from '@/components/cv/CvActions'
import { CvImportCard } from '@/components/cv/CvImportCard'
import { PageTransition } from '@/components/ui/PageTransition'
import { CvDocumentBar } from '@/components/cv/CvDocumentBar'

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

  const pdfStale = !!(profile.latest_pdf_generated_at && profile.updated_at && new Date(profile.updated_at) > new Date(profile.latest_pdf_generated_at))

  return (
    <PageTransition className={`flex flex-col gap-4 -mx-4 px-4 md:-mx-6 md:px-6 bg-[var(--color-amber-50)] ${profile.latest_pdf_path ? 'pb-36' : 'pb-24'}`}>
      <h1 className="text-[28px] font-serif tracking-tight text-[var(--color-text-primary)]">My CV</h1>

      {/* Education card — CV is output-only, data lives on Profile */}
      <div className="rounded-2xl border border-[var(--color-amber-200)] bg-white/90 shadow-sm p-4 flex items-start gap-3">
        <div className="mt-0.5 h-8 w-8 rounded-full bg-[var(--color-amber-100)] flex items-center justify-center shrink-0">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--color-amber-500)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 20h9" /><path d="M16.5 3.5a2.121 2.121 0 013 3L7 19l-4 1 1-4L16.5 3.5z" />
          </svg>
        </div>
        <div className="flex-1">
          <p className="text-sm text-[var(--color-text-primary)] leading-relaxed">
            Your CV is built from your profile. Edit your experience, certs, and details on the Profile tab.
          </p>
          <Link
            href="/app/profile"
            className="inline-flex items-center gap-1 text-sm font-medium text-[var(--color-interactive)] mt-1.5 hover:underline"
          >
            Go to Profile
            <span aria-hidden="true">&rarr;</span>
          </Link>
        </div>
      </div>

      <CvImportCard
        hasUploadedCv={!!profile.cv_storage_path}
        cvParsedAt={profile.cv_parsed_at as string | null}
      />
      <CvActions
        hasGeneratedPdf={!!profile.latest_pdf_path}
        pdfGeneratedAt={profile.latest_pdf_generated_at as string | null}
        pdfStale={pdfStale}
        hasUploadedCv={!!profile.cv_storage_path}
        cvPublic={profile.cv_public ?? true}
        cvPublicSource={(profile.cv_public_source as 'generated' | 'uploaded') ?? 'generated'}
        isPro={isProFromRecord(profile)}
      />

      {/* Sticky document action bar — shows when generated PDF exists */}
      <CvDocumentBar
        hasGeneratedPdf={!!profile.latest_pdf_path}
        pdfStale={pdfStale}
      />
    </PageTransition>
  )
}

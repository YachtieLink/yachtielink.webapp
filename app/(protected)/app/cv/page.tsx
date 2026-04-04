import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { isProFromRecord } from '@/lib/stripe/pro-shared'
import { CvActions } from '@/components/cv/CvActions'
import { CvImportCard } from '@/components/cv/CvImportCard'
import { PageTransition } from '@/components/ui/PageTransition'
import { CvDocumentBar } from '@/components/cv/CvDocumentBar'
import { FirstVisitCard } from '@/components/ui/FirstVisitCard'

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

  const hasUploadedCv = !!profile.cv_storage_path
  const hasGeneratedPdf = !!profile.latest_pdf_path
  const isCold = !hasUploadedCv && !hasGeneratedPdf
  const pdfStale = !!(profile.latest_pdf_generated_at && profile.updated_at && new Date(profile.updated_at) > new Date(profile.latest_pdf_generated_at))

  // ── Cold state: no CV uploaded, no PDF generated ───────────────────
  if (isCold) {
    return (
      <PageTransition className="flex flex-col gap-4 -mx-4 px-4 md:-mx-6 md:px-6 bg-[var(--color-amber-50)] pb-24">
        <h1 className="text-[28px] font-serif tracking-tight text-[var(--color-text-primary)]">My CV</h1>

        {/* Centered cold state */}
        <div className="flex-1 flex flex-col items-center justify-center text-center py-12">
          <div className="h-16 w-16 rounded-full bg-[var(--color-amber-100)] flex items-center justify-center mb-4">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--color-amber-500)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14 2 14 8 20 8" />
              <line x1="16" y1="13" x2="8" y2="13" />
              <line x1="16" y1="17" x2="8" y2="17" />
              <polyline points="10 9 9 9 8 9" />
            </svg>
          </div>
          <h2 className="text-lg font-serif tracking-tight text-[var(--color-text-primary)] mb-2">
            Your CV starts with your profile
          </h2>
          <p className="text-sm text-[var(--color-text-secondary)] leading-relaxed max-w-[280px] mb-6">
            Complete your profile and we&apos;ll generate a professional CV for you. Or upload an existing CV to get started faster.
          </p>
          <div className="flex flex-col gap-3 w-full max-w-[240px]">
            <Link
              href="/app/cv/upload"
              className="w-full px-4 py-2.5 rounded-xl text-sm font-medium bg-[var(--color-interactive)] text-white text-center hover:opacity-90 transition-opacity"
            >
              Upload a CV
            </Link>
            <Link
              href="/app/profile"
              className="w-full px-4 py-2.5 rounded-xl text-sm font-medium text-[var(--color-interactive)] text-center border border-[var(--color-border)] hover:bg-[var(--color-surface-raised)] transition-colors"
            >
              Go to Profile
            </Link>
          </div>
        </div>
      </PageTransition>
    )
  }

  // ── Warm state: has uploaded CV or generated PDF ────────────────────
  return (
    <PageTransition className={`flex flex-col gap-4 -mx-4 px-4 md:-mx-6 md:px-6 bg-[var(--color-amber-50)] ${hasGeneratedPdf ? 'pb-36' : 'pb-24'}`}>
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

      <FirstVisitCard
        storageKey="yl_first_visit_cv"
        accentColor="amber"
        icon="📄"
        title="How your CV works"
        description="Your YachtieLink CV is built from your profile. Edit your experience on the Profile tab — the CV updates automatically."
      />

      <CvActions
        hasGeneratedPdf={hasGeneratedPdf}
        pdfGeneratedAt={profile.latest_pdf_generated_at as string | null}
        pdfStale={pdfStale}
        hasUploadedCv={hasUploadedCv}
        cvPublic={profile.cv_public ?? true}
        cvPublicSource={(profile.cv_public_source as 'generated' | 'uploaded') ?? 'generated'}
        isPro={isProFromRecord(profile)}
      />

      {/* Demoted CV re-import — text link at bottom */}
      <CvImportCard
        hasUploadedCv={hasUploadedCv}
        cvParsedAt={profile.cv_parsed_at as string | null}
      />

      {/* Sticky document action bar — shows when generated PDF exists */}
      <CvDocumentBar
        hasGeneratedPdf={hasGeneratedPdf}
        pdfStale={pdfStale}
      />
    </PageTransition>
  )
}

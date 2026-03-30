import { notFound } from 'next/navigation'
import Link from 'next/link'
import { createServiceClient } from '@/lib/supabase/admin'
import { getUserByHandle, getCvSections } from '@/lib/queries/profile'
import { CvPreview } from '@/components/cv/CvPreview'
import { ShareButton } from '@/components/public/ShareButton'

interface Props {
  params: Promise<{ handle: string }>
}

export default async function PublicCvPage({ params }: Props) {
  const { handle } = await params
  const user = await getUserByHandle(handle)
  // cv_public defaults to true when null (matching CvActions behaviour)
  if (!user || user.cv_public === false) notFound()

  // Uploaded CV path — serve via signed URL iframe
  if (user.cv_public_source === 'uploaded' && user.cv_storage_path) {
    const serviceClient = createServiceClient()
    const { data: signedUrl } = await serviceClient.storage
      .from('cv-uploads')
      .createSignedUrl(user.cv_storage_path, 3600)

    return (
      <div className="min-h-screen flex flex-col">
        <div className="p-4 flex items-center justify-between bg-[var(--color-surface)]">
          <Link href={`/u/${handle}`} className="text-sm text-[var(--color-interactive)]">
            &larr; Back to profile
          </Link>
          <div className="flex items-center gap-3">
            <ShareButton
              url={`${process.env.NEXT_PUBLIC_SITE_URL ?? ''}/u/${handle}/cv`}
              name={user.display_name ?? user.full_name ?? handle}
              userId={user.id}
              variant="compact"
            />
            {(user.latest_pdf_path || user.cv_storage_path) && (
              <a
                href={`/api/cv/public-download/${handle}`}
                target="_blank"
                rel="noopener"
                className="flex items-center justify-center w-10 h-10 rounded-full bg-black/25 backdrop-blur-md text-white hover:bg-black/40 transition-colors"
                aria-label="Download CV"
              >
                <svg style={{ width: 17, height: 17 }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2M7 10l5 5 5-5M12 15V3" />
                </svg>
              </a>
            )}
          </div>
        </div>
        {signedUrl?.signedUrl ? (
          <iframe
            src={signedUrl.signedUrl}
            className="flex-1 w-full"
            title={`${user.display_name ?? user.full_name}'s CV`}
          />
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <p className="text-sm text-[var(--color-text-secondary)]">CV file not available.</p>
          </div>
        )}
      </div>
    )
  }

  // Generated CV — HTML render via shared query helper
  const { attachments, certifications, endorsements, education, skills, hobbies } =
    await getCvSections(user.id)

  return (
    <div className="min-h-screen bg-gray-50 overflow-x-hidden">
      <div className="p-4 flex items-center justify-between bg-[var(--color-surface)]">
        <Link href={`/u/${handle}`} className="text-sm text-[var(--color-interactive)]">
          &larr; Back to profile
        </Link>
        <div className="flex items-center gap-3">
          <ShareButton
            url={`${process.env.NEXT_PUBLIC_SITE_URL ?? ''}/u/${handle}/cv`}
            name={user.display_name ?? user.full_name ?? handle}
            userId={user.id}
            variant="compact"
          />
          {(user.latest_pdf_path || user.cv_storage_path) && (
            <a
              href={`/api/cv/public-download/${handle}`}
              target="_blank"
              rel="noopener"
              className="flex items-center justify-center w-10 h-10 rounded-full bg-[var(--color-interactive)] text-white hover:opacity-90 transition-opacity"
              aria-label="Download CV"
            >
              <svg style={{ width: 17, height: 17 }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2M7 10l5 5 5-5M12 15V3" />
              </svg>
            </a>
          )}
        </div>
      </div>
      <div className="py-8 px-4">
        <CvPreview
          mode="viewer"
          user={user}
          attachments={attachments}
          certifications={certifications}
          endorsements={endorsements}
          education={education}
          skills={skills}
          hobbies={hobbies}
        />
      </div>
    </div>
  )
}

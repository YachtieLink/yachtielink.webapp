import { notFound } from 'next/navigation'
import Link from 'next/link'
import { createServiceClient } from '@/lib/supabase/admin'
import { getUserByHandle, getCvSections } from '@/lib/queries/profile'
import { CvPreview } from '@/components/cv/CvPreview'

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
    <div className="min-h-screen bg-gray-50 py-8 px-4">
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
  )
}

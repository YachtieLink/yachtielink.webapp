import { notFound } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/admin'
import { getUserByHandle } from '@/lib/queries/profile'
import { CvPreview } from '@/components/cv/CvPreview'

interface Props {
  params: Promise<{ handle: string }>
}

export default async function PublicCvPage({ params }: Props) {
  const { handle } = await params
  const user = await getUserByHandle(handle)
  if (!user || !user.cv_public) notFound()

  const supabase = await createClient()

  // Uploaded CV path
  if (user.cv_public_source === 'uploaded' && user.cv_storage_path) {
    const serviceClient = createServiceClient()
    const { data: signedUrl } = await serviceClient.storage
      .from('cv-uploads')
      .createSignedUrl(user.cv_storage_path, 3600)

    return (
      <div className="min-h-screen flex flex-col">
        <div className="p-4 flex items-center justify-between bg-[var(--color-surface)]">
          <Link href={`/u/${handle}`} className="text-sm text-[var(--color-interactive)]">
            ← Back to profile
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

  // Generated CV — HTML render
  const [attRes, certRes, endRes, eduRes, skillsRes, hobbiesRes] = await Promise.all([
    supabase.from('attachments').select('id, role_label, started_at, ended_at, employment_type, yacht_program, description, cruising_area, yachts(id, name, yacht_type, length_meters, flag_state, builder)').eq('user_id', user.id).is('deleted_at', null).order('started_at', { ascending: false }),
    supabase.from('certifications').select('id, custom_cert_name, issued_at, expires_at, issuing_body, certification_types(name, category)').eq('user_id', user.id).order('created_at', { ascending: false }),
    supabase.from('endorsements').select('id, content, created_at, endorser:endorser_id(display_name, full_name), yacht:yachts!yacht_id(name)').eq('recipient_id', user.id).is('deleted_at', null).order('created_at', { ascending: false }).limit(3),
    supabase.from('user_education').select('id, institution, qualification, field_of_study, started_at, ended_at').eq('user_id', user.id).order('sort_order'),
    supabase.from('user_skills').select('id, name').eq('user_id', user.id).order('sort_order'),
    supabase.from('user_hobbies').select('id, name').eq('user_id', user.id).order('sort_order'),
  ])

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <CvPreview
        mode="viewer"
        user={user}
        attachments={attRes.data ?? []}
        certifications={certRes.data ?? []}
        endorsements={endRes.data ?? []}
        education={eduRes.data ?? []}
        skills={skillsRes.data ?? []}
        hobbies={hobbiesRes.data ?? []}
      />
    </div>
  )
}

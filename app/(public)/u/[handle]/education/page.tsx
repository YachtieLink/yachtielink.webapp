import { notFound } from 'next/navigation'
import Link from 'next/link'
import type { Metadata } from 'next'
import { ChevronLeft } from 'lucide-react'
import { getUserByHandle, getExtendedProfileSections } from '@/lib/queries/profile'

interface Props {
  params: Promise<{ handle: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { handle } = await params
  const user = await getUserByHandle(handle)
  if (!user) return { title: 'Not Found' }
  const name = user.display_name || user.full_name
  return { title: `Education — ${name} — YachtieLink` }
}

export default async function EducationPage({ params }: Props) {
  const { handle } = await params
  const user = await getUserByHandle(handle)
  if (!user) notFound()

  const { education } = await getExtendedProfileSections(user.id)
  const name = user.display_name || user.full_name

  return (
    <div className="max-w-[680px] mx-auto px-4 py-6 flex flex-col gap-4">
      <Link
        href={`/u/${handle}`}
        className="inline-flex items-center gap-1 text-sm text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-colors w-fit"
      >
        <ChevronLeft size={16} />
        Back to {name}
      </Link>

      <h1 className="text-2xl font-serif tracking-tight text-[var(--color-text-primary)]">
        Education
      </h1>
      <p className="text-sm text-[var(--color-text-secondary)]">
        {education.length} entr{education.length !== 1 ? 'ies' : 'y'}
      </p>

      <div className="flex flex-col gap-3">
        {education.map((edu) => (
          <div key={edu.id} className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
            <p className="text-sm font-medium text-[var(--color-text-primary)]">{edu.institution}</p>
            {edu.qualification && (
              <p className="text-sm text-[var(--color-text-secondary)] mt-0.5">{edu.qualification}</p>
            )}
            {edu.field_of_study && (
              <p className="text-xs text-[var(--color-text-secondary)] mt-0.5">{edu.field_of_study}</p>
            )}
            {(edu.started_at || edu.ended_at) && (
              <p className="text-xs text-[var(--color-text-tertiary)] mt-1">
                {edu.started_at ? new Date(edu.started_at).getFullYear() : ''}
                {edu.started_at && edu.ended_at ? ' – ' : ''}
                {edu.ended_at ? new Date(edu.ended_at).getFullYear() : ''}
              </p>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

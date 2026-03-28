import { notFound } from 'next/navigation'
import Link from 'next/link'
import type { Metadata } from 'next'
import { ChevronLeft } from 'lucide-react'
import { getUserByHandle, getPublicProfileSections } from '@/lib/queries/profile'
import { formatDate } from '@/lib/format-date'

interface Props {
  params: Promise<{ handle: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { handle } = await params
  const user = await getUserByHandle(handle)
  if (!user) return { title: 'Not Found' }
  const name = user.display_name || user.full_name
  return { title: `Experience — ${name} — YachtieLink` }
}

export default async function ExperiencePage({ params }: Props) {
  const { handle } = await params
  const user = await getUserByHandle(handle)
  if (!user) notFound()

  const { attachments } = await getPublicProfileSections(user.id)
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
        Experience
      </h1>
      <p className="text-sm text-[var(--color-text-secondary)]">
        {attachments.length} position{attachments.length !== 1 ? 's' : ''}
      </p>

      <div className="flex flex-col gap-4">
        {attachments.map((att) => (
          <div key={att.id} className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
            <p className="text-sm font-medium text-[var(--color-text-primary)]">
              {att.yachts?.name ?? 'Unknown Yacht'}
              {att.role_label && <span className="font-normal text-[var(--color-text-secondary)]"> — {att.role_label}</span>}
            </p>
            {(att.started_at || att.ended_at) && (
              <p className="text-xs text-[var(--color-text-secondary)] mt-1">
                {formatDate(att.started_at)}{att.started_at && ' – '}{att.ended_at ? formatDate(att.ended_at) : 'Present'}
              </p>
            )}
            {att.yachts?.flag_state && (
              <p className="text-xs text-[var(--color-text-secondary)]">
                {att.yachts.flag_state}{att.yachts.length_meters ? ` · ${att.yachts.length_meters}m` : ''}
              </p>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

import { notFound } from 'next/navigation'
import Link from 'next/link'
import type { Metadata } from 'next'
import { ChevronLeft } from 'lucide-react'
import { getUserByHandle, getPublicProfileSections, getLandExperience } from '@/lib/queries/profile'
import { formatDate } from '@/lib/format-date'
import { Anchor, Briefcase } from 'lucide-react'

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

  const [{ attachments }, landExperience] = await Promise.all([
    getPublicProfileSections(user.id),
    getLandExperience(user.id),
  ])
  const name = user.display_name || user.full_name

  // Merge and sort: current roles first, then by start date descending
  type Entry =
    | { type: 'yacht'; data: typeof attachments[number] }
    | { type: 'land'; data: typeof landExperience[number] }

  const entries: Entry[] = [
    ...attachments.map(a => ({ type: 'yacht' as const, data: a })),
    ...landExperience.map(l => ({ type: 'land' as const, data: l })),
  ].sort((a, b) => {
    const startA = a.type === 'yacht' ? a.data.started_at : a.data.start_date
    const startB = b.type === 'yacht' ? b.data.started_at : b.data.start_date
    const endA = a.type === 'yacht' ? a.data.ended_at : a.data.end_date
    const endB = b.type === 'yacht' ? b.data.ended_at : b.data.end_date
    // Current roles first (has start but no end)
    const currentA = startA && !endA
    const currentB = startB && !endB
    if (currentA && !currentB) return -1
    if (!currentA && currentB) return 1
    // Then by start date descending
    const dateA = startA ? new Date(startA).getTime() : 0
    const dateB = startB ? new Date(startB).getTime() : 0
    return dateB - dateA
  })

  const totalPositions = entries.length

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
        {totalPositions} position{totalPositions !== 1 ? 's' : ''}
      </p>

      <div className="flex flex-col gap-4">
        {entries.map((entry) => {
          if (entry.type === 'yacht') {
            const att = entry.data
            return (
              <div key={`y-${att.id}`} className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4 flex gap-3">
                <div className="mt-0.5 shrink-0 h-7 w-7 rounded-lg bg-[var(--color-navy-50)] flex items-center justify-center">
                  <Anchor size={14} className="text-[var(--color-navy-500)]" />
                </div>
                <div>
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
              </div>
            )
          }

          const job = entry.data
          return (
            <div key={`l-${job.id}`} className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4 flex gap-3">
              <div className="mt-0.5 shrink-0 h-7 w-7 rounded-lg bg-[var(--color-amber-50)] flex items-center justify-center">
                <Briefcase size={14} className="text-[var(--color-amber-600)]" />
              </div>
              <div>
                <p className="text-sm font-medium text-[var(--color-text-primary)]">
                  {job.company || 'Unknown company'}
                  {job.role && <span className="font-normal text-[var(--color-text-secondary)]"> — {job.role}</span>}
                </p>
                {(job.start_date || job.end_date) && (
                  <p className="text-xs text-[var(--color-text-secondary)] mt-1">
                    {job.start_date ? formatDate(job.start_date) : ''}{job.start_date && ' – '}{job.end_date ? formatDate(job.end_date) : 'Present'}
                  </p>
                )}
                {job.industry && (
                  <p className="text-xs text-[var(--color-text-secondary)]">{job.industry}</p>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

'use client'

import Link from 'next/link'
import { Anchor, Briefcase } from 'lucide-react'
import { formatDate } from '@/lib/format-date'
import { prefixedYachtName } from '@/lib/yacht-prefix'
import type { PublicAttachment, LandExperienceEntry } from '@/lib/queries/types'

interface ExperienceTileProps {
  attachments: PublicAttachment[]
  landExperience?: LandExperienceEntry[]
  handle: string
  maxShow?: number
}

type Entry =
  | { type: 'yacht'; data: PublicAttachment }
  | { type: 'land'; data: LandExperienceEntry }

export function ExperienceTile({ attachments, landExperience = [], handle, maxShow = 3 }: ExperienceTileProps) {
  const entries: Entry[] = [
    ...attachments.map(a => ({ type: 'yacht' as const, data: a })),
    ...landExperience.map(l => ({ type: 'land' as const, data: l })),
  ].sort((a, b) => {
    const startA = a.type === 'yacht' ? a.data.started_at : a.data.start_date
    const startB = b.type === 'yacht' ? b.data.started_at : b.data.start_date
    const endA = a.type === 'yacht' ? a.data.ended_at : a.data.end_date
    const endB = b.type === 'yacht' ? b.data.ended_at : b.data.end_date
    const currentA = startA && !endA
    const currentB = startB && !endB
    if (currentA && !currentB) return -1
    if (!currentA && currentB) return 1
    if (!startA && startB) return 1
    if (startA && !startB) return -1
    return new Date(startB ?? 0).getTime() - new Date(startA ?? 0).getTime()
  })

  const shown = entries.slice(0, maxShow)
  const remaining = entries.length - shown.length

  return (
    <div className="h-full rounded-xl bg-[var(--color-teal-50)]/50 p-5 flex flex-col">
      <div className="flex items-center gap-2 mb-3">
        <Anchor size={14} className="text-blue-500" />
        <span className="text-xs font-semibold uppercase tracking-wide text-[var(--color-text-tertiary)]">My Experience</span>
      </div>
      <div className="flex flex-col gap-2.5 flex-1">
        {shown.map((entry) => {
          if (entry.type === 'yacht') {
            const att = entry.data
            return (
              <div key={`y-${att.id}`} className="flex gap-2.5">
                <div className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-[var(--accent-500,#14b8a6)]" />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-[var(--color-text-primary)] truncate">
                    {prefixedYachtName(att.yachts?.name ?? 'Unknown Yacht', att.yachts?.yacht_type)}
                    {att.role_label && <span className="font-normal text-[var(--color-text-secondary)]"> — {att.role_label}</span>}
                  </p>
                  {(att.started_at || att.ended_at) && (
                    <p className="text-xs text-[var(--color-text-secondary)]">
                      {formatDate(att.started_at)}{att.started_at && ' – '}{att.ended_at ? formatDate(att.ended_at) : 'Present'}
                    </p>
                  )}
                </div>
              </div>
            )
          }
          const job = entry.data
          return (
            <div key={`l-${job.id}`} className="flex gap-2.5">
              <div className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-[var(--color-amber-500,#d97706)]" />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-[var(--color-text-primary)] truncate">
                  {job.company || 'Unknown company'}
                  {job.role && <span className="font-normal text-[var(--color-text-secondary)]"> — {job.role}</span>}
                </p>
                {job.start_date && (
                  <p className="text-xs text-[var(--color-text-secondary)]">
                    {formatDate(job.start_date)} – {job.end_date ? formatDate(job.end_date) : 'Present'}
                  </p>
                )}
              </div>
            </div>
          )
        })}
      </div>
      {remaining > 0 && (
        <Link
          href={`/u/${handle}/experience`}
          className="mt-2 text-xs font-medium text-[var(--accent-500,#14b8a6)] hover:underline"
        >
          +{remaining} more &rarr;
        </Link>
      )}
    </div>
  )
}

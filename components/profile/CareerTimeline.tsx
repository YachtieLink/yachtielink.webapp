'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Anchor, Briefcase, ChevronDown, ChevronRight } from 'lucide-react'
import type { LandExperienceEntry } from '@/lib/queries/types'

type YachtInfo = { id: string; name: string; yacht_type: string | null; flag_state: string | null }

interface YachtAttachment {
  id: string
  role_label: string
  started_at: string
  ended_at: string | null
  yachts: YachtInfo | YachtInfo[] | null
}

function resolveYacht(raw: YachtInfo | YachtInfo[] | null): YachtInfo | null {
  if (!raw) return null
  return Array.isArray(raw) ? raw[0] ?? null : raw
}

type TimelineEntry =
  | { type: 'yacht'; data: YachtAttachment }
  | { type: 'land'; data: LandExperienceEntry }

function hasStartDate(entry: TimelineEntry): boolean {
  if (entry.type === 'yacht') return !!entry.data.started_at
  return !!entry.data.start_date
}

function getStartDate(entry: TimelineEntry): Date {
  if (entry.type === 'yacht') {
    return new Date(entry.data.started_at)
  }
  return entry.data.start_date ? new Date(entry.data.start_date) : new Date(0)
}

function getEndDate(entry: TimelineEntry): Date | null {
  if (entry.type === 'yacht') {
    return entry.data.ended_at ? new Date(entry.data.ended_at) : null
  }
  return entry.data.end_date ? new Date(entry.data.end_date) : null
}

function formatDateRange(start: Date, end: Date | null): string {
  const startStr = start.toLocaleDateString('en-GB', { month: 'short', year: 'numeric' })
  if (!end) return `${startStr} – Present`
  const endStr = end.toLocaleDateString('en-GB', { month: 'short', year: 'numeric' })
  return `${startStr} – ${endStr}`
}

const COLLAPSED_COUNT = 3

interface CareerTimelineProps {
  attachments: YachtAttachment[]
  landExperience: LandExperienceEntry[]
}

export function CareerTimeline({ attachments, landExperience }: CareerTimelineProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [showAll, setShowAll] = useState(false)

  // Merge and sort reverse chronological
  const entries: TimelineEntry[] = [
    ...attachments.map(a => ({ type: 'yacht' as const, data: a })),
    ...landExperience.map(l => ({ type: 'land' as const, data: l })),
  ].sort((a, b) => {
    const endA = getEndDate(a)
    const endB = getEndDate(b)
    const hasStartA = hasStartDate(a)
    const hasStartB = hasStartDate(b)

    // Entries with no dates at all sort to the end
    if (!hasStartA && hasStartB) return 1
    if (hasStartA && !hasStartB) return -1

    // Current roles first (has start but no end)
    const currentA = hasStartA && !endA
    const currentB = hasStartB && !endB
    if (currentA && !currentB) return -1
    if (!currentA && currentB) return 1

    // Then by start date descending
    return getStartDate(b).getTime() - getStartDate(a).getTime()
  })

  if (entries.length === 0) return null

  const visibleEntries = showAll ? entries : entries.slice(0, COLLAPSED_COUNT)
  const hiddenCount = entries.length - COLLAPSED_COUNT

  return (
    <>
      <div className="flex items-center justify-between mt-4 mb-1">
        <h3 className="text-xs font-semibold text-[var(--color-text-secondary)] uppercase tracking-wider">Career</h3>
        <Link
          href="/app/attachment/new"
          className="text-xs text-[var(--color-interactive)] hover:underline"
        >
          Add
        </Link>
      </div>

      <ul className="flex flex-col gap-0.5">
        {visibleEntries.map((entry) => {
          const id = entry.data.id
          const isExpanded = expandedId === id
          const startDate = getStartDate(entry)
          const endDate = getEndDate(entry)
          const hasDates = hasStartDate(entry)

          if (entry.type === 'yacht') {
            const att = entry.data
            const yacht = resolveYacht(att.yachts)
            return (
              <li key={`y-${id}`} className="flex gap-3 py-2.5">
                <div className="mt-0.5 shrink-0 h-7 w-7 rounded-lg bg-[var(--color-navy-50)] flex items-center justify-center">
                  <Anchor size={14} className="text-[var(--color-navy-500)]" />
                </div>
                <div className="min-w-0 flex-1">
                  <button
                    className="w-full flex items-start justify-between gap-2 text-left"
                    onClick={() => setExpandedId(isExpanded ? null : id)}
                    aria-expanded={isExpanded}
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-[var(--color-text-primary)] truncate">
                        {yacht?.name ?? 'Unknown yacht'}
                      </p>
                      <p className="text-xs text-[var(--color-text-secondary)] truncate">
                        {att.role_label} · {formatDateRange(startDate, endDate)}
                      </p>
                    </div>
                    <ChevronRight
                      size={14}
                      className={`text-[var(--color-text-tertiary)] shrink-0 mt-1 transition-transform ${isExpanded ? 'rotate-90' : ''}`}
                    />
                  </button>

                  {isExpanded && (
                    <div className="mt-2 flex flex-col gap-1.5 pl-0.5">
                      {yacht?.yacht_type && (
                        <p className="text-xs text-[var(--color-text-secondary)]">
                          {yacht.yacht_type}{yacht.flag_state ? ` · ${yacht.flag_state}` : ''}
                        </p>
                      )}
                      {yacht && (
                        <Link href={`/app/yacht/${yacht.id}`} className="text-xs text-[var(--color-interactive)] hover:underline">
                          View yacht page
                        </Link>
                      )}
                      <Link href={`/app/attachment/${att.id}/edit`} className="text-xs text-[var(--color-text-secondary)] hover:underline">
                        Edit
                      </Link>
                    </div>
                  )}
                </div>
              </li>
            )
          }

          // Land experience
          const job = entry.data
          return (
            <li key={`l-${id}`} className="flex gap-3 py-2.5">
              <div className="mt-0.5 shrink-0 h-7 w-7 rounded-lg bg-[var(--color-amber-50)] flex items-center justify-center">
                <Briefcase size={14} className="text-[var(--color-amber-600)]" />
              </div>
              <div className="min-w-0 flex-1">
                <button
                  className="w-full flex items-start justify-between gap-2 text-left"
                  onClick={() => setExpandedId(isExpanded ? null : id)}
                  aria-expanded={isExpanded}
                >
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-[var(--color-text-primary)] truncate">
                      {job.company || 'Unknown company'}
                    </p>
                    <p className="text-xs text-[var(--color-text-secondary)] truncate">
                      {job.role}{hasDates ? ` · ${formatDateRange(startDate, endDate)}` : ''}
                    </p>
                  </div>
                  <ChevronRight
                    size={14}
                    className={`text-[var(--color-text-tertiary)] shrink-0 mt-1 transition-transform ${isExpanded ? 'rotate-90' : ''}`}
                  />
                </button>

                {isExpanded && (
                  <div className="mt-2 flex flex-col gap-1.5 pl-0.5">
                    {job.industry && (
                      <p className="text-xs text-[var(--color-text-secondary)]">{job.industry}</p>
                    )}
                    {job.description && (
                      <p className="text-xs text-[var(--color-text-tertiary)]">{job.description}</p>
                    )}
                  </div>
                )}
              </div>
            </li>
          )
        })}
      </ul>

      {hiddenCount > 0 && !showAll && (
        <button
          onClick={() => setShowAll(true)}
          className="w-full text-center text-sm text-[var(--color-interactive)] hover:underline py-2 mt-1"
        >
          Show {hiddenCount} more
        </button>
      )}
      {showAll && entries.length > COLLAPSED_COUNT && (
        <button
          onClick={() => setShowAll(false)}
          className="w-full flex items-center justify-center gap-1 text-sm text-[var(--color-text-secondary)] hover:underline py-2 mt-1"
        >
          Show less <ChevronDown size={14} className="rotate-180" />
        </button>
      )}
    </>
  )
}

'use client'

import { useState } from 'react'
import Link from 'next/link'

interface Attachment {
  id: string
  role_label: string
  started_at: string
  ended_at: string | null
  yachts: {
    id: string
    name: string
    yacht_type: string | null
    flag_state: string | null
  } | null
}

interface YachtsSectionProps {
  attachments: Attachment[]
}

function formatDateRange(start: string, end: string | null): string {
  const s = new Date(start)
  const startStr = s.toLocaleDateString('en-GB', { month: 'short', year: 'numeric' })
  if (!end) return `${startStr} – Present`
  const e = new Date(end)
  const endStr = e.toLocaleDateString('en-GB', { month: 'short', year: 'numeric' })
  return `${startStr} – ${endStr}`
}

export function YachtsSection({ attachments }: YachtsSectionProps) {
  const [expanded, setExpanded] = useState<string | null>(null)

  // Sort reverse chronological (current first, then by start date)
  const sorted = [...attachments].sort((a, b) => {
    if (!a.ended_at && b.ended_at) return -1
    if (a.ended_at && !b.ended_at) return 1
    return new Date(b.started_at).getTime() - new Date(a.started_at).getTime()
  })

  return (
    <div className="bg-[var(--card)] rounded-2xl p-5">
      <div className="flex items-center justify-between mb-3">
        <h2 className="font-semibold text-[var(--foreground)]">Yachts</h2>
        <Link
          href="/app/attachment/new"
          className="text-sm text-[var(--ocean-500)] hover:underline"
        >
          Add
        </Link>
      </div>

      {sorted.length === 0 ? (
        <p className="text-sm text-[var(--muted-foreground)]">
          Add your first yacht to start building your work history.
        </p>
      ) : (
        <ul className="flex flex-col divide-y divide-[var(--border)]">
          {sorted.map((att) => {
            const isExpanded = expanded === att.id
            const yacht = att.yachts

            return (
              <li key={att.id} className="py-3">
                <button
                  className="w-full flex items-start justify-between gap-2 text-left"
                  onClick={() => setExpanded(isExpanded ? null : att.id)}
                  aria-expanded={isExpanded}
                >
                  <div className="min-w-0">
                    <p className="font-medium text-sm text-[var(--foreground)] truncate">
                      {yacht?.name ?? 'Unknown yacht'}
                    </p>
                    <p className="text-xs text-[var(--muted-foreground)] truncate">
                      {att.role_label} · {formatDateRange(att.started_at, att.ended_at)}
                    </p>
                    {yacht?.yacht_type && (
                      <p className="text-xs text-[var(--muted-foreground)]">
                        {yacht.yacht_type}
                        {yacht.flag_state ? ` · ${yacht.flag_state}` : ''}
                      </p>
                    )}
                  </div>
                  <span
                    className={`text-[var(--muted-foreground)] transition-transform shrink-0 mt-0.5 ${isExpanded ? 'rotate-90' : ''}`}
                  >
                    ›
                  </span>
                </button>

                {isExpanded && (
                  <div className="mt-3 flex flex-col gap-2 pl-1">
                    {yacht && (
                      <Link
                        href={`/app/yacht/${yacht.id}`}
                        className="text-sm text-[var(--ocean-500)] hover:underline"
                      >
                        View yacht page →
                      </Link>
                    )}
                    <Link
                      href={`/app/endorsement/request?yacht_id=${yacht?.id}`}
                      className="text-sm text-[var(--ocean-500)] hover:underline"
                    >
                      Request endorsements from this yacht →
                    </Link>
                    <Link
                      href={`/app/attachment/${att.id}/edit`}
                      className="text-sm text-[var(--muted-foreground)] hover:underline"
                    >
                      Edit attachment
                    </Link>
                  </div>
                )}
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}

'use client'

import Link from 'next/link'
import { Anchor } from 'lucide-react'
import type { PublicAttachment } from '@/lib/queries/types'

interface ExperienceTileProps {
  attachments: PublicAttachment[]
  handle: string
  maxShow?: number
}

function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return ''
  return new Date(dateStr).toLocaleDateString('en-GB', { month: 'short', year: 'numeric' })
}

export function ExperienceTile({ attachments, handle, maxShow = 3 }: ExperienceTileProps) {
  const shown = attachments.slice(0, maxShow)
  const remaining = attachments.length - shown.length

  return (
    <div className="h-full rounded-xl bg-white/80 p-5 flex flex-col">
      <div className="flex items-center gap-2 mb-3">
        <Anchor size={14} className="text-blue-500" />
        <span className="text-xs font-semibold uppercase tracking-wide text-[var(--color-text-tertiary)]">Experience</span>
      </div>
      <div className="flex flex-col gap-2.5 flex-1">
        {shown.map((att) => (
          <div key={att.id} className="flex gap-2.5">
            <div className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-[var(--accent-500,#14b8a6)]" />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-[var(--color-text-primary)] truncate">
                {att.yachts?.name ?? 'Unknown Yacht'}
                {att.role_label && <span className="font-normal text-[var(--color-text-secondary)]"> — {att.role_label}</span>}
              </p>
              {(att.started_at || att.ended_at) && (
                <p className="text-xs text-[var(--color-text-secondary)]">
                  {formatDate(att.started_at)}{att.started_at && ' – '}{att.ended_at ? formatDate(att.ended_at) : 'Present'}
                </p>
              )}
            </div>
          </div>
        ))}
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

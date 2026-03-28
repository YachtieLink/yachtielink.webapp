'use client'

import Link from 'next/link'
import { MessageSquareQuote } from 'lucide-react'
import type { PublicEndorsement } from '@/lib/queries/types'

interface EndorsementsTileProps {
  endorsements: PublicEndorsement[]
  handle: string
}

export function EndorsementsTile({ endorsements, handle }: EndorsementsTileProps) {
  const top = endorsements[0]
  if (!top) return null

  const remaining = endorsements.length - 1

  return (
    <div className="h-full rounded-xl bg-white/80 p-5 flex flex-col">
      <div className="flex items-center gap-2 mb-3">
        <MessageSquareQuote size={14} className="text-rose-500" />
        <span className="text-xs font-semibold uppercase tracking-wide text-[var(--color-text-tertiary)]">Endorsements</span>
      </div>
      <div className="flex-1">
        <p className="text-sm text-[var(--color-text-primary)] italic line-clamp-3">
          &ldquo;{top.content}&rdquo;
        </p>
        <p className="text-xs text-[var(--color-text-secondary)] mt-1.5">
          — {top.endorser?.display_name || top.endorser?.full_name || 'Anonymous'}
        </p>
      </div>
      {remaining > 0 && (
        <Link
          href={`/u/${handle}/endorsements`}
          className="mt-2 text-xs font-medium text-[var(--accent-500,#14b8a6)] hover:underline"
        >
          +{remaining} more &rarr;
        </Link>
      )}
    </div>
  )
}

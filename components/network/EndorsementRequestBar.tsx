'use client'

import Link from 'next/link'
import { StickyBottomBar } from '@/components/ui/StickyBottomBar'

interface EndorsementRequestBarProps {
  endorsementCount: number
  colleagueCount: number
}

/**
 * Sticky endorsement request bar for the Network tab.
 * Shows when endorsements < 5 AND colleagues >= 1.
 * Progress indicator + "Request one" CTA in thumb zone.
 */
export function EndorsementRequestBar({ endorsementCount, colleagueCount }: EndorsementRequestBarProps) {
  const visible = endorsementCount < 5 && colleagueCount >= 1
  const progress = Math.min(endorsementCount / 5, 1)

  return (
    <StickyBottomBar visible={visible}>
      <div className="flex items-center gap-3">
        {/* Progress bar */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-medium text-[var(--color-text-primary)]">
              {endorsementCount}/5 endorsements
            </span>
          </div>
          <div className="h-1.5 rounded-full bg-[var(--color-navy-100)] overflow-hidden">
            <div
              className="h-full rounded-full bg-[var(--color-navy-500)] transition-all duration-500"
              style={{ width: `${progress * 100}%` }}
            />
          </div>
        </div>

        {/* CTA */}
        <Link
          href="/app/endorsement/request"
          className="shrink-0 px-3 py-1.5 text-xs font-medium rounded-lg bg-[var(--color-interactive)] text-white hover:opacity-90 transition-opacity"
        >
          Request one
        </Link>
      </div>
    </StickyBottomBar>
  )
}

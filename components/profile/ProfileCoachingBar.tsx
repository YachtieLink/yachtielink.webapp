'use client'

import Link from 'next/link'
import { StickyBottomBar } from '@/components/ui/StickyBottomBar'

interface ProfileCoachingBarProps {
  score: number
  nextPrompt: string
  ctaLabel?: string
  ctaHref?: string
}

/**
 * Sticky coaching bar for the Profile tab.
 * Shows when Profile Strength < 80%.
 * Compact: small ring + next action + CTA button.
 */
export function ProfileCoachingBar({ score, nextPrompt, ctaLabel, ctaHref }: ProfileCoachingBarProps) {
  const visible = score < 80

  const circumference = 2 * Math.PI * 12 // r=12 (small ring)
  const dash = (score / 100) * circumference
  const arcColor = score <= 30
    ? 'var(--color-strength-low)'
    : score <= 60
    ? 'var(--color-strength-mid)'
    : 'var(--color-strength-high)'

  return (
    <StickyBottomBar visible={visible}>
      <div className="flex items-center gap-3">
        {/* Mini strength ring */}
        <svg width="32" height="32" viewBox="0 0 32 32" className="shrink-0" role="img" aria-label={`Profile strength: ${score}%`}>
          <circle cx="16" cy="16" r="12" fill="none" stroke="var(--color-border)" strokeWidth="3" />
          <circle
            cx="16" cy="16" r="12"
            fill="none" stroke={arcColor} strokeWidth="3"
            strokeDasharray={`${dash} ${circumference}`}
            strokeLinecap="round"
            transform="rotate(-90 16 16)"
          />
          <text x="16" y="19" textAnchor="middle" fontSize="8" fontWeight="700" fill="var(--color-text-primary)">
            {score}%
          </text>
        </svg>

        {/* Next action text */}
        <p className="flex-1 text-sm text-[var(--color-text-primary)] leading-tight min-w-0 truncate">
          {nextPrompt}
        </p>

        {/* CTA button */}
        {ctaHref && (
          <Link
            href={ctaHref}
            className="shrink-0 px-3 py-1.5 text-xs font-medium rounded-lg bg-[var(--color-interactive)] text-white hover:opacity-90 transition-opacity"
          >
            {ctaLabel ?? 'Do it'}
          </Link>
        )}
      </div>
    </StickyBottomBar>
  )
}

'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'

// ─── Types ────────────────────────────────────────────────────────────────────

interface EndorsementBannerProps {
  endorsementCount: number
  mostRecentEndorsementDate: string | null
}

// ─── localStorage keys ────────────────────────────────────────────────────────

const KEY_COLLAPSED = 'yl-endorsement-banner-collapsed'
const KEY_COLLAPSED_AT = 'yl-endorsement-banner-collapsed-at'
const KEY_CELEBRATED = 'yl-endorsement-5-celebrated'

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getTierLabel(count: number): string {
  if (count >= 20) return 'Outstanding'
  if (count >= 10) return 'Great'
  return 'Good'
}

function getTierColors(count: number): string {
  if (count >= 20) return 'bg-amber-500/10 text-amber-600 dark:text-amber-400'
  if (count >= 10) return 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
  return 'bg-[var(--color-interactive)]/10 text-[var(--color-interactive)]'
}

function isEndorsementStale(mostRecentEndorsementDate: string | null): boolean {
  if (!mostRecentEndorsementDate) return true
  const endorsementDate = new Date(mostRecentEndorsementDate)
  const monthsSince = (Date.now() - endorsementDate.getTime()) / (1000 * 60 * 60 * 24 * 30)
  return monthsSince >= 12
}

function shouldExpand(collapsed: boolean, collapsedAt: string | null): boolean {
  if (!collapsed) return true
  if (!collapsedAt) return true
  const daysSince = (Date.now() - new Date(collapsedAt).getTime()) / (1000 * 60 * 60 * 24)
  return daysSince >= 7
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function EndorsementBanner({ endorsementCount, mostRecentEndorsementDate }: EndorsementBannerProps) {
  // Hydration-safe: start with null, set on mount
  const [mounted, setMounted] = useState(false)
  const [isExpanded, setIsExpanded] = useState(false)
  const [showCelebration, setShowCelebration] = useState(false)

  const isPhase1 = endorsementCount < 5
  const isPhase2 = endorsementCount >= 5
  const stale = isEndorsementStale(mostRecentEndorsementDate)
  const isPhase3 = isPhase2 && stale

  // Determine initial expanded state from localStorage (only on mount)
  useEffect(() => {
    setMounted(true)

    const collapsed = localStorage.getItem(KEY_COLLAPSED) === 'true'
    const collapsedAt = localStorage.getItem(KEY_COLLAPSED_AT)

    if (isPhase2 && !isPhase3) {
      // Phase 2 without staleness: always collapsed tier badge
      setIsExpanded(false)
      return
    }

    // Phase 1 or Phase 3: check 7-day re-expand
    setIsExpanded(shouldExpand(collapsed, collapsedAt))

    // Celebration at count === 5 on first load
    if (endorsementCount === 5) {
      const celebrated = localStorage.getItem(KEY_CELEBRATED) === 'true'
      if (!celebrated) {
        setShowCelebration(true)
        localStorage.setItem(KEY_CELEBRATED, 'true')
        setTimeout(() => setShowCelebration(false), 3000)
      }
    }
  }, [endorsementCount, isPhase2, isPhase3])

  function handleCollapse() {
    setIsExpanded(false)
    localStorage.setItem(KEY_COLLAPSED, 'true')
    localStorage.setItem(KEY_COLLAPSED_AT, new Date().toISOString())
  }

  // Don't render until mounted (prevents localStorage mismatch on SSR)
  if (!mounted) return null

  // ─── Phase 2: Tier badge only ─────────────────────────────────────────────

  if (isPhase2 && !isPhase3) {
    return (
      <div className="card-soft rounded-2xl px-4 py-3 mb-6 flex items-center justify-between">
        <p className="text-sm text-[var(--color-text-secondary)]">Endorsements</p>
        <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${getTierColors(endorsementCount)}`}>
          {getTierLabel(endorsementCount)}
        </span>
      </div>
    )
  }

  // ─── Celebration toast ────────────────────────────────────────────────────

  const celebrationEl = showCelebration ? (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      className="fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-[var(--color-surface)] border border-[var(--color-border)] shadow-lg rounded-2xl px-5 py-3 text-sm font-medium text-[var(--color-text-primary)] whitespace-nowrap pointer-events-none"
    >
      You&apos;ve hit 5 endorsements
    </motion.div>
  ) : null

  // ─── Phase 1 / Phase 3: Collapsible banner ────────────────────────────────

  const progressCount = Math.min(endorsementCount, 5)
  const progressPct = (progressCount / 5) * 100

  const copy = isPhase3
    ? "You've got great endorsements — consider getting a recent one"
    : "Yachties with 5+ endorsements get significantly more responses"

  return (
    <>
      <AnimatePresence>{showCelebration && celebrationEl}</AnimatePresence>

      <div className="card-soft rounded-2xl mb-6 overflow-hidden">
        {/* Collapsed state */}
        <AnimatePresence initial={false}>
          {!isExpanded && (
            <motion.button
              key="collapsed"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              onClick={() => setIsExpanded(true)}
              className="w-full px-4 py-3 flex items-center justify-between text-left"
            >
              <div className="flex items-center gap-3 flex-1 min-w-0">
                {isPhase3 ? (
                  <span className={`text-xs font-semibold px-2.5 py-1 rounded-full shrink-0 ${getTierColors(endorsementCount)}`}>
                    {getTierLabel(endorsementCount)}
                  </span>
                ) : (
                  <span className="text-sm text-[var(--color-text-secondary)]">
                    {progressCount}/5 endorsements
                  </span>
                )}
                {!isPhase3 && (
                  <div className="flex-1 h-1 rounded-full bg-[var(--color-surface-raised)] overflow-hidden">
                    <div
                      className="h-full rounded-full bg-[var(--color-interactive)] transition-all"
                      style={{ width: `${progressPct}%` }}
                    />
                  </div>
                )}
              </div>
              <svg className="h-4 w-4 text-[var(--color-text-tertiary)] shrink-0 ml-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="m19 9-7 7-7-7" />
              </svg>
            </motion.button>
          )}
        </AnimatePresence>

        {/* Expanded state */}
        <AnimatePresence initial={false}>
          {isExpanded && (
            <motion.div
              key="expanded"
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2, ease: 'easeInOut' }}
              className="overflow-hidden"
            >
              <Link
                href="/app/endorsement/request"
                className="block px-4 pt-4 pb-3 hover:bg-[var(--color-surface-raised)] transition-colors"
              >
                <div className="flex items-start justify-between gap-3 mb-2">
                  <p className="text-sm font-semibold text-[var(--color-text-primary)]">
                    Request endorsements
                  </p>
                  <svg className="h-4 w-4 text-[var(--color-text-tertiary)] shrink-0 mt-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
                  </svg>
                </div>
                <p className="text-xs text-[var(--color-text-secondary)]">{copy}</p>
                {isPhase1 && (
                  <div className="mt-3">
                    <div className="w-full h-1.5 rounded-full bg-[var(--color-surface-raised)] overflow-hidden">
                      <div
                        className="h-full rounded-full bg-[var(--color-interactive)] transition-all"
                        style={{ width: `${progressPct}%` }}
                      />
                    </div>
                    <p className="text-xs text-[var(--color-text-tertiary)] mt-1">{progressCount}/5 endorsements</p>
                  </div>
                )}
              </Link>
              <div className="px-4 pb-3">
                <button
                  onClick={handleCollapse}
                  className="text-xs text-[var(--color-text-tertiary)] hover:text-[var(--color-text-secondary)] transition-colors"
                >
                  Dismiss
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </>
  )
}

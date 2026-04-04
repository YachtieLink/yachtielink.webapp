'use client'

import { useState, useEffect } from 'react'
import { X } from 'lucide-react'
import { AnimatePresence, motion } from 'framer-motion'
import { springSnappy } from '@/lib/motion'
import type { SectionColor } from '@/lib/section-colors'
import { getSectionTokens } from '@/lib/section-colors'

interface FirstVisitCardProps {
  storageKey: string
  accentColor: SectionColor
  icon: React.ReactNode
  title: string
  description: string
}

/**
 * Dismissible education card that shows once per tab for first-time visitors.
 * Stores dismissal state in localStorage.
 */
export function FirstVisitCard({ storageKey, accentColor, icon, title, description }: FirstVisitCardProps) {
  const [visible, setVisible] = useState(false)
  const tokens = getSectionTokens(accentColor)

  useEffect(() => {
    const dismissed = localStorage.getItem(storageKey)
    if (!dismissed) setVisible(true)
  }, [storageKey])

  function dismiss() {
    localStorage.setItem(storageKey, 'dismissed')
    setVisible(false)
  }

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          transition={springSnappy}
          className="overflow-hidden"
        >
          <div
            className="rounded-2xl border p-4 flex items-start gap-3"
            style={{
              backgroundColor: tokens.bg50,
              borderColor: tokens.bg200,
            }}
          >
            <span className="text-lg shrink-0 mt-0.5">{icon}</span>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-[var(--color-text-primary)] mb-0.5">{title}</p>
              <p className="text-xs text-[var(--color-text-secondary)] leading-relaxed">{description}</p>
            </div>
            <button
              type="button"
              onClick={dismiss}
              className="shrink-0 p-1 rounded-lg text-[var(--color-text-tertiary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-surface-raised)] transition-colors"
              aria-label="Dismiss"
            >
              <X size={14} />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

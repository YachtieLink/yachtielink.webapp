'use client'

import { useState, useEffect } from 'react'
import { X, RefreshCw } from 'lucide-react'
import { AnimatePresence, motion } from 'framer-motion'
import { springSnappy } from '@/lib/motion'

interface CvFreshnessNudgeProps {
  /** ISO date when profile was last updated */
  profileUpdatedAt: string | null
  /** ISO date when PDF was last generated */
  pdfGeneratedAt: string | null
}

const STORAGE_KEY = 'yl-cv-freshness-dismissed'

export function CvFreshnessNudge({ profileUpdatedAt, pdfGeneratedAt }: CvFreshnessNudgeProps) {
  const [visible, setVisible] = useState(false)
  const [changeDate, setChangeDate] = useState('')

  useEffect(() => {
    if (!profileUpdatedAt || !pdfGeneratedAt) return

    const profileDate = new Date(profileUpdatedAt)
    const pdfDate = new Date(pdfGeneratedAt)

    // Only show if profile changed after CV was generated
    if (profileDate <= pdfDate) return

    // Only show if it's been 7+ days since the profile change
    const daysSinceChange = (Date.now() - profileDate.getTime()) / (1000 * 60 * 60 * 24)
    if (daysSinceChange < 7) return

    // Check if dismissed for this specific profile update
    const dismissed = localStorage.getItem(STORAGE_KEY)
    if (dismissed === profileUpdatedAt) return

    setChangeDate(profileDate.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }))
    setVisible(true)
  }, [profileUpdatedAt, pdfGeneratedAt])

  function dismiss() {
    if (profileUpdatedAt) localStorage.setItem(STORAGE_KEY, profileUpdatedAt)
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
          <div className="rounded-2xl border border-[var(--color-amber-200)] bg-[var(--color-amber-50)] p-4 flex items-start gap-3">
            <RefreshCw size={16} className="text-[var(--color-amber-500)] shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <p className="text-sm text-[var(--color-text-primary)]">
                Your profile changed on {changeDate}. Regenerate your CV to include updates.
              </p>
            </div>
            <button
              onClick={dismiss}
              className="shrink-0 text-[var(--color-text-tertiary)] hover:text-[var(--color-text-secondary)] transition-colors p-0.5"
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

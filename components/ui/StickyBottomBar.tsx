'use client'

import { AnimatePresence, motion } from 'framer-motion'
import { springSnappy } from '@/lib/motion'

interface StickyBottomBarProps {
  children: React.ReactNode
  visible: boolean
  className?: string
}

/**
 * Shared sticky bar that sits above the tab bar (z-30).
 * Used for Profile coaching, CV actions, Network endorsement progress.
 *
 * Positioning: fixed above tab bar with safe-area handling.
 * Desktop: centered with capped width matching BottomSheet pattern.
 * Animation: spring slide-up/down via AnimatePresence.
 */
export function StickyBottomBar({ children, visible, className = '' }: StickyBottomBarProps) {
  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ y: '100%', opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: '100%', opacity: 0 }}
          transition={springSnappy}
          className={`fixed bottom-[calc(5rem+env(safe-area-inset-bottom))] left-0 right-0 z-30 px-4 md:left-[calc(50%-248px)] md:right-auto md:w-[560px] md:px-0 ${className}`}
        >
          <div className="rounded-2xl bg-[var(--color-surface)] shadow-lg border border-[var(--color-border)] p-3">
            {children}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

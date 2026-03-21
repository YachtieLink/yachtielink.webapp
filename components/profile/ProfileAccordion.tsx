'use client'

import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { ChevronRight } from 'lucide-react'
import { easeGentle } from '@/lib/motion'
import Link from 'next/link'

interface ProfileAccordionProps {
  title: string
  summary: string
  children: React.ReactNode
  /** If provided, renders an edit link in the header (own-profile view) */
  editHref?: string
  /** If true, starts expanded */
  defaultOpen?: boolean
  /** If true, section is completely hidden (empty + not visible) */
  hidden?: boolean
}

export function ProfileAccordion({
  title,
  summary,
  children,
  editHref,
  defaultOpen = false,
  hidden = false,
}: ProfileAccordionProps) {
  const [open, setOpen] = useState(defaultOpen)

  if (hidden) return null

  return (
    <div className="bg-[var(--color-surface)] rounded-2xl shadow-sm overflow-hidden border border-[var(--color-border-subtle)]">
      <button
        className="w-full text-left p-4 flex items-start gap-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-interactive)] active:scale-[0.99] transition-transform"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
      >
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-base font-semibold text-[var(--color-text-primary)]">{title}</span>
            {editHref && (
              <Link
                href={editHref}
                onClick={(e) => e.stopPropagation()}
                className="text-[10px] text-[var(--color-interactive)] hover:underline font-medium px-2 py-0.5 rounded-full bg-[var(--color-interactive)]/10"
              >
                Edit
              </Link>
            )}
          </div>
          <p className="text-sm text-[var(--color-text-secondary)] truncate mt-0.5">{summary}</p>
        </div>
        <motion.span
          animate={{ rotate: open ? 90 : 0 }}
          transition={easeGentle}
          className="shrink-0 text-[var(--color-text-secondary)] mt-0.5"
          aria-hidden
        >
          <ChevronRight size={18} />
        </motion.span>
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            key="content"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={easeGentle}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 pt-3 border-t border-[var(--color-border)]">
              {children}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

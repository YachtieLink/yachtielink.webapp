'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { easeGentle } from '@/lib/motion'

interface YachtAccordionProps {
  yachtId: string
  yachtName: string
  yachtType: string | null
  lengthMeters: number | null
  yachtPhotoUrl?: string | null
  userRole: string
  startDate: string
  endDate: string | null
  colleagueCount: number
  defaultExpanded?: boolean
  children: React.ReactNode
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-GB', { month: 'short', year: 'numeric' })
}

export function YachtAccordion({
  yachtId,
  yachtName,
  yachtType,
  lengthMeters,
  yachtPhotoUrl,
  userRole,
  startDate,
  endDate,
  colleagueCount,
  defaultExpanded = false,
  children,
}: YachtAccordionProps) {
  const [expanded, setExpanded] = useState(defaultExpanded)

  const datePeriod = `${formatDate(startDate)}–${endDate ? formatDate(endDate) : 'Present'}`
  const meta = [yachtType, lengthMeters ? `${lengthMeters}m` : null].filter(Boolean).join(' · ')

  return (
    <div className="card-soft rounded-2xl overflow-hidden">
      {/* Accordion header — rich yacht mini card */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full text-left px-4 py-3 flex items-center gap-3 hover:bg-[var(--color-surface-raised)]/30 transition-colors min-h-[56px]"
      >
        {/* Yacht photo or fallback */}
        <div className="w-14 h-14 rounded-xl bg-[var(--color-navy-100)] overflow-hidden shrink-0 flex items-center justify-center">
          {yachtPhotoUrl ? (
            <Image
              src={yachtPhotoUrl}
              alt={yachtName}
              width={56}
              height={56}
              className="object-cover w-full h-full"
            />
          ) : (
            <span className="text-xl text-[var(--color-navy-700)]">⚓</span>
          )}
        </div>

        {/* Yacht details */}
        <div className="min-w-0 flex-1">
          <Link
            href={`/app/yacht/${yachtId}`}
            onClick={(e) => e.stopPropagation()}
            className="text-base font-semibold text-[var(--color-text-primary)] truncate block hover:underline"
          >
            {yachtName}
          </Link>
          {meta && (
            <p className="text-sm text-[var(--color-text-secondary)] truncate">{meta}</p>
          )}
          <p className="text-sm text-[var(--color-text-secondary)] truncate">
            {userRole} · {datePeriod}
          </p>
          <p className="text-xs text-[var(--color-text-tertiary)]">
            {colleagueCount} colleague{colleagueCount !== 1 ? 's' : ''}
          </p>
        </div>

        {/* Chevron */}
        <motion.span
          animate={{ rotate: expanded ? 180 : 0 }}
          transition={easeGentle}
          className="text-[var(--color-text-secondary)] text-sm shrink-0"
        >
          ▾
        </motion.span>
      </button>

      {/* Accordion content */}
      <AnimatePresence initial={false}>
        {expanded && (
          <motion.div
            initial={{ height: 0 }}
            animate={{ height: 'auto' }}
            exit={{ height: 0 }}
            transition={easeGentle}
            className="overflow-hidden"
          >
            <div className="px-4 pb-3 border-t border-[var(--color-border)]">
              {children}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

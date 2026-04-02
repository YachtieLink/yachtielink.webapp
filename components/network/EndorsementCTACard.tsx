'use client'

import { useState } from 'react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { easeGentle } from '@/lib/motion'
import { Button } from '@/components/ui/Button'

interface EndorsementCTACardProps {
  endorsementCount: number
  maxEndorsements?: number
}

function getDynamicCopy(count: number): string {
  if (count === 0) return 'You have no endorsements yet'
  if (count === 1) return 'You have 1 endorsement'
  return `You have ${count} endorsements`
}

export function EndorsementCTACard({
  endorsementCount,
  maxEndorsements = 5,
}: EndorsementCTACardProps) {
  const [expanded, setExpanded] = useState(false)

  return (
    <div className="card-soft rounded-2xl p-4">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full text-left flex items-center justify-between"
      >
        <div className="flex items-center gap-3">
          <span className="text-xs font-semibold uppercase tracking-wide text-[var(--color-text-secondary)]">
            Endorsements
          </span>
          <span className="text-sm font-bold text-[var(--color-navy-700)]">
            {endorsementCount}/{maxEndorsements}
          </span>
        </div>
        <motion.span
          animate={{ rotate: expanded ? 180 : 0 }}
          transition={easeGentle}
          className="text-[var(--color-text-secondary)] text-sm"
        >
          ▾
        </motion.span>
      </button>

      <p className="text-sm text-[var(--color-text-secondary)] mt-1">
        {getDynamicCopy(endorsementCount)}
      </p>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={easeGentle}
            className="overflow-hidden"
          >
            <p className="text-xs text-[var(--color-text-secondary)] mt-2">
              Profiles with 5+ endorsements get 3x more attention from captains and agents
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      <Link href="/app/endorsement/request" className="mt-3 inline-block">
        <Button variant="outline" size="sm">
          Request endorsement
        </Button>
      </Link>
    </div>
  )
}

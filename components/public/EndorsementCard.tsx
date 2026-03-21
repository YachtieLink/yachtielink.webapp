'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { cardHover } from '@/lib/motion'
import { ProfileAvatar } from '@/components/ui/ProfileAvatar'

interface EndorsementCardProps {
  endorserName: string
  endorserRole?: string | null
  endorserPhoto?: string | null
  yachtName?: string | null
  date: string
  content: string
}

const TRUNCATE_LENGTH = 150

export function EndorsementCard({
  endorserName,
  endorserRole,
  endorserPhoto,
  yachtName,
  date,
  content,
}: EndorsementCardProps) {
  const [expanded, setExpanded] = useState(false)
  const needsTruncation = content.length > TRUNCATE_LENGTH

  const displayText = needsTruncation && !expanded
    ? content.slice(0, TRUNCATE_LENGTH) + '…'
    : content

  const formattedDate = new Date(date).toLocaleDateString('en-GB', {
    month: 'short',
    year: 'numeric',
  })

  return (
    <motion.div {...cardHover} className="rounded-2xl border border-[var(--color-border)] border-l-4 border-l-[var(--color-coral-500)] bg-[var(--color-surface)] p-4">
      {/* Endorser info */}
      <div className="flex items-center gap-3 mb-3">
        <ProfileAvatar name={endorserName} src={endorserPhoto} size="md" />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-[var(--color-text-primary)] truncate">
            {endorserName}
          </p>
          {endorserRole && (
            <p className="text-xs text-[var(--color-text-secondary)] truncate">
              {endorserRole}
            </p>
          )}
          <p className="text-xs text-[var(--color-text-tertiary)]">
            {yachtName && <>{yachtName} · </>}
            {formattedDate}
          </p>
        </div>
      </div>

      {/* Content */}
      <p className="text-sm text-[var(--color-text-primary)] leading-relaxed whitespace-pre-line">
        &ldquo;{displayText}&rdquo;
      </p>

      {needsTruncation && (
        <button
          onClick={() => setExpanded(!expanded)}
          className="mt-2 text-xs font-medium text-[var(--color-interactive)] hover:text-[var(--color-interactive-hover)]"
        >
          {expanded ? 'Show less' : 'Read more'}
        </button>
      )}
    </motion.div>
  )
}

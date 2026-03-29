'use client'

import { useState } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { Pin } from 'lucide-react'
import { cardHover } from '@/lib/motion'
import { ProfileAvatar } from '@/components/ui/ProfileAvatar'

interface EndorsementCardProps {
  endorserName: string
  endorserRole?: string | null
  endorserPhoto?: string | null
  endorserHandle?: string | null
  yachtName?: string | null
  yachtId?: string | null
  date: string
  content: string
  isPinned?: boolean
  onPin?: (isPinned: boolean) => void
  /** When provided, navigation to endorser/yacht profiles goes through a confirmation callback instead of direct links */
  onNavigate?: (url: string, label: string) => void
}

const TRUNCATE_LENGTH = 150

export function EndorsementCard({
  endorserName,
  endorserRole,
  endorserPhoto,
  endorserHandle,
  yachtName,
  yachtId,
  date,
  content,
  isPinned,
  onPin,
  onNavigate,
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
    <motion.div {...cardHover} className={`rounded-2xl border bg-[var(--color-surface)] p-4 ${isPinned ? 'border-[var(--accent-500,var(--color-interactive))]/30' : 'border-[var(--color-border)]'}`}>
      {/* Pin indicator + button */}
      {(isPinned || onPin) && (
        <div className="flex items-center justify-between mb-2">
          {isPinned && (
            <span className="text-[10px] font-semibold uppercase tracking-wide text-[var(--accent-500,var(--color-interactive))] flex items-center gap-1">
              <Pin size={10} /> Pinned
            </span>
          )}
          {onPin && (
            <button
              onClick={() => onPin(!isPinned)}
              className={`text-xs font-medium flex items-center gap-1 transition-colors ml-auto ${isPinned ? 'text-[var(--color-text-secondary)] hover:text-[var(--color-error)]' : 'text-[var(--color-text-tertiary)] hover:text-[var(--accent-500,var(--color-interactive))]'}`}
            >
              <Pin size={12} /> {isPinned ? 'Unpin' : 'Pin'}
            </button>
          )}
        </div>
      )}

      {/* Endorser info */}
      <div className="flex items-center gap-3 mb-3">
        {endorserHandle ? (
          onNavigate ? (
            <button onClick={() => onNavigate(`/u/${endorserHandle}`, endorserName)}>
              <ProfileAvatar name={endorserName} src={endorserPhoto} size="md" />
            </button>
          ) : (
            <Link href={`/u/${endorserHandle}`}>
              <ProfileAvatar name={endorserName} src={endorserPhoto} size="md" />
            </Link>
          )
        ) : (
          <ProfileAvatar name={endorserName} src={endorserPhoto} size="md" />
        )}
        <div className="min-w-0 flex-1">
          {endorserHandle ? (
            onNavigate ? (
              <button onClick={() => onNavigate(`/u/${endorserHandle}`, endorserName)} className="text-sm font-medium text-[var(--color-text-primary)] hover:text-[var(--accent-500,#0f9b8e)] truncate block text-left transition-colors">
                {endorserName}
              </button>
            ) : (
              <Link href={`/u/${endorserHandle}`} className="text-sm font-medium text-[var(--color-text-primary)] hover:text-[var(--color-interactive)] truncate block">
                {endorserName}
              </Link>
            )
          ) : (
            <p className="text-sm font-medium text-[var(--color-text-primary)] truncate">
              {endorserName}
            </p>
          )}
          {endorserRole && (
            <p className="text-xs text-[var(--color-text-secondary)] truncate">
              {endorserRole}
            </p>
          )}
          <p className="text-xs text-[var(--color-text-tertiary)]">
            {yachtName && (
              <>
                {yachtId && onNavigate ? (
                  <button onClick={() => onNavigate(`/app/yacht/${yachtId}`, yachtName)} className="hover:text-[var(--accent-500,#0f9b8e)] transition-colors">
                    {yachtName}
                  </button>
                ) : yachtName}
                {' · '}
              </>
            )}
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

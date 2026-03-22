'use client'

import Link from 'next/link'
import Image from 'next/image'

export interface CrewCardProps {
  name: string
  handle: string | null
  profilePhotoUrl: string | null
  roleLabel: string
  startDate: string
  endDate: string | null
  isCurrentUser: boolean
  otherSharedYachts: string[]
  endorsementRelation: 'endorsed_you' | 'you_endorsed' | 'mutual' | null
  /** Extensible slot for future actions (e.g. overflow menu, report button) */
  actions?: React.ReactNode
}

function EndorsementBadge({ relation }: { relation: CrewCardProps['endorsementRelation'] }) {
  if (!relation) return null

  const config = {
    mutual: { icon: '✅', text: 'Mutual endorsements', className: 'text-[var(--color-interactive)]' },
    endorsed_you: { icon: '✅', text: 'Endorsed you', className: 'text-[var(--color-interactive)]' },
    you_endorsed: { icon: '✅', text: 'You endorsed', className: 'text-[var(--color-interactive)]' },
  }[relation]

  return (
    <span className={`text-xs ${config.className}`}>
      {config.icon} {config.text}
    </span>
  )
}

export function CrewCard({
  name,
  handle,
  profilePhotoUrl,
  roleLabel,
  startDate,
  endDate,
  isCurrentUser,
  otherSharedYachts,
  endorsementRelation,
  actions,
}: CrewCardProps) {
  const start = new Date(startDate).toLocaleDateString('en-GB', { month: 'short', year: 'numeric' })
  const end = endDate
    ? new Date(endDate).toLocaleDateString('en-GB', { month: 'short', year: 'numeric' })
    : 'Present'

  const content = (
    <div className="py-3 flex items-start gap-3">
      {/* Avatar */}
      <div className="w-10 h-10 rounded-full bg-[var(--color-surface-raised)] overflow-hidden shrink-0">
        {profilePhotoUrl ? (
          <Image
            src={profilePhotoUrl}
            alt={name}
            width={40}
            height={40}
            className="object-cover w-full h-full"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-sm font-semibold text-[var(--color-text-secondary)]">
            {name[0]?.toUpperCase()}
          </div>
        )}
      </div>

      {/* Info */}
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5">
          <p className="text-sm font-medium text-[var(--color-text-primary)] truncate">
            {name}{isCurrentUser ? ' (you)' : ''}
          </p>
          {handle && !isCurrentUser && (
            <span className="text-[var(--color-text-tertiary)] text-xs shrink-0">→</span>
          )}
        </div>
        <p className="text-xs text-[var(--color-text-secondary)] truncate">
          {roleLabel} · {start}–{end}
        </p>

        {/* Badges */}
        <div className="flex flex-col gap-0.5 mt-1">
          {otherSharedYachts.length > 0 && (
            <span className="text-xs text-[var(--color-text-secondary)]">
              🤝 Also on {otherSharedYachts[0]}
              {otherSharedYachts.length > 1 && ` +${otherSharedYachts.length - 1} more`}
            </span>
          )}
          <EndorsementBadge relation={endorsementRelation} />
        </div>
      </div>

      {/* Actions slot */}
      {actions && <div className="shrink-0">{actions}</div>}
    </div>
  )

  if (handle && !isCurrentUser) {
    return (
      <Link
        href={`/u/${handle}`}
        className="block hover:bg-[var(--color-surface-raised)]/50 -mx-1 px-1 rounded-lg transition-colors"
        aria-label={`View ${name}'s profile`}
      >
        {content}
      </Link>
    )
  }

  return content
}

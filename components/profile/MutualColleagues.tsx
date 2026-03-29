'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import type { MutualColleague } from '@/lib/queries/types'

interface MutualColleaguesProps {
  profileFirstName: string
  mutuals: MutualColleague[]
}

export function MutualColleagues({ profileFirstName, mutuals }: MutualColleaguesProps) {
  const [expanded, setExpanded] = useState(false)

  if (mutuals.length === 0) return null

  return (
    <div className="px-5 py-3">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full text-left text-sm text-[var(--color-text-secondary)]"
        aria-expanded={expanded}
      >
        <span className="font-medium text-[var(--color-text-primary)]">
          {mutuals.length} of your colleagues
        </span>
        {' '}
        {mutuals.length === 1 ? 'has' : 'have'} worked with {profileFirstName}
        <span className="ml-1 text-[var(--color-text-tertiary)]">{expanded ? '▲' : '▼'}</span>
      </button>

      {expanded && (
        <div className="mt-2 flex flex-col gap-1">
          {mutuals.map(m => {
            const content = (
              <div className="flex items-center gap-2.5 py-2 -mx-2 px-2 rounded-lg transition-colors hover:bg-[var(--color-surface-raised)]/50">
                <div className="w-7 h-7 rounded-full bg-[var(--color-surface-raised)] overflow-hidden shrink-0">
                  {m.photoUrl ? (
                    <Image src={m.photoUrl} alt={m.name} width={28} height={28} className="object-cover w-full h-full" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-xs font-semibold text-[var(--color-text-secondary)]">
                      {m.name[0]?.toUpperCase()}
                    </div>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-[var(--color-text-primary)] truncate">{m.name}</p>
                  {m.throughYachtWithProfile && (
                    <p className="text-xs text-[var(--color-text-tertiary)] truncate">via {m.throughYachtWithProfile}</p>
                  )}
                </div>
                {m.handle && (
                  <span className="text-xs text-[var(--color-interactive)] shrink-0">View ▸</span>
                )}
              </div>
            )

            if (m.handle) {
              return (
                <Link key={m.id} href={`/u/${m.handle}`} aria-label={`View ${m.name}'s profile`}>
                  {content}
                </Link>
              )
            }
            return <div key={m.id}>{content}</div>
          })}
        </div>
      )}
    </div>
  )
}

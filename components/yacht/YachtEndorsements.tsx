'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'

interface EndorsementPerson {
  id: string
  display_name: string | null
  full_name: string
  profile_photo_url: string | null
  handle: string | null
}

export interface YachtEndorsementsProps {
  endorsements: Array<{
    id: string
    content: string
    created_at: string
    endorser: EndorsementPerson
    recipient: EndorsementPerson
  }>
  totalCount: number
}

function PersonLink({ person }: { person: EndorsementPerson }) {
  const name = person.display_name || person.full_name
  if (person.handle) {
    return (
      <Link href={`/u/${person.handle}`} className="font-medium text-[var(--color-interactive)] hover:underline">
        {name}
      </Link>
    )
  }
  return <span className="font-medium text-[var(--color-text-primary)]">{name}</span>
}

export function YachtEndorsements({ endorsements, totalCount }: YachtEndorsementsProps) {
  const [expanded, setExpanded] = useState(false)

  if (endorsements.length === 0) return null

  const visible = expanded ? endorsements : endorsements.slice(0, 3)
  const hasMore = endorsements.length > 3

  return (
    <div className="mt-6">
      <h2 className="font-semibold text-[var(--color-text-primary)] mb-3">
        Endorsements between crew on this yacht ({totalCount})
      </h2>
      <div className="bg-[var(--color-surface)] rounded-2xl divide-y divide-[var(--color-border)]">
        {visible.map((e) => {
          const endorserName = e.endorser.display_name || e.endorser.full_name
          const date = new Date(e.created_at).toLocaleDateString('en-GB', { month: 'short', year: 'numeric' })

          return (
            <div key={e.id} className="p-4">
              <div className="flex items-center gap-2 mb-1.5">
                <div className="w-7 h-7 rounded-full bg-[var(--color-surface-raised)] overflow-hidden shrink-0">
                  {e.endorser.profile_photo_url ? (
                    <Image
                      src={e.endorser.profile_photo_url}
                      alt={endorserName}
                      width={28}
                      height={28}
                      className="object-cover w-full h-full"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-xs font-semibold text-[var(--color-text-secondary)]">
                      {endorserName[0]?.toUpperCase()}
                    </div>
                  )}
                </div>
                <p className="text-sm text-[var(--color-text-secondary)]">
                  <PersonLink person={e.endorser} /> endorsed <PersonLink person={e.recipient} />
                </p>
              </div>
              <p className="text-sm text-[var(--color-text-primary)] line-clamp-2 ml-9">
                &ldquo;{e.content}&rdquo;
              </p>
              <p className="text-xs text-[var(--color-text-tertiary)] mt-1 ml-9">{date}</p>
            </div>
          )
        })}
      </div>

      {hasMore && (
        <button
          onClick={() => setExpanded(!expanded)}
          className="mt-2 w-full text-center text-sm text-[var(--color-interactive)] py-2 hover:underline"
          aria-expanded={expanded}
        >
          {expanded
            ? 'Show less'
            : totalCount > endorsements.length
              ? `Show ${endorsements.length} of ${totalCount} endorsements`
              : `Show all ${totalCount} endorsements`
          }
        </button>
      )}
    </div>
  )
}

'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import Image from 'next/image'

interface ColleagueInfo {
  id: string
  name: string
  handle: string | null
  photoUrl: string | null
  role: string | null
  theirRoleOnYacht: string | null
  sharedYachtCount: number
  endorsementStatus: 'mutual' | 'endorsed_you' | 'you_endorsed' | null
  canEndorse: boolean
}

interface YachtGroup {
  yacht: { id: string; name: string }
  colleagues: ColleagueInfo[]
}

export interface ColleagueExplorerProps {
  yachtGroups: YachtGroup[]
  totalColleagues: number
  totalYachts: number
  totalEndorsements: number
}

function EndorsementStatusBadge({ status }: { status: ColleagueInfo['endorsementStatus'] }) {
  if (!status) return <span className="text-xs text-[var(--color-text-tertiary)]">No endorsement yet</span>

  const config = {
    mutual: { text: 'Mutual endorsements', className: 'text-[var(--color-interactive)]' },
    endorsed_you: { text: 'Endorsed you', className: 'text-[var(--color-interactive)]' },
    you_endorsed: { text: 'You endorsed', className: 'text-[var(--color-interactive)]' },
  }[status]

  return <span className={`text-xs ${config.className}`}>✅ {config.text}</span>
}

export function ColleagueExplorer({ yachtGroups, totalColleagues, totalYachts, totalEndorsements }: ColleagueExplorerProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [expandedYachts, setExpandedYachts] = useState<Set<string>>(() => {
    // First group expanded by default
    const first = yachtGroups[0]?.yacht.id
    return first ? new Set([first]) : new Set()
  })

  const filteredGroups = useMemo(() => {
    if (!searchQuery.trim()) return yachtGroups
    const q = searchQuery.toLowerCase()
    return yachtGroups
      .map(group => ({
        ...group,
        colleagues: group.colleagues.filter(c => c.name.toLowerCase().includes(q)),
      }))
      .filter(group => group.colleagues.length > 0)
  }, [yachtGroups, searchQuery])

  function toggleYacht(yachtId: string) {
    setExpandedYachts(prev => {
      const next = new Set(prev)
      if (next.has(yachtId)) next.delete(yachtId)
      else next.add(yachtId)
      return next
    })
  }

  return (
    <div>
      {/* Summary stats */}
      <dl className="flex gap-4 mb-4">
        <div className="bg-[var(--color-surface-raised)] rounded-2xl px-4 py-3 flex-1 text-center">
          <dd className="text-2xl font-bold text-[var(--color-text-primary)]">{totalColleagues}</dd>
          <dt className="text-xs text-[var(--color-text-secondary)] mt-0.5">colleagues</dt>
        </div>
        <div className="bg-[var(--color-surface-raised)] rounded-2xl px-4 py-3 flex-1 text-center">
          <dd className="text-2xl font-bold text-[var(--color-text-primary)]">{totalYachts}</dd>
          <dt className="text-xs text-[var(--color-text-secondary)] mt-0.5">yachts</dt>
        </div>
        <div className="bg-[var(--color-surface-raised)] rounded-2xl px-4 py-3 flex-1 text-center">
          <dd className="text-2xl font-bold text-[var(--color-text-primary)]">{totalEndorsements}</dd>
          <dt className="text-xs text-[var(--color-text-secondary)] mt-0.5">endorsements</dt>
        </div>
      </dl>

      {/* Search */}
      <div className="mb-4">
        <label htmlFor="colleague-search" className="sr-only">Search colleagues</label>
        <input
          id="colleague-search"
          type="text"
          placeholder="Search colleagues..."
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          className="w-full px-4 py-2.5 bg-[var(--color-surface-raised)] rounded-xl text-sm text-[var(--color-text-primary)] placeholder:text-[var(--color-text-tertiary)] border border-[var(--color-border)] focus:outline-none focus:ring-2 focus:ring-[var(--color-interactive)]/30"
        />
      </div>

      {/* Yacht groups accordion */}
      <div className="flex flex-col gap-2" role="list" aria-live="polite">
        {filteredGroups.map(group => {
          const isExpanded = expandedYachts.has(group.yacht.id)

          return (
            <div key={group.yacht.id} className="bg-[var(--color-surface)] rounded-2xl overflow-hidden" role="listitem">
              {/* Accordion header */}
              <button
                onClick={() => toggleYacht(group.yacht.id)}
                className="w-full flex items-center justify-between px-4 py-3.5 text-left hover:bg-[var(--color-surface-raised)]/50 transition-colors"
                aria-expanded={isExpanded}
                aria-controls={`yacht-group-${group.yacht.id}`}
                style={{ minHeight: '44px' }}
              >
                <div className="flex items-center gap-2">
                  <Link
                    href={`/app/yacht/${group.yacht.id}`}
                    onClick={e => e.stopPropagation()}
                    className="text-sm font-semibold text-[var(--color-text-primary)] hover:text-[var(--color-interactive)]"
                  >
                    {group.yacht.name}
                  </Link>
                  <span className="text-xs text-[var(--color-text-secondary)]">
                    — {group.colleagues.length} {group.colleagues.length === 1 ? 'colleague' : 'colleagues'}
                  </span>
                </div>
                <span className="text-[var(--color-text-tertiary)] text-sm">
                  {isExpanded ? '▼' : '▶'}
                </span>
              </button>

              {/* Colleague list */}
              {isExpanded && (
                <div id={`yacht-group-${group.yacht.id}`} className="px-4 pb-3 divide-y divide-[var(--color-border)]">
                  {group.colleagues.map(colleague => (
                    <div key={colleague.id} className="py-3 flex items-start gap-3">
                      {/* Avatar */}
                      <Link href={colleague.handle ? `/u/${colleague.handle}` : '#'} className="shrink-0">
                        <div className="w-10 h-10 rounded-full bg-[var(--color-surface-raised)] overflow-hidden">
                          {colleague.photoUrl ? (
                            <Image
                              src={colleague.photoUrl}
                              alt={colleague.name}
                              width={40}
                              height={40}
                              className="object-cover w-full h-full"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-sm font-semibold text-[var(--color-text-secondary)]">
                              {colleague.name[0]?.toUpperCase()}
                            </div>
                          )}
                        </div>
                      </Link>

                      {/* Info */}
                      <div className="min-w-0 flex-1">
                        <Link
                          href={colleague.handle ? `/u/${colleague.handle}` : '#'}
                          className="text-sm font-medium text-[var(--color-text-primary)] hover:text-[var(--color-interactive)] truncate block"
                          aria-label={`View ${colleague.name}'s profile`}
                        >
                          {colleague.name}
                        </Link>
                        <p className="text-xs text-[var(--color-text-secondary)] truncate">
                          {colleague.theirRoleOnYacht || colleague.role || 'Crew'}
                          {colleague.sharedYachtCount > 1 && ` · ${colleague.sharedYachtCount} shared yachts`}
                        </p>
                        <EndorsementStatusBadge status={colleague.endorsementStatus} />
                      </div>

                      {/* Endorse action */}
                      {colleague.canEndorse && (
                        <Link
                          href={`/app/endorsement/request?yacht_id=${group.yacht.id}&colleague_id=${colleague.id}`}
                          className="shrink-0 text-xs text-[var(--color-interactive)] font-medium px-3 py-1.5 rounded-full border border-[var(--color-interactive)] hover:bg-[var(--color-interactive)]/5 transition-colors"
                          onClick={e => e.stopPropagation()}
                        >
                          Endorse
                        </Link>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )
        })}

        {filteredGroups.length === 0 && searchQuery && (
          <div className="text-center py-8">
            <p className="text-sm text-[var(--color-text-secondary)]">
              No colleagues matching &ldquo;{searchQuery}&rdquo;
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

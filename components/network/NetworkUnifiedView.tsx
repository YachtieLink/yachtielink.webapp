'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { motion } from 'framer-motion'
import { staggerContainer, fadeUp } from '@/lib/motion'
import { EndorsementSummaryCard } from './EndorsementSummaryCard'
import { EndorsementCTACard } from './EndorsementCTACard'
import { YachtAccordion } from './YachtAccordion'
import { ColleagueRow } from './ColleagueRow'

// ─── Types ──────────────────────────────────────────────────────────────────

interface ColleagueProfile {
  id: string
  display_name: string | null
  full_name: string
  profile_photo_url: string | null
  primary_role: string | null
  handle: string | null
}

interface ColleagueEntry {
  colleague_id: string
  shared_yachts: string[]
  profile: ColleagueProfile | null
  sharedYachtDetails: Array<{ id: string; name: string }>
}

interface UserYacht {
  id: string
  role_label: string
  started_at: string
  ended_at: string | null
  yachts: {
    id: string
    name: string
    yacht_type: string | null
    length_meters: number | null
    flag_state: string | null
    is_established: boolean
  } | null
}

interface EndorsementReceived {
  id: string
  endorser: { id: string } | null
  yacht: { id: string } | null
}

interface RequestSent {
  id: string
  recipient_user_id: string | null
  status: string
  cancelled_at: string | null
  yacht: { name: string } | null
}

interface GhostSuggestion {
  id: string
  full_name: string
  primary_role: string | null
  yacht_id: string
}

interface NetworkUnifiedViewProps {
  colleagues: ColleagueEntry[]
  userYachts: UserYacht[]
  endorsementsReceivedCount: number
  endorsementsGivenCount: number
  pendingRequestsCount: number
  endorsedColleagueIds: string[]
  pendingColleagueIds: string[]
  ghostSuggestions: GhostSuggestion[]
}

// ─── Yacht Search ───────────────────────────────────────────────────────────

function YachtSearch() {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<Array<{ id: string; name: string; yacht_type: string | null; length_meters: number | null; crew_count?: number }>>([])
  const [searching, setSearching] = useState(false)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const seqRef = useRef(0)

  useEffect(() => {
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current) }
  }, [])

  const search = useCallback(async (q: string) => {
    if (!q.trim()) { setResults([]); setSearching(false); return }
    const seq = ++seqRef.current
    setSearching(true)
    try {
      const supabase = createClient()
      const { data } = await supabase.rpc('search_yachts', { p_query: q, p_limit: 6 })
      if (seq !== seqRef.current) return
      setResults((data as typeof results) ?? [])
    } catch { /* fail silently */ }
    if (seq === seqRef.current) setSearching(false)
  }, [])

  function handleChange(value: string) {
    setQuery(value)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => search(value), 300)
  }

  return (
    <div className="mt-6 border-t border-[var(--color-border)] pt-4">
      <h2 className="text-sm font-semibold text-[var(--color-text-secondary)] uppercase tracking-wide mb-3">
        Find a yacht
      </h2>
      <label htmlFor="yacht-search" className="sr-only">Search yachts</label>
      <input
        id="yacht-search"
        type="text"
        placeholder="Search by name…"
        value={query}
        onChange={(e) => handleChange(e.target.value)}
        className="w-full px-4 py-2.5 bg-[var(--color-surface-raised)] rounded-xl text-sm text-[var(--color-text-primary)] placeholder:text-[var(--color-text-tertiary)] border border-[var(--color-border)] focus:outline-none focus:ring-2 focus:ring-[var(--color-navy-500)]/30"
      />
      {searching && <p className="text-xs text-[var(--color-text-secondary)] mt-2 px-1">Searching…</p>}
      {!searching && results.length === 0 && query.trim() && (
        <p className="text-xs text-[var(--color-text-secondary)] mt-2 px-1">No yachts found matching &ldquo;{query}&rdquo;</p>
      )}
      {results.length > 0 && (
        <div className="flex flex-col gap-2 mt-3">
          {results.map((r) => (
            <Link key={r.id} href={`/app/yacht/${r.id}`} className="card-soft rounded-xl px-4 py-3 flex items-center gap-3 hover:bg-[var(--color-surface-raised)] transition-colors">
              <div className="min-w-0 flex-1">
                <p className="font-medium text-sm text-[var(--color-text-primary)] truncate">{r.name}</p>
                <p className="text-xs text-[var(--color-text-secondary)] mt-0.5">
                  {[r.yacht_type, r.length_meters ? `${r.length_meters}m` : null].filter(Boolean).join(' · ')}
                </p>
              </div>
              <span className="text-[var(--color-text-tertiary)] text-sm shrink-0">›</span>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── Main Component ─────────────────────────────────────────────────────────

export function NetworkUnifiedView({
  colleagues,
  userYachts,
  endorsementsReceivedCount,
  endorsementsGivenCount,
  pendingRequestsCount,
  endorsedColleagueIds,
  pendingColleagueIds,
  ghostSuggestions,
}: NetworkUnifiedViewProps) {
  // Group colleagues by yacht
  const yachtColleagueMap = new Map<string, ColleagueEntry[]>()
  for (const entry of colleagues) {
    for (const yachtId of entry.shared_yachts) {
      const existing = yachtColleagueMap.get(yachtId) ?? []
      existing.push(entry)
      yachtColleagueMap.set(yachtId, existing)
    }
  }

  // Group ghosts by yacht
  const yachtGhostMap = new Map<string, GhostSuggestion[]>()
  for (const ghost of ghostSuggestions) {
    const existing = yachtGhostMap.get(ghost.yacht_id) ?? []
    existing.push(ghost)
    yachtGhostMap.set(ghost.yacht_id, existing)
  }

  // Zero yachts — centered empty state (suppress endorsement cards — meaningless without colleagues)
  if (userYachts.length === 0) {
    return (
      <div className="flex flex-col items-center text-center py-8 gap-4">
        <div className="h-16 w-16 rounded-full bg-[var(--color-navy-100)] flex items-center justify-center">
          <span className="text-2xl">⚓</span>
        </div>
        <div>
          <h2 className="text-lg font-serif tracking-tight text-[var(--color-text-primary)] mb-1">
            Add your first yacht to start building your network
          </h2>
          <p className="text-sm text-[var(--color-text-secondary)] leading-relaxed max-w-[280px] mx-auto">
            We&apos;ll connect you with crew you&apos;ve worked with and make endorsements easy.
          </p>
        </div>
        <div className="flex flex-col gap-3 w-full max-w-[240px]">
          <Link
            href="/app/attachment/new"
            className="w-full px-4 py-2.5 rounded-xl text-sm font-medium bg-[var(--color-interactive)] text-white text-center hover:opacity-90 transition-opacity"
          >
            Add a Yacht
          </Link>
          <Link
            href="/app/cv/upload"
            className="w-full px-4 py-2.5 rounded-xl text-sm font-medium text-[var(--color-interactive)] text-center border border-[var(--color-border)] hover:bg-[var(--color-surface-raised)] transition-colors"
          >
            Upload a CV instead
          </Link>
        </div>
        <YachtSearch />
      </div>
    )
  }

  return (
    <motion.div
      variants={staggerContainer}
      initial="hidden"
      animate="visible"
      className="flex flex-col gap-4"
    >
      {/* Endorsement CTA card */}
      <motion.div variants={fadeUp}>
        <EndorsementCTACard endorsementCount={endorsementsReceivedCount} />
      </motion.div>

      {/* Endorsement summary stat card */}
      {(endorsementsReceivedCount > 0 || endorsementsGivenCount > 0) && (
        <motion.div variants={fadeUp}>
          <EndorsementSummaryCard
            received={endorsementsReceivedCount}
            given={endorsementsGivenCount}
            pending={pendingRequestsCount}
          />
        </motion.div>
      )}

      {/* Yacht accordions */}
      {userYachts.map((att, index) => {
        const yacht = att.yachts
        if (!yacht) return null

        const yachtColleagues = yachtColleagueMap.get(yacht.id) ?? []
        const yachtGhosts = yachtGhostMap.get(yacht.id) ?? []
        const totalCount = yachtColleagues.length + yachtGhosts.length

        return (
          <motion.div key={att.id} variants={fadeUp}>
            <YachtAccordion
              yachtId={yacht.id}
              yachtName={yacht.name}
              yachtType={yacht.yacht_type}
              lengthMeters={yacht.length_meters}
              userRole={att.role_label}
              startDate={att.started_at}
              endDate={att.ended_at}
              colleagueCount={totalCount}
              defaultExpanded={index === 0}
            >
              {/* On-platform colleagues */}
              {yachtColleagues.map((entry) => {
                const profile = entry.profile
                if (!profile) return null
                const name = profile.display_name ?? profile.full_name

                let endorsementStatus: 'endorsed' | 'pending' | null = null
                if (endorsedColleagueIds.includes(entry.colleague_id)) {
                  endorsementStatus = 'endorsed'
                } else if (pendingColleagueIds.includes(entry.colleague_id)) {
                  endorsementStatus = 'pending'
                }

                return (
                  <ColleagueRow
                    key={entry.colleague_id}
                    colleagueId={entry.colleague_id}
                    name={name}
                    profilePhotoUrl={profile.profile_photo_url}
                    role={profile.primary_role}
                    handle={profile.handle}
                    yachtId={yacht.id}
                    endorsementStatus={endorsementStatus}
                  />
                )
              })}

              {/* Ghost suggestions inline */}
              {yachtGhosts.map((ghost) => (
                <ColleagueRow
                  key={ghost.id}
                  colleagueId={ghost.id}
                  name={ghost.full_name}
                  profilePhotoUrl={null}
                  role={ghost.primary_role}
                  handle={null}
                  yachtId={yacht.id}
                  isGhost
                />
              ))}

              {/* Zero colleagues on this yacht */}
              {yachtColleagues.length === 0 && yachtGhosts.length === 0 && (
                <p className="text-sm text-[var(--color-text-secondary)] py-3">
                  No colleagues found for this yacht yet
                </p>
              )}

              {/* Invite former crew CTA */}
              <div className="pt-2 pb-1">
                <Link
                  href={`/app/endorsement/request?yacht_id=${yacht.id}`}
                  className="text-sm font-medium text-[var(--color-interactive)] hover:underline"
                >
                  Invite former crew →
                </Link>
              </div>
            </YachtAccordion>
          </motion.div>
        )
      })}

      {/* Add another yacht — shown when 1-3 yachts */}
      {userYachts.length <= 3 && (
        <motion.div variants={fadeUp}>
          <Link
            href="/app/attachment/new"
            className="flex items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-[var(--color-navy-200)] py-4 text-sm font-medium text-[var(--color-navy-500)] hover:border-[var(--color-navy-300)] hover:bg-[var(--color-navy-50)] transition-colors"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            Add another yacht
          </Link>
        </motion.div>
      )}

      {/* Yacht search at bottom */}
      <YachtSearch />
    </motion.div>
  )
}

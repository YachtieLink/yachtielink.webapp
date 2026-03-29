'use client'

import { useState, useCallback, useRef, useEffect } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { motion } from 'framer-motion'
import { staggerContainer, fadeUp, cardHover, popIn } from '@/lib/motion'
import { RequestActions } from './RequestActions'
import { EmptyState } from '@/components/ui/EmptyState'
import { Button } from '@/components/ui/Button'

// ─── Types ───────────────────────────────────────────────────────────────────

interface EndorsementReceived {
  id: string
  content: string
  created_at: string
  endorser: {
    id: string
    display_name: string | null
    full_name: string
    profile_photo_url: string | null
  } | null
  yacht: {
    id: string
    name: string
  } | null
}

interface RequestReceived {
  id: string
  token: string
  yacht_id: string
  status: string
  expires_at: string
  cancelled_at: string | null
  requester: {
    display_name: string | null
    full_name: string
    profile_photo_url: string | null
  } | null
  yacht: {
    name: string
  } | null
}

interface RequestSent {
  id: string
  token: string
  recipient_email: string | null
  recipient_phone: string | null
  status: string
  expires_at: string
  cancelled_at: string | null
  yacht: {
    name: string
  } | null
}

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

export interface UserYacht {
  id: string
  role_label: string
  started_at: string
  ended_at: string | null
  yachts: {
    id: string; name: string; yacht_type: string | null; length_meters: number | null
    flag_state: string | null; is_established: boolean
  } | null
}

interface AudienceTabsProps {
  endorsementsReceived: EndorsementReceived[]
  requestsReceived: RequestReceived[]
  requestsSent: RequestSent[]
  colleagues: ColleagueEntry[]
  mostRecentYachtId: string | null
  savedCount: number
  userYachts: UserYacht[]
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

const EXCERPT_LENGTH = 140

function excerpt(text: string): string {
  if (text.length <= EXCERPT_LENGTH) return text
  return text.slice(0, EXCERPT_LENGTH).trimEnd() + '…'
}

function StatusPill({ status, expiresAt, cancelledAt }: { status: string; expiresAt: string; cancelledAt: string | null }) {
  const isExpired = new Date(expiresAt) < new Date()
  const isCancelled = !!cancelledAt || status === 'cancelled'

  if (isCancelled) {
    return <span className="text-xs px-2 py-0.5 rounded-full bg-[var(--color-surface-raised)] text-[var(--color-text-tertiary)]">Cancelled</span>
  }
  if (status === 'accepted') {
    return <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 font-medium">Completed</span>
  }
  if (isExpired) {
    return <span className="text-xs px-2 py-0.5 rounded-full bg-[var(--color-surface-raised)] text-[var(--color-text-tertiary)]">Expired</span>
  }
  return <span className="text-xs px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400 font-medium">Pending</span>
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function AudienceTabs({
  endorsementsReceived,
  requestsReceived,
  requestsSent,
  colleagues,
  mostRecentYachtId,
  savedCount,
  userYachts,
}: AudienceTabsProps) {
  const [activeTab, setActiveTab] = useState<'endorsements' | 'colleagues' | 'yachts' | 'saved'>('endorsements')

  const endorsementCount = Math.min(endorsementsReceived.length, 5)
  const progressPct = (endorsementCount / 5) * 100

  return (
    <div className="min-h-screen bg-[var(--color-navy-50)] -mx-4 px-4 md:-mx-6 md:px-6 pt-8 pb-24">

      {/* Request endorsements CTA */}
      <Link
        href="/app/endorsement/request"
        className="block w-full bg-[var(--color-interactive)] rounded-2xl p-4 mb-6 hover:bg-[var(--color-interactive-hover)] transition-colors"
      >
        <div className="flex items-center justify-between mb-2">
          <p className="text-sm font-semibold text-white">Request endorsements</p>
          <svg className="h-5 w-5 text-white/80" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
          </svg>
        </div>
        <p className="text-xs text-white/70">
          Ask colleagues to endorse your work via email, WhatsApp, or a shareable link.
        </p>
        {endorsementCount < 5 && (
          <div className="mt-3">
            <div className="w-full h-1.5 rounded-full bg-white/20 overflow-hidden">
              <div
                className="h-full rounded-full bg-white/70 transition-all"
                style={{ width: `${progressPct}%` }}
              />
            </div>
            <p className="text-xs text-white/60 mt-1">{endorsementCount}/5 endorsements</p>
          </div>
        )}
      </Link>

      {/* Segment control */}
      <div className="flex bg-[var(--color-surface-raised)] rounded-xl p-1 mb-6">
        {(['endorsements', 'colleagues', 'yachts', 'saved'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-1 py-2 text-sm font-medium rounded-lg transition-colors ${
              activeTab === tab
                ? 'bg-[var(--color-surface)] text-[var(--color-text-primary)] shadow-sm'
                : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]'
            }`}
          >
            {(() => {
              const count = tab === 'endorsements' ? endorsementsReceived.length
                : tab === 'colleagues' ? colleagues.length
                : tab === 'yachts' ? userYachts.length
                : savedCount
              const label = tab === 'endorsements' ? 'Endorsements'
                : tab === 'colleagues' ? 'Colleagues'
                : tab === 'yachts' ? 'Yachts'
                : 'Saved'
              return (
                <span className="flex items-center justify-center gap-1.5">
                  {label}
                  {count > 0 && (
                    <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-[var(--color-navy-100)] text-[var(--color-navy-700)]">
                      {count}
                    </span>
                  )}
                </span>
              )
            })()}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {activeTab === 'endorsements' ? (
        <EndorsementsTab
          endorsementsReceived={endorsementsReceived}
          requestsReceived={requestsReceived}
          requestsSent={requestsSent}
        />
      ) : activeTab === 'colleagues' ? (
        <ColleaguesTab colleagues={colleagues} />
      ) : activeTab === 'yachts' ? (
        <YachtsTab userYachts={userYachts} />
      ) : (
        <SavedTab />
      )}
    </div>
  )
}

// ─── Received Request Card ────────────────────────────────────────────────────

function ReceivedRequestCard({ req }: { req: RequestReceived }) {
  // Prefer full name over username
  const name = req.requester?.full_name ?? req.requester?.display_name ?? 'Someone'
  const isExpired = new Date(req.expires_at) < new Date()
  const isPending = req.status !== 'accepted' && !req.cancelled_at && !isExpired
  const [declining, setDeclining] = useState(false)
  const [declined, setDeclined] = useState(false)

  const handleDecline = useCallback(async () => {
    setDeclining(true)
    try {
      await fetch(`/api/endorsement-requests/${req.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'decline' }),
      })
      setDeclined(true)
    } finally {
      setDeclining(false)
    }
  }, [req.id])

  if (declined) return null

  return (
    <div className="card-soft rounded-2xl p-4">
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-full bg-[var(--color-surface-raised)] overflow-hidden shrink-0">
          {req.requester?.profile_photo_url ? (
            <Image
              src={req.requester.profile_photo_url}
              alt={name}
              width={36}
              height={36}
              className="object-cover w-full h-full"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-sm font-semibold text-[var(--color-text-secondary)]">
              {name[0]?.toUpperCase()}
            </div>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-[var(--color-text-primary)] truncate">{name}</p>
          {req.yacht && (
            <p className="text-xs text-[var(--color-text-secondary)] truncate">{req.yacht.name}</p>
          )}
        </div>
        <StatusPill status={req.status} expiresAt={req.expires_at} cancelledAt={req.cancelled_at} />
      </div>
      {isPending && (
        <div className="mt-3 flex items-center gap-4">
          <Link href={`/r/${req.token}`}>
            <Button variant="outline" size="sm">Write endorsement</Button>
          </Link>
          <button
            onClick={handleDecline}
            disabled={declining}
            className="text-sm text-[var(--color-text-tertiary)] hover:text-red-400 transition-colors disabled:opacity-50"
          >
            {declining ? 'Declining…' : 'Decline'}
          </button>
        </div>
      )}
    </div>
  )
}

// ─── Endorsements Tab ─────────────────────────────────────────────────────────

function EndorsementsTab({
  endorsementsReceived,
  requestsReceived,
  requestsSent,
}: {
  endorsementsReceived: EndorsementReceived[]
  requestsReceived: RequestReceived[]
  requestsSent: RequestSent[]
}) {
  return (
    <div className="flex flex-col gap-6">

      {/* Requests received */}
      {requestsReceived.length > 0 && (
        <section>
          <h2 className="text-sm font-semibold text-[var(--color-text-secondary)] uppercase tracking-wide mb-3">
            Requests received
          </h2>
          <div className="flex flex-col gap-3">
            {requestsReceived.map((req) => (
              <ReceivedRequestCard key={req.id} req={req} />
            ))}
          </div>
        </section>
      )}

      {/* Endorsements received */}
      <section>
        <h2 className="text-sm font-semibold text-[var(--color-text-secondary)] uppercase tracking-wide mb-3">
          Endorsements{' '}
          <motion.span variants={popIn} initial="hidden" animate="visible" className="normal-case font-medium text-xs px-2 py-0.5 rounded-full bg-[var(--color-coral-100)] text-[var(--color-coral-700)]">
            {endorsementsReceived.length}
          </motion.span>
        </h2>
        {endorsementsReceived.length === 0 ? (
          <EmptyState title="No endorsements yet" actionLabel="Request endorsements" actionHref="/app/endorsement/request" />
        ) : (
          <motion.div variants={staggerContainer} initial="hidden" animate="visible" className="flex flex-col gap-3">
            {endorsementsReceived.map((e) => {
              const endorserName =
                e.endorser?.display_name ?? e.endorser?.full_name ?? 'Anonymous'
              const date = new Date(e.created_at).toLocaleDateString('en-GB', {
                month: 'short',
                year: 'numeric',
              })
              return (
                <motion.div key={e.id} variants={fadeUp} {...cardHover} className="card-soft rounded-2xl p-4 border-l-2 border-[var(--color-interactive)]">
                  <p className="text-sm text-[var(--color-text-primary)] leading-relaxed mb-2">
                    &ldquo;{excerpt(e.content)}&rdquo;
                  </p>
                  <p className="text-xs text-[var(--color-text-tertiary)]">
                    {endorserName}
                    {e.yacht && (
                      <>
                        {' \u00b7 '}
                        <Link href={`/app/yacht/${e.yacht.id}`} className="text-[var(--color-interactive)] hover:underline">
                          {e.yacht.name}
                        </Link>
                      </>
                    )}
                    {' \u00b7 '}{date}
                  </p>
                </motion.div>
              )
            })}
          </motion.div>
        )}
      </section>

      {/* Requests sent */}
      {requestsSent.length > 0 && (
        <section>
          <h2 className="text-sm font-semibold text-[var(--color-text-secondary)] uppercase tracking-wide mb-3">
            Requests sent
          </h2>
          <div className="flex flex-col gap-3">
            {requestsSent.map((req) => {
              const recipient = req.recipient_email ?? req.recipient_phone ?? 'Unknown'
              return (
                <div key={req.id} className="card-soft rounded-2xl p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-[var(--color-text-primary)] truncate">
                        {recipient}
                      </p>
                      {req.yacht && (
                        <p className="text-xs text-[var(--color-text-secondary)] truncate">
                          {req.yacht.name}
                        </p>
                      )}
                    </div>
                    <StatusPill
                      status={req.status}
                      expiresAt={req.expires_at}
                      cancelledAt={req.cancelled_at}
                    />
                  </div>
                  <RequestActions
                    requestId={req.id}
                    status={req.status}
                    expiresAt={req.expires_at}
                    cancelledAt={req.cancelled_at}
                  />
                </div>
              )
            })}
          </div>
        </section>
      )}
    </div>
  )
}

// ─── Yachts Tab ──────────────────────────────────────────────────────────────

function YachtsTab({ userYachts }: { userYachts: UserYacht[] }) {
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<Array<{ id: string; name: string; yacht_type: string | null; length_meters: number | null; flag_state: string | null; crew_count?: number }>>([])
  const [searching, setSearching] = useState(false)
  const [searchError, setSearchError] = useState(false)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const searchSeqRef = useRef(0)

  useEffect(() => {
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current) }
  }, [])

  async function searchYachts(q: string) {
    if (!q.trim()) { setSearchResults([]); setSearching(false); setSearchError(false); return }
    const seq = ++searchSeqRef.current
    setSearching(true)
    setSearchError(false)
    try {
      const supabase = createClient()
      const { data, error } = await supabase.rpc('search_yachts', { p_query: q, p_limit: 6 })
      if (seq !== searchSeqRef.current) return
      if (error) { setSearchError(true); setSearching(false); return }
      const results = (data as Array<{ id: string; name: string; yacht_type: string | null; length_meters: number | null; flag_state: string | null }>) ?? []
      if (results.length > 0) {
        const crewCounts = await Promise.all(results.map(r => supabase.rpc('yacht_crew_count', { yacht: r.id })))
        if (seq !== searchSeqRef.current) return
        setSearchResults(results.map((r, i) => ({ ...r, crew_count: (crewCounts[i].data as number) ?? 0 })))
      } else { setSearchResults([]) }
    } catch { if (seq === searchSeqRef.current) setSearchError(true) }
    if (seq === searchSeqRef.current) setSearching(false)
  }

  function handleSearchChange(value: string) {
    setSearchQuery(value)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => searchYachts(value), 300)
  }

  function yachtMeta(y: { yacht_type: string | null; length_meters: number | null; flag_state: string | null; crew_count?: number }) {
    return [y.yacht_type, y.length_meters ? `${y.length_meters}m` : null, y.flag_state, y.crew_count != null && y.crew_count > 0 ? `${y.crew_count} crew` : null].filter(Boolean).join(' \u00b7 ')
  }

  return (
    <div className="flex flex-col gap-4">
      {userYachts.length > 0 ? (
        <motion.div variants={staggerContainer} initial="hidden" animate="visible" className="flex flex-col gap-3">
          <h2 className="text-sm font-semibold text-[var(--color-text-secondary)] uppercase tracking-wide">My Yachts</h2>
          {userYachts.map((att) => {
            const yacht = att.yachts!
            const start = new Date(att.started_at).toLocaleDateString('en-GB', { month: 'short', year: 'numeric' })
            const end = att.ended_at ? new Date(att.ended_at).toLocaleDateString('en-GB', { month: 'short', year: 'numeric' }) : 'Present'
            return (
              <motion.div key={att.id} variants={fadeUp} {...cardHover}>
                <Link href={`/app/yacht/${yacht.id}`} className="card-soft rounded-2xl p-4 flex items-center gap-3 hover:bg-[var(--color-surface-raised)] transition-colors">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-sm text-[var(--color-text-primary)] truncate">{yacht.name}</p>
                      {yacht.is_established && (
                        <span className="text-[10px] bg-[var(--color-interactive)]/10 text-[var(--color-interactive)] px-1.5 py-0.5 rounded-full font-medium shrink-0">Established</span>
                      )}
                    </div>
                    <p className="text-xs text-[var(--color-text-secondary)] truncate mt-0.5">{att.role_label} {'\u00b7'} {start}{'\u2013'}{end}</p>
                    {(yacht.yacht_type || yacht.length_meters || yacht.flag_state) && (
                      <p className="text-xs text-[var(--color-text-tertiary)] truncate mt-0.5">
                        {[yacht.yacht_type, yacht.length_meters ? `${yacht.length_meters}m` : null, yacht.flag_state].filter(Boolean).join(' \u00b7 ')}
                      </p>
                    )}
                  </div>
                  <span className="text-[var(--color-text-tertiary)] text-sm shrink-0">{'\u203a'}</span>
                </Link>
              </motion.div>
            )
          })}
        </motion.div>
      ) : (
        <EmptyState title="Add a yacht to your profile to start building your network" actionLabel="+ Add a yacht" actionHref="/app/attachment/new" />
      )}

      <div className="border-t border-[var(--color-border)] pt-4">
        <h2 className="text-sm font-semibold text-[var(--color-text-secondary)] uppercase tracking-wide mb-3">Find a yacht</h2>
        <label htmlFor="yacht-search" className="sr-only">Search yachts</label>
        <input id="yacht-search" type="text" placeholder="Search by name…" value={searchQuery}
          onChange={e => handleSearchChange(e.target.value)}
          className="w-full px-4 py-2.5 bg-[var(--color-surface-raised)] rounded-xl text-sm text-[var(--color-text-primary)] placeholder:text-[var(--color-text-tertiary)] border border-[var(--color-border)] focus:outline-none focus:ring-2 focus:ring-[var(--color-interactive)]/30"
        />
        {searching && <p className="text-xs text-[var(--color-text-secondary)] mt-2 px-1">Searching…</p>}
        {searchError && !searching && <p className="text-xs text-[var(--color-error,#ef4444)] mt-2 px-1">Search failed. Please try again.</p>}
        {!searching && !searchError && searchResults.length === 0 && searchQuery.trim() && (
          <p className="text-xs text-[var(--color-text-secondary)] mt-2 px-1">No yachts found matching &ldquo;{searchQuery}&rdquo;</p>
        )}
        {searchResults.length > 0 && (
          <div className="flex flex-col gap-2 mt-3" aria-live="polite">
            {searchResults.map((r) => (
              <Link key={r.id} href={`/app/yacht/${r.id}`} className="card-soft rounded-xl px-4 py-3 flex items-center gap-3 hover:bg-[var(--color-surface-raised)] transition-colors">
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-sm text-[var(--color-text-primary)] truncate">{r.name}</p>
                  {yachtMeta(r) && <p className="text-xs text-[var(--color-text-secondary)] mt-0.5">{yachtMeta(r)}</p>}
                </div>
                <span className="text-[var(--color-text-tertiary)] text-sm shrink-0">{'\u203a'}</span>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Saved Tab ────────────────────────────────────────────────────────────────

function SavedTab() {
  return (
    <Link
      href="/app/network/saved"
      className="card-soft rounded-2xl p-4 flex items-center gap-3 hover:bg-[var(--color-surface-raised)] transition-colors"
    >
      <span className="text-2xl">🔖</span>
      <div className="flex-1">
        <p className="text-sm font-medium text-[var(--color-text-primary)]">Saved Profiles</p>
        <p className="text-xs text-[var(--color-text-secondary)]">View and organise your saved profiles</p>
      </div>
      <span className="text-[var(--color-text-secondary)]">›</span>
    </Link>
  )
}

// ─── Colleagues Tab ───────────────────────────────────────────────────────────

function ColleaguesTab({ colleagues }: { colleagues: ColleagueEntry[] }) {
  if (colleagues.length === 0) {
    return (
      <EmptyState
        title="Your colleague list will populate once you and a crewmate have both attached the same yacht"
        actionLabel="Add a yacht"
        actionHref="/app/attachment/new"
      />
    )
  }

  return (
    <motion.div variants={staggerContainer} initial="hidden" animate="visible" className="flex flex-col gap-3">
      {colleagues.map((entry) => {
        const profile = entry.profile
        if (!profile) return null
        const name = profile.display_name ?? profile.full_name

        return (
          <motion.div
            key={entry.colleague_id}
            variants={fadeUp}
            {...cardHover}
            className="card-soft rounded-2xl p-4 flex items-center gap-3"
          >
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <Link href={profile.handle ? `/u/${profile.handle}` : '#'} className="w-11 h-11 rounded-full bg-[var(--color-surface-raised)] overflow-hidden shrink-0">
                {profile.profile_photo_url ? (
                  <Image
                    src={profile.profile_photo_url}
                    alt={name}
                    width={44}
                    height={44}
                    className="object-cover w-full h-full"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-base font-semibold text-[var(--color-text-secondary)]">
                    {name[0]?.toUpperCase()}
                  </div>
                )}
              </Link>
              <div className="min-w-0 flex-1">
                <Link href={profile.handle ? `/u/${profile.handle}` : '#'} className="block">
                  <p className="font-medium text-sm text-[var(--color-text-primary)] truncate">{name}</p>
                  {profile.primary_role && (
                    <p className="text-xs text-[var(--color-text-secondary)] truncate">
                      {profile.primary_role}
                    </p>
                  )}
                </Link>
                {entry.sharedYachtDetails.length > 0 && (
                  <p className="text-xs text-[var(--color-interactive)] truncate mt-0.5">
                    <Link href={`/app/yacht/${entry.sharedYachtDetails[0].id}`} className="hover:underline">
                      {entry.sharedYachtDetails[0].name}
                    </Link>
                    {entry.sharedYachtDetails.length > 1 && ` +${entry.sharedYachtDetails.length - 1} more`}
                  </p>
                )}
              </div>
            </div>
            <Link
              href={`/app/endorsement/request?colleague_id=${entry.colleague_id}&yacht_id=${entry.shared_yachts[0] ?? ''}`}
              className="shrink-0"
            >
              <Button variant="outline" size="sm">Endorse</Button>
            </Link>
          </motion.div>
        )
      })}

      {/* Explore full network link */}
      <Link
        href="/app/network/colleagues"
        className="mt-2 block text-center text-sm text-[var(--color-interactive)] font-medium py-2 hover:underline"
      >
        Explore your network →
      </Link>
    </motion.div>
  )
}

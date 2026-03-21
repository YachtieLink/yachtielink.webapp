'use client'

import { useState, useCallback, useEffect } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { RequestActions } from './RequestActions'
import { EmptyState } from '@/components/ui/EmptyState'

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
}

interface ColleagueEntry {
  colleague_id: string
  shared_yachts: string[]
  profile: ColleagueProfile | null
  sharedYachtNames: string[]
}

interface AudienceTabsProps {
  endorsementsReceived: EndorsementReceived[]
  requestsReceived: RequestReceived[]
  requestsSent: RequestSent[]
  colleagues: ColleagueEntry[]
  mostRecentYachtId: string | null
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
}: AudienceTabsProps) {
  const [activeTab, setActiveTab] = useState<'endorsements' | 'colleagues' | 'saved'>('endorsements')

  const endorsementCount = Math.min(endorsementsReceived.length, 5)
  const progressPct = (endorsementCount / 5) * 100

  return (
    <div className="min-h-screen bg-[var(--color-surface)] px-4 pt-8 pb-24">

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
        {(['endorsements', 'colleagues', 'saved'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-1 py-2 text-sm font-medium rounded-lg transition-colors ${
              activeTab === tab
                ? 'bg-[var(--color-surface)] text-[var(--color-text-primary)] shadow-sm'
                : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]'
            }`}
          >
            {tab === 'endorsements' ? 'Endorsements' : tab === 'colleagues' ? 'Colleagues' : 'Saved'}
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
    <div className="bg-[var(--color-surface)] rounded-2xl p-4">
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
          <Link
            href={`/r/${req.token}`}
            className="text-sm text-[var(--color-interactive)] font-medium hover:underline"
          >
            Write endorsement →
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
          <span className="normal-case font-normal text-[var(--color-text-tertiary)]">
            ({endorsementsReceived.length})
          </span>
        </h2>
        {endorsementsReceived.length === 0 ? (
          <EmptyState title="No endorsements yet" actionLabel="Request endorsements" actionHref="/app/endorsement/request" />
        ) : (
          <div className="flex flex-col gap-3">
            {endorsementsReceived.map((e) => {
              const endorserName =
                e.endorser?.display_name ?? e.endorser?.full_name ?? 'Anonymous'
              const date = new Date(e.created_at).toLocaleDateString('en-GB', {
                month: 'short',
                year: 'numeric',
              })
              return (
                <div key={e.id} className="bg-[var(--color-surface)] rounded-2xl p-4 border-l-2 border-[var(--color-interactive)]">
                  <p className="text-sm text-[var(--color-text-primary)] leading-relaxed mb-2">
                    &ldquo;{excerpt(e.content)}&rdquo;
                  </p>
                  <p className="text-xs text-[var(--color-text-tertiary)]">
                    {endorserName}
                    {e.yacht ? ` · ${e.yacht.name}` : ''}
                    {' · '}{date}
                  </p>
                </div>
              )
            })}
          </div>
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
                <div key={req.id} className="bg-[var(--color-surface)] rounded-2xl p-4">
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

// ─── Saved Tab ────────────────────────────────────────────────────────────────

interface SavedProfile {
  id: string
  saved_user_id: string
  folder_id: string | null
  created_at: string
  saved_user: {
    id: string
    display_name: string | null
    full_name: string
    profile_photo_url: string | null
    primary_role: string | null
    handle: string
  } | null
}

interface SavedFolder {
  id: string
  name: string
  emoji: string | null
}

function SavedTab() {
  const [profiles, setProfiles] = useState<SavedProfile[]>([])
  const [folders, setFolders] = useState<SavedFolder[]>([])
  const [activeFolder, setActiveFolder] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      fetch('/api/saved-profiles').then((r) => r.json()),
      fetch('/api/profile-folders').then((r) => r.json()),
    ]).then(([savedData, folderData]) => {
      setProfiles(savedData.results ?? [])
      setFolders(folderData.folders ?? [])
    }).catch(() => {
      // silently fail — empty state shown
    }).finally(() => {
      setLoading(false)
    })
  }, [])

  async function unsave(savedUserId: string) {
    setProfiles((prev) => prev.filter((p) => p.saved_user_id !== savedUserId))
    await fetch('/api/saved-profiles', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ saved_user_id: savedUserId }),
    })
  }

  if (loading) {
    return (
      <div className="flex flex-col gap-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-[var(--color-surface)] rounded-2xl p-4 h-16 animate-pulse" />
        ))}
      </div>
    )
  }

  const filtered = activeFolder
    ? profiles.filter((p) => p.folder_id === activeFolder)
    : profiles

  if (profiles.length === 0) {
    return (
      <div className="bg-[var(--color-surface)] rounded-2xl p-6 text-center">
        <p className="text-2xl mb-3">🔖</p>
        <p className="text-sm font-medium text-[var(--color-text-primary)] mb-1">No saved profiles yet</p>
        <p className="text-xs text-[var(--color-text-secondary)]">
          Tap the bookmark on any profile to save them here.
        </p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Folder filter pills */}
      {folders.length > 0 && (
        <div className="flex gap-2 overflow-x-auto pb-1">
          <button
            onClick={() => setActiveFolder(null)}
            className={`shrink-0 text-xs px-3 py-1.5 rounded-full font-medium transition-colors ${
              activeFolder === null
                ? 'bg-[var(--color-interactive)] text-white'
                : 'bg-[var(--color-surface-raised)] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]'
            }`}
          >
            All ({profiles.length})
          </button>
          {folders.map((f) => {
            const count = profiles.filter((p) => p.folder_id === f.id).length
            return (
              <button
                key={f.id}
                onClick={() => setActiveFolder(f.id)}
                className={`shrink-0 text-xs px-3 py-1.5 rounded-full font-medium transition-colors ${
                  activeFolder === f.id
                    ? 'bg-[var(--color-interactive)] text-white'
                    : 'bg-[var(--color-surface-raised)] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]'
                }`}
              >
                {f.emoji ? `${f.emoji} ` : ''}{f.name} ({count})
              </button>
            )
          })}
        </div>
      )}

      {/* Profile list */}
      <div className="flex flex-col gap-3">
        {filtered.map((entry) => {
          const u = entry.saved_user
          if (!u) return null
          const name = u.display_name ?? u.full_name
          return (
            <div key={entry.id} className="bg-[var(--color-surface)] rounded-2xl p-4 flex items-center gap-3">
              <Link href={`/u/${u.handle}`} className="w-11 h-11 rounded-full bg-[var(--color-surface-raised)] overflow-hidden shrink-0">
                {u.profile_photo_url ? (
                  <Image src={u.profile_photo_url} alt={name} width={44} height={44} className="object-cover w-full h-full" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-base font-semibold text-[var(--color-text-secondary)]">
                    {name[0]?.toUpperCase()}
                  </div>
                )}
              </Link>
              <Link href={`/u/${u.handle}`} className="min-w-0 flex-1">
                <p className="font-medium text-sm text-[var(--color-text-primary)] truncate">{name}</p>
                {u.primary_role && (
                  <p className="text-xs text-[var(--color-text-secondary)] truncate">{u.primary_role}</p>
                )}
              </Link>
              <button
                onClick={() => unsave(u.id)}
                className="shrink-0 text-xs text-[var(--color-text-secondary)] hover:text-[var(--color-error)] transition-colors px-2 py-1"
                aria-label="Unsave"
              >
                ✕
              </button>
            </div>
          )
        })}
        {filtered.length === 0 && activeFolder && (
          <div className="bg-[var(--color-surface)] rounded-2xl p-5 text-center">
            <p className="text-sm text-[var(--color-text-secondary)]">No profiles in this folder.</p>
          </div>
        )}
      </div>
    </div>
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
    <div className="flex flex-col gap-3">
      {colleagues.map((entry) => {
        const profile = entry.profile
        if (!profile) return null
        const name = profile.display_name ?? profile.full_name

        return (
          <div
            key={entry.colleague_id}
            className="bg-[var(--color-surface)] rounded-2xl p-4 flex items-center gap-3"
          >
            <div className="w-11 h-11 rounded-full bg-[var(--color-surface-raised)] overflow-hidden shrink-0">
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
            </div>
            <div className="min-w-0 flex-1">
              <p className="font-medium text-sm text-[var(--color-text-primary)] truncate">{name}</p>
              {profile.primary_role && (
                <p className="text-xs text-[var(--color-text-secondary)] truncate">
                  {profile.primary_role}
                </p>
              )}
              {entry.sharedYachtNames.length > 0 && (
                <p className="text-xs text-[var(--color-interactive)] truncate mt-0.5">
                  {entry.sharedYachtNames.length === 1
                    ? entry.sharedYachtNames[0]
                    : `${entry.sharedYachtNames[0]} +${entry.sharedYachtNames.length - 1} more`}
                </p>
              )}
            </div>
            <Link
              href={`/app/endorsement/request?colleague_id=${entry.colleague_id}&yacht_id=${entry.shared_yachts[0]}`}
              className="shrink-0 text-xs text-[var(--color-interactive)] font-medium px-3 py-1.5 rounded-full border border-[var(--color-interactive)] hover:bg-[var(--color-interactive)]/5 transition-colors"
            >
              Endorse
            </Link>
          </div>
        )
      })}
    </div>
  )
}

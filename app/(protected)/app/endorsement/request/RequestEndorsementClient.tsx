'use client'

import { useState, useCallback, useEffect } from 'react'
import Image from 'next/image'
import { Button } from '@/components/ui/Button'
import { PageHeader } from '@/components/ui/PageHeader'
import { Input } from '@/components/ui'
import { useToast } from '@/components/ui/Toast'
import { ChevronDown, Anchor, UserPlus, Send } from 'lucide-react'

// ── Types ────────────────────────────────────────────────────────────────────

interface ColleagueOption {
  id: string
  name: string
  email: string | null
  profilePhotoUrl: string | null
  primaryRole: string | null
  existingRequestStatus: 'pending' | 'accepted' | 'expired' | 'cancelled' | null
  alreadyEndorsed: boolean
  isGhost: boolean
  requestCreatedAt: string | null
  requestId: string | null
}

interface YachtGroup {
  id: string
  name: string
  yachtType: string | null
  coverPhotoUrl: string | null
  startDate: string | null
  endDate: string | null
  userRole: string | null
  colleagues: ColleagueOption[]
}

interface RequestEndorsementClientProps {
  yachtGroups: YachtGroup[]
  remaining: number
  limit: number
  userId: string
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function StatusPill({ status }: { status: 'pending' | 'accepted' | 'expired' | 'cancelled' }) {
  const styles: Record<string, string> = {
    pending: 'bg-blue-500/10 text-blue-400',
    accepted: 'bg-emerald-500/10 text-emerald-400',
    expired: 'bg-[var(--color-surface-raised)] text-[var(--color-text-tertiary)]',
    cancelled: 'bg-[var(--color-surface-raised)] text-[var(--color-text-tertiary)]',
  }
  const labels: Record<string, string> = {
    pending: 'Pending',
    accepted: 'Endorsed',
    expired: 'Expired',
    cancelled: 'Cancelled',
  }
  return (
    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${styles[status]}`}>
      {labels[status]}
    </span>
  )
}

function formatDateRange(start: string | null, end: string | null): string {
  const fmt = (d: string) => {
    const date = new Date(d)
    return date.toLocaleDateString('en-GB', { month: 'short', year: 'numeric' })
  }
  if (!start) return ''
  return end ? `${fmt(start)} – ${fmt(end)}` : `${fmt(start)} – Present`
}

// TODO: Reminder feature deferred — needs `reminded_at` column migration + /api/endorsement-requests/[id]/remind endpoint
function canRemind(createdAt: string | null): 'available' | 'too_soon' {
  if (!createdAt) return 'too_soon'
  const daysSince = (Date.now() - new Date(createdAt).getTime()) / 86400000
  return daysSince >= 7 ? 'available' : 'too_soon'
}

function daysUntilRemind(createdAt: string | null): number {
  if (!createdAt) return 7
  return Math.max(0, Math.ceil(7 - (Date.now() - new Date(createdAt).getTime()) / 86400000))
}

function isValidEmail(v: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)
}

function isValidPhone(v: string): boolean {
  const digits = v.replace(/[\s\-()]/g, '')
  return /^\+?\d{7,15}$/.test(digits)
}

function normalizePhone(v: string): string {
  return v.replace(/[\s\-()]/g, '')
}

// ── Component ────────────────────────────────────────────────────────────────

export function RequestEndorsementClient({
  yachtGroups,
  remaining: initialRemaining,
  limit,
  userId: _userId,
}: RequestEndorsementClientProps) {
  const { toast } = useToast()
  const [remaining, setRemaining] = useState(initialRemaining)
  const [expandedYachts, setExpandedYachts] = useState<Set<string>>(() => {
    return new Set(yachtGroups.length > 0 ? [yachtGroups[0].id] : [])
  })
  const [colleagueStates, setColleagueStates] = useState<Record<string, 'idle' | 'sending' | 'sent' | 'error'>>({})
  const [reminderStates, setReminderStates] = useState<Record<string, 'idle' | 'sending' | 'sent' | 'error'>>({})

  // Per-yacht invite forms
  const [yachtInviteForms, setYachtInviteForms] = useState<Record<string, boolean>>({})
  const [inviteName, setInviteName] = useState('')
  const [inviteContact, setInviteContact] = useState('')
  const [invitingYacht, setInvitingYacht] = useState<string | null>(null)

  // Generic invite
  const [genericName, setGenericName] = useState('')
  const [genericContact, setGenericContact] = useState('')
  const [sendingGeneric, setSendingGeneric] = useState(false)

  // Share link
  const [shareLink, setShareLink] = useState<string | null>(null)
  const [loadingShareLink, setLoadingShareLink] = useState(false)

  const fetchShareLink = useCallback(async () => {
    if (yachtGroups.length === 0) return
    setLoadingShareLink(true)
    try {
      const res = await fetch('/api/endorsement-requests/share-link', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ yacht_id: yachtGroups[0].id }),
      })
      const data = await res.json()
      if (data.ok && data.deep_link) {
        setShareLink(data.deep_link)
      }
    } catch { /* non-fatal */ }
    setLoadingShareLink(false)
  }, [yachtGroups])

  useEffect(() => { fetchShareLink() }, [fetchShareLink])

  function toggleYacht(yachtId: string) {
    setExpandedYachts((prev) => {
      const next = new Set(prev)
      if (next.has(yachtId)) next.delete(yachtId)
      else next.add(yachtId)
      return next
    })
  }

  async function sendToColleague(colleague: ColleagueOption, yachtId: string, yachtName: string) {
    if (remaining === 0) {
      toast('Daily request limit reached.', 'error')
      return
    }
    const key = `${colleague.id}-${yachtId}`
    setColleagueStates((prev) => ({ ...prev, [key]: 'sending' }))
    try {
      const res = await fetch('/api/endorsement-requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          yacht_id: yachtId,
          yacht_name: yachtName,
          recipient_user_id: colleague.isGhost ? undefined : colleague.id,
          recipient_email: colleague.email,
        }),
      })
      const data = await res.json()
      if (res.ok && (data.ok || data.skipped)) {
        setColleagueStates((prev) => ({ ...prev, [key]: 'sent' }))
        setRemaining((r) => Math.max(0, r - 1))
        toast(`Request sent to ${colleague.name}`, 'success')
      } else {
        setColleagueStates((prev) => ({ ...prev, [key]: 'error' }))
        toast('Failed to send request.', 'error')
      }
    } catch {
      setColleagueStates((prev) => ({ ...prev, [key]: 'error' }))
      toast('Failed to send request.', 'error')
    }
  }

  async function sendReminder(requestId: string, colleagueName: string) {
    setReminderStates((prev) => ({ ...prev, [requestId]: 'sending' }))
    try {
      const res = await fetch(`/api/endorsement-requests/${requestId}/remind`, {
        method: 'POST',
      })
      if (res.ok) {
        setReminderStates((prev) => ({ ...prev, [requestId]: 'sent' }))
        toast(`Reminder sent to ${colleagueName}`, 'success')
      } else {
        toast('Could not send reminder.', 'error')
        setReminderStates((prev) => ({ ...prev, [requestId]: 'idle' }))
      }
    } catch {
      toast('Could not send reminder.', 'error')
      setReminderStates((prev) => ({ ...prev, [requestId]: 'idle' }))
    }
  }

  async function handleYachtInvite(yachtId: string, yachtName: string) {
    if (!inviteName.trim() || (!isValidEmail(inviteContact) && !isValidPhone(inviteContact))) {
      toast('Enter a name and valid email or phone.', 'error')
      return
    }
    setInvitingYacht(yachtId)
    try {
      const isEmail = isValidEmail(inviteContact)
      const res = await fetch('/api/endorsement-requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          yacht_id: yachtId,
          yacht_name: yachtName,
          recipient_name: inviteName.trim(),
          recipient_email: isEmail ? inviteContact.trim().toLowerCase() : undefined,
          recipient_phone: !isEmail ? normalizePhone(inviteContact) : undefined,
        }),
      })
      if (res.ok) {
        toast(`Invitation sent to ${inviteName}`, 'success')
        setInviteName('')
        setInviteContact('')
        setYachtInviteForms((prev) => ({ ...prev, [yachtId]: false }))
        setRemaining((r) => Math.max(0, r - 1))
      } else {
        toast('Failed to send invitation.', 'error')
      }
    } catch {
      toast('Failed to send invitation.', 'error')
    } finally {
      setInvitingYacht(null)
    }
  }

  async function handleGenericInvite() {
    if (!genericName.trim() || (!isValidEmail(genericContact) && !isValidPhone(genericContact))) {
      toast('Enter a name and valid email or phone.', 'error')
      return
    }
    setSendingGeneric(true)
    try {
      const isEmail = isValidEmail(genericContact)
      const res = await fetch('/api/endorsement-requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          yacht_id: yachtGroups[0]?.id,
          yacht_name: yachtGroups[0]?.name ?? '',
          recipient_name: genericName.trim(),
          recipient_email: isEmail ? genericContact.trim().toLowerCase() : undefined,
          recipient_phone: !isEmail ? normalizePhone(genericContact) : undefined,
        }),
      })
      if (res.ok) {
        toast(`Invitation sent to ${genericName}`, 'success')
        setGenericName('')
        setGenericContact('')
        setRemaining((r) => Math.max(0, r - 1))
      } else {
        toast('Failed to send invitation.', 'error')
      }
    } catch {
      toast('Failed to send invitation.', 'error')
    } finally {
      setSendingGeneric(false)
    }
  }

  async function copyLink() {
    if (!shareLink) return
    try {
      await navigator.clipboard.writeText(shareLink)
      toast('Link copied!', 'success')
    } catch {
      toast('Could not copy link.', 'error')
    }
  }

  function openWhatsApp() {
    if (!shareLink) return
    const text = encodeURIComponent(
      `Hey! I'd love an endorsement from you on YachtieLink. It only takes a couple of minutes: ${shareLink}`
    )
    window.open(`https://wa.me/?text=${text}`, '_blank')
  }

  return (
    <div className="min-h-screen bg-[var(--color-navy-50,var(--color-surface))] pb-24 -mx-4 px-4 md:-mx-6 md:px-6">
      <PageHeader backHref="/app/network" title="Request Endorsements" />

      {/* ── YOUR COLLEAGUES — yacht-grouped ──────────────────────── */}
      <div className="mb-6">
        <h2 className="text-xs font-semibold uppercase tracking-wide text-[var(--color-navy-600,var(--color-text-tertiary))] mb-3">
          Your Colleagues
        </h2>

        <div className="flex flex-col gap-2">
          {yachtGroups.map((yacht) => {
            const isExpanded = expandedYachts.has(yacht.id)
            const realColleagues = yacht.colleagues.filter((c) => !c.isGhost)
            const ghostColleagues = yacht.colleagues.filter((c) => c.isGhost)
            const dateRange = formatDateRange(yacht.startDate, yacht.endDate)
            const showInviteForm = yachtInviteForms[yacht.id] ?? false

            return (
              <div key={yacht.id} className="bg-[var(--color-surface)] rounded-2xl overflow-hidden">
                {/* Yacht header */}
                <button
                  type="button"
                  onClick={() => toggleYacht(yacht.id)}
                  className="w-full flex items-center gap-3 p-4 text-left hover:bg-[var(--color-surface-raised)]/30 transition-colors"
                >
                  <div className="w-12 h-12 rounded-xl bg-[var(--color-navy-100,var(--color-surface-raised))] overflow-hidden shrink-0 flex items-center justify-center">
                    {yacht.coverPhotoUrl ? (
                      <Image
                        src={yacht.coverPhotoUrl}
                        alt={yacht.name}
                        width={48}
                        height={48}
                        className="object-cover w-full h-full"
                      />
                    ) : (
                      <Anchor size={20} className="text-[var(--color-navy-400,var(--color-text-tertiary))]" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-[var(--color-text-primary)] truncate">
                      {yacht.name}
                    </p>
                    <p className="text-xs text-[var(--color-text-secondary)]">
                      {yacht.userRole && <span>{yacht.userRole} &middot; </span>}
                      {dateRange}
                      {yacht.colleagues.length > 0 && <span> &middot; {yacht.colleagues.length} crew</span>}
                    </p>
                  </div>
                  <ChevronDown
                    size={16}
                    className={`text-[var(--color-text-tertiary)] transition-transform shrink-0 ${isExpanded ? 'rotate-180' : ''}`}
                  />
                </button>

                {/* Expanded content */}
                {isExpanded && (
                  <div className="px-4 pb-4">
                    {realColleagues.length > 0 && (
                      <div className="divide-y divide-[var(--color-border)]">
                        {realColleagues.map((colleague) => {
                          const key = `${colleague.id}-${yacht.id}`
                          const state = colleagueStates[key] ?? 'idle'
                          const isActionable = !colleague.alreadyEndorsed && colleague.existingRequestStatus !== 'accepted'
                          const isPending = colleague.existingRequestStatus === 'pending'
                          const reminderStatus = canRemind(colleague.requestCreatedAt)
                          const reminderState = colleague.requestId ? (reminderStates[colleague.requestId] ?? 'idle') : 'idle'

                          return (
                            <div key={colleague.id} className="flex items-center gap-3 py-3">
                              <div className="w-9 h-9 rounded-full bg-[var(--color-surface-raised)] overflow-hidden shrink-0 flex items-center justify-center">
                                {colleague.profilePhotoUrl ? (
                                  <Image
                                    src={colleague.profilePhotoUrl}
                                    alt={colleague.name}
                                    width={36}
                                    height={36}
                                    className="object-cover w-full h-full"
                                  />
                                ) : (
                                  <span className="text-xs font-semibold text-[var(--color-text-secondary)]">
                                    {colleague.name.split(' ').map((n) => n[0]).join('').slice(0, 2)}
                                  </span>
                                )}
                              </div>
                              <div className="min-w-0 flex-1">
                                <p className="text-sm font-medium text-[var(--color-text-primary)] truncate">
                                  {colleague.name}
                                </p>
                                {colleague.primaryRole && (
                                  <p className="text-xs text-[var(--color-text-secondary)]">{colleague.primaryRole}</p>
                                )}
                              </div>
                              <div className="shrink-0 flex items-center gap-1.5">
                                {colleague.alreadyEndorsed ? (
                                  <StatusPill status="accepted" />
                                ) : state === 'sent' ? (
                                  <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-emerald-500/10 text-emerald-400">
                                    Sent
                                  </span>
                                ) : isPending ? (
                                  <div className="flex items-center gap-1.5">
                                    <StatusPill status="pending" />
                                    {reminderStatus === 'available' && colleague.requestId && reminderState !== 'sent' && (
                                      <button
                                        type="button"
                                        onClick={() => sendReminder(colleague.requestId!, colleague.name)}
                                        disabled={reminderState === 'sending'}
                                        className="text-[10px] text-[var(--color-interactive)] font-medium"
                                      >
                                        {reminderState === 'sending' ? '...' : 'Remind'}
                                      </button>
                                    )}
                                    {reminderStatus === 'too_soon' && (
                                      <span className="text-[10px] text-[var(--color-text-tertiary)]">
                                        Remind in {daysUntilRemind(colleague.requestCreatedAt)}d
                                      </span>
                                    )}
                                    {reminderState === 'sent' && (
                                      <span className="text-[10px] text-[var(--color-text-tertiary)]">Reminded</span>
                                    )}
                                  </div>
                                ) : isActionable ? (
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => sendToColleague(colleague, yacht.id, yacht.name)}
                                    disabled={state === 'sending' || remaining === 0}
                                    loading={state === 'sending'}
                                    className="text-xs rounded-full border-[var(--color-interactive)] text-[var(--color-interactive)] hover:bg-[var(--color-interactive)]/5"
                                  >
                                    Request
                                  </Button>
                                ) : colleague.existingRequestStatus ? (
                                  <StatusPill status={colleague.existingRequestStatus} />
                                ) : null}
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    )}

                    {/* Ghost colleagues */}
                    {ghostColleagues.length > 0 && (
                      <>
                        <div className="flex items-center gap-2 mt-3 mb-2">
                          <div className="flex-1 h-px bg-[var(--color-border)]" />
                          <span className="text-[10px] text-[var(--color-text-tertiary)] uppercase tracking-wide">
                            not on platform
                          </span>
                          <div className="flex-1 h-px bg-[var(--color-border)]" />
                        </div>
                        <div className="divide-y divide-[var(--color-border)]">
                          {ghostColleagues.map((ghost) => {
                            const key = `${ghost.id}-${yacht.id}`
                            const state = colleagueStates[key] ?? 'idle'
                            return (
                              <div key={ghost.id} className="flex items-center gap-3 py-3">
                                <div className="w-9 h-9 rounded-full bg-[var(--color-surface-raised)] overflow-hidden shrink-0 flex items-center justify-center">
                                  <span className="text-xs font-semibold text-[var(--color-text-tertiary)]">
                                    {ghost.name.split(' ').map((n) => n[0]).join('').slice(0, 2)}
                                  </span>
                                </div>
                                <div className="min-w-0 flex-1">
                                  <p className="text-sm font-medium text-[var(--color-text-primary)] truncate">
                                    {ghost.name}
                                  </p>
                                  {ghost.primaryRole && (
                                    <p className="text-xs text-[var(--color-text-tertiary)]">{ghost.primaryRole}</p>
                                  )}
                                </div>
                                <div className="shrink-0">
                                  {state === 'sent' ? (
                                    <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-emerald-500/10 text-emerald-400">
                                      Invited
                                    </span>
                                  ) : (
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => sendToColleague(ghost, yacht.id, yacht.name)}
                                      disabled={state === 'sending' || remaining === 0}
                                      loading={state === 'sending'}
                                      className="text-xs rounded-full border-[var(--color-text-tertiary)] text-[var(--color-text-secondary)]"
                                    >
                                      Invite
                                    </Button>
                                  )}
                                </div>
                              </div>
                            )
                          })}
                        </div>
                      </>
                    )}

                    {/* Per-yacht invite CTA */}
                    {!showInviteForm ? (
                      <button
                        type="button"
                        onClick={() => {
                          setInviteName('')
                          setInviteContact('')
                          setYachtInviteForms((prev) => ({ ...prev, [yacht.id]: true }))
                        }}
                        className="flex items-center gap-2 mt-3 text-xs font-medium text-[var(--color-interactive)]"
                      >
                        <UserPlus size={14} />
                        Invite someone from {yacht.name}
                      </button>
                    ) : (
                      <div className="mt-3 p-3 rounded-xl bg-[var(--color-surface-raised)] flex flex-col gap-2">
                        <p className="text-xs font-medium text-[var(--color-text-primary)]">
                          Invite to endorse from {yacht.name}
                        </p>
                        <Input
                          type="text"
                          value={inviteName}
                          onChange={(e) => setInviteName(e.target.value)}
                          placeholder="Their name"
                        />
                        <Input
                          type="text"
                          value={inviteContact}
                          onChange={(e) => setInviteContact(e.target.value)}
                          placeholder="Email or phone"
                        />
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            onClick={() => handleYachtInvite(yacht.id, yacht.name)}
                            disabled={invitingYacht === yacht.id || remaining === 0}
                            loading={invitingYacht === yacht.id}
                            className="flex-1 gap-1"
                          >
                            <Send size={12} />
                            Send
                          </Button>
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => {
                              setYachtInviteForms((prev) => ({ ...prev, [yacht.id]: false }))
                              setInviteName('')
                              setInviteContact('')
                            }}
                          >
                            Cancel
                          </Button>
                        </div>
                      </div>
                    )}

                    {yacht.colleagues.length === 0 && (
                      <p className="text-sm text-[var(--color-text-secondary)] py-3">
                        No colleagues found for this yacht. Invite someone below.
                      </p>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* ── INVITE A FORMER COLLEAGUE ────────────────────────────── */}
      <div className="bg-[var(--color-surface)] rounded-2xl p-4 mb-6">
        <h2 className="text-xs font-semibold uppercase tracking-wide text-[var(--color-navy-600,var(--color-text-tertiary))] mb-2">
          Invite a Former Colleague
        </h2>
        <p className="text-xs text-[var(--color-text-secondary)] mb-3">
          Invite anyone to endorse you — they can write one even without an account.
        </p>
        <div className="flex flex-col gap-2">
          <Input
            type="text"
            value={genericName}
            onChange={(e) => setGenericName(e.target.value)}
            placeholder="Their name"
          />
          <Input
            type="text"
            value={genericContact}
            onChange={(e) => setGenericContact(e.target.value)}
            placeholder="Email or phone"
          />
          <Button
            onClick={handleGenericInvite}
            disabled={sendingGeneric || remaining === 0}
            loading={sendingGeneric}
            className="w-full gap-1.5"
          >
            <Send size={14} />
            Send invitation
          </Button>
        </div>

        <div className="mt-3 pt-3 border-t border-[var(--color-border)]">
          <p className="text-xs text-[var(--color-text-tertiary)] mb-2">or share via:</p>
          <div className="flex gap-2">
            <Button
              onClick={openWhatsApp}
              disabled={!shareLink}
              className="flex-1 gap-2 bg-[#25D366] hover:bg-[#20bd5a] text-white"
              size="sm"
            >
              WhatsApp
            </Button>
            <Button
              variant="secondary"
              onClick={copyLink}
              disabled={!shareLink || loadingShareLink}
              className="flex-1 gap-2"
              size="sm"
            >
              Copy Link
            </Button>
          </div>
        </div>
      </div>

      <p className={`text-xs text-center ${remaining === 0 ? 'text-[var(--color-error)]' : 'text-[var(--color-text-tertiary)]'}`}>
        {remaining}/{limit} requests remaining today
      </p>
    </div>
  )
}

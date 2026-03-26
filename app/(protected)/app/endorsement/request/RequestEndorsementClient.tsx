'use client'

import { useState, useEffect, useCallback } from 'react'
import Image from 'next/image'
import { Button } from '@/components/ui/Button'
import { BackButton } from '@/components/ui/BackButton'
import { Input } from '@/components/ui'
import { useToast } from '@/components/ui/Toast'
import { sendEndorsementRequest, sendBatchRequests } from '@/lib/endorsements/send-request'

// ── Types ────────────────────────────────────────────────────────────────────

interface ColleagueOption {
  id: string
  name: string
  email: string | null
  profile_photo_url: string | null
  primary_role: string | null
  existingRequestStatus: 'pending' | 'accepted' | 'expired' | 'cancelled' | null
  alreadyEndorsed: boolean
}

interface RequestEndorsementClientProps {
  yacht: { id: string; name: string; yacht_type: string | null; cover_photo_url: string | null }
  colleagues: ColleagueOption[]
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

function isValidEmail(v: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)
}

function isValidPhone(v: string): boolean {
  // Accept numbers with optional + prefix, spaces, dashes (min 7 digits)
  const digits = v.replace(/[\s\-()]/g, '')
  return /^\+?\d{7,15}$/.test(digits)
}

function normalizePhone(v: string): string {
  return v.replace(/[\s\-()]/g, '')
}

// ── Component ────────────────────────────────────────────────────────────────

export function RequestEndorsementClient({
  yacht,
  colleagues,
  remaining: initialRemaining,
  limit,
  userId: _userId,
}: RequestEndorsementClientProps) {
  const { toast } = useToast()

  // Contact input (email or phone)
  const [inputValue, setInputValue] = useState('')
  const [contacts, setContacts] = useState<{ type: 'email' | 'phone'; value: string }[]>([])
  const [sending, setSending] = useState(false)
  const [remaining, setRemaining] = useState(initialRemaining)

  // Share link (eagerly fetched)
  const [shareLink, setShareLink] = useState<string | null>(null)
  const [loadingShareLink, setLoadingShareLink] = useState(false)

  // Colleague request states
  const [colleagueStates, setColleagueStates] = useState<
    Record<string, 'idle' | 'sending' | 'sent' | 'error'>
  >({})

  // Eagerly fetch shareable link on mount
  const fetchShareLink = useCallback(async () => {
    setLoadingShareLink(true)
    try {
      const res = await fetch('/api/endorsement-requests/share-link', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ yacht_id: yacht.id }),
      })
      const data = await res.json()
      if (data.ok && data.deep_link) {
        setShareLink(data.deep_link)
      }
    } catch {
      // Non-fatal
    }
    setLoadingShareLink(false)
  }, [yacht.id])

  useEffect(() => {
    fetchShareLink()
  }, [fetchShareLink])

  // ── Contact input handlers ─────────────────────────────────────────────────

  function addContact() {
    const trimmed = inputValue.trim()
    if (!trimmed) return

    if (isValidEmail(trimmed)) {
      if (contacts.some((c) => c.type === 'email' && c.value === trimmed.toLowerCase())) {
        toast('Already added.', 'error')
        return
      }
      setContacts((prev) => [...prev, { type: 'email', value: trimmed.toLowerCase() }])
      setInputValue('')
    } else if (isValidPhone(trimmed)) {
      const normalized = normalizePhone(trimmed)
      if (contacts.some((c) => c.type === 'phone' && c.value === normalized)) {
        toast('Already added.', 'error')
        return
      }
      setContacts((prev) => [...prev, { type: 'phone', value: normalized }])
      setInputValue('')
    } else {
      toast('Enter a valid email or phone number.', 'error')
    }
  }

  function removeContact(idx: number) {
    setContacts((prev) => prev.filter((_, i) => i !== idx))
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') {
      e.preventDefault()
      addContact()
    }
  }

  // ── Send to colleague (direct) ─────────────────────────────────────────────

  async function sendToColleague(colleague: ColleagueOption) {
    if (remaining === 0) {
      toast('Daily request limit reached.', 'error')
      return
    }
    setColleagueStates((prev) => ({ ...prev, [colleague.id]: 'sending' }))
    const result = await sendEndorsementRequest({
      yacht_id: yacht.id,
      yacht_name: yacht.name,
      recipient_user_id: colleague.id,
      recipient_email: colleague.email ?? undefined,
    })
    if (result.ok) {
      setColleagueStates((prev) => ({ ...prev, [colleague.id]: 'sent' }))
      setRemaining((r) => Math.max(0, r - 1))
      toast(`Request sent to ${colleague.name}`, 'success')
    } else {
      setColleagueStates((prev) => ({ ...prev, [colleague.id]: 'error' }))
      toast(result.error ?? 'Failed to send request.', 'error')
    }
  }

  // ── Send to manual contacts ────────────────────────────────────────────────

  async function handleSendContacts() {
    if (contacts.length === 0) return
    if (remaining === 0) {
      toast('Daily request limit reached.', 'error')
      return
    }

    setSending(true)
    const { successCount, failCount } = await sendBatchRequests(yacht.id, yacht.name, contacts)
    setSending(false)

    if (successCount > 0) {
      toast(`Sent to ${successCount} contact${successCount === 1 ? '' : 's'}.`, 'success')
      setContacts([])
      setRemaining((r) => Math.max(0, r - successCount))
    }
    if (failCount > 0) {
      toast(`${failCount} request${failCount === 1 ? '' : 's'} failed.`, 'error')
    }
  }

  // ── Share actions ──────────────────────────────────────────────────────────

  async function copyLink() {
    const link = shareLink
    if (!link) return
    try {
      await navigator.clipboard.writeText(link)
      toast('Link copied!', 'success')
    } catch {
      toast('Could not copy link.', 'error')
    }
  }

  function openWhatsApp() {
    if (!shareLink) return
    const text = encodeURIComponent(
      `Hey! I'd love an endorsement from you for my time on ${yacht.name} on YachtieLink. It only takes a couple of minutes: ${shareLink}`
    )
    window.open(`https://wa.me/?text=${text}`, '_blank')
  }

  async function nativeShare() {
    if (!shareLink) return
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Endorse me on YachtieLink',
          text: `I'd love an endorsement from you for my time on ${yacht.name}. It only takes a couple of minutes.`,
          url: shareLink,
        })
      } catch {
        // User cancelled
      }
    } else {
      await copyLink()
    }
  }

  const canSend = contacts.length > 0 && remaining > 0 && !sending
  const actionableColleagues = colleagues.filter(
    (c) => !c.alreadyEndorsed && c.existingRequestStatus !== 'pending' && c.existingRequestStatus !== 'accepted'
  )
  const inactiveColleagues = colleagues.filter(
    (c) => c.alreadyEndorsed || c.existingRequestStatus === 'pending' || c.existingRequestStatus === 'accepted'
  )

  return (
    <div className="min-h-screen bg-[var(--color-surface)] px-4 pt-8 pb-24">
      <div className="flex items-center gap-3 mb-6">
        <BackButton href="/app/network" />
        <h1 className="text-[28px] font-bold tracking-tight text-[var(--color-text-primary)]">
          Request endorsements
        </h1>
      </div>

      {/* Yacht card */}
      <div className="bg-[var(--color-surface-raised)] rounded-2xl px-4 py-3 mb-6 flex items-center gap-3">
        {yacht.cover_photo_url && (
          <div className="w-10 h-10 rounded-lg overflow-hidden shrink-0">
            <Image
              src={yacht.cover_photo_url}
              alt={yacht.name}
              width={40}
              height={40}
              className="object-cover w-full h-full"
            />
          </div>
        )}
        <div>
          <p className="font-semibold text-sm text-[var(--color-text-primary)]">{yacht.name}</p>
          {yacht.yacht_type && (
            <p className="text-xs text-[var(--color-text-secondary)]">{yacht.yacht_type}</p>
          )}
        </div>
      </div>

      {/* ── Share section (always visible, most prominent) ──────────────────── */}
      <div className="bg-[var(--color-surface)] rounded-2xl p-4 mb-6">
        <h2 className="text-sm font-semibold text-[var(--color-text-primary)] mb-1">
          Share with anyone
        </h2>
        <p className="text-xs text-[var(--color-text-secondary)] mb-4">
          Send this link to anyone you worked with — they can write an endorsement even without an account.
        </p>

        <div className="flex gap-2">
          <Button
            onClick={openWhatsApp}
            disabled={!shareLink}
            className="flex-1 gap-2 bg-[#25D366] hover:bg-[#20bd5a] text-white"
            size="sm"
          >
            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
            </svg>
            WhatsApp
          </Button>

          <Button
            variant="secondary"
            onClick={copyLink}
            disabled={!shareLink}
            className="flex-1 gap-2"
            size="sm"
          >
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.666 3.888A2.25 2.25 0 0 0 13.5 2.25h-3c-1.03 0-1.9.693-2.166 1.638m7.332 0c.055.194.084.4.084.612v0a.75.75 0 0 1-.75.75H9.75a.75.75 0 0 1-.75-.75v0c0-.212.03-.418.084-.612m7.332 0c.646.049 1.288.11 1.927.184 1.1.128 1.907 1.077 1.907 2.185V19.5a2.25 2.25 0 0 1-2.25 2.25H6.75A2.25 2.25 0 0 1 4.5 19.5V6.257c0-1.108.806-2.057 1.907-2.185a48.208 48.208 0 0 1 1.927-.184" />
            </svg>
            Copy Link
          </Button>

          <Button
            variant="icon"
            onClick={nativeShare}
            disabled={!shareLink}
            aria-label="Share via..."
            className="shrink-0 h-9 w-9 bg-[var(--color-surface-raised)] hover:bg-[var(--color-surface-overlay)]"
          >
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M7.217 10.907a2.25 2.25 0 1 0 0 2.186m0-2.186c.18.324.283.696.283 1.093s-.103.77-.283 1.093m0-2.186 9.566-5.314m-9.566 7.5 9.566 5.314m0 0a2.25 2.25 0 1 0 3.935 2.186 2.25 2.25 0 0 0-3.935-2.186Zm0-12.814a2.25 2.25 0 1 0 3.935-2.186 2.25 2.25 0 0 0-3.935 2.186Z" />
            </svg>
          </Button>
        </div>

        {loadingShareLink && (
          <p className="text-xs text-[var(--color-text-tertiary)] mt-2">Generating link...</p>
        )}
      </div>

      {/* ── Colleagues section (actionable) ────────────────────────────────── */}
      {actionableColleagues.length > 0 && (
        <div className="mb-6">
          <h2 className="text-sm font-semibold text-[var(--color-text-secondary)] uppercase tracking-wide mb-3">
            Colleagues on {yacht.name}
          </h2>
          <div className="flex flex-col gap-2">
            {actionableColleagues.map((colleague) => {
              const state = colleagueStates[colleague.id] ?? 'idle'
              return (
                <div
                  key={colleague.id}
                  className="bg-[var(--color-surface)] rounded-2xl p-3 flex items-center gap-3"
                >
                  <div className="w-9 h-9 rounded-full bg-[var(--color-surface-raised)] overflow-hidden shrink-0">
                    {colleague.profile_photo_url ? (
                      <Image
                        src={colleague.profile_photo_url}
                        alt={colleague.name}
                        width={36}
                        height={36}
                        className="object-cover w-full h-full"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-sm font-semibold text-[var(--color-text-secondary)]">
                        {colleague.name[0]?.toUpperCase()}
                      </div>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-[var(--color-text-primary)] truncate">
                      {colleague.name}
                    </p>
                    {colleague.primary_role && (
                      <p className="text-xs text-[var(--color-text-secondary)] truncate">
                        {colleague.primary_role}
                      </p>
                    )}
                  </div>
                  <div className="shrink-0">
                    {state === 'sent' ? (
                      <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-emerald-500/10 text-emerald-400">
                        Sent
                      </span>
                    ) : (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => sendToColleague(colleague)}
                        disabled={state === 'sending' || remaining === 0}
                        loading={state === 'sending'}
                        className="text-xs rounded-full border-[var(--color-interactive)] text-[var(--color-interactive)] hover:bg-[var(--color-interactive)]/5"
                      >
                        {state === 'sending' ? 'Sending...' : 'Request'}
                      </Button>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Already endorsed / pending colleagues */}
      {inactiveColleagues.length > 0 && (
        <div className="mb-6">
          {actionableColleagues.length > 0 && (
            <div className="border-t border-[var(--color-border)] my-4" />
          )}
          <div className="flex flex-col gap-2">
            {inactiveColleagues.map((colleague) => (
              <div
                key={colleague.id}
                className="bg-[var(--color-surface)] rounded-2xl p-3 flex items-center gap-3 opacity-60"
              >
                <div className="w-9 h-9 rounded-full bg-[var(--color-surface-raised)] overflow-hidden shrink-0">
                  {colleague.profile_photo_url ? (
                    <Image
                      src={colleague.profile_photo_url}
                      alt={colleague.name}
                      width={36}
                      height={36}
                      className="object-cover w-full h-full"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-sm font-semibold text-[var(--color-text-secondary)]">
                      {colleague.name[0]?.toUpperCase()}
                    </div>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-[var(--color-text-primary)] truncate">
                    {colleague.name}
                  </p>
                  {colleague.primary_role && (
                    <p className="text-xs text-[var(--color-text-secondary)] truncate">
                      {colleague.primary_role}
                    </p>
                  )}
                </div>
                <div className="shrink-0">
                  {colleague.alreadyEndorsed ? (
                    <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-emerald-500/10 text-emerald-400">
                      Endorsed
                    </span>
                  ) : colleague.existingRequestStatus ? (
                    <StatusPill status={colleague.existingRequestStatus} />
                  ) : null}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Invite by email or phone ───────────────────────────────────────── */}
      <div className="mb-6">
        <h2 className="text-sm font-semibold text-[var(--color-text-secondary)] uppercase tracking-wide mb-3">
          Invite by email or phone
        </h2>
        <div className="flex gap-2">
          <Input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Email or phone number"
            className="flex-1"
          />
          <Button variant="secondary" size="sm" onClick={addContact} type="button">
            Add
          </Button>
        </div>

        {/* Contact chips */}
        {contacts.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-3">
            {contacts.map((contact, idx) => (
              <span
                key={`${contact.type}-${contact.value}`}
                className="flex items-center gap-1.5 bg-[var(--color-surface-raised)] text-[var(--color-text-primary)] text-sm rounded-full px-3 py-1"
              >
                {contact.type === 'phone' && (
                  <svg className="h-3 w-3 text-[var(--color-text-tertiary)]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 0 0 2.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 0 1-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 0 0-1.091-.852H4.5A2.25 2.25 0 0 0 2.25 4.5v2.25Z" />
                  </svg>
                )}
                {contact.value}
                <button
                  onClick={() => removeContact(idx)}
                  aria-label={`Remove ${contact.value}`}
                  className="text-[var(--color-text-tertiary)] hover:text-[var(--color-text-primary)] transition-colors"
                >
                  <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                  </svg>
                </button>
              </span>
            ))}
          </div>
        )}

        {contacts.length > 0 && (
          <Button
            onClick={handleSendContacts}
            disabled={!canSend}
            loading={sending}
            className="w-full mt-4"
            size="lg"
          >
            {sending
              ? 'Sending...'
              : `Send ${contacts.length} request${contacts.length === 1 ? '' : 's'}`}
          </Button>
        )}
      </div>

      {/* Rate limit */}
      <p className={`text-xs ${remaining === 0 ? 'text-[var(--color-error)]' : 'text-[var(--color-text-tertiary)]'}`}>
        {remaining}/{limit} requests remaining today
      </p>
    </div>
  )
}

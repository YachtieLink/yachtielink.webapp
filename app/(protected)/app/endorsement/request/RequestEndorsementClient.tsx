'use client'

import { useState } from 'react'
import Image from 'next/image'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui'
import { useToast } from '@/components/ui/Toast'

interface ColleagueOption {
  id: string
  name: string
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

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

export function RequestEndorsementClient({
  yacht,
  colleagues,
  remaining,
  limit,
  userId: _userId,
}: RequestEndorsementClientProps) {
  const { toast } = useToast()
  const [inputValue, setInputValue] = useState('')
  const [emails, setEmails] = useState<string[]>([])
  const [sending, setSending] = useState(false)
  const [sentDeepLink, setSentDeepLink] = useState<string | null>(null)
  const [results, setResults] = useState<{ email: string; ok: boolean }[]>([])

  function addEmail() {
    const trimmed = inputValue.trim().toLowerCase()
    if (!trimmed) return
    if (!isValidEmail(trimmed)) {
      toast('Please enter a valid email address.', 'error')
      return
    }
    if (emails.includes(trimmed)) {
      toast('That email is already added.', 'error')
      return
    }
    setEmails((prev) => [...prev, trimmed])
    setInputValue('')
  }

  function removeEmail(email: string) {
    setEmails((prev) => prev.filter((e) => e !== email))
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') {
      e.preventDefault()
      addEmail()
    }
  }

  async function handleSend() {
    if (emails.length === 0) return
    if (remaining === 0) {
      toast('You have reached your daily request limit.', 'error')
      return
    }

    setSending(true)
    const newResults: { email: string; ok: boolean }[] = []
    let lastDeepLink: string | null = null

    for (const email of emails) {
      try {
        const res = await fetch('/api/endorsement-requests', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            yacht_id: yacht.id,
            yacht_name: yacht.name,
            recipient_email: email,
          }),
        })
        const data = await res.json() as { ok?: boolean; deep_link?: string; error?: string }
        if (res.ok && data.ok) {
          newResults.push({ email, ok: true })
          if (data.deep_link) lastDeepLink = data.deep_link
        } else {
          newResults.push({ email, ok: false })
        }
      } catch {
        newResults.push({ email, ok: false })
      }
    }

    setSending(false)
    setResults(newResults)
    const successCount = newResults.filter((r) => r.ok).length
    if (successCount > 0) {
      toast(`Sent to ${successCount} colleague${successCount === 1 ? '' : 's'}.`, 'success')
      setEmails([])
      if (lastDeepLink) setSentDeepLink(lastDeepLink)
    }
    const failCount = newResults.filter((r) => !r.ok).length
    if (failCount > 0) {
      toast(`${failCount} request${failCount === 1 ? '' : 's'} failed.`, 'error')
    }
  }

  async function copyLink() {
    if (!sentDeepLink) return
    try {
      await navigator.clipboard.writeText(sentDeepLink)
      toast('Link copied!', 'success')
    } catch {
      toast('Could not copy link.', 'error')
    }
  }

  async function shareLink() {
    if (!sentDeepLink) return
    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({
          title: 'Endorse me on YachtieLink',
          text: `I'd love an endorsement from you for my time on ${yacht.name}. It only takes a couple of minutes.`,
          url: sentDeepLink,
        })
      } catch {
        // User dismissed share sheet — no action needed
      }
    } else {
      await copyLink()
    }
  }

  const canNativeShare = typeof navigator !== 'undefined' && !!navigator.share
  const canSend = emails.length > 0 && remaining > 0 && !sending

  return (
    <div className="min-h-screen bg-[var(--color-surface)] px-4 pt-8 pb-24">
      <h1 className="text-xl font-bold text-[var(--color-text-primary)] mb-6">
        Request endorsements
      </h1>

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

      {/* Colleagues section (display only) */}
      {colleagues.length > 0 && (
        <div className="mb-6">
          <h2 className="text-sm font-semibold text-[var(--color-text-secondary)] uppercase tracking-wide mb-3">
            Colleagues on this yacht
          </h2>
          <div className="flex flex-col gap-2">
            {colleagues.map((colleague) => (
              <div
                key={colleague.id}
                className="bg-[var(--card)] rounded-2xl p-3 flex items-center gap-3"
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
          <p className="text-xs text-[var(--color-text-tertiary)] mt-2">
            Add their email below to send a request.
          </p>
        </div>
      )}

      {/* Manual email input */}
      <div className="mb-6">
        <h2 className="text-sm font-semibold text-[var(--color-text-secondary)] uppercase tracking-wide mb-3">
          Send by email
        </h2>
        <div className="flex gap-2">
          <Input
            type="email"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="colleague@email.com"
            className="flex-1"
          />
          <Button variant="secondary" size="sm" onClick={addEmail} type="button">
            Add
          </Button>
        </div>

        {/* Email chips */}
        {emails.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-3">
            {emails.map((email) => (
              <span
                key={email}
                className="flex items-center gap-1.5 bg-[var(--color-surface-raised)] text-[var(--color-text-primary)] text-sm rounded-full px-3 py-1"
              >
                {email}
                <button
                  onClick={() => removeEmail(email)}
                  aria-label={`Remove ${email}`}
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
      </div>

      {/* Rate limit display */}
      <p className={`text-xs mb-6 ${remaining === 0 ? 'text-red-400' : 'text-[var(--color-text-tertiary)]'}`}>
        {remaining}/{limit} requests remaining today
      </p>

      {/* Send CTA */}
      <Button
        onClick={handleSend}
        disabled={!canSend}
        loading={sending}
        className="w-full"
        size="lg"
      >
        {sending
          ? 'Sending…'
          : `Send ${emails.length} request${emails.length === 1 ? '' : 's'}`}
      </Button>

      {/* Failed results */}
      {results.filter((r) => !r.ok).length > 0 && (
        <div className="mt-4">
          <p className="text-xs text-[var(--color-text-secondary)] mb-1">Failed to send:</p>
          {results
            .filter((r) => !r.ok)
            .map((r) => (
              <p key={r.email} className="text-xs text-red-400">
                {r.email}
              </p>
            ))}
        </div>
      )}

      {/* Share link section */}
      {sentDeepLink && (
        <div className="mt-6 bg-[var(--color-surface-raised)] rounded-2xl p-4">
          <p className="text-sm font-medium text-[var(--color-text-primary)] mb-1">
            Or share a link
          </p>
          <p className="text-xs text-[var(--color-text-secondary)] mb-3">
            Anyone with this link can write you an endorsement for {yacht.name}.
          </p>
          <div className="flex items-center gap-2 bg-[var(--color-surface)] rounded-xl px-3 py-2 border border-[var(--color-border)]">
            <p className="text-xs text-[var(--color-text-tertiary)] truncate flex-1">
              {sentDeepLink}
            </p>
            <button
              onClick={copyLink}
              className="shrink-0 text-xs text-[var(--color-interactive)] font-medium hover:underline"
            >
              Copy
            </button>
          </div>
          {/* Native share button — opens WhatsApp, Messages, AirDrop etc on mobile */}
          {canNativeShare && (
            <button
              onClick={shareLink}
              className="mt-3 w-full flex items-center justify-center gap-2 h-11 rounded-xl border border-[var(--color-border)] text-sm font-medium text-[var(--color-text-primary)] hover:bg-[var(--color-surface-raised)] transition-colors"
            >
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 1 1 0-2.684m0 2.684 6.632 3.316m-6.632-6 6.632-3.316m0 0a3 3 0 1 0 5.367-2.684 3 3 0 0 0-5.367 2.684Zm0 9.316a3 3 0 1 0 5.368 2.684 3 3 0 0 0-5.368-2.684Z" />
              </svg>
              Share via…
            </button>
          )}
        </div>
      )}
    </div>
  )
}

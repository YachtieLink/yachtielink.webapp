'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

type SuggestedEndorsement = {
  text: string
}

type Props = {
  token: string
  requesterName: string
  yachtName: string
  prefillName?: string
  prefillRole?: string
  suggestedEndorsements?: SuggestedEndorsement[]
  isShareableLink?: boolean
}

/**
 * GhostEndorseForm — the endorsement writing form for unauthenticated visitors.
 * Submits to POST /api/endorsements/guest and redirects to the thank-you page.
 *
 * Three fields:
 *   1. Your name (pre-filled from request metadata if available)
 *   2. Your role on {yacht}
 *   3. Your endorsement (textarea, 10-2000 chars)
 *
 * Plus an optional email field for shareable-link flows.
 * Consent line above submit — submission IS the consent act (no checkbox needed).
 */
export function GhostEndorseForm({
  token,
  requesterName,
  yachtName,
  prefillName = '',
  prefillRole = '',
  suggestedEndorsements = [],
  isShareableLink = false,
}: Props) {
  const router = useRouter()

  const [name, setName]     = useState(prefillName)
  const [role, setRole]     = useState(prefillRole)
  const [content, setContent] = useState('')
  const [email, setEmail]   = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError]   = useState<string | null>(null)

  const remainingChars = 2000 - content.length
  const isValid = name.trim().length > 0 && content.trim().length >= 10

  function handleSuggestionTap(text: string) {
    setContent(text)
    // Focus will land at the end of the inserted text via the textarea's onFocus
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!isValid || submitting) return

    setSubmitting(true)
    setError(null)

    try {
      const body: Record<string, string> = { token, content: content.trim(), endorser_name: name.trim(), endorser_role: role.trim() }
      if (isShareableLink && email) body.endorser_email = email.trim()

      const res = await fetch('/api/endorsements/guest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })

      const json = await res.json()

      if (!res.ok) {
        if (json.code === 'user_exists') {
          // Redirect to login with returnTo preserved
          router.push(`/login?returnTo=${encodeURIComponent(`/r/${token}`)}`)
          return
        }
        if (json.code === 'already_submitted') {
          setError("You've already submitted an endorsement for this request.")
          return
        }
        setError(json.error ?? 'Something went wrong. Please try again.')
        return
      }

      // Success — navigate to the thank-you page
      router.push(`/endorse/${token}/success?ghost_id=${json.ghost_id}`)
    } catch {
      setError('Network error. Please check your connection and try again.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      {/* Suggested endorsement starters */}
      {suggestedEndorsements.length > 0 && (
        <div className="flex flex-col gap-2">
          <p className="text-xs text-[var(--color-text-secondary)] font-medium">
            Tap to start — then make it your own
          </p>
          <div className="flex flex-col gap-2">
            {suggestedEndorsements.slice(0, 4).map((s, i) => (
              <button
                key={i}
                type="button"
                onClick={() => handleSuggestionTap(s.text)}
                className="text-left px-3 py-2 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-raised)] text-sm text-[var(--color-text-secondary)] hover:border-[var(--color-teal-500)] hover:text-[var(--color-text-primary)] transition-colors line-clamp-2"
              >
                "{s.text}"
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Name */}
      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium text-[var(--color-text-primary)]">
          Your name
        </label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Full name"
          maxLength={200}
          required
          className="h-12 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-raised)] px-4 text-sm text-[var(--color-text-primary)] placeholder:text-[var(--color-text-tertiary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-teal-500)]"
        />
      </div>

      {/* Role */}
      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium text-[var(--color-text-primary)]">
          Your role on {yachtName}
        </label>
        <input
          type="text"
          value={role}
          onChange={(e) => setRole(e.target.value)}
          placeholder="e.g. Captain, Chief Mate, Stewardess…"
          maxLength={100}
          className="h-12 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-raised)] px-4 text-sm text-[var(--color-text-primary)] placeholder:text-[var(--color-text-tertiary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-teal-500)]"
        />
      </div>

      {/* Endorsement content */}
      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium text-[var(--color-text-primary)]">
          Your endorsement
        </label>
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder={`What was it like working with ${requesterName} on ${yachtName}?`}
          minLength={10}
          maxLength={2000}
          rows={5}
          required
          className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-raised)] px-4 py-3 text-sm text-[var(--color-text-primary)] placeholder:text-[var(--color-text-tertiary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-teal-500)] resize-none"
        />
        <p className={`text-xs text-right ${remainingChars < 100 ? 'text-[var(--color-coral-500)]' : 'text-[var(--color-text-tertiary)]'}`}>
          {remainingChars} characters remaining
        </p>
      </div>

      {/* Email — shareable link only */}
      {isShareableLink && (
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-[var(--color-text-primary)]">
            Your email <span className="text-[var(--color-text-tertiary)] font-normal">(optional — to claim your profile later)</span>
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            className="h-12 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-raised)] px-4 text-sm text-[var(--color-text-primary)] placeholder:text-[var(--color-text-tertiary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-teal-500)]"
          />
        </div>
      )}

      {/* Error */}
      {error && (
        <p className="text-sm text-[var(--color-coral-500)] rounded-lg bg-[var(--color-coral-50)] px-4 py-3">
          {error}
        </p>
      )}

      {/* Consent + submit */}
      <div className="flex flex-col gap-3">
        <p className="text-xs text-[var(--color-text-tertiary)] leading-relaxed">
          By submitting, you agree we'll create a profile for you. You can claim or delete it anytime.{' '}
          <a href="/privacy" className="underline hover:text-[var(--color-text-secondary)]" target="_blank" rel="noopener noreferrer">
            Privacy policy
          </a>
        </p>
        <button
          type="submit"
          disabled={!isValid || submitting}
          className="h-12 rounded-xl bg-[var(--color-teal-700)] text-white text-sm font-semibold disabled:opacity-40 disabled:cursor-not-allowed transition-opacity"
        >
          {submitting ? 'Sending…' : 'Send endorsement'}
        </button>
      </div>
    </form>
  )
}

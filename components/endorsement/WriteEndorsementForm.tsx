'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui'
import { useToast } from '@/components/ui/Toast'

interface ExistingEndorsement {
  id: string
  content: string
  endorser_role_label?: string
  recipient_role_label?: string
  worked_together_start?: string
  worked_together_end?: string
}

interface WriteEndorsementFormProps {
  recipientId: string
  recipientName: string
  yachtId: string
  yachtName: string
  requestToken?: string
  prefillEndorserRole?: string
  prefillRecipientRole?: string
  prefillStartDate?: string
  prefillEndDate?: string
  existingEndorsement?: ExistingEndorsement
  onSuccess: () => void
}

export function WriteEndorsementForm({
  recipientId,
  recipientName,
  yachtId,
  yachtName,
  requestToken,
  prefillEndorserRole,
  prefillRecipientRole,
  prefillStartDate,
  prefillEndDate,
  existingEndorsement,
  onSuccess,
}: WriteEndorsementFormProps) {
  const router = useRouter()
  const { toast } = useToast()
  const isEditMode = !!existingEndorsement

  const [content, setContent] = useState(existingEndorsement?.content ?? '')
  const [endorserRole, setEndorserRole] = useState(
    existingEndorsement?.endorser_role_label ?? prefillEndorserRole ?? ''
  )
  const [recipientRole, setRecipientRole] = useState(
    existingEndorsement?.recipient_role_label ?? prefillRecipientRole ?? ''
  )
  const [startDate, setStartDate] = useState(
    existingEndorsement?.worked_together_start ?? prefillStartDate ?? ''
  )
  const [endDate, setEndDate] = useState(
    existingEndorsement?.worked_together_end ?? prefillEndDate ?? ''
  )
  const [showDetails, setShowDetails] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [succeeded, setSucceeded] = useState(false)

  const charCount = content.length
  const minMet = charCount >= 10
  const maxAllowed = 2000

  async function handleSubmit() {
    if (!minMet || charCount > maxAllowed) return
    setSubmitting(true)

    if (isEditMode && existingEndorsement) {
      const res = await fetch(`/api/endorsements/${existingEndorsement.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content,
          endorser_role_label: endorserRole || undefined,
          recipient_role_label: recipientRole || undefined,
          worked_together_start: startDate || undefined,
          worked_together_end: endDate || undefined,
        }),
      })
      setSubmitting(false)
      if (!res.ok) {
        const data = await res.json() as { error?: string }
        toast(data.error ?? 'Failed to save changes. Please try again.', 'error')
        return
      }
      toast('Endorsement updated.', 'success')
      onSuccess()
      return
    }

    const res = await fetch('/api/endorsements', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        recipient_id: recipientId,
        yacht_id: yachtId,
        content,
        endorser_role_label: endorserRole || undefined,
        recipient_role_label: recipientRole || undefined,
        worked_together_start: startDate || undefined,
        worked_together_end: endDate || undefined,
        request_token: requestToken,
      }),
    })
    setSubmitting(false)

    if (!res.ok) {
      const data = await res.json() as { error?: string }
      if (res.status === 409) {
        toast("You've already endorsed this person for this yacht.", 'error')
        return
      }
      if (res.status === 403) {
        toast('You can only endorse people you have worked with on this yacht.', 'error')
        return
      }
      toast(data.error ?? 'Failed to submit endorsement. Please try again.', 'error')
      return
    }

    setSucceeded(true)
  }

  if (succeeded) {
    return (
      <div className="flex flex-col items-center justify-center gap-6 py-12 px-4 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[var(--color-surface-raised)]">
          <span className="text-3xl">✓</span>
        </div>
        <div>
          <h2 className="text-xl font-bold text-[var(--color-text-primary)] mb-2">
            Endorsement sent.
          </h2>
          <p className="text-sm text-[var(--color-text-secondary)]">
            {recipientName} will be notified.
          </p>
        </div>
        <Button onClick={onSuccess} className="w-full max-w-xs" size="lg">
          Continue
        </Button>
        <button
          type="button"
          onClick={() => router.push('/app/endorsement/request')}
          className="text-sm text-[var(--color-interactive)] font-medium hover:underline"
        >
          Want endorsements too? Request yours →
        </button>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-5">
      {/* Context card */}
      <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-raised)] px-4 py-3">
        <p className="text-xs text-[var(--color-text-secondary)] mb-0.5">Endorsing</p>
        <p className="font-semibold text-[var(--color-text-primary)]">{recipientName}</p>
        <p className="text-sm text-[var(--color-text-secondary)]">{yachtName}</p>
      </div>

      {/* Text area */}
      <div>
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder={`Write your endorsement of ${recipientName}'s work…`}
          rows={6}
          maxLength={maxAllowed}
          className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-3 text-sm text-[var(--color-text-primary)] placeholder:text-[var(--color-text-tertiary)] focus:border-[var(--color-interactive)] focus:outline-none focus:ring-2 focus:ring-[var(--color-interactive)]/20 resize-none"
        />
        <div className="flex items-center justify-between mt-1">
          {!minMet && charCount > 0 ? (
            <p className="text-xs text-[var(--color-text-secondary)]">10 characters minimum</p>
          ) : (
            <span />
          )}
          <p className={`text-xs ml-auto ${charCount > maxAllowed ? 'text-red-500' : 'text-[var(--color-text-secondary)]'}`}>
            {charCount} / {maxAllowed}
          </p>
        </div>
      </div>

      {/* Collapsible details */}
      <button
        type="button"
        onClick={() => setShowDetails((v) => !v)}
        className="flex items-center gap-2 text-sm text-[var(--color-interactive)] font-medium text-left"
      >
        <span>{showDetails ? '▲' : '▼'}</span>
        Add details (optional)
      </button>

      {showDetails && (
        <div className="flex flex-col gap-4">
          <div>
            <label className="block text-xs font-medium text-[var(--color-text-secondary)] mb-1">
              Your role on this yacht
            </label>
            <Input
              value={endorserRole}
              onChange={(e) => setEndorserRole(e.target.value)}
              placeholder="e.g. First Officer"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-[var(--color-text-secondary)] mb-1">
              Their role on this yacht
            </label>
            <Input
              value={recipientRole}
              onChange={(e) => setRecipientRole(e.target.value)}
              placeholder={`e.g. ${recipientName}'s role`}
            />
          </div>
          <div className="flex gap-3">
            <div className="flex-1">
              <label className="block text-xs font-medium text-[var(--color-text-secondary)] mb-1">
                Worked together from
              </label>
              <Input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                max={new Date().toISOString().split('T')[0]}
              />
            </div>
            <div className="flex-1">
              <label className="block text-xs font-medium text-[var(--color-text-secondary)] mb-1">
                To
              </label>
              <Input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                min={startDate}
                max={new Date().toISOString().split('T')[0]}
              />
            </div>
          </div>
        </div>
      )}

      <Button
        onClick={handleSubmit}
        disabled={!minMet || charCount > maxAllowed || submitting}
        className="w-full"
        size="lg"
      >
        {submitting ? 'Submitting…' : isEditMode ? 'Save changes' : 'Submit endorsement'}
      </Button>
    </div>
  )
}

'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { WriteEndorsementForm } from './WriteEndorsementForm'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui'
import { useToast } from '@/components/ui/Toast'

interface EndorsementRequest {
  id: string
  token: string
  requester_id: string
  yacht_id: string
  recipient_email: string
  status: string
  expires_at: string
}

interface Requester {
  display_name: string | null
  full_name: string | null
  profile_photo_url: string | null
}

interface Yacht {
  id: string
  name: string
  yacht_type: string | null
  length_meters: number | null
  flag_state: string | null
  year_built: number | null
}

interface DeepLinkFlowProps {
  request: EndorsementRequest
  requester: Requester
  yacht: Yacht
  currentUserId: string
}

type FlowStep = 'checking' | 'add-yacht' | 'write'

interface AttachmentPrefill {
  role_label: string
  started_at: string
  ended_at: string | null
}

export function DeepLinkFlow({ request, requester, yacht, currentUserId }: DeepLinkFlowProps) {
  const router = useRouter()
  const { toast } = useToast()
  const supabase = createClient()

  const [step, setStep] = useState<FlowStep>('checking')
  const [prefill, setPrefill] = useState<AttachmentPrefill | null>(null)

  // Role/date state for add-yacht step
  const [roleLabel, setRoleLabel] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [isCurrent, setIsCurrent] = useState(false)
  const [saving, setSaving] = useState(false)

  const requesterName = requester.display_name ?? requester.full_name ?? 'Your colleague'

  useEffect(() => {
    // Check if current user already has attachment to this yacht
    supabase
      .from('attachments')
      .select('id, role_label, started_at, ended_at')
      .eq('user_id', currentUserId)
      .eq('yacht_id', request.yacht_id)
      .is('deleted_at', null)
      .limit(1)
      .then(({ data }) => {
        if (data && data.length > 0) {
          const att = data[0] as AttachmentPrefill & { id: string }
          setPrefill({ role_label: att.role_label, started_at: att.started_at, ended_at: att.ended_at })
          setStep('write')
        } else {
          setStep('add-yacht')
        }
      })
  }, [currentUserId, request.yacht_id])

  async function handleConfirmYacht() {
    if (!roleLabel.trim() || !startDate) return
    setSaving(true)

    const { error } = await supabase.from('attachments').insert({
      user_id: currentUserId,
      yacht_id: request.yacht_id,
      role_label: roleLabel.trim(),
      started_at: startDate,
      ended_at: isCurrent ? null : endDate || null,
    })

    setSaving(false)
    if (error) {
      toast('Failed to add yacht. Please try again.', 'error')
      return
    }

    setPrefill({ role_label: roleLabel.trim(), started_at: startDate, ended_at: isCurrent ? null : endDate || null })
    setStep('write')
  }

  function handleDecline() {
    toast('Request declined.', 'success')
    router.push('/app/profile')
  }

  if (step === 'checking') {
    return (
      <div className="flex items-center justify-center py-16">
        <p className="text-sm text-[var(--color-text-secondary)]">Loading…</p>
      </div>
    )
  }

  if (step === 'add-yacht') {
    return (
      <div className="flex flex-col gap-5">
        {/* Request context */}
        <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-raised)] px-4 py-4">
          <p className="text-sm text-[var(--color-text-secondary)] mb-1">
            <strong className="text-[var(--color-text-primary)]">{requesterName}</strong> is asking you to endorse their work on
          </p>
          <p className="text-lg font-bold text-[var(--color-text-primary)]">{yacht.name}</p>
          {yacht.yacht_type && (
            <p className="text-xs text-[var(--color-text-secondary)] mt-0.5">{yacht.yacht_type}</p>
          )}
        </div>

        <p className="text-sm text-[var(--color-text-secondary)]">
          To write an endorsement, confirm your time on <strong>{yacht.name}</strong> first.
        </p>

        <div>
          <label className="block text-xs font-medium text-[var(--color-text-secondary)] mb-1">
            Your role on {yacht.name} *
          </label>
          <Input
            value={roleLabel}
            onChange={(e) => setRoleLabel(e.target.value)}
            placeholder="e.g. First Officer"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-[var(--color-text-secondary)] mb-1">
            Start date *
          </label>
          <Input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            max={new Date().toISOString().split('T')[0]}
          />
        </div>

        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="text-xs font-medium text-[var(--color-text-secondary)]">
              End date
            </label>
            <label className="flex items-center gap-2 text-xs text-[var(--color-text-secondary)]">
              <input
                type="checkbox"
                checked={isCurrent}
                onChange={(e) => setIsCurrent(e.target.checked)}
                className="rounded"
              />
              Currently working here
            </label>
          </div>
          {!isCurrent && (
            <Input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              min={startDate}
              max={new Date().toISOString().split('T')[0]}
            />
          )}
        </div>

        <Button
          onClick={handleConfirmYacht}
          disabled={!roleLabel.trim() || !startDate || saving}
          className="w-full"
          size="lg"
        >
          {saving ? 'Saving…' : 'Confirm yacht & continue'}
        </Button>

        <button
          type="button"
          onClick={handleDecline}
          className="text-sm text-[var(--color-text-secondary)] text-center py-2 hover:text-[var(--color-text-primary)] transition-colors"
        >
          Decline
        </button>
      </div>
    )
  }

  // step === 'write'
  return (
    <WriteEndorsementForm
      recipientId={request.requester_id}
      recipientName={requesterName}
      yachtId={request.yacht_id}
      yachtName={yacht.name}
      requestToken={request.token}
      prefillEndorserRole={prefill?.role_label}
      prefillStartDate={prefill?.started_at}
      prefillEndDate={prefill?.ended_at ?? undefined}
      onSuccess={() => router.push('/app/audience')}
    />
  )
}

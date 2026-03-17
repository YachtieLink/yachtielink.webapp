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

interface RequesterAttachment {
  role_label: string | null
  started_at: string | null
  ended_at: string | null
}

interface DeepLinkFlowProps {
  request: EndorsementRequest
  requester: Requester
  yacht: Yacht
  requesterAttachment: RequesterAttachment | null
  currentUserId: string
}

type FlowStep = 'checking' | 'mini-onboard' | 'add-yacht' | 'write' | 'already-endorsed'

interface AttachmentPrefill {
  role_label: string
  started_at: string
  ended_at: string | null
}

function displayName(r: Requester) {
  return r.full_name ?? r.display_name ?? 'Your colleague'
}

export function DeepLinkFlow({ request, requester, yacht, requesterAttachment, currentUserId }: DeepLinkFlowProps) {
  const router = useRouter()
  const { toast } = useToast()
  const supabase = createClient()

  const [step, setStep] = useState<FlowStep>('checking')
  const [prefill, setPrefill] = useState<AttachmentPrefill | null>(null)
  const [needsOnboard, setNeedsOnboard] = useState(false)

  // Mini-onboard fields
  const [fullName, setFullName] = useState('')
  const [primaryRole, setPrimaryRole] = useState('')

  // Add-yacht / mini-onboard shared fields
  const [roleLabel, setRoleLabel] = useState('')
  const [startDate, setStartDate] = useState(requesterAttachment?.started_at?.split('T')[0] ?? '')
  const [endDate, setEndDate] = useState(requesterAttachment?.ended_at?.split('T')[0] ?? '')
  const [isCurrent, setIsCurrent] = useState(!requesterAttachment?.ended_at)
  const [saving, setSaving] = useState(false)

  const name = displayName(requester)

  useEffect(() => {
    Promise.all([
      supabase
        .from('users')
        .select('full_name, primary_role, onboarding_complete')
        .eq('id', currentUserId)
        .single(),
      supabase
        .from('attachments')
        .select('id, role_label, started_at, ended_at')
        .eq('user_id', currentUserId)
        .eq('yacht_id', request.yacht_id)
        .is('deleted_at', null)
        .limit(1),
      supabase
        .from('endorsements')
        .select('id')
        .eq('endorser_id', currentUserId)
        .eq('recipient_id', request.requester_id)
        .eq('yacht_id', request.yacht_id)
        .is('deleted_at', null)
        .limit(1),
    ]).then(([userRes, attachmentRes, endorsementRes]) => {
      if (endorsementRes.data && endorsementRes.data.length > 0) {
        setStep('already-endorsed')
        return
      }

      const userProfile = userRes.data as { full_name: string | null; primary_role: string | null; onboarding_complete: boolean } | null
      const profileIncomplete = !userProfile?.full_name || !userProfile?.primary_role

      if (profileIncomplete) {
        setNeedsOnboard(true)
        if (userProfile?.full_name) setFullName(userProfile.full_name)
        if (userProfile?.primary_role) setPrimaryRole(userProfile.primary_role)
      }

      if (attachmentRes.data && attachmentRes.data.length > 0) {
        const att = attachmentRes.data[0] as AttachmentPrefill & { id: string }
        setPrefill({ role_label: att.role_label, started_at: att.started_at, ended_at: att.ended_at })
        // If profile is incomplete, go to mini-onboard; otherwise skip to write
        setStep(profileIncomplete ? 'mini-onboard' : 'write')
      } else {
        // Need to add yacht — mini-onboard includes yacht fields if profile incomplete
        setStep(profileIncomplete ? 'mini-onboard' : 'add-yacht')
      }
    })
  }, [currentUserId, request.yacht_id, request.requester_id])

  async function handleMiniOnboard() {
    if (!fullName.trim() || !primaryRole.trim() || !roleLabel.trim() || !startDate) return
    setSaving(true)

    // Update user profile
    const { error: userError } = await supabase
      .from('users')
      .update({
        full_name: fullName.trim(),
        display_name: fullName.trim().split(' ')[0],
        primary_role: primaryRole.trim(),
      })
      .eq('id', currentUserId)

    if (userError) {
      toast('Failed to save profile. Please try again.', 'error')
      setSaving(false)
      return
    }

    // Create attachment if not already present
    if (!prefill) {
      const { error: attError } = await supabase.from('attachments').insert({
        user_id: currentUserId,
        yacht_id: request.yacht_id,
        role_label: roleLabel.trim(),
        started_at: startDate,
        ended_at: isCurrent ? null : endDate || null,
      })
      if (attError) {
        toast('Failed to add yacht. Please try again.', 'error')
        setSaving(false)
        return
      }
      setPrefill({ role_label: roleLabel.trim(), started_at: startDate, ended_at: isCurrent ? null : endDate || null })
    }

    setSaving(false)
    setStep('write')
  }

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

  function handleSuccess() {
    // If user hasn't completed onboarding, redirect to finish it
    if (needsOnboard) {
      router.push('/onboarding')
    } else {
      router.push('/app/network')
    }
  }

  if (step === 'checking') {
    return (
      <div className="flex items-center justify-center py-16">
        <p className="text-sm text-[var(--color-text-secondary)]">Loading...</p>
      </div>
    )
  }

  if (step === 'already-endorsed') {
    return (
      <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-raised)] px-4 py-6 text-center">
        <p className="text-2xl mb-3"><span className="text-2xl text-[var(--color-success)]">✓</span></p>
        <p className="text-sm font-medium text-[var(--color-text-primary)] mb-1">Already endorsed</p>
        <p className="text-sm text-[var(--color-text-secondary)]">
          You have already written an endorsement for {name} on {yacht.name}.
        </p>
        <button
          onClick={() => router.push('/app/network')}
          className="mt-4 text-sm text-[var(--color-interactive)] font-medium hover:underline"
        >
          View your endorsements
        </button>
      </div>
    )
  }

  // ── Mini-onboard: name + role + yacht dates (for new/incomplete users) ─────
  if (step === 'mini-onboard') {
    const hasAttachment = !!prefill
    return (
      <div className="flex flex-col gap-5">
        <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-raised)] px-4 py-4">
          <p className="text-sm text-[var(--color-text-secondary)] mb-1">
            <strong className="text-[var(--color-text-primary)]">{name}</strong> is asking you to endorse their work on
          </p>
          <p className="text-lg font-bold text-[var(--color-text-primary)]">{yacht.name}</p>
          {yacht.yacht_type && (
            <p className="text-xs text-[var(--color-text-secondary)] mt-0.5">{yacht.yacht_type}</p>
          )}
        </div>

        <p className="text-sm text-[var(--color-text-secondary)]">
          Quick setup before you write your endorsement:
        </p>

        {/* Name */}
        <div>
          <label className="block text-xs font-medium text-[var(--color-text-secondary)] mb-1">
            Your full name *
          </label>
          <Input value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="e.g. James Harrison" />
        </div>

        {/* Role */}
        <div>
          <label className="block text-xs font-medium text-[var(--color-text-secondary)] mb-1">
            Your primary role *
          </label>
          <Input value={primaryRole} onChange={(e) => setPrimaryRole(e.target.value)} placeholder="e.g. First Officer" />
        </div>

        {/* Yacht details (only if no existing attachment) */}
        {!hasAttachment && (
          <>
            <div className="border-t border-[var(--color-border)] pt-4">
              <p className="text-xs font-medium text-[var(--color-text-secondary)] mb-3">
                Your time on {yacht.name}
              </p>
            </div>
            <div>
              <label className="block text-xs font-medium text-[var(--color-text-secondary)] mb-1">
                Your role on {yacht.name} *
              </label>
              <Input value={roleLabel} onChange={(e) => setRoleLabel(e.target.value)} placeholder="e.g. Chief Stewardess" />
            </div>
            <div>
              <label className="block text-xs font-medium text-[var(--color-text-secondary)] mb-1">Start date *</label>
              <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} max={new Date().toISOString().split('T')[0]} />
            </div>
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-medium text-[var(--color-text-secondary)]">End date</label>
                <label className="flex items-center gap-2 text-xs text-[var(--color-text-secondary)]">
                  <input type="checkbox" checked={isCurrent} onChange={(e) => setIsCurrent(e.target.checked)} className="rounded" />
                  Currently working here
                </label>
              </div>
              {!isCurrent && (
                <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} min={startDate} max={new Date().toISOString().split('T')[0]} />
              )}
            </div>
          </>
        )}

        <Button
          onClick={handleMiniOnboard}
          disabled={
            !fullName.trim() ||
            !primaryRole.trim() ||
            (!hasAttachment && (!roleLabel.trim() || !startDate)) ||
            saving
          }
          className="w-full"
          size="lg"
        >
          {saving ? 'Saving...' : 'Continue to endorsement'}
        </Button>
        <button type="button" onClick={handleDecline} className="text-sm text-[var(--color-text-secondary)] text-center py-2 hover:text-[var(--color-text-primary)] transition-colors">
          Decline
        </button>
      </div>
    )
  }

  if (step === 'add-yacht') {
    return (
      <div className="flex flex-col gap-5">
        <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-raised)] px-4 py-4">
          <p className="text-sm text-[var(--color-text-secondary)] mb-1">
            <strong className="text-[var(--color-text-primary)]">{name}</strong> is asking you to endorse their work on
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
          <Input value={roleLabel} onChange={(e) => setRoleLabel(e.target.value)} placeholder="e.g. First Officer" />
        </div>
        <div>
          <label className="block text-xs font-medium text-[var(--color-text-secondary)] mb-1">Start date *</label>
          <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} max={new Date().toISOString().split('T')[0]} />
        </div>
        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="text-xs font-medium text-[var(--color-text-secondary)]">End date</label>
            <label className="flex items-center gap-2 text-xs text-[var(--color-text-secondary)]">
              <input type="checkbox" checked={isCurrent} onChange={(e) => setIsCurrent(e.target.checked)} className="rounded" />
              Currently working here
            </label>
          </div>
          {!isCurrent && (
            <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} min={startDate} max={new Date().toISOString().split('T')[0]} />
          )}
        </div>
        <Button onClick={handleConfirmYacht} disabled={!roleLabel.trim() || !startDate || saving} className="w-full" size="lg">
          {saving ? 'Saving...' : 'Confirm yacht & continue'}
        </Button>
        <button type="button" onClick={handleDecline} className="text-sm text-[var(--color-text-secondary)] text-center py-2 hover:text-[var(--color-text-primary)] transition-colors">
          Decline
        </button>
      </div>
    )
  }

  return (
    <WriteEndorsementForm
      recipientId={request.requester_id}
      recipientName={name}
      yachtId={request.yacht_id}
      yachtName={yacht.name}
      requestToken={request.token}
      prefillEndorserRole={prefill?.role_label}
      prefillRecipientRole={requesterAttachment?.role_label ?? undefined}
      prefillStartDate={prefill?.started_at}
      prefillEndDate={prefill?.ended_at ?? undefined}
      onSuccess={handleSuccess}
    />
  )
}

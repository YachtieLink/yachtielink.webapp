'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowRightLeft } from 'lucide-react'
import { BottomSheet } from '@/components/ui/BottomSheet'
import { Button } from '@/components/ui/Button'
import { YachtPickerModal, type YachtOption } from '@/components/yacht/YachtPicker'

interface TransferExperienceButtonProps {
  attachmentId: string
  currentYachtName: string
  roleLabel: string
  userId: string
}

type Step = 'idle' | 'pick-yacht' | 'confirm' | 'transferring' | 'success' | 'error'

export function TransferExperienceButton({
  attachmentId,
  currentYachtName,
  roleLabel,
  userId,
}: TransferExperienceButtonProps) {
  const router = useRouter()
  const [step, setStep] = useState<Step>('idle')
  const [selectedYacht, setSelectedYacht] = useState<YachtOption | null>(null)
  const [errorMessage, setErrorMessage] = useState('')
  const justSelectedRef = useRef(false)
  const [result, setResult] = useState<{
    endorsements_made_dormant: number
    endorsements_reactivated: number
  } | null>(null)

  function handleYachtSelected(yacht: YachtOption) {
    justSelectedRef.current = true
    setSelectedYacht(yacht)
    setStep('confirm')
  }

  async function handleConfirm() {
    if (!selectedYacht) return
    setStep('transferring')
    setErrorMessage('')

    try {
      const res = await fetch('/api/transfer-experience', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          employment_id: attachmentId,
          to_yacht_id: selectedYacht.id,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        setErrorMessage(data.error ?? 'Transfer failed. Please try again.')
        setStep('error')
        return
      }

      setResult({
        endorsements_made_dormant: data.endorsements_made_dormant ?? 0,
        endorsements_reactivated: data.endorsements_reactivated ?? 0,
      })
      setStep('success')
    } catch {
      setErrorMessage('Something went wrong. Please try again.')
      setStep('error')
    }
  }

  function handleClose() {
    // YachtPickerModal calls onClose() after onSelect() — don't reset if transitioning to confirm
    if (justSelectedRef.current) {
      justSelectedRef.current = false
      return
    }
    if (step === 'success') {
      router.refresh()
    }
    setStep('idle')
    setSelectedYacht(null)
    setErrorMessage('')
    setResult(null)
  }

  return (
    <>
      <button
        onClick={() => setStep('pick-yacht')}
        className="flex items-center gap-1 text-xs text-[var(--color-text-secondary)] hover:text-[var(--color-interactive)] hover:underline transition-colors"
        aria-label={`Transfer ${roleLabel} experience from ${currentYachtName}`}
      >
        <ArrowRightLeft size={12} />
        Transfer
      </button>

      {/* Step 1: Yacht picker */}
      <YachtPickerModal
        isOpen={step === 'pick-yacht'}
        onClose={handleClose}
        onSelect={handleYachtSelected}
        userId={userId}
      />

      {/* Step 2: Confirmation */}
      <BottomSheet
        open={step === 'confirm' || step === 'transferring'}
        onClose={step === 'transferring' ? () => {} : handleClose}
        title="Confirm transfer"
      >
        <div className="flex flex-col gap-4">
          <p className="text-sm text-[var(--color-text-primary)]">
            Move your <strong>{roleLabel}</strong> experience from{' '}
            <strong>{currentYachtName}</strong> to{' '}
            <strong>{selectedYacht?.name}</strong>?
          </p>
          <p className="text-xs text-[var(--color-text-secondary)]">
            Dates and details will transfer. Endorsements will update automatically
            — any endorsements tied to {currentYachtName} may become hidden if you
            and the endorser no longer share that vessel.
          </p>
          <div className="flex gap-3">
            <Button
              variant="secondary"
              size="lg"
              className="flex-1"
              onClick={handleClose}
              disabled={step === 'transferring'}
            >
              Cancel
            </Button>
            <Button
              size="lg"
              className="flex-1"
              onClick={handleConfirm}
              disabled={step === 'transferring'}
            >
              {step === 'transferring' ? 'Transferring…' : 'Transfer'}
            </Button>
          </div>
        </div>
      </BottomSheet>

      {/* Step 3: Success */}
      <BottomSheet open={step === 'success'} onClose={handleClose} title="Transfer complete">
        <div className="flex flex-col gap-4">
          <p className="text-sm text-[var(--color-text-primary)]">
            Your <strong>{roleLabel}</strong> experience has been moved to{' '}
            <strong>{selectedYacht?.name}</strong>.
          </p>
          {result && (result.endorsements_made_dormant > 0 || result.endorsements_reactivated > 0) && (
            <div className="rounded-xl bg-[var(--color-surface-raised)] p-3 text-xs text-[var(--color-text-secondary)] flex flex-col gap-1">
              {result.endorsements_made_dormant > 0 && (
                <p>
                  {result.endorsements_made_dormant} endorsement{result.endorsements_made_dormant !== 1 ? 's' : ''}{' '}
                  temporarily hidden (no longer sharing that vessel)
                </p>
              )}
              {result.endorsements_reactivated > 0 && (
                <p>
                  {result.endorsements_reactivated} endorsement{result.endorsements_reactivated !== 1 ? 's' : ''}{' '}
                  reactivated (now sharing this vessel)
                </p>
              )}
            </div>
          )}
          <Button size="lg" className="w-full" onClick={handleClose}>
            Done
          </Button>
        </div>
      </BottomSheet>

      {/* Step 4: Error */}
      <BottomSheet open={step === 'error'} onClose={handleClose} title="Transfer failed">
        <div className="flex flex-col gap-4">
          <p className="text-sm text-red-600">{errorMessage}</p>
          <div className="flex gap-3">
            <Button variant="secondary" size="lg" className="flex-1" onClick={handleClose}>
              Cancel
            </Button>
            <Button size="lg" className="flex-1" onClick={() => setStep('confirm')}>
              Try again
            </Button>
          </div>
        </div>
      </BottomSheet>
    </>
  )
}

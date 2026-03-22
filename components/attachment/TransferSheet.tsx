'use client'

import { useState } from 'react'
import { BottomSheet } from '@/components/ui/BottomSheet'
import { YachtPicker, type YachtOption } from '@/components/yacht/YachtPicker'
import { Button } from '@/components/ui/Button'

interface TransferSheetProps {
  open: boolean
  onClose: () => void
  attachmentId: string
  userId: string
  currentYachtId: string
  currentYachtName: string
  roleLabel: string
  startDate: string
  endDate: string | null
  onTransferComplete: () => void
}

type Step = 'select' | 'confirm'

interface TransferPreview {
  toYacht: YachtOption
  crewCount: number | null
}

export function TransferSheet({
  open,
  onClose,
  attachmentId,
  userId,
  currentYachtId,
  currentYachtName,
  roleLabel,
  startDate,
  endDate,
  onTransferComplete,
}: TransferSheetProps) {
  const [step, setStep] = useState<Step>('select')
  const [preview, setPreview] = useState<TransferPreview | null>(null)
  const [cascadeEndorsements, setCascadeEndorsements] = useState(true)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function handleYachtSelect(yacht: YachtOption) {
    if (yacht.id === currentYachtId) {
      setError('This attachment is already on this yacht.')
      return
    }
    setPreview({ toYacht: yacht, crewCount: null })
    setError(null)
    setStep('confirm')
  }

  async function handleConfirm() {
    if (!preview) return
    setLoading(true)
    setError(null)

    try {
      const res = await fetch('/api/attachment/transfer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          attachmentId,
          toYachtId: preview.toYacht.id,
          cascadeEndorsements,
        }),
      })

      const data = await res.json()

      if (!res.ok || !data.success) {
        setError(data.message || data.error || 'Transfer failed. Please try again.')
        setLoading(false)
        return
      }

      setLoading(false)
      onTransferComplete()
    } catch {
      setError('Something went wrong. Please try again.')
      setLoading(false)
    }
  }

  function handleClose() {
    setStep('select')
    setPreview(null)
    setError(null)
    setLoading(false)
    onClose()
  }

  const startFormatted = new Date(startDate).toLocaleDateString('en-GB', { month: 'short', year: 'numeric' })
  const endFormatted = endDate
    ? new Date(endDate).toLocaleDateString('en-GB', { month: 'short', year: 'numeric' })
    : 'Present'

  return (
    <BottomSheet open={open} onClose={handleClose} title="Move to a different yacht">
      {step === 'select' && (
        <div className="pb-4">
          <YachtPicker userId={userId} onSelect={handleYachtSelect} />
          {error && (
            <p className="text-sm text-[var(--color-error)] mt-2 px-1">{error}</p>
          )}
        </div>
      )}

      {step === 'confirm' && preview && (
        <div className="pb-4 flex flex-col gap-4">
          {/* From → To */}
          <div className="bg-[var(--color-surface-raised)] rounded-xl p-4 flex items-center gap-3">
            <div className="flex-1 text-center">
              <p className="text-xs text-[var(--color-text-secondary)]">From</p>
              <p className="text-sm font-semibold text-[var(--color-text-primary)] truncate">{currentYachtName}</p>
            </div>
            <span className="text-[var(--color-text-tertiary)]">→</span>
            <div className="flex-1 text-center">
              <p className="text-xs text-[var(--color-text-secondary)]">To</p>
              <p className="text-sm font-semibold text-[var(--color-text-primary)] truncate">{preview.toYacht.name}</p>
            </div>
          </div>

          {/* What stays */}
          <div>
            <p className="text-xs font-semibold text-[var(--color-text-secondary)] uppercase tracking-wide mb-1">What stays the same</p>
            <ul className="text-sm text-[var(--color-text-primary)] space-y-0.5">
              <li>· Your role: {roleLabel}</li>
              <li>· Your dates: {startFormatted} – {endFormatted}</li>
            </ul>
          </div>

          {/* Cascade checkbox */}
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={cascadeEndorsements}
              onChange={e => setCascadeEndorsements(e.target.checked)}
              className="w-4 h-4 rounded border-[var(--color-border)] text-[var(--color-interactive)] focus:ring-[var(--color-interactive)]"
            />
            <span className="text-sm text-[var(--color-text-primary)]">Move my endorsements too</span>
          </label>

          {error && (
            <p className="text-sm text-[var(--color-error)]">{error}</p>
          )}

          {/* Actions */}
          <div className="flex flex-col gap-2">
            <Button
              onClick={handleConfirm}
              loading={loading}
              disabled={loading}
            >
              Confirm transfer
            </Button>
            <button
              onClick={() => { setStep('select'); setPreview(null); setError(null) }}
              className="text-sm text-[var(--color-text-secondary)] py-2 hover:text-[var(--color-text-primary)]"
              disabled={loading}
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </BottomSheet>
  )
}

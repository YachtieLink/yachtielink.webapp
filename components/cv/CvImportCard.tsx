'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/Button'
import { Upload, CheckCircle, RefreshCw, AlertTriangle } from 'lucide-react'

interface CvImportCardProps {
  hasUploadedCv: boolean
  cvParsedAt: string | null
}

export function CvImportCard({ hasUploadedCv, cvParsedAt }: CvImportCardProps) {
  const router = useRouter()
  const hasParsed = !!cvParsedAt
  const [showConfirm, setShowConfirm] = useState(false)

  // ── Already imported ──────────────────────────────────────────────
  if (hasParsed) {
    const parsedDate = new Date(cvParsedAt!)
    const formattedDate = parsedDate.toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    })

    return (
      <div className="rounded-2xl border border-[var(--color-amber-200)] bg-[var(--color-amber-50)]/50 p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <div className="mt-0.5 h-8 w-8 rounded-full bg-green-100 flex items-center justify-center shrink-0">
              <CheckCircle size={16} className="text-green-600" />
            </div>
            <div>
              <p className="text-sm font-semibold text-[var(--color-text-primary)]">
                CV uploaded
              </p>
              <p className="text-xs text-[var(--color-text-tertiary)] mt-0.5">
                Your profile was built from your CV on {formattedDate}.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setShowConfirm(true)}
            className="flex items-center gap-1 text-xs text-[var(--color-interactive)] shrink-0 mt-1"
          >
            <RefreshCw size={12} />
            Update from new CV
          </button>
        </div>

        {/* Re-parse confirmation dialog (UX5) */}
        {showConfirm && (
          <div className="mt-3 rounded-xl border border-[var(--color-amber-300)] bg-[var(--color-amber-50)] p-3">
            <div className="flex items-start gap-2 mb-3">
              <AlertTriangle size={16} className="text-[var(--color-amber-500)] shrink-0 mt-0.5" />
              <p className="text-sm text-[var(--color-text-primary)] leading-relaxed">
                This will re-parse your CV and may overwrite edits you&apos;ve made to your profile. Continue?
              </p>
            </div>
            <div className="flex items-center gap-2 justify-end">
              <button
                type="button"
                onClick={() => setShowConfirm(false)}
                className="px-3 py-1.5 rounded-lg text-sm text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-raised)] transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowConfirm(false)
                  router.push('/app/cv/upload')
                }}
                className="px-3 py-1.5 rounded-lg text-sm font-medium bg-[var(--color-amber-500)] text-white hover:bg-[var(--color-amber-600)] transition-colors"
              >
                Continue
              </button>
            </div>
          </div>
        )}
      </div>
    )
  }

  // ── No CV imported yet ────────────────────────────────────────────
  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => router.push('/app/cv/upload')}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') router.push('/app/cv/upload') }}
      className="rounded-2xl border-2 border-dashed border-[var(--color-amber-300)] bg-[var(--color-amber-50)]/50 p-8 flex flex-col items-center gap-3 cursor-pointer hover:border-[var(--color-amber-400)] hover:bg-[var(--color-amber-50)] transition-colors"
    >
      <Upload size={32} className="text-[var(--color-amber-400)]" />
      <div className="text-center">
        <h2 className="text-lg font-serif tracking-tight text-[var(--color-text-primary)]">
          Got a CV? Let us do the typing.
        </h2>
        <p className="text-sm text-[var(--color-text-secondary)] mt-1 leading-relaxed">
          Upload your CV and we&apos;ll pull out your experience, roles, certs,
          and qualifications — your profile fills itself in seconds.
        </p>
      </div>
      <p className="text-xs text-[var(--color-text-tertiary)]">
        PDF or DOCX · Max 10 MB
      </p>
    </div>
  )
}

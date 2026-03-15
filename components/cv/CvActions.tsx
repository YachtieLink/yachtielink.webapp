'use client'

import { useState } from 'react'
import Link from 'next/link'
import QRCode from 'react-qr-code'
import { useToast } from '@/components/ui/Toast'

interface CvActionsProps {
  handle: string
  hasPdf: boolean
  pdfGeneratedAt?: string | null
  isPro: boolean
}

export function CvActions({ handle, hasPdf, pdfGeneratedAt, isPro }: CvActionsProps) {
  const { toast } = useToast()
  const [generating, setGenerating] = useState(false)
  const [pdfReady, setPdfReady] = useState(hasPdf)
  const [showQR, setShowQR] = useState(false)

  const profileUrl = `https://yachtie.link/u/${handle}`

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(profileUrl)
      toast('Link copied', 'success')
    } catch {
      toast('Could not copy link', 'error')
    }
  }

  async function generatePdf() {
    setGenerating(true)
    try {
      const res = await fetch('/api/cv/generate-pdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ template: 'standard' }),
      })
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        throw new Error(body.error || 'Failed to generate PDF')
      }
      const { url } = await res.json()
      setPdfReady(true)
      // Auto-download
      window.open(url, '_blank')
      toast('PDF generated', 'success')
    } catch (err) {
      toast(err instanceof Error ? err.message : 'PDF generation failed', 'error')
    } finally {
      setGenerating(false)
    }
  }

  async function downloadPdf() {
    try {
      const res = await fetch('/api/cv/download-pdf')
      if (!res.ok) throw new Error('Could not get download link')
      const { url } = await res.json()
      window.open(url, '_blank')
    } catch {
      toast('Download failed', 'error')
    }
  }

  function downloadQR() {
    const svg = document.getElementById('cv-qr-svg')
    if (!svg) return
    const data = new XMLSerializer().serializeToString(svg)
    const blob = new Blob([data], { type: 'image/svg+xml' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${handle}-qr.svg`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="flex flex-col gap-3">
      {/* Share + PDF row */}
      <div className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
        <h2 className="text-xs font-semibold uppercase tracking-wide text-[var(--color-text-tertiary)] mb-3">
          Actions
        </h2>
        <div className="flex flex-col gap-2">
          {/* Share link */}
          <button
            onClick={copyLink}
            className="w-full rounded-lg bg-[var(--color-interactive)] px-4 py-2.5 text-sm font-medium text-[var(--color-text-inverse)] hover:bg-[var(--color-interactive-hover)] transition-colors"
          >
            Share Profile Link
          </button>

          {/* PDF actions */}
          {pdfReady ? (
            <div className="flex gap-2">
              <button
                onClick={downloadPdf}
                className="flex-1 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-2.5 text-sm font-medium text-[var(--color-text-primary)] hover:bg-[var(--color-surface-overlay)] transition-colors"
              >
                Download PDF
              </button>
              <button
                onClick={generatePdf}
                disabled={generating}
                className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-2.5 text-sm font-medium text-[var(--color-text-primary)] hover:bg-[var(--color-surface-overlay)] transition-colors disabled:opacity-50"
              >
                {generating ? 'Generating…' : 'Regenerate'}
              </button>
            </div>
          ) : (
            <button
              onClick={generatePdf}
              disabled={generating}
              className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-2.5 text-sm font-medium text-[var(--color-text-primary)] hover:bg-[var(--color-surface-overlay)] transition-colors disabled:opacity-50"
            >
              {generating ? 'Generating PDF…' : 'Generate PDF Snapshot'}
            </button>
          )}
          {pdfGeneratedAt && (
            <p className="text-xs text-[var(--color-text-tertiary)]">
              Last generated {new Date(pdfGeneratedAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
            </p>
          )}

          {/* Upload CV */}
          <Link
            href="/app/cv/upload"
            className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-2.5 text-sm font-medium text-[var(--color-text-primary)] hover:bg-[var(--color-surface-overlay)] transition-colors text-center"
          >
            Upload CV
          </Link>

          {/* QR code toggle */}
          <button
            onClick={() => setShowQR(!showQR)}
            className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-2.5 text-sm font-medium text-[var(--color-text-primary)] hover:bg-[var(--color-surface-overlay)] transition-colors"
          >
            {showQR ? 'Hide QR Code' : 'QR Code'}
          </button>
          {showQR && (
            <div className="flex flex-col items-center gap-3 py-3">
              <QRCode
                id="cv-qr-svg"
                value={profileUrl}
                size={160}
                level="M"
                bgColor="transparent"
                fgColor="var(--color-text-primary)"
              />
              <button
                onClick={downloadQR}
                className="text-xs font-medium text-[var(--color-interactive)] hover:text-[var(--color-interactive-hover)]"
              >
                Download QR
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Template selector */}
      <div className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
        <h2 className="text-xs font-semibold uppercase tracking-wide text-[var(--color-text-tertiary)] mb-3">
          PDF Template
        </h2>
        <div className="flex flex-col gap-2">
          {/* Standard (active) */}
          <div className="flex items-center justify-between rounded-lg border-2 border-[var(--color-interactive)] bg-[var(--color-surface)] p-3">
            <div>
              <p className="text-sm font-medium text-[var(--color-text-primary)]">Standard</p>
              <p className="text-xs text-[var(--color-text-tertiary)]">Free</p>
            </div>
            <div className="h-4 w-4 rounded-full bg-[var(--color-interactive)]" />
          </div>

          {/* Classic Navy (locked) */}
          <div className="flex items-center justify-between rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-overlay)] p-3 opacity-60">
            <div>
              <p className="text-sm font-medium text-[var(--color-text-primary)]">Classic Navy</p>
              <p className="text-xs text-[var(--color-text-tertiary)]">Pro</p>
            </div>
            <svg className="h-4 w-4 text-[var(--color-text-tertiary)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>

          {/* Modern Minimal (locked) */}
          <div className="flex items-center justify-between rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-overlay)] p-3 opacity-60">
            <div>
              <p className="text-sm font-medium text-[var(--color-text-primary)]">Modern Minimal</p>
              <p className="text-xs text-[var(--color-text-tertiary)]">Pro</p>
            </div>
            <svg className="h-4 w-4 text-[var(--color-text-tertiary)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>

          {!isPro && (
            <Link
              href="/app/insights"
              className="mt-1 text-xs font-medium text-[var(--color-interactive)] hover:text-[var(--color-interactive-hover)] text-center"
            >
              Upgrade to Pro for premium templates
            </Link>
          )}
        </div>
      </div>

      {/* Edit profile link */}
      <Link
        href="/app/profile"
        className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-3 text-sm font-medium text-[var(--color-text-primary)] hover:bg-[var(--color-surface-overlay)] transition-colors text-center"
      >
        Edit Profile
      </Link>
    </div>
  )
}

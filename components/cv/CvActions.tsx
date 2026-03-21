'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import dynamic from 'next/dynamic'
import { Button } from '@/components/ui/Button'
import { useToast } from '@/components/ui/Toast'

const QRCode = dynamic(() => import('react-qr-code').then(m => m.default), { ssr: false })

interface CvActionsProps {
  handle: string
  hasPdf: boolean
  pdfGeneratedAt?: string | null
  isPro: boolean
}

type Template = 'standard' | 'classic-navy' | 'modern-minimal'

const TEMPLATES: { id: Template; label: string; sublabel: string; proOnly: boolean }[] = [
  { id: 'standard',       label: 'Standard',       sublabel: 'Free',                    proOnly: false },
  { id: 'classic-navy',   label: 'Classic Navy',   sublabel: 'Pro · Traditional serif', proOnly: true  },
  { id: 'modern-minimal', label: 'Modern Minimal', sublabel: 'Pro · Clean & spacious',  proOnly: true  },
]

export function CvActions({ handle, hasPdf, pdfGeneratedAt, isPro }: CvActionsProps) {
  const { toast } = useToast()
  const router = useRouter()
  const [generating, setGenerating] = useState(false)
  const [pdfReady, setPdfReady] = useState(hasPdf)
  const [showQR, setShowQR] = useState(false)
  const [selectedTemplate, setSelectedTemplate] = useState<Template>('standard')

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
        body: JSON.stringify({ template: selectedTemplate }),
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
      {/* Bento action grid */}
      <div className="rounded-2xl border border-[var(--color-border)] card-soft p-4">
        <h2 className="text-xs font-semibold uppercase tracking-wide text-[var(--color-text-tertiary)] mb-3">
          Actions
        </h2>
        <div className="flex flex-col gap-2">
          {/* Row 1: Share link — primary, full width */}
          <Button onClick={copyLink} className="w-full">
            Share Profile Link
          </Button>

          {/* Row 2: Generate/Download PDF + Upload CV — outline, 2-col */}
          <div className="grid grid-cols-2 gap-2">
            {pdfReady ? (
              <Button variant="outline" onClick={downloadPdf} className="w-full">
                Download PDF
              </Button>
            ) : (
              <Button variant="outline" onClick={generatePdf} loading={generating} className="w-full">
                {generating ? 'Generating…' : 'Generate PDF'}
              </Button>
            )}
            <Button variant="outline" onClick={() => router.push('/app/cv/upload')} className="w-full">
              Upload CV
            </Button>
          </div>

          {/* Row 3: QR Code + Edit — ghost, 2-col */}
          <div className="grid grid-cols-2 gap-2">
            <Button variant="ghost" onClick={() => setShowQR(!showQR)} className="w-full">
              {showQR ? 'Hide QR' : 'QR Code'}
            </Button>
            <Button variant="ghost" onClick={() => router.push('/app/profile')} className="w-full">
              Edit
            </Button>
          </div>

          {/* PDF regenerate hint when PDF exists */}
          {pdfReady && (
            <div className="flex items-center gap-2">
              <Button variant="link" size="sm" onClick={generatePdf} loading={generating}>
                {generating ? 'Generating…' : 'Regenerate PDF'}
              </Button>
              {pdfGeneratedAt && (
                <span className="text-xs text-[var(--color-text-tertiary)]">
                  · {new Date(pdfGeneratedAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                </span>
              )}
            </div>
          )}
          {!pdfReady && pdfGeneratedAt && (
            <p className="text-xs text-[var(--color-text-tertiary)]">
              Last generated {new Date(pdfGeneratedAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
            </p>
          )}

          {/* QR code panel */}
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
              <Button variant="ghost" size="sm" onClick={downloadQR}>
                Download QR
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Template selector */}
      <div className="rounded-2xl border border-[var(--color-border)] card-soft p-4">
        <h2 className="text-xs font-semibold uppercase tracking-wide text-[var(--color-text-tertiary)] mb-3">
          PDF Template
        </h2>
        <div className="flex flex-col gap-2">
          {TEMPLATES.map((t) => {
            const locked = t.proOnly && !isPro
            const selected = selectedTemplate === t.id
            return (
              <button
                key={t.id}
                onClick={() => {
                  if (locked) {
                    router.push('/app/insights')
                    toast('Upgrade to Pro for premium templates', 'info')
                    return
                  }
                  setSelectedTemplate(t.id)
                }}
                className={`flex items-center justify-between rounded-lg border p-3 transition-colors text-left ${
                  selected
                    ? 'border-[var(--color-interactive)] border-2 bg-[var(--color-surface)]'
                    : locked
                    ? 'border-[var(--color-border)] bg-[var(--color-surface-overlay)] opacity-60'
                    : 'border-[var(--color-border)] bg-[var(--color-surface)] hover:bg-[var(--color-surface-overlay)]'
                }`}
              >
                <div className="flex items-center gap-2">
                  {locked && (
                    <svg className="h-4 w-4 text-[var(--color-text-tertiary)] shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                  )}
                  <div>
                    <p className="text-sm font-medium text-[var(--color-text-primary)]">{t.label}</p>
                    <p className="text-xs text-[var(--color-text-tertiary)]">{t.sublabel}</p>
                  </div>
                </div>
                {selected && !locked ? (
                  <div className="h-4 w-4 rounded-full bg-[var(--color-interactive)]" />
                ) : null}
              </button>
            )
          })}

          {!isPro && (
            <Button
              variant="link"
              size="sm"
              onClick={() => router.push('/app/insights')}
              className="mt-1 text-xs text-center"
            >
              Upgrade to Pro for premium templates
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}

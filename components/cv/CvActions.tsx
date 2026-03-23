'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import dynamic from 'next/dynamic'
import { Button } from '@/components/ui/Button'
import { useToast } from '@/components/ui/Toast'
import { ShareModal } from './ShareModal'
import { Download, Eye, RefreshCw, Upload, Share2 } from 'lucide-react'

const QRCode = dynamic(() => import('react-qr-code').then(m => m.default), { ssr: false })

interface CvActionsProps {
  handle: string
  hasPdf: boolean
  pdfGeneratedAt?: string | null
  hasUploadedCv: boolean
  cvPublic: boolean
  cvPublicSource: 'generated' | 'uploaded'
  isPro: boolean
  displayName: string
  primaryRole?: string | null
  departments?: string[] | null
  profilePhotoUrl?: string | null
}

type Template = 'standard' | 'classic-navy' | 'modern-minimal'

const TEMPLATES: { id: Template; label: string; sublabel: string; proOnly: boolean }[] = [
  { id: 'standard',       label: 'Standard',       sublabel: 'Free',                    proOnly: false },
  { id: 'classic-navy',   label: 'Classic Navy',   sublabel: 'Pro · Traditional serif', proOnly: true  },
  { id: 'modern-minimal', label: 'Modern Minimal', sublabel: 'Pro · Clean & spacious',  proOnly: true  },
]

export function CvActions({
  handle,
  hasPdf,
  pdfGeneratedAt,
  hasUploadedCv,
  cvPublic: initialCvPublic,
  cvPublicSource: initialCvPublicSource,
  isPro,
  displayName,
  primaryRole,
  departments,
  profilePhotoUrl,
}: CvActionsProps) {
  const { toast } = useToast()
  const router = useRouter()
  const [generating, setGenerating] = useState(false)
  const [pdfReady, setPdfReady] = useState(hasPdf)
  const [generatedAt, setGeneratedAt] = useState(pdfGeneratedAt)
  const [selectedTemplate, setSelectedTemplate] = useState<Template>('standard')
  const [showShareModal, setShowShareModal] = useState(false)
  const [cvPublic, setCvPublic] = useState(initialCvPublic)
  const [cvPublicSource, setCvPublicSource] = useState(initialCvPublicSource)

  const profileUrl = `https://yachtie.link/u/${handle}`

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
      setGeneratedAt(new Date().toISOString())
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

  async function saveCvSettings(pub: boolean, source: 'generated' | 'uploaded') {
    const prevPub = cvPublic
    const prevSource = cvPublicSource
    setCvPublic(pub)
    setCvPublicSource(source)
    try {
      const res = await fetch('/api/user/cv-settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cv_public: pub, cv_public_source: source }),
      })
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        throw new Error(body.error || 'Save failed')
      }
      toast('Settings saved', 'success')
    } catch (err) {
      setCvPublic(prevPub)
      setCvPublicSource(prevSource)
      toast(err instanceof Error ? err.message : 'Could not save settings', 'error')
    }
  }

  return (
    <div className="flex flex-col gap-3">
      {/* ── 1. QR Code — always visible ─────────────────────────────── */}
      <div className="rounded-2xl border border-[var(--color-border)] card-soft p-4 flex flex-col items-center gap-3">
        <h2 className="text-xs font-semibold uppercase tracking-wide text-[var(--color-text-tertiary)] self-start">
          Your QR Code
        </h2>
        <QRCode
          id="cv-qr-svg"
          value={profileUrl}
          size={160}
          level="M"
          bgColor="transparent"
          fgColor="var(--color-text-primary)"
        />
        <p className="text-xs text-[var(--color-text-tertiary)] font-mono">
          yachtie.link/u/{handle}
        </p>
        <Button variant="ghost" size="sm" onClick={downloadQR}>
          Download QR
        </Button>
        <p className="text-[10px] text-[var(--color-text-tertiary)]">
          Customisable QR coming soon
        </p>
      </div>

      {/* ── 2. Share Profile ────────────────────────────────────────── */}
      <Button onClick={() => setShowShareModal(true)} className="w-full gap-2">
        <Share2 size={16} />
        Share Profile
      </Button>

      {showShareModal && (
        <ShareModal
          handle={handle}
          displayName={displayName}
          primaryRole={primaryRole}
          departments={departments}
          profilePhotoUrl={profilePhotoUrl}
          onClose={() => setShowShareModal(false)}
        />
      )}

      {/* ── 3. CV Section ───────────────────────────────────────────── */}
      <div className="rounded-2xl border border-[var(--color-border)] card-soft p-4">
        <h2 className="text-xs font-semibold uppercase tracking-wide text-[var(--color-text-tertiary)] mb-3">
          Your CVs
        </h2>

        <a
          href="/app/cv/preview"
          className="flex items-center gap-2 rounded-xl border border-[var(--color-border)] p-3 hover:bg-[var(--color-surface-raised)] transition-colors"
        >
          <Eye size={16} className="text-[var(--color-text-tertiary)]" />
          <span className="text-sm font-medium text-[var(--color-text-primary)]">Preview your CV</span>
        </a>

        <div className="flex flex-col gap-3">
          {/* Generated CV */}
          <div className="rounded-xl border border-[var(--color-border)] p-3 flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-[var(--color-text-primary)]">Generated PDF</p>
              {pdfReady && (
                <Button variant="ghost" size="sm" onClick={downloadPdf} className="gap-1.5">
                  <Download size={14} /> Download
                </Button>
              )}
            </div>
            {pdfReady ? (
              <div className="flex items-center gap-2">
                <Button variant="link" size="sm" onClick={generatePdf} loading={generating} className="gap-1.5">
                  <RefreshCw size={12} />
                  {generating ? 'Generating…' : 'Regenerate'}
                </Button>
                {generatedAt && (
                  <span className="text-xs text-[var(--color-text-tertiary)]">
                    · {new Date(generatedAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </span>
                )}
              </div>
            ) : (
              <Button variant="outline" size="sm" onClick={generatePdf} loading={generating}>
                {generating ? 'Generating…' : 'Generate PDF'}
              </Button>
            )}
          </div>

          {/* Uploaded CV */}
          <div className="rounded-xl border border-[var(--color-border)] p-3 flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-[var(--color-text-primary)]">Uploaded CV</p>
              {hasUploadedCv && (
                <Button variant="ghost" size="sm" onClick={() => router.push('/app/cv/upload')} className="gap-1.5">
                  <Upload size={14} /> Replace
                </Button>
              )}
            </div>
            {hasUploadedCv ? (
              <p className="text-xs text-[var(--color-text-secondary)]">CV uploaded</p>
            ) : (
              <Button variant="outline" size="sm" onClick={() => router.push('/app/cv/upload')} className="gap-1.5">
                <Upload size={14} /> Upload CV
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* ── Template selector ───────────────────────────────────────── */}
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

      {/* ── 4. Public download toggle ───────────────────────────────── */}
      <div className="rounded-2xl border border-[var(--color-border)] card-soft p-4">
        <h2 className="text-xs font-semibold uppercase tracking-wide text-[var(--color-text-tertiary)] mb-3">
          Public CV Download
        </h2>

        <label className="flex items-center justify-between cursor-pointer">
          <span className="text-sm text-[var(--color-text-primary)]">
            Make CV downloadable from public profile
          </span>
          <button
            type="button"
            role="switch"
            aria-checked={cvPublic}
            onClick={() => saveCvSettings(!cvPublic, cvPublicSource)}
            className={`relative inline-flex h-6 w-11 shrink-0 rounded-full transition-colors ${
              cvPublic ? 'bg-[var(--color-interactive)]' : 'bg-[var(--color-border)]'
            }`}
          >
            <span
              className={`inline-block h-5 w-5 rounded-full bg-white shadow transform transition-transform mt-0.5 ${
                cvPublic ? 'translate-x-[22px]' : 'translate-x-0.5'
              }`}
            />
          </button>
        </label>

        {cvPublic && (pdfReady || hasUploadedCv) && (
          <div className="mt-3 flex flex-col gap-2 pl-1">
            <p className="text-xs text-[var(--color-text-secondary)] mb-1">Which CV to share?</p>
            {pdfReady && (
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="cv-source"
                  checked={cvPublicSource === 'generated'}
                  onChange={() => saveCvSettings(true, 'generated')}
                  className="accent-[var(--color-interactive)]"
                />
                <span className="text-sm text-[var(--color-text-primary)]">Generated PDF</span>
              </label>
            )}
            {hasUploadedCv && (
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="cv-source"
                  checked={cvPublicSource === 'uploaded'}
                  onChange={() => saveCvSettings(true, 'uploaded')}
                  className="accent-[var(--color-interactive)]"
                />
                <span className="text-sm text-[var(--color-text-primary)]">Uploaded CV</span>
              </label>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

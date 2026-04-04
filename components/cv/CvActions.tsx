'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/Button'
import { useToast } from '@/components/ui/Toast'
import { ProUpsellCard } from '@/components/ui/ProUpsellCard'
import { Download, Eye, EyeOff, Upload, FileText, Sparkles, RefreshCw, ChevronDown } from 'lucide-react'
import { InfoTooltip } from '@/components/ui/InfoTooltip'

interface CvActionsProps {
  hasGeneratedPdf: boolean
  pdfGeneratedAt: string | null
  pdfStale: boolean
  hasUploadedCv: boolean
  cvPublic: boolean
  cvPublicSource: 'generated' | 'uploaded'
  isPro: boolean
}

type Template = 'standard' | 'classic-navy' | 'modern-minimal'

const TEMPLATES: { id: Template; label: string; sublabel: string; proOnly: boolean }[] = [
  { id: 'standard',       label: 'Standard',       sublabel: 'Free',                    proOnly: false },
  { id: 'classic-navy',   label: 'Classic Navy',   sublabel: 'Pro · Traditional serif', proOnly: true  },
  { id: 'modern-minimal', label: 'Modern Minimal', sublabel: 'Pro · Clean & spacious',  proOnly: true  },
]

export function CvActions({
  hasGeneratedPdf: initialHasGeneratedPdf,
  pdfGeneratedAt: initialPdfGeneratedAt,
  pdfStale: initialPdfStale,
  hasUploadedCv,
  cvPublic: initialCvPublic,
  cvPublicSource: initialCvPublicSource,
  isPro,
}: CvActionsProps) {
  const { toast } = useToast()
  const router = useRouter()
  const [generating, setGenerating] = useState(false)
  const [hasGeneratedPdf, setHasGeneratedPdf] = useState(initialHasGeneratedPdf)
  const [pdfGeneratedAt, setPdfGeneratedAt] = useState(initialPdfGeneratedAt)
  const [pdfStale, setPdfStale] = useState(initialPdfStale)
  const [selectedTemplate, setSelectedTemplate] = useState<Template>('standard')
  const [templatePickerOpen, setTemplatePickerOpen] = useState(false)
  const [previewingTemplate, setPreviewingTemplate] = useState<Template | null>(null)
  const [cvPublic, setCvPublic] = useState(initialCvPublic)
  const [cvPublicSource, setCvPublicSource] = useState(initialCvPublicSource)

  async function downloadUploadedCv() {
    try {
      const res = await fetch('/api/cv/download-uploaded')
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        throw new Error(body.error || 'Failed to get download link')
      }
      const { url } = await res.json()
      window.open(url, '_blank')
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Could not download CV', 'error')
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
      if (res.status === 429) {
        toast('You\u2019ve used all your generations for now — you\u2019ll get 50 more within the hour.', 'info')
        return
      }
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        throw new Error(body.error || 'Failed to generate PDF')
      }
      await res.json()
      setHasGeneratedPdf(true)
      setPdfGeneratedAt(new Date().toISOString())
      setPdfStale(false)
      toast(hasGeneratedPdf ? 'CV regenerated from your latest profile' : 'CV generated — you can now preview and download it', 'success')
    } catch (err) {
      toast(err instanceof Error ? err.message : 'PDF generation failed', 'error')
    } finally {
      setGenerating(false)
    }
  }

  async function downloadGeneratedPdf() {
    try {
      const res = await fetch('/api/cv/download-pdf')
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        throw new Error(body.error || 'Failed to get download link')
      }
      const { url } = await res.json()
      window.open(url, '_blank')
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Could not download PDF', 'error')
    }
  }

  async function previewTemplate(template: Template) {
    setPreviewingTemplate(template)
    try {
      const res = await fetch('/api/cv/generate-pdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ template }),
      })
      if (res.status === 429) {
        toast('You\u2019ve used all your generations for now — you\u2019ll get 50 more within the hour.', 'info')
        return
      }
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        throw new Error(body.error || 'Failed to generate preview')
      }
      const { url } = await res.json()
      setHasGeneratedPdf(true)
      setPdfGeneratedAt(new Date().toISOString())
      setPdfStale(false)
      setSelectedTemplate(template)
      window.open(url, '_blank')
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Preview failed', 'error')
    } finally {
      setPreviewingTemplate(null)
    }
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

  const currentTemplateName = TEMPLATES.find((t) => t.id === selectedTemplate)?.label ?? 'Standard'

  return (
    <div className="flex flex-col gap-3">
      {/* ── 1. Your CV ────────────────────────────────────────────────── */}
      <div className="rounded-2xl border border-[var(--color-amber-200)] bg-white/90 shadow-sm p-4 flex flex-col gap-3">
        <h2 className="text-xs font-semibold uppercase tracking-wide text-[var(--color-amber-500)]">
          Your CV
        </h2>

        {/* YachtieLink CV — built from profile */}
        <div className="rounded-xl border border-[var(--color-amber-200)] bg-white/60 p-3 flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <Sparkles size={14} className="text-[var(--color-amber-500)] shrink-0" />
            <p className="text-sm font-medium text-[var(--color-text-primary)]">YachtieLink CV</p>
            {pdfStale && hasGeneratedPdf && (
              <InfoTooltip text="Your profile has changed since this CV was generated. Regenerate to include updates." />
            )}
          </div>
          {pdfStale && hasGeneratedPdf ? (
            <div className="rounded-lg bg-[var(--color-amber-50)] border border-[var(--color-amber-200)] p-2.5 flex items-start gap-2">
              <RefreshCw size={14} className="text-[var(--color-amber-500)] shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-xs font-medium text-[var(--color-text-primary)]">
                  Your profile has changed since this CV was generated.
                </p>
                <p className="text-xs text-[var(--color-text-tertiary)] mt-0.5">
                  Regenerate so visitors see your latest info.
                </p>
              </div>
            </div>
          ) : (
            <p className="text-xs text-[var(--color-text-tertiary)] leading-relaxed">
              {hasGeneratedPdf
                ? 'Built from your profile. Regenerate any time to pick up changes.'
                : 'We\u2019ll build a professional CV from your profile — ready in seconds.'}
            </p>
          )}
          {hasGeneratedPdf && pdfGeneratedAt && (
            <p className="text-xs text-[var(--color-text-tertiary)]">
              Last generated {new Date(pdfGeneratedAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })} at {new Date(pdfGeneratedAt).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
            </p>
          )}
          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={generatePdf}
              disabled={generating}
              className="inline-flex items-center gap-1.5 rounded-lg bg-[var(--color-amber-500)] text-white text-xs font-medium px-3 py-1.5 hover:bg-[var(--color-amber-600)] transition-colors disabled:opacity-50"
            >
              {hasGeneratedPdf ? <RefreshCw size={14} /> : <Sparkles size={14} />}
              {generating ? 'Generating…' : hasGeneratedPdf ? 'Regenerate' : 'Generate CV'}
            </button>
            {hasGeneratedPdf && (
              <>
                <a
                  href="/app/cv/preview"
                  className="flex items-center gap-1.5 text-xs text-[var(--color-interactive)]"
                >
                  <Eye size={12} /> Preview
                </a>
                <button
                  type="button"
                  onClick={downloadGeneratedPdf}
                  className="flex items-center gap-1.5 text-xs text-[var(--color-interactive)]"
                >
                  <Download size={12} /> Download
                </button>
              </>
            )}
          </div>
        </div>

        {/* Uploaded CV — their own file */}
        <div className="rounded-xl border border-[var(--color-amber-200)] bg-white/60 p-3 flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <FileText size={14} className="text-[var(--color-text-tertiary)] shrink-0" />
            <p className="text-sm font-medium text-[var(--color-text-primary)]">Your own CV</p>
          </div>
          {hasUploadedCv ? (
            <>
              <p className="text-xs text-[var(--color-text-tertiary)] leading-relaxed">
                Your uploaded file — use Sharing below to make it available on your profile.
              </p>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={downloadUploadedCv}
                  className="flex items-center gap-1.5 text-xs text-[var(--color-interactive)]"
                >
                  <Eye size={12} /> Preview
                </button>
                <button
                  type="button"
                  onClick={downloadUploadedCv}
                  className="flex items-center gap-1.5 text-xs text-[var(--color-interactive)]"
                >
                  <Download size={12} /> Download
                </button>
                <button
                  type="button"
                  onClick={() => router.push('/app/cv/upload')}
                  className="flex items-center gap-1.5 text-xs text-[var(--color-interactive)]"
                >
                  <Upload size={12} /> Replace
                </button>
              </div>
            </>
          ) : (
            <>
              <p className="text-xs text-[var(--color-text-tertiary)] leading-relaxed">
                Upload your own CV so captains and agents can download it from your profile.
              </p>
              <Button variant="outline" size="sm" onClick={() => router.push('/app/cv/upload')} className="gap-1.5 self-start">
                <Upload size={14} /> Upload CV
              </Button>
            </>
          )}
        </div>
      </div>

      {/* ── 2. CV Design — Collapsed template picker ──────────────── */}
      <div className="rounded-2xl border border-[var(--color-amber-200)] bg-white/90 shadow-sm p-4 flex flex-col gap-2">
        <h2 className="text-xs font-semibold uppercase tracking-wide text-[var(--color-amber-500)]">
          CV Design
        </h2>
        <div className="flex items-center justify-between">
          <p className="text-sm text-[var(--color-text-primary)]">{currentTemplateName}</p>
          <button
            type="button"
            onClick={() => setTemplatePickerOpen(!templatePickerOpen)}
            className="flex items-center gap-1 text-sm font-medium text-[var(--color-interactive)]"
          >
            Change
            <ChevronDown
              size={14}
              className={`transition-transform ${templatePickerOpen ? 'rotate-180' : ''}`}
            />
          </button>
        </div>

        {templatePickerOpen && (
          <div className="flex flex-col gap-2 mt-1">
            {TEMPLATES.map((t) => {
              const locked = t.proOnly && !isPro
              const selected = selectedTemplate === t.id
              return (
                <button
                  key={t.id}
                  onClick={() => {
                    if (locked) {
                      router.push('/app/settings/plan')
                      toast('Upgrade to Pro for premium templates', 'info')
                      return
                    }
                    setSelectedTemplate(t.id)
                    setTemplatePickerOpen(false)
                  }}
                  className={`flex items-center gap-3 rounded-lg border p-3 transition-colors text-left ${
                    selected
                      ? 'border-[var(--color-amber-500)] border-2 bg-[var(--color-amber-50)]/50'
                      : locked
                      ? 'border-[var(--color-border)] bg-[var(--color-surface-overlay)] opacity-60'
                      : 'border-[var(--color-border)] bg-[var(--color-surface)] hover:bg-[var(--color-surface-overlay)]'
                  }`}
                >
                  <div className={`h-4 w-4 rounded-full border-2 shrink-0 ${
                    selected ? 'border-[var(--color-amber-500)] bg-[var(--color-amber-500)]' : 'border-[var(--color-border)]'
                  }`}>
                    {selected && <div className="h-full w-full rounded-full border-2 border-white" />}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-1.5">
                      {locked && (
                        <svg className="h-3 w-3 text-[var(--color-text-tertiary)] shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                        </svg>
                      )}
                      <p className="text-sm font-medium text-[var(--color-text-primary)]">{t.label}</p>
                    </div>
                    <p className="text-xs text-[var(--color-text-tertiary)]">{t.sublabel}</p>
                  </div>
                  {!locked && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation()
                        previewTemplate(t.id)
                      }}
                      disabled={previewingTemplate !== null}
                      className="flex items-center gap-1 text-xs text-[var(--color-interactive)] shrink-0"
                    >
                      <Eye size={12} />
                      {previewingTemplate === t.id ? 'Loading…' : 'Preview'}
                    </button>
                  )}
                </button>
              )
            })}

            {!isPro && (
              <ProUpsellCard
                variant="inline"
                feature="premium CV templates"
                context="cv"
              />
            )}
          </div>
        )}
      </div>

      {/* ── 3. Sharing — who can download from your public profile ─── */}
      <div className="rounded-2xl border border-[var(--color-amber-200)] bg-white/90 shadow-sm p-4 flex flex-col gap-3">
        <h2 className="text-xs font-semibold uppercase tracking-wide text-[var(--color-amber-500)]">
          Sharing
        </h2>
        <p className="text-xs text-[var(--color-text-tertiary)] leading-relaxed">
          Who can download from your public profile?
        </p>

        <div className="flex flex-col gap-2">
          {/* No download */}
          <button
            type="button"
            onClick={() => saveCvSettings(false, cvPublicSource)}
            className={`flex items-center gap-3 rounded-lg border p-3 transition-colors text-left ${
              !cvPublic
                ? 'border-[var(--color-amber-500)] border-2 bg-[var(--color-amber-50)]/50'
                : 'border-[var(--color-border)] bg-[var(--color-surface)] hover:bg-[var(--color-surface-overlay)]'
            }`}
          >
            <div className={`h-4 w-4 rounded-full border-2 shrink-0 ${
              !cvPublic ? 'border-[var(--color-amber-500)] bg-[var(--color-amber-500)]' : 'border-[var(--color-border)]'
            }`}>
              {!cvPublic && <div className="h-full w-full rounded-full border-2 border-white" />}
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-1.5">
                <EyeOff size={12} className="text-[var(--color-text-tertiary)]" />
                <p className="text-sm font-medium text-[var(--color-text-primary)]">No download</p>
              </div>
              <p className="text-xs text-[var(--color-text-tertiary)] mt-0.5">
                Visitors can view your profile but not download a CV.
              </p>
            </div>
          </button>

          {/* YachtieLink CV */}
          <button
            type="button"
            onClick={() => {
              if (!hasGeneratedPdf) {
                toast('Generate a PDF first', 'info')
                return
              }
              saveCvSettings(true, 'generated')
            }}
            className={`flex items-center gap-3 rounded-lg border p-3 transition-colors text-left ${
              cvPublic && cvPublicSource === 'generated'
                ? 'border-[var(--color-amber-500)] border-2 bg-[var(--color-amber-50)]/50'
                : !hasGeneratedPdf
                  ? 'border-[var(--color-border)] bg-[var(--color-surface-overlay)] opacity-60'
                  : 'border-[var(--color-border)] bg-[var(--color-surface)] hover:bg-[var(--color-surface-overlay)]'
            }`}
          >
            <div className={`h-4 w-4 rounded-full border-2 shrink-0 ${
              cvPublic && cvPublicSource === 'generated' ? 'border-[var(--color-amber-500)] bg-[var(--color-amber-500)]' : 'border-[var(--color-border)]'
            }`}>
              {cvPublic && cvPublicSource === 'generated' && <div className="h-full w-full rounded-full border-2 border-white" />}
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-1.5">
                <Sparkles size={12} className="text-[var(--color-amber-500)]" />
                <p className="text-sm font-medium text-[var(--color-text-primary)]">YachtieLink CV</p>
              </div>
              <p className="text-xs text-[var(--color-text-tertiary)] mt-0.5">
                {hasGeneratedPdf
                  ? 'Built from your profile — always up to date.'
                  : 'Generate a PDF first to enable this option.'}
              </p>
            </div>
          </button>

          {/* Your own CV */}
          <button
            type="button"
            onClick={() => {
              if (!hasUploadedCv) {
                router.push('/app/cv/upload')
                toast('Upload a CV first', 'info')
                return
              }
              saveCvSettings(true, 'uploaded')
            }}
            className={`flex items-center gap-3 rounded-lg border p-3 transition-colors text-left ${
              cvPublic && cvPublicSource === 'uploaded'
                ? 'border-[var(--color-amber-500)] border-2 bg-[var(--color-amber-50)]/50'
                : !hasUploadedCv
                  ? 'border-[var(--color-border)] bg-[var(--color-surface-overlay)] opacity-60'
                  : 'border-[var(--color-border)] bg-[var(--color-surface)] hover:bg-[var(--color-surface-overlay)]'
            }`}
          >
            <div className={`h-4 w-4 rounded-full border-2 shrink-0 ${
              cvPublic && cvPublicSource === 'uploaded' ? 'border-[var(--color-amber-500)] bg-[var(--color-amber-500)]' : 'border-[var(--color-border)]'
            }`}>
              {cvPublic && cvPublicSource === 'uploaded' && <div className="h-full w-full rounded-full border-2 border-white" />}
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-1.5">
                <FileText size={12} className="text-[var(--color-text-tertiary)]" />
                <p className="text-sm font-medium text-[var(--color-text-primary)]">Your own CV</p>
              </div>
              <p className="text-xs text-[var(--color-text-tertiary)] mt-0.5">
                {hasUploadedCv
                  ? 'The file you uploaded.'
                  : 'Upload a CV to enable this option.'}
              </p>
            </div>
          </button>
        </div>
      </div>
    </div>
  )
}

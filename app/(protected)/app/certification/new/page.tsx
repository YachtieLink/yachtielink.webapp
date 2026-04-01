'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { uploadCertDocument } from '@/lib/storage/upload'
import { Button, Input, DatePicker } from '@/components/ui'
import { useToast } from '@/components/ui/Toast'
import { PageHeader } from '@/components/ui/PageHeader'
import {
  Wrench, UtensilsCrossed, Stethoscope, Compass,
  Scale, LifeBuoy, Waves, Plus, ChevronRight,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

interface CertType {
  id: string
  name: string
  short_name: string | null
  category: string
}

type Step = 'category' | 'cert' | 'details'

const CATEGORY_ICONS: Record<string, LucideIcon> = {
  'Engineering': Wrench,
  'Hospitality & Service': UtensilsCrossed,
  'Medical': Stethoscope,
  'Navigation & Watchkeeping': Compass,
  'Regulatory & Flag State': Scale,
  'Safety & Sea Survival': LifeBuoy,
  'Water Sports & Leisure': Waves,
}

export default function CertNewPage() {
  const router    = useRouter()
  const { toast } = useToast()
  const supabase  = createClient()

  const [certTypes, setCertTypes]     = useState<CertType[]>([])
  const [step, setStep]               = useState<Step>('category')
  const [category, setCategory]       = useState<string>('')
  const [selectedId, setSelectedId]   = useState<string | null>(null)
  const [customName, setCustomName]   = useState('')
  const [isOther, setIsOther]         = useState(false)
  const [issuedAt, setIssuedAt]       = useState('')
  const [expiresAt, setExpiresAt]     = useState('')
  const [noExpiry, setNoExpiry]       = useState(false)
  const [docFile, setDocFile]         = useState<File | null>(null)
  const [saving, setSaving]           = useState(false)
  const docFileRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    supabase
      .from('certification_types')
      .select('id, name, short_name, category')
      .order('category')
      .order('name')
      .then(({ data }) => { if (data) setCertTypes(data) })
  }, [supabase])

  const categories = [...new Set(certTypes.map((c) => c.category))].sort()
  const certsInCategory = certTypes.filter((c) => c.category === category)
  const selectedCert = certTypes.find((c) => c.id === selectedId)

  function pickCategory(cat: string) {
    setCategory(cat)
    setSelectedId(null)
    setIsOther(false)
    setCustomName('')
    setStep('cert')
  }

  function pickCert(id: string) {
    setSelectedId(id)
    setIsOther(false)
    setCustomName('')
    setStep('details')
  }

  function pickOther() {
    setSelectedId(null)
    setIsOther(true)
    setStep('details')
  }

  async function handleSave() {
    if (isOther && !customName.trim()) {
      toast('Please enter a certification name.', 'error')
      return
    }
    if (!issuedAt && !noExpiry) {
      // issued date is optional — proceed
    }
    if (!noExpiry && expiresAt && issuedAt && new Date(expiresAt) < new Date(issuedAt)) {
      toast('Expiry date must be after issued date.', 'error')
      return
    }

    setSaving(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { toast('Not signed in.', 'error'); return }

      // Insert certification record
      const { data: cert, error: insertErr } = await supabase
        .from('certifications')
        .insert({
          user_id:               user.id,
          certification_type_id: selectedId ?? null,
          custom_cert_name:      isOther ? customName.trim() : null,
          issued_at:             issuedAt  || null,
          expires_at:            noExpiry ? null : (expiresAt || null),
        })
        .select('id')
        .single()

      if (insertErr || !cert) {
        toast(insertErr?.message ?? 'Failed to save certification.', 'error')
        return
      }

      // Upload document if provided
      if (docFile) {
        const result = await uploadCertDocument(user.id, cert.id, docFile)
        if (result.ok) {
          await supabase
            .from('certifications')
            .update({ document_url: result.storagePath })
            .eq('id', cert.id)
        } else {
          toast(`Cert saved, but document upload failed: ${result.error}`, 'error')
        }
      }

      // If "Other", log for periodic review
      if (isOther) {
        await supabase
          .from('other_cert_entries')
          .insert({ value: customName.trim(), category: category || null, submitted_by: user.id })
      }

      toast('Certification added.', 'success')
      router.push('/app/profile')
      router.refresh()
    } finally {
      setSaving(false)
    }
  }

  // ── Step: Category ──────────────────────────────────────────────────────────
  if (step === 'category') {
    return (
      <div className="flex flex-col gap-4 pb-24">
        <PageHeader
          backHref="/app/profile"
          title="Add certification"
          subtitle="Choose a category to start."
        />
        <div className="grid grid-cols-2 gap-2">
          {categories.map((cat) => {
            const Icon = CATEGORY_ICONS[cat] ?? Compass
            return (
              <button
                key={cat}
                onClick={() => pickCategory(cat)}
                className="flex items-center gap-3 p-4 rounded-xl border transition-colors border-[var(--color-border)] bg-[var(--color-surface)] hover:border-[var(--color-teal-700)] hover:bg-[var(--color-teal-50)] text-left"
              >
                <Icon size={20} className="shrink-0 text-[var(--color-text-secondary)]" />
                <span className="text-sm font-medium text-[var(--color-text-primary)]">{cat}</span>
              </button>
            )
          })}
          <button
            onClick={() => { setCategory(''); pickOther() }}
            className="flex items-center gap-3 p-4 rounded-xl border transition-colors border-[var(--color-border)] bg-[var(--color-surface)] hover:border-[var(--color-teal-700)] hover:bg-[var(--color-teal-50)] text-left"
          >
            <Plus size={20} className="shrink-0 text-[var(--color-text-secondary)]" />
            <span className="text-sm font-medium text-[var(--color-interactive)]">Other / not listed</span>
          </button>
        </div>
      </div>
    )
  }

  // ── Step: Cert within category ──────────────────────────────────────────────
  if (step === 'cert') {
    return (
      <div className="flex flex-col gap-4 pb-24">
        <PageHeader
          onBack={() => setStep('category')}
          backLabel="Categories"
          title={category}
          subtitle="Choose your certification"
          sectionColor="teal"
        />
        <ul className="bg-[var(--color-surface)] rounded-2xl divide-y divide-[var(--color-border)]">
          {certsInCategory.map((ct) => (
            <li key={ct.id}>
              <button
                onClick={() => pickCert(ct.id)}
                className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-[var(--color-surface-raised)]/30 transition-colors first:rounded-t-2xl"
              >
                <div>
                  <p className="text-sm text-[var(--color-text-primary)]">{ct.name}</p>
                  {ct.short_name && (
                    <p className="text-xs text-[var(--color-text-secondary)]">{ct.short_name}</p>
                  )}
                </div>
                <ChevronRight size={16} className="shrink-0 text-[var(--color-text-secondary)]" />
              </button>
            </li>
          ))}
          <li>
            <button
              onClick={pickOther}
              className="w-full flex items-center justify-between px-5 py-4 text-sm text-[var(--color-interactive)] hover:bg-[var(--color-surface-raised)]/30 transition-colors text-left last:rounded-b-2xl"
            >
              Other / not listed
              <ChevronRight size={16} className="shrink-0 text-[var(--color-text-secondary)]" />
            </button>
          </li>
        </ul>
      </div>
    )
  }

  // ── Step: Details ───────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col gap-6 pb-24">
      <PageHeader
        onBack={() => setStep(isOther && !category ? 'category' : 'cert')}
        backLabel={isOther && !category ? 'Categories' : category || 'Back'}
        title={isOther ? 'Other certification' : (selectedCert?.name ?? 'Certification')}
        subtitle={!isOther && category ? category : undefined}
        sectionColor="teal"
      />

      <div className="bg-[var(--color-surface)] rounded-2xl p-5 flex flex-col gap-4">
        {isOther && (
          <Input
            label="Certification name"
            value={customName}
            onChange={(e) => setCustomName(e.target.value)}
            placeholder="e.g. Helicopter Underwater Escape Training"
            required
          />
        )}

        <DatePicker
          label="Issued date"
          value={issuedAt || null}
          onChange={(v) => setIssuedAt(v ?? '')}
          hint="Optional"
          maxYear={new Date().getFullYear()}
        />

        <div className="flex flex-col gap-2">
          <DatePicker
            label="Expiry date"
            value={expiresAt || null}
            onChange={(v) => setExpiresAt(v ?? '')}
            disabled={noExpiry}
          />
          <label className="flex items-center gap-3 py-3 px-4 rounded-xl hover:bg-[var(--color-surface-raised)] cursor-pointer min-h-[44px]">
            <input
              type="checkbox"
              checked={noExpiry}
              onChange={(e) => { setNoExpiry(e.target.checked); if (e.target.checked) setExpiresAt('') }}
              className="w-5 h-5 rounded accent-[var(--color-teal-700)]"
            />
            <span className="text-sm text-[var(--color-text-primary)]">No expiry / lifetime certification</span>
          </label>
        </div>

        <div>
          <label className="text-sm font-medium text-[var(--color-text-primary)]">
            Supporting document <span className="font-normal text-[var(--color-text-secondary)]">(optional)</span>
          </label>
          <p className="text-xs text-[var(--color-text-secondary)] mb-2">PDF, JPEG, or PNG · max 10 MB · private, only you can see it</p>
          <Button variant="outline" size="sm" onClick={() => docFileRef.current?.click()}>
            {docFile ? docFile.name : 'Choose file'}
          </Button>
          <input
            ref={docFileRef}
            type="file"
            accept=".pdf,image/jpeg,image/png"
            onChange={(e) => setDocFile(e.target.files?.[0] ?? null)}
            className="hidden"
          />
        </div>
      </div>

      <div className="flex gap-3">
        <Button variant="secondary" onClick={() => router.back()} className="flex-1">
          Cancel
        </Button>
        <Button onClick={handleSave} loading={saving} className="flex-1">
          Save
        </Button>
      </div>
    </div>
  )
}

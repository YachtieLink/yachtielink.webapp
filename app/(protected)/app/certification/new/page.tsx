'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { uploadCertDocument } from '@/lib/storage/upload'
import { Button, Input } from '@/components/ui'
import { useToast } from '@/components/ui/Toast'

interface CertType {
  id: string
  name: string
  short_name: string | null
  category: string
}

type Step = 'category' | 'cert' | 'details'

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
      <div className="flex flex-col gap-4 pb-8">
        <div>
          <h1 className="text-xl font-semibold text-[var(--color-text-primary)]">Add certification</h1>
          <p className="text-sm text-[var(--color-text-secondary)] mt-1">Choose a category to start.</p>
        </div>
        <ul className="bg-[var(--color-surface)] rounded-2xl divide-y divide-[var(--color-border)]">
          {categories.map((cat) => (
            <li key={cat}>
              <button
                onClick={() => pickCategory(cat)}
                className="w-full flex items-center justify-between px-5 py-4 text-sm text-[var(--color-text-primary)] hover:bg-[var(--color-surface-raised)]/30 transition-colors text-left first:rounded-t-2xl last:rounded-b-2xl"
              >
                {cat}
                <span className="text-[var(--color-text-secondary)]">›</span>
              </button>
            </li>
          ))}
          <li>
            <button
              onClick={() => { setCategory(''); pickOther() }}
              className="w-full flex items-center justify-between px-5 py-4 text-sm text-[var(--color-interactive)] hover:bg-[var(--color-surface-raised)]/30 transition-colors text-left last:rounded-b-2xl"
            >
              Other / not listed
              <span className="text-[var(--color-text-secondary)]">›</span>
            </button>
          </li>
        </ul>
      </div>
    )
  }

  // ── Step: Cert within category ──────────────────────────────────────────────
  if (step === 'cert') {
    return (
      <div className="flex flex-col gap-4 pb-8">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setStep('category')}
            className="text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]"
            aria-label="Back"
          >
            ‹
          </button>
          <div>
            <h1 className="text-xl font-semibold text-[var(--color-text-primary)]">{category}</h1>
            <p className="text-sm text-[var(--color-text-secondary)]">Choose your certification</p>
          </div>
        </div>
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
                <span className="text-[var(--color-text-secondary)]">›</span>
              </button>
            </li>
          ))}
          <li>
            <button
              onClick={pickOther}
              className="w-full flex items-center justify-between px-5 py-4 text-sm text-[var(--color-interactive)] hover:bg-[var(--color-surface-raised)]/30 transition-colors text-left last:rounded-b-2xl"
            >
              Other / not listed
              <span className="text-[var(--color-text-secondary)]">›</span>
            </button>
          </li>
        </ul>
      </div>
    )
  }

  // ── Step: Details ───────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col gap-6 pb-8">
      <div className="flex items-center gap-3">
        <button
          onClick={() => setStep(isOther && !category ? 'category' : 'cert')}
          className="text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]"
          aria-label="Back"
        >
          ‹
        </button>
        <div>
          <h1 className="text-xl font-semibold text-[var(--color-text-primary)]">
            {isOther ? 'Other certification' : (selectedCert?.name ?? 'Certification')}
          </h1>
          {!isOther && category && (
            <p className="text-sm text-[var(--color-text-secondary)]">{category}</p>
          )}
        </div>
      </div>

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

        <Input
          label="Issued date"
          type="date"
          value={issuedAt}
          onChange={(e) => setIssuedAt(e.target.value)}
          hint="Optional"
        />

        <div className="flex flex-col gap-2">
          <Input
            label="Expiry date"
            type="date"
            value={expiresAt}
            onChange={(e) => setExpiresAt(e.target.value)}
            disabled={noExpiry}
          />
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={noExpiry}
              onChange={(e) => { setNoExpiry(e.target.checked); if (e.target.checked) setExpiresAt('') }}
              className="rounded border-[var(--color-border)] text-[var(--color-interactive)]"
            />
            <span className="text-sm text-[var(--color-text-secondary)]">No expiry / lifetime certification</span>
          </label>
        </div>

        <div>
          <label className="text-sm font-medium text-[var(--color-text-primary)]">
            Supporting document <span className="font-normal text-[var(--color-text-secondary)]">(optional)</span>
          </label>
          <p className="text-xs text-[var(--color-text-secondary)] mb-2">PDF, JPEG, or PNG · max 10 MB · private, only you can see it</p>
          <input
            type="file"
            accept=".pdf,image/jpeg,image/png"
            onChange={(e) => setDocFile(e.target.files?.[0] ?? null)}
            className="text-sm text-[var(--color-text-primary)]"
          />
          {docFile && (
            <p className="text-xs text-[var(--color-interactive)] mt-1">{docFile.name}</p>
          )}
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

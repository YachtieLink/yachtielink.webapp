'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { createClient } from '@/lib/supabase/client'
import { uploadCertDocument } from '@/lib/storage/upload'
import { Button, Input, DatePicker } from '@/components/ui'
import { useToast } from '@/components/ui/Toast'
import { Skeleton } from '@/components/ui/skeleton'
import { PageTransition } from '@/components/ui/PageTransition'
import { BackButton } from '@/components/ui/BackButton'

export default function CertEditPage() {
  const router    = useRouter()
  const params    = useParams<{ id: string }>()
  const { toast } = useToast()
  const supabase  = createClient()

  const [loaded, setLoaded]       = useState(false)
  const [saving, setSaving]       = useState(false)
  const [deleting, setDeleting]   = useState(false)
  const prefersReducedMotion = useReducedMotion()
  const [certName, setCertName]   = useState('')
  const [isCustom, setIsCustom]   = useState(false)
  const [customName, setCustomName] = useState('')
  const [issuedAt, setIssuedAt]   = useState('')
  const [expiresAt, setExpiresAt] = useState('')
  const [noExpiry, setNoExpiry]   = useState(false)
  const [issuingBody, setIssuingBody] = useState('')
  const [existingDoc, setExistingDoc] = useState<string | null>(null)
  const [docFile, setDocFile]     = useState<File | null>(null)
  const docFileRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    async function load() {
      const { data } = await supabase
        .from('certifications')
        .select('custom_cert_name, issued_at, expires_at, document_url, issuing_body, certification_types(name)')
        .eq('id', params.id)
        .single()

      if (!data) { toast('Certification not found.', 'error'); router.back(); return }

      const name = (data.certification_types as any)?.name ?? data.custom_cert_name ?? ''
      setCertName(name)
      setIsCustom(!data.certification_types)
      setCustomName(data.custom_cert_name ?? '')
      setIssuedAt(data.issued_at ?? '')
      setExpiresAt(data.expires_at ?? '')
      setNoExpiry(!data.expires_at)
      setIssuingBody(data.issuing_body ?? '')
      setExistingDoc(data.document_url)
      setLoaded(true)
    }
    load()
  }, [supabase, params.id, router, toast])

  async function handleSave() {
    if (!noExpiry && expiresAt && issuedAt && new Date(expiresAt) < new Date(issuedAt)) {
      toast('Expiry date must be after issued date.', 'error')
      return
    }

    setSaving(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { toast('Not signed in.', 'error'); return }

      const { error } = await supabase
        .from('certifications')
        .update({
          custom_cert_name: isCustom ? customName.trim() : undefined,
          issued_at:  issuedAt  || null,
          expires_at: noExpiry ? null : (expiresAt || null),
          issuing_body: issuingBody.trim() || null,
        })
        .eq('id', params.id)

      if (error) { toast(error.message, 'error'); return }

      if (docFile) {
        const result = await uploadCertDocument(user.id, params.id, docFile)
        if (result.ok) {
          await supabase
            .from('certifications')
            .update({ document_url: result.storagePath })
            .eq('id', params.id)
        } else {
          toast(`Saved, but document upload failed: ${result.error}`, 'error')
        }
      }

      toast('Certification updated.', 'success')
      router.push('/app/profile')
      router.refresh()
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete() {
    if (!confirm('Remove this certification? This cannot be undone.')) return
    setDeleting(true)
    try {
      const { error } = await supabase
        .from('certifications')
        .delete()
        .eq('id', params.id)

      if (error) { toast(error.message, 'error'); return }
      toast('Certification removed.', 'success')
      router.push('/app/profile')
      router.refresh()
    } finally {
      setDeleting(false)
    }
  }

  return (
    <PageTransition>
      <AnimatePresence mode="wait">
        {!loaded ? (
          <motion.div
            key="skeleton"
            exit={prefersReducedMotion ? undefined : { opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="flex flex-col gap-4"
          >
            <Skeleton className="h-6 w-40" />
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} className="h-12 w-full rounded-xl" />
            ))}
          </motion.div>
        ) : (
          <motion.div
            key="content"
            initial={prefersReducedMotion ? false : { opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.15 }}
            className="flex flex-col gap-6 pb-24"
          >
            <div className="flex items-center gap-3">
              <BackButton href="/app/profile" />
              <div>
                <h1 className="text-[28px] font-bold tracking-tight text-[var(--color-text-primary)]">Edit certification</h1>
                <p className="text-sm text-[var(--color-text-secondary)] mt-1">{certName}</p>
              </div>
            </div>

            <div className="bg-[var(--color-surface)] rounded-2xl p-5 flex flex-col gap-4">
              {isCustom && (
                <Input
                  label="Certification name"
                  value={customName}
                  onChange={(e) => setCustomName(e.target.value)}
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

              <Input
                label="Issuing body"
                value={issuingBody}
                onChange={(e) => setIssuingBody(e.target.value)}
                placeholder="e.g. Maritime Authority"
              />

              <div>
                <label className="text-sm font-medium text-[var(--color-text-primary)]">Supporting document</label>
                <p className="text-xs text-[var(--color-text-secondary)] mb-2">
                  {existingDoc ? 'A document is already attached. Upload a new one to replace it.' : 'PDF, JPEG, or PNG · max 10 MB · private'}
                </p>
                <Button variant="outline" size="sm" onClick={() => docFileRef.current?.click()}>
                  {docFile ? docFile.name : existingDoc ? 'Replace file' : 'Choose file'}
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

            <Button
              variant="destructive"
              size="sm"
              onClick={handleDelete}
              loading={deleting}
              className="w-full"
            >
              Remove certification
            </Button>
          </motion.div>
        )}
      </AnimatePresence>
    </PageTransition>
  )
}

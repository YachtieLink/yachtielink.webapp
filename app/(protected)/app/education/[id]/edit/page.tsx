'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { PageHeader } from '@/components/ui/PageHeader'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { DatePicker } from '@/components/ui/DatePicker'
import { useToast } from '@/components/ui/Toast'
import { Skeleton } from '@/components/ui/skeleton'
import { PageTransition } from '@/components/ui/PageTransition'

export default function EducationEditPage() {
  const router = useRouter()
  const params = useParams<{ id: string }>()
  const { toast } = useToast()
  const [form, setForm] = useState({
    institution: '',
    qualification: '',
    field_of_study: '',
    started_at: '',
    ended_at: '',
  })
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState('')
  const [loaded, setLoaded] = useState(false)
  const [notFound, setNotFound] = useState(false)
  const prefersReducedMotion = useReducedMotion()

  useEffect(() => {
    async function load() {
      const res = await fetch(`/api/user-education/${params.id}`)
      if (!res.ok) { setNotFound(true); setLoaded(true); return }
      const { education } = await res.json()
      setForm({
        institution: education.institution ?? '',
        qualification: education.qualification ?? '',
        field_of_study: education.field_of_study ?? '',
        started_at: education.started_at ?? '',
        ended_at: education.ended_at ?? '',
      })
      setLoaded(true)
    }
    load()
  }, [params.id])

  function update(key: string, value: string) {
    setForm((prev) => ({ ...prev, [key]: value }))
    setError('')
  }

  async function save(e: React.FormEvent) {
    e.preventDefault()
    if (!form.institution.trim()) {
      setError('Institution is required')
      return
    }
    setSaving(true)
    try {
      const res = await fetch(`/api/user-education/${params.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          institution: form.institution.trim(),
          qualification: form.qualification.trim() || undefined,
          field_of_study: form.field_of_study.trim() || undefined,
          started_at: form.started_at || null,
          ended_at: form.ended_at || null,
        }),
      })
      if (!res.ok) {
        const d = await res.json()
        setError(d.error ?? 'Failed to save')
        return
      }
      toast('Education saved.', 'success')
      router.push('/app/profile')
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete() {
    if (!confirm('Delete this education entry? This cannot be undone.')) return
    setDeleting(true)
    try {
      const res = await fetch(`/api/user-education/${params.id}`, { method: 'DELETE' })
      if (res.ok) {
        toast('Education entry deleted.', 'success')
        router.push('/app/profile')
      } else {
        const d = await res.json()
        setError(d.error ?? 'Failed to delete')
      }
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
            className="flex flex-col gap-4 pb-24"
          >
            <div className="flex items-center gap-3">
              <Skeleton className="h-9 w-9 rounded-xl" />
              <Skeleton className="h-6 w-40" />
            </div>
            <div className="flex flex-col gap-4">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-12 w-full rounded-xl" />
              ))}
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="content"
            initial={prefersReducedMotion ? false : { opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.15 }}
            className="flex flex-col gap-4 pb-24"
          >
            {notFound ? (
              <>
                <PageHeader backHref="/app/profile" title="Edit Education" />
                <p className="text-sm text-[var(--color-text-secondary)]">Education record not found.</p>
              </>
            ) : (
              <>
                <PageHeader backHref="/app/profile" title="Edit Education" />

                <form onSubmit={save} className="flex flex-col gap-4">
                  <Input
                    label="Institution *"
                    value={form.institution}
                    onChange={(e) => update('institution', e.target.value)}
                    placeholder="e.g. UKSA, Maritime Academy"
                    maxLength={200}
                    error={error && !form.institution.trim() ? error : undefined}
                  />

                  <Input
                    label="Qualification"
                    value={form.qualification}
                    onChange={(e) => update('qualification', e.target.value)}
                    placeholder="e.g. BSc Marine Engineering, STCW Basic"
                    maxLength={200}
                  />

                  <Input
                    label="Field of Study"
                    value={form.field_of_study}
                    onChange={(e) => update('field_of_study', e.target.value)}
                    placeholder="e.g. Nautical Science"
                    maxLength={200}
                  />

                  <div className="grid grid-cols-2 gap-3">
                    <DatePicker
                      label="Start date"
                      value={form.started_at || null}
                      onChange={(v) => update('started_at', v ?? '')}
                      maxYear={new Date().getFullYear()}
                    />
                    <DatePicker
                      label="End date"
                      value={form.ended_at || null}
                      onChange={(v) => update('ended_at', v ?? '')}
                    />
                  </div>

                  {error && form.institution.trim() && (
                    <p className="text-sm text-[var(--color-error)]">{error}</p>
                  )}

                  <Button
                    type="submit"
                    loading={saving}
                    className="w-full"
                  >
                    Save changes
                  </Button>

                  <Button
                    type="button"
                    variant="destructive"
                    onClick={handleDelete}
                    loading={deleting}
                    className="w-full"
                  >
                    Delete this entry
                  </Button>
                </form>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </PageTransition>
  )
}

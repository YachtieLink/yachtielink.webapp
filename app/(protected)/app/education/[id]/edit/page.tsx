'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'

export default function EducationEditPage() {
  const router = useRouter()
  const params = useParams<{ id: string }>()
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
      if (res.ok) router.push('/app/profile')
      else {
        const d = await res.json()
        setError(d.error ?? 'Failed to delete')
      }
    } finally {
      setDeleting(false)
    }
  }

  if (!loaded) {
    return (
      <div className="flex flex-col gap-4 pb-24">
        <div className="h-6 w-32 rounded bg-[var(--color-surface-raised)] animate-pulse" />
        <div className="flex flex-col gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-10 rounded-xl bg-[var(--color-surface-raised)] animate-pulse" />
          ))}
        </div>
      </div>
    )
  }

  if (notFound) {
    return (
      <div className="flex flex-col gap-4 pb-24">
        <Link href="/app/profile" className="text-sm text-[var(--color-interactive)] hover:underline">← Back</Link>
        <p className="text-sm text-[var(--color-text-secondary)]">Education record not found.</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4 pb-24">
      <div className="flex items-center gap-3">
        <Link href="/app/profile" className="text-sm text-[var(--color-interactive)] hover:underline">← Back</Link>
        <h1 className="font-semibold text-lg text-[var(--color-text-primary)]">Edit Education</h1>
      </div>

      <form onSubmit={save} className="flex flex-col gap-4">
        <div>
          <label className="block text-sm font-medium text-[var(--color-text-primary)] mb-1">Institution *</label>
          <input
            value={form.institution}
            onChange={(e) => update('institution', e.target.value)}
            placeholder="e.g. UKSA, Maritime Academy"
            className="w-full px-3 py-2 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-interactive)]"
            maxLength={200}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-[var(--color-text-primary)] mb-1">Qualification</label>
          <input
            value={form.qualification}
            onChange={(e) => update('qualification', e.target.value)}
            placeholder="e.g. BSc Marine Engineering, STCW Basic"
            className="w-full px-3 py-2 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-interactive)]"
            maxLength={200}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-[var(--color-text-primary)] mb-1">Field of Study</label>
          <input
            value={form.field_of_study}
            onChange={(e) => update('field_of_study', e.target.value)}
            placeholder="e.g. Nautical Science"
            className="w-full px-3 py-2 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-interactive)]"
            maxLength={200}
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-[var(--color-text-primary)] mb-1">Start date</label>
            <input
              type="date"
              value={form.started_at}
              onChange={(e) => update('started_at', e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-interactive)]"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-[var(--color-text-primary)] mb-1">End date</label>
            <input
              type="date"
              value={form.ended_at}
              onChange={(e) => update('ended_at', e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-interactive)]"
            />
          </div>
        </div>

        {error && <p className="text-sm text-[var(--color-error)]">{error}</p>}

        <button
          type="submit"
          disabled={saving}
          className="w-full py-3 rounded-xl bg-[var(--color-interactive)] text-white font-medium disabled:opacity-60 hover:bg-[var(--color-interactive-hover)] transition-colors"
        >
          {saving ? 'Saving…' : 'Save changes'}
        </button>

        <button
          type="button"
          onClick={handleDelete}
          disabled={deleting}
          className="w-full py-3 rounded-xl border border-[var(--color-error)] text-[var(--color-error)] font-medium hover:bg-[var(--color-error)]/10 transition-colors disabled:opacity-60"
        >
          {deleting ? 'Deleting…' : 'Delete this entry'}
        </button>
      </form>
    </div>
  )
}

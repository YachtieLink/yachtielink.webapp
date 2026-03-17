'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function EducationNewPage() {
  const router = useRouter()
  const [form, setForm] = useState({
    institution: '',
    qualification: '',
    field_of_study: '',
    started_at: '',
    ended_at: '',
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

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
      const res = await fetch('/api/user-education', {
        method: 'POST',
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

  return (
    <div className="flex flex-col gap-4 pb-24">
      <div className="flex items-center gap-3">
        <Link href="/app/profile" className="text-sm text-[var(--color-interactive)] hover:underline">← Back</Link>
        <h1 className="font-semibold text-lg text-[var(--color-text-primary)]">Add Education</h1>
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
          {saving ? 'Saving…' : 'Add education'}
        </button>
      </form>
    </div>
  )
}

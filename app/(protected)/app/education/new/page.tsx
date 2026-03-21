'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { BackButton } from '@/components/ui/BackButton'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'

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
        <BackButton href="/app/profile" />
        <h1 className="font-semibold text-lg text-[var(--color-text-primary)]">Add Education</h1>
      </div>

      <form onSubmit={save} className="flex flex-col gap-4">
        <Input
          label="Institution *"
          value={form.institution}
          onChange={(e) => update('institution', e.target.value)}
          placeholder="e.g. UKSA, Maritime Academy"
          maxLength={200}
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
          <Input
            label="Start date"
            type="date"
            value={form.started_at}
            onChange={(e) => update('started_at', e.target.value)}
          />
          <Input
            label="End date"
            type="date"
            value={form.ended_at}
            onChange={(e) => update('ended_at', e.target.value)}
          />
        </div>

        {error && <p className="text-sm text-[var(--color-error)]">{error}</p>}

        <Button
          type="submit"
          disabled={saving}
          loading={saving}
          className="w-full"
          size="lg"
        >
          {saving ? 'Saving…' : 'Add education'}
        </Button>
      </form>
    </div>
  )
}

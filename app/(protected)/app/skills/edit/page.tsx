'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { BackButton } from '@/components/ui/BackButton'

const CATEGORIES = ['technical', 'certifiable', 'language', 'software', 'other'] as const
type Category = typeof CATEGORIES[number]

interface Skill {
  id?: string
  name: string
  category?: Category
}

export default function SkillsEditPage() {
  const router = useRouter()
  const [skills, setSkills] = useState<Skill[]>([])
  const [input, setInput] = useState('')
  const [category, setCategory] = useState<Category>('technical')
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/user-skills')
      .then((r) => r.json())
      .then((d) => { setSkills(d.skills ?? []) })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  function addSkill() {
    const name = input.trim()
    if (!name || skills.length >= 20) return
    setSkills((prev) => [...prev, { name, category }])
    setInput('')
  }

  function removeSkill(idx: number) {
    setSkills((prev) => prev.filter((_, i) => i !== idx))
  }

  async function save() {
    setSaving(true)
    try {
      const res = await fetch('/api/user-skills', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ skills: skills.map(({ name, category }) => ({ name, category })) }),
      })
      if (!res.ok) {
        const d = await res.json().catch(() => ({}))
        alert(d.error ?? 'Save failed. Please try again.')
        return
      }
      router.push('/app/profile')
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <div className="p-4 text-[var(--color-text-secondary)]">Loading…</div>

  return (
    <div className="flex flex-col gap-4 pb-24">
      <div className="flex items-center gap-3">
        <BackButton href="/app/profile" />
        <h1 className="font-semibold text-lg text-[var(--color-text-primary)]">Extra Skills</h1>
      </div>

      <p className="text-sm text-[var(--color-text-secondary)]">Technical skills, languages, software, or anything else you bring aboard. Up to 20.</p>

      {/* Current skills grouped by category */}
      {CATEGORIES.map((cat) => {
        const catSkills = skills.filter((s) => s.category === cat)
        if (catSkills.length === 0) return null
        return (
          <div key={cat}>
            <p className="text-xs font-semibold uppercase tracking-wide text-[var(--color-text-secondary)] mb-1.5 capitalize">{cat}</p>
            <div className="flex flex-wrap gap-2">
              {catSkills.map((s, _) => {
                const idx = skills.findIndex((sk) => sk === s)
                return (
                  <div key={idx} className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-[var(--color-surface)] text-sm text-[var(--color-text-primary)]">
                    <span>{s.name}</span>
                    <button
                      onClick={() => removeSkill(idx)}
                      className="ml-1 text-[var(--color-text-secondary)] hover:text-[var(--color-error)] leading-none"
                      aria-label={`Remove ${s.name}`}
                    >
                      ×
                    </button>
                  </div>
                )
              })}
            </div>
          </div>
        )
      })}

      {/* Add form */}
      {skills.length < 20 && (
        <div className="flex flex-col gap-2">
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value as Category)}
            className="px-3 py-2 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-interactive)]"
          >
            {CATEGORIES.map((c) => (
              <option key={c} value={c} className="capitalize">{c.charAt(0).toUpperCase() + c.slice(1)}</option>
            ))}
          </select>
          <div className="flex gap-2">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addSkill())}
              placeholder="e.g. Welding, Spanish, AutoCAD"
              className="flex-1 px-3 py-2 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-interactive)]"
              maxLength={100}
            />
            <button
              onClick={addSkill}
              disabled={!input.trim()}
              className="px-4 py-2 rounded-xl bg-[var(--color-interactive)] text-white text-sm font-medium disabled:opacity-40 hover:bg-[var(--color-interactive-hover)] transition-colors"
            >
              Add
            </button>
          </div>
        </div>
      )}

      <button
        onClick={save}
        disabled={saving}
        className="w-full py-3 rounded-xl bg-[var(--color-interactive)] text-white font-medium disabled:opacity-60 hover:bg-[var(--color-interactive-hover)] transition-colors"
      >
        {saving ? 'Saving…' : 'Save skills'}
      </button>
    </div>
  )
}

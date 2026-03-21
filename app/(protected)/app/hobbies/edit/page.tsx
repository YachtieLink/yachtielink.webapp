'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { BackButton } from '@/components/ui/BackButton'

interface Hobby {
  id?: string
  name: string
  emoji: string
}

export default function HobbiesEditPage() {
  const router = useRouter()
  const [hobbies, setHobbies] = useState<Hobby[]>([])
  const [input, setInput] = useState('')
  const [emoji, setEmoji] = useState('')
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/user-hobbies')
      .then((r) => r.json())
      .then((d) => { setHobbies(d.hobbies ?? []) })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  function addHobby() {
    const name = input.trim()
    if (!name || hobbies.length >= 10) return
    setHobbies((prev) => [...prev, { name, emoji: emoji.trim() }])
    setInput('')
    setEmoji('')
  }

  function removeHobby(idx: number) {
    setHobbies((prev) => prev.filter((_, i) => i !== idx))
  }

  async function save() {
    setSaving(true)
    try {
      const res = await fetch('/api/user-hobbies', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ hobbies: hobbies.map(({ name, emoji }) => ({ name, emoji: emoji || undefined })) }),
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
        <h1 className="font-semibold text-lg text-[var(--color-text-primary)]">Hobbies</h1>
      </div>

      <p className="text-sm text-[var(--color-text-secondary)]">What do you do off the water? Add up to 10 hobbies.</p>

      {/* Current hobbies */}
      <div className="flex flex-wrap gap-2">
        {hobbies.map((h, idx) => (
          <div key={idx} className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-[var(--color-surface)] text-sm text-[var(--color-text-primary)]">
            {h.emoji && <span>{h.emoji}</span>}
            <span>{h.name}</span>
            <button
              onClick={() => removeHobby(idx)}
              className="ml-1 text-[var(--color-text-secondary)] hover:text-[var(--color-error)] leading-none"
              aria-label={`Remove ${h.name}`}
            >
              ×
            </button>
          </div>
        ))}
      </div>

      {/* Add form */}
      {hobbies.length < 10 && (
        <div className="flex gap-2">
          <input
            value={emoji}
            onChange={(e) => setEmoji(e.target.value)}
            placeholder="🏄"
            className="w-14 px-2 py-2 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] text-center text-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-interactive)]"
            maxLength={2}
          />
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addHobby())}
            placeholder="e.g. Surfing"
            className="flex-1 px-3 py-2 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-interactive)]"
            maxLength={100}
          />
          <button
            onClick={addHobby}
            disabled={!input.trim()}
            className="px-4 py-2 rounded-xl bg-[var(--color-interactive)] text-white text-sm font-medium disabled:opacity-40 hover:bg-[var(--color-interactive-hover)] transition-colors"
          >
            Add
          </button>
        </div>
      )}

      <button
        onClick={save}
        disabled={saving}
        className="w-full py-3 rounded-xl bg-[var(--color-interactive)] text-white font-medium disabled:opacity-60 hover:bg-[var(--color-interactive-hover)] transition-colors"
      >
        {saving ? 'Saving…' : 'Save hobbies'}
      </button>
    </div>
  )
}

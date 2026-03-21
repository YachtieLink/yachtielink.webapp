'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { BackButton } from '@/components/ui/BackButton'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { useToast } from '@/components/ui/Toast'
import { Skeleton } from '@/components/ui/skeleton'
import { PageTransition } from '@/components/ui/PageTransition'
import { suggestEmoji } from '@/lib/hobby-emojis'

interface Hobby {
  id?: string
  name: string
  emoji: string
}

export default function HobbiesEditPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [hobbies, setHobbies] = useState<Hobby[]>([])
  const [input, setInput] = useState('')
  const [emoji, setEmoji] = useState('')
  const [emojiManuallyEdited, setEmojiManuallyEdited] = useState(false)
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(true)
  const prefersReducedMotion = useReducedMotion()

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
    setEmojiManuallyEdited(false)
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
        toast(d.error ?? 'Save failed. Please try again.', 'error')
        return
      }
      toast('Hobbies saved.', 'success')
      router.push('/app/profile')
    } finally {
      setSaving(false)
    }
  }

  return (
    <PageTransition>
      <AnimatePresence mode="wait">
        {loading ? (
          <motion.div
            key="skeleton"
            exit={prefersReducedMotion ? undefined : { opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="flex flex-col gap-4 pb-24"
          >
            <div className="flex items-center gap-3">
              <Skeleton className="h-9 w-9 rounded-xl" />
              <Skeleton className="h-6 w-24" />
            </div>
            <div className="flex flex-wrap gap-2">
              {[...Array(4)].map((_, i) => (
                <Skeleton key={i} className="h-9 w-24 rounded-full" />
              ))}
            </div>
            <Skeleton className="h-12 w-full rounded-xl" />
            <Skeleton className="h-12 w-full rounded-xl" />
          </motion.div>
        ) : (
          <motion.div
            key="content"
            initial={prefersReducedMotion ? false : { opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.15 }}
            className="flex flex-col gap-4 pb-24"
          >
            <div className="flex items-center gap-3">
              <BackButton href="/app/profile" />
              <h1 className="text-[28px] font-bold tracking-tight text-[var(--color-text-primary)]">Hobbies</h1>
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
              <div className="flex flex-col gap-2">
                <div className="flex gap-2">
                  <div className="relative shrink-0">
                    <input
                      type="text"
                      value={emoji}
                      onChange={(e) => {
                        const val = e.target.value
                        // Keep only the last emoji entered
                        const chars = [...val]
                        setEmoji(chars.length > 1 ? chars[chars.length - 1] : val)
                        setEmojiManuallyEdited(true)
                      }}
                      placeholder="😊"
                      className="w-14 h-12 text-center text-2xl rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] focus:outline-none focus:ring-2 focus:ring-[var(--color-interactive)] cursor-pointer"
                      aria-label="Choose emoji"
                    />
                    {emoji && (
                      <button
                        type="button"
                        onClick={() => { setEmoji(''); setEmojiManuallyEdited(true) }}
                        className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-[var(--color-text-tertiary)] text-white text-xs flex items-center justify-center"
                        aria-label="Clear emoji"
                      >
                        ×
                      </button>
                    )}
                  </div>
                  <Input
                    value={input}
                    onChange={(e) => {
                      setInput(e.target.value)
                      if (!emojiManuallyEdited) {
                        const suggested = suggestEmoji(e.target.value)
                        if (suggested) setEmoji(suggested)
                        else if (!e.target.value.trim()) setEmoji('')
                      }
                    }}
                    onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addHobby())}
                    placeholder="e.g. Cooking"
                    className="flex-1 min-w-0"
                    maxLength={100}
                  />
                  <Button
                    onClick={addHobby}
                    disabled={!input.trim()}
                    variant="primary"
                  >
                    Add
                  </Button>
                </div>
                {input.trim() && suggestEmoji(input) && !emoji && (
                  <button
                    type="button"
                    onClick={() => setEmoji(suggestEmoji(input) ?? '')}
                    className="self-start px-3 py-1 rounded-full bg-[var(--color-surface-raised)] text-sm text-[var(--color-text-secondary)] hover:bg-[var(--color-surface)] transition-colors"
                  >
                    Suggested: {suggestEmoji(input)} — tap to use
                  </button>
                )}
              </div>
            )}

            <Button
              onClick={save}
              loading={saving}
              className="w-full"
            >
              Save hobbies
            </Button>
          </motion.div>
        )}
      </AnimatePresence>
    </PageTransition>
  )
}

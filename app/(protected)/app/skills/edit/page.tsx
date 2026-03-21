'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { BackButton } from '@/components/ui/BackButton'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { useToast } from '@/components/ui/Toast'
import { Skeleton } from '@/components/ui/skeleton'
import { PageTransition } from '@/components/ui/PageTransition'

const CATEGORIES = ['technical', 'certifiable', 'language', 'software', 'other'] as const
type Category = typeof CATEGORIES[number]

const CATEGORY_LABELS: Record<Category, string> = {
  technical: 'Technical',
  certifiable: 'Certifiable',
  language: 'Language',
  software: 'Software',
  other: 'Other',
}

const SKILL_SUGGESTIONS: Partial<Record<Category, string[]>> = {
  technical: ['Welding', 'Paint spraying', 'Watermaker servicing', 'AV systems', 'Hydraulics'],
  certifiable: ['Silver service', 'Wine knowledge', 'Cocktail making', 'Event planning', 'Flower arranging'],
  language: ['English', 'French', 'Spanish', 'Italian', 'German'],
  software: ['AutoCAD', 'Microsoft Office', 'Adobe Suite', 'ECDIS', 'PMS systems'],
  other: ['Driving license', 'Photography', 'Social media', 'Project management'],
}

interface Skill {
  id?: string
  name: string
  category?: Category
}

export default function SkillsEditPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [skills, setSkills] = useState<Skill[]>([])
  const [input, setInput] = useState('')
  const [category, setCategory] = useState<Category>('technical')
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(true)
  const prefersReducedMotion = useReducedMotion()

  useEffect(() => {
    fetch('/api/user-skills')
      .then((r) => r.json())
      .then((d) => { setSkills(d.skills ?? []) })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  function addSkill(name?: string) {
    const skillName = (name ?? input).trim()
    if (!skillName || skills.length >= 20) return
    if (skills.some((s) => s.name.toLowerCase() === skillName.toLowerCase() && s.category === category)) return
    setSkills((prev) => [...prev, { name: skillName, category }])
    if (!name) setInput('')
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
        toast(d.error ?? 'Save failed. Please try again.', 'error')
        return
      }
      toast('Skills saved.', 'success')
      router.push('/app/profile')
    } finally {
      setSaving(false)
    }
  }

  // Suggestions for the current category, excluding already-added ones
  const suggestions = (SKILL_SUGGESTIONS[category] ?? []).filter(
    (s) => !skills.some((sk) => sk.name.toLowerCase() === s.toLowerCase() && sk.category === category)
  )

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
              <Skeleton className="h-6 w-28" />
            </div>
            <div className="flex flex-wrap gap-2">
              {[...Array(5)].map((_, i) => (
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
              <h1 className="text-[28px] font-bold tracking-tight text-[var(--color-text-primary)]">Extra Skills</h1>
            </div>

            <p className="text-sm text-[var(--color-text-secondary)]">
              These appear on your public profile under Extra Skills. Add up to 20.
            </p>

            {/* Current skills grouped by category */}
            {CATEGORIES.map((cat) => {
              const catSkills = skills.filter((s) => s.category === cat)
              if (catSkills.length === 0) return null
              return (
                <div key={cat}>
                  <p className="text-xs font-semibold uppercase tracking-wide text-[var(--color-text-secondary)] mb-1.5">{CATEGORY_LABELS[cat]}</p>
                  <div className="flex flex-wrap gap-2">
                    {catSkills.map((s) => {
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
              <div className="flex flex-col gap-3">
                <Select
                  label="Category"
                  value={category}
                  onChange={(e) => setCategory(e.target.value as Category)}
                >
                  {CATEGORIES.map((c) => (
                    <option key={c} value={c}>{CATEGORY_LABELS[c]}</option>
                  ))}
                </Select>

                {/* Suggestion chips */}
                {suggestions.length > 0 && (
                  <div>
                    <p className="text-xs text-[var(--color-text-secondary)] mb-1.5">Quick add:</p>
                    <div className="flex flex-wrap gap-1.5">
                      {suggestions.map((s) => (
                        <button
                          key={s}
                          type="button"
                          onClick={() => addSkill(s)}
                          className="px-3 py-1.5 rounded-full text-xs font-medium border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text-primary)] hover:border-[var(--color-teal-700)] hover:bg-[var(--color-teal-50)] transition-colors"
                        >
                          + {s}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex gap-2">
                  <Input
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addSkill())}
                    placeholder="e.g. Welding, Spanish, AutoCAD"
                    className="flex-1"
                    maxLength={100}
                  />
                  <Button
                    onClick={() => addSkill()}
                    disabled={!input.trim()}
                    variant="primary"
                  >
                    Add
                  </Button>
                </div>
              </div>
            )}

            <Button
              onClick={save}
              loading={saving}
              className="w-full"
            >
              Save skills
            </Button>
          </motion.div>
        )}
      </AnimatePresence>
    </PageTransition>
  )
}

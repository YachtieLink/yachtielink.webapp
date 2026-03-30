'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { X } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { PageHeader } from '@/components/ui/PageHeader'
import { useToast } from '@/components/ui/Toast'
import { Skeleton } from '@/components/ui/skeleton'
import { PageTransition } from '@/components/ui/PageTransition'

const PROFICIENCY_OPTIONS = [
  { value: 'native', label: 'Native' },
  { value: 'fluent', label: 'Fluent' },
  { value: 'intermediate', label: 'Intermediate' },
  { value: 'basic', label: 'Basic' },
] as const

interface LanguageEntry {
  language: string
  proficiency: string
}

export default function LanguagesEditPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [languages, setLanguages] = useState<LanguageEntry[]>([])
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(true)
  const prefersReducedMotion = useReducedMotion()

  const [newLang, setNewLang] = useState('')
  const [newProf, setNewProf] = useState('fluent')

  useEffect(() => {
    fetch('/api/profile/languages')
      .then((r) => r.json())
      .then((d) => {
        setLanguages(d.languages ?? [])
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  function addLanguage() {
    const name = newLang.trim()
    if (!name) return
    if (languages.length >= 10) {
      toast('Maximum 10 languages.', 'error')
      return
    }
    if (languages.some((l) => l.language.toLowerCase() === name.toLowerCase())) {
      toast('Language already added.', 'error')
      return
    }
    setLanguages([...languages, { language: name, proficiency: newProf }])
    setNewLang('')
    setNewProf('fluent')
  }

  function removeLanguage(index: number) {
    setLanguages(languages.filter((_, i) => i !== index))
  }

  function updateProficiency(index: number, proficiency: string) {
    setLanguages(languages.map((l, i) => i === index ? { ...l, proficiency } : l))
  }

  async function handleSave() {
    setSaving(true)
    try {
      const res = await fetch('/api/profile/languages', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ languages }),
      })
      if (!res.ok) {
        const d = await res.json().catch(() => ({}))
        toast(d.error ?? 'Save failed. Please try again.', 'error')
        return
      }
      toast('Languages saved.', 'success')
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
              <Skeleton className="h-6 w-28" />
            </div>
            {[...Array(3)].map((_, i) => (
              <Skeleton key={i} className="h-12 w-full rounded-xl" />
            ))}
          </motion.div>
        ) : (
          <motion.div
            key="content"
            initial={prefersReducedMotion ? false : { opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.15 }}
            className="flex flex-col gap-4 pb-24"
          >
            <PageHeader backHref="/app/profile" title="Languages" />

            <p className="text-sm text-[var(--color-text-secondary)]">
              Add up to 10 languages to your profile.
            </p>

            {/* Current languages */}
            {languages.length > 0 && (
              <div className="flex flex-col gap-2">
                {languages.map((l, i) => (
                  <div
                    key={`${l.language}-${i}`}
                    className="flex items-center gap-2 bg-[var(--color-surface)] rounded-xl px-4 py-3 border border-[var(--color-border)]"
                  >
                    <span className="flex-1 text-sm font-medium text-[var(--color-text-primary)]">
                      {l.language}
                    </span>
                    <Select
                      value={l.proficiency}
                      onChange={(e) => updateProficiency(i, e.target.value)}
                      className="w-36"
                    >
                      {PROFICIENCY_OPTIONS.map((o) => (
                        <option key={o.value} value={o.value}>{o.label}</option>
                      ))}
                    </Select>
                    <button
                      type="button"
                      onClick={() => removeLanguage(i)}
                      className="shrink-0 p-1 text-[var(--color-text-tertiary)] hover:text-[var(--color-error)] transition-colors"
                    >
                      <X size={16} />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Add new language */}
            {languages.length < 10 && (
              <div className="flex flex-col gap-2">
                <p className="text-sm font-medium text-[var(--color-text-primary)]">Add a language</p>
                <div className="flex gap-2">
                  <Input
                    value={newLang}
                    onChange={(e) => setNewLang(e.target.value)}
                    placeholder="Language name"
                    className="flex-1"
                    onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addLanguage() } }}
                  />
                  <Select
                    value={newProf}
                    onChange={(e) => setNewProf(e.target.value)}
                    className="w-36"
                  >
                    {PROFICIENCY_OPTIONS.map((o) => (
                      <option key={o.value} value={o.value}>{o.label}</option>
                    ))}
                  </Select>
                  <Button type="button" variant="secondary" onClick={addLanguage} className="shrink-0">
                    Add
                  </Button>
                </div>
              </div>
            )}

            <Button
              onClick={handleSave}
              loading={saving}
              className="w-full mt-2"
            >
              Save languages
            </Button>
          </motion.div>
        )}
      </AnimatePresence>
    </PageTransition>
  )
}

'use client'

import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { PageHeader } from '@/components/ui/PageHeader'
import { PageTransition } from '@/components/ui/PageTransition'
import { Input } from '@/components/ui/Input'
import { Textarea } from '@/components/ui/Textarea'
import { Button } from '@/components/ui/Button'
import { useToast } from '@/components/ui/Toast'

const CATEGORIES = [
  { value: 'profile', label: 'Profile' },
  { value: 'network', label: 'Network' },
  { value: 'cv', label: 'CV' },
  { value: 'insights', label: 'Insights' },
  { value: 'general', label: 'General' },
] as const

type Category = (typeof CATEGORIES)[number]['value']

export default function SuggestPage() {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [category, setCategory] = useState<Category>('general')
  const [submitting, setSubmitting] = useState(false)
  const [errors, setErrors] = useState<{ title?: string; description?: string }>({})

  const supabase = useMemo(() => createClient(), [])
  const router = useRouter()
  const { toast } = useToast()

  const titleValid = title.trim().length >= 5

  function validate(): boolean {
    const next: typeof errors = {}
    const trimmed = title.trim()
    if (trimmed.length < 5) next.title = 'Title must be at least 5 characters'
    if (trimmed.length > 100) next.title = 'Title must be 100 characters or less'
    if (description.trim().length > 1000) next.description = 'Description must be 1,000 characters or less'
    setErrors(next)
    return Object.keys(next).length === 0
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!validate()) return

    setSubmitting(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        toast('Please sign in to submit a request', 'error')
        return
      }

      // Rate limit: max 5 suggestions per hour per user
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString()
      const { count } = await supabase
        .from('feature_suggestions')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .gte('created_at', oneHourAgo)
      if (count !== null && count >= 5) {
        toast('Too many requests. Please try again later.', 'error')
        return
      }

      const { data: inserted, error } = await supabase
        .from('feature_suggestions')
        .insert({
          user_id: user.id,
          title: title.trim(),
          description: description.trim() || null,
          category,
        })
        .select('id')
        .single()

      if (error) throw error

      // Auto-vote the creator's own suggestion; trigger increments vote_count to 1
      if (inserted) {
        const { error: voteError } = await supabase.from('feature_votes').insert({
          user_id: user.id,
          suggestion_id: inserted.id,
        })
        if (voteError) console.error('Auto-vote failed:', voteError)
      }

      toast('Feature request submitted!', 'success')
      router.push('/app/more/roadmap?tab=requests')
    } catch {
      toast('Failed to submit. Please try again.', 'error')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <PageTransition className="flex flex-col gap-0 pb-24">
      <PageHeader
        backHref="/app/more/roadmap"
        backLabel="Feature Roadmap"
        title="Suggest a Feature"
      />

      <p className="text-sm text-[var(--color-text-secondary)] mb-6">
        Tell us what would make YachtieLink more useful for you. The best ideas come from crew who use the platform every day.
      </p>

      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
        <Input
          label="Title"
          placeholder="e.g. Crew availability calendar"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          error={errors.title}
          maxLength={100}
          hint={`${title.length}/100`}
          required
        />

        <Textarea
          label="Description (optional)"
          placeholder="What problem would this solve? How would it work?"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          error={errors.description}
          maxLength={1000}
          hint={`${description.length}/1,000`}
        />

        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-[var(--color-text-primary)]">
            Category
          </label>
          <div className="flex flex-wrap gap-2">
            {CATEGORIES.map((cat) => (
              <button
                key={cat.value}
                type="button"
                onClick={() => setCategory(cat.value)}
                className={`text-sm font-medium px-3 py-1.5 rounded-full transition-colors ${
                  category === cat.value
                    ? 'bg-[var(--color-interactive)] text-white'
                    : 'bg-[var(--color-surface-raised)] text-[var(--color-text-secondary)] hover:bg-[var(--color-sand-100)]'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>

        <Button type="submit" loading={submitting} disabled={!titleValid || submitting} className="w-full" size="lg">
          Submit request
        </Button>
      </form>
    </PageTransition>
  )
}

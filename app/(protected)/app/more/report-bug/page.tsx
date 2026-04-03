'use client'

import { useState, useEffect } from 'react'
import { PageHeader } from '@/components/ui/PageHeader'
import { PageTransition } from '@/components/ui/PageTransition'
import { Textarea } from '@/components/ui/Textarea'
import { Button } from '@/components/ui/Button'
import { useToast } from '@/components/ui/Toast'

const CATEGORIES = [
  { value: 'bug', label: 'Something is broken' },
  { value: 'ui_issue', label: 'UI or display problem' },
  { value: 'performance', label: 'Slow or unresponsive' },
  { value: 'other', label: 'Something else' },
] as const

type Category = typeof CATEGORIES[number]['value']

export default function ReportBugPage() {
  const [category, setCategory] = useState<Category | ''>('')
  const [description, setDescription] = useState('')
  const [pageUrl, setPageUrl] = useState('')
  const [submitting, setSubmitting] = useState(false)

  // Pre-fill with the referring page (where the bug likely occurred)
  useEffect(() => {
    if (document.referrer) setPageUrl(document.referrer)
  }, [])
  const [submitted, setSubmitted] = useState(false)
  const { toast } = useToast()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!category || description.length < 10) return

    setSubmitting(true)
    try {
      const res = await fetch('/api/bug-reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          category,
          description,
          page_url: pageUrl.trim() || undefined,
        }),
      })

      if (res.status === 429) {
        toast('Too many reports submitted. Try again later.', 'error')
        return
      }
      if (!res.ok) {
        toast('Could not submit report. Try again.', 'error')
        return
      }

      setSubmitted(true)
    } catch {
      toast('Could not submit report. Try again.', 'error')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <PageTransition>
      <PageHeader backHref="/app/more" title="Report a Bug" sectionColor="sand" />

      {submitted ? (
        <div className="bg-[var(--color-surface)] rounded-2xl p-6 text-center">
          <p className="text-lg font-serif text-[var(--color-text-primary)]">Thanks for the report</p>
          <p className="text-sm text-[var(--color-text-secondary)] mt-2 leading-relaxed">
            We&apos;ll look into this as soon as possible. Your feedback helps make YachtieLink better for everyone.
          </p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {/* Category */}
          <div className="bg-[var(--color-surface)] rounded-2xl p-4">
            <p className="text-sm font-medium text-[var(--color-text-primary)] mb-3">What type of issue is this?</p>
            <div className="flex flex-col gap-1">
              {CATEGORIES.map(cat => (
                <label
                  key={cat.value}
                  className="flex items-center gap-3 py-2.5 px-2 rounded-xl cursor-pointer hover:bg-[var(--color-surface-raised)] transition-colors"
                >
                  <input
                    type="radio"
                    name="category"
                    value={cat.value}
                    checked={category === cat.value}
                    onChange={() => setCategory(cat.value)}
                    className="accent-[var(--color-sand-400)]"
                  />
                  <span className="text-sm text-[var(--color-text-primary)]">{cat.label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Description */}
          <div className="bg-[var(--color-surface)] rounded-2xl p-4">
            <Textarea
              label="What happened?"
              placeholder="Describe the issue — what you did, what you expected, what actually happened…"
              value={description}
              onChange={e => setDescription(e.target.value)}
              minLength={10}
              maxLength={2000}
              hint={`${description.length}/2000`}
            />
          </div>

          {/* Page URL (optional) */}
          <div className="bg-[var(--color-surface)] rounded-2xl p-4">
            <label className="block text-sm font-medium text-[var(--color-text-primary)] mb-1.5">
              Page where it happened <span className="text-[var(--color-text-tertiary)] font-normal">(optional)</span>
            </label>
            <input
              type="text"
              value={pageUrl}
              onChange={e => setPageUrl(e.target.value)}
              placeholder="/app/profile or https://yachtie.link/…"
              className="w-full rounded-xl border border-[var(--color-border)] px-4 py-2.5 text-sm bg-[var(--color-surface)] text-[var(--color-text-primary)] placeholder:text-[var(--color-text-tertiary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-sand-400)]/20 focus-visible:border-[var(--color-sand-400)]"
            />
          </div>

          <Button
            type="submit"
            variant="primary"
            size="md"
            disabled={!category || description.length < 10 || submitting}
            loading={submitting}
          >
            {submitting ? 'Submitting…' : 'Submit report'}
          </Button>
        </form>
      )}
    </PageTransition>
  )
}

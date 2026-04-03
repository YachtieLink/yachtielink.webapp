'use client'

import { useState, useRef, useMemo } from 'react'
import { Flag } from 'lucide-react'
import { BottomSheet } from '@/components/ui/BottomSheet'
import { Textarea } from '@/components/ui/Textarea'
import { Button } from '@/components/ui/Button'
import { useToast } from '@/components/ui/Toast'
import { createClient } from '@/lib/supabase/client'

type TargetType = 'profile' | 'yacht' | 'endorsement'

interface Category {
  value: string
  label: string
}

const PROFILE_CATEGORIES: Category[] = [
  { value: 'fake_profile', label: 'Fake profile' },
  { value: 'false_employment_claim', label: 'False employment claim' },
  { value: 'inappropriate_content', label: 'Inappropriate content' },
  { value: 'harassment', label: 'Harassment' },
  { value: 'spam', label: 'Spam' },
  { value: 'other', label: 'Other' },
]

const YACHT_CATEGORIES: Category[] = [
  { value: 'duplicate_yacht', label: 'Duplicate yacht entry' },
  { value: 'incorrect_details', label: 'Incorrect details' },
  { value: 'other', label: 'Other' },
]

const ENDORSEMENT_CATEGORIES: Category[] = [
  { value: 'fake_endorsement', label: 'Fake endorsement' },
  { value: 'inappropriate_content', label: 'Inappropriate content' },
  { value: 'harassment', label: 'Harassment' },
  { value: 'spam', label: 'Spam' },
  { value: 'other', label: 'Other' },
]

function getCategoriesForType(type: TargetType): Category[] {
  switch (type) {
    case 'profile': return PROFILE_CATEGORIES
    case 'yacht': return YACHT_CATEGORIES
    case 'endorsement': return ENDORSEMENT_CATEGORIES
  }
}

function escapeLike(str: string): string {
  return str.replace(/%/g, '\\%').replace(/_/g, '\\_')
}

interface YachtResult {
  id: string
  name: string
}

export interface ReportButtonProps {
  targetType: TargetType
  targetId: string
}

export function ReportButton({ targetType, targetId }: ReportButtonProps) {
  const [open, setOpen] = useState(false)
  const [category, setCategory] = useState('')
  const [reason, setReason] = useState('')
  const [yachtSearch, setYachtSearch] = useState('')
  const [yachtResults, setYachtResults] = useState<YachtResult[]>([])
  const [selectedYacht, setSelectedYacht] = useState<YachtResult | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const { toast } = useToast()
  const supabase = useMemo(() => createClient(), [])
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const categories = getCategoriesForType(targetType)

  function handleYachtSearchChange(query: string) {
    setYachtSearch(query)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    if (query.length < 2) {
      setYachtResults([])
      return
    }
    debounceRef.current = setTimeout(async () => {
      const { data } = await supabase
        .from('yachts')
        .select('id, name')
        .ilike('name', `%${escapeLike(query)}%`)
        .limit(10)
      setYachtResults(data ?? [])
    }, 300)
  }

  function reset() {
    setCategory('')
    setReason('')
    setYachtSearch('')
    setYachtResults([])
    setSelectedYacht(null)
    setSubmitted(false)
  }

  function handleClose() {
    setOpen(false)
    reset()
  }

  function handleCategoryChange(value: string) {
    setCategory(value)
    if (value !== 'duplicate_yacht') {
      setYachtSearch('')
      setYachtResults([])
      setSelectedYacht(null)
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!category || reason.length < 10) return
    if (category === 'duplicate_yacht' && !selectedYacht) {
      toast('Please select the correct yacht', 'error')
      return
    }

    setSubmitting(true)
    try {
      const res = await fetch('/api/report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          target_type: targetType,
          target_id: targetId,
          category,
          reason,
          ...(category === 'duplicate_yacht' ? { duplicate_of_yacht_id: selectedYacht!.id } : {}),
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
      toast('Report submitted', 'success')
    } catch {
      toast('Could not submit report. Try again.', 'error')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        aria-label="Report this content"
        title="Report"
        className="flex items-center gap-1 text-rose-300 hover:text-rose-500 transition-colors p-1 rounded"
      >
        <Flag size={14} />
      </button>

      <BottomSheet open={open} onClose={handleClose} title="Report">
        {submitted ? (
          <div className="py-8 text-center">
            <p className="text-sm font-medium text-[var(--color-text-primary)]">Report submitted</p>
            <p className="text-xs text-[var(--color-text-secondary)] mt-1">
              Thank you for helping keep YachtieLink safe.
            </p>
            <Button variant="outline" size="sm" onClick={handleClose} className="mt-4">
              Close
            </Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col gap-4 pb-4">
            {/* Category */}
            <div>
              <p className="text-sm font-medium text-[var(--color-text-primary)] mb-2">What&apos;s the issue?</p>
              <div className="flex flex-col gap-1">
                {categories.map(cat => (
                  <label
                    key={cat.value}
                    className="flex items-center gap-3 py-2.5 px-3 rounded-xl cursor-pointer hover:bg-[var(--color-surface-raised)] transition-colors"
                  >
                    <input
                      type="radio"
                      name="category"
                      value={cat.value}
                      checked={category === cat.value}
                      onChange={() => handleCategoryChange(cat.value)}
                      className="accent-[var(--color-interactive)]"
                    />
                    <span className="text-sm text-[var(--color-text-primary)]">{cat.label}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Duplicate yacht search */}
            {category === 'duplicate_yacht' && (
              <div>
                <p className="text-sm font-medium text-[var(--color-text-primary)] mb-1.5">
                  Which yacht is the correct entry?
                </p>
                {selectedYacht ? (
                  <div className="flex items-center justify-between py-2.5 px-3 bg-[var(--color-surface-raised)] rounded-xl">
                    <span className="text-sm text-[var(--color-text-primary)]">{selectedYacht.name}</span>
                    <button
                      type="button"
                      onClick={() => setSelectedYacht(null)}
                      className="text-xs text-[var(--color-text-secondary)] hover:text-[var(--color-error)] transition-colors"
                    >
                      Change
                    </button>
                  </div>
                ) : (
                  <div className="relative">
                    <input
                      type="text"
                      value={yachtSearch}
                      onChange={e => handleYachtSearchChange(e.target.value)}
                      placeholder="Search yacht name…"
                      className="w-full rounded-xl border border-[var(--color-border)] px-4 py-2.5 text-sm bg-[var(--color-surface)] text-[var(--color-text-primary)] placeholder:text-[var(--color-text-tertiary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-interactive)]/20 focus-visible:border-[var(--color-interactive)]"
                    />
                    {yachtResults.length > 0 && (
                      <div className="absolute top-full left-0 right-0 mt-1 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl shadow-lg z-10 overflow-hidden">
                        {yachtResults.map(y => (
                          <button
                            key={y.id}
                            type="button"
                            onClick={() => {
                              setSelectedYacht(y)
                              setYachtSearch('')
                              setYachtResults([])
                            }}
                            className="w-full text-left px-4 py-2.5 text-sm text-[var(--color-text-primary)] hover:bg-[var(--color-surface-raised)] transition-colors border-b border-[var(--color-border)] last:border-0"
                          >
                            {y.name}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Reason */}
            <Textarea
              label="Details"
              placeholder="Tell us more about the issue…"
              value={reason}
              onChange={e => setReason(e.target.value)}
              minLength={10}
              maxLength={2000}
              hint={`${reason.length}/2000`}
            />

            <Button
              type="submit"
              variant="primary"
              size="md"
              disabled={
                !category ||
                reason.length < 10 ||
                submitting ||
                (category === 'duplicate_yacht' && !selectedYacht)
              }
              loading={submitting}
            >
              {submitting ? 'Submitting…' : 'Submit report'}
            </Button>
          </form>
        )}
      </BottomSheet>
    </>
  )
}

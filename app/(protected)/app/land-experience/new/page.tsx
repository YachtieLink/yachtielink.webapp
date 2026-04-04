'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button, Input, DatePicker } from '@/components/ui'
import { useToast } from '@/components/ui/Toast'
import { PageHeader } from '@/components/ui/PageHeader'
import { PageTransition } from '@/components/ui/PageTransition'

export default function NewLandExperiencePage() {
  const router = useRouter()
  const { toast } = useToast()
  const supabase = createClient()

  const [company, setCompany] = useState('')
  const [role, setRole] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [isCurrent, setIsCurrent] = useState(false)
  const [industry, setIndustry] = useState('')
  const [description, setDescription] = useState('')
  const [saving, setSaving] = useState(false)

  async function handleSave() {
    if (!company.trim() || !role.trim()) return
    setSaving(true)

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setSaving(false); return }

    const { error } = await supabase.from('land_experience').insert({
      user_id: user.id,
      company: company.trim(),
      role: role.trim(),
      start_date: startDate || null,
      end_date: isCurrent ? null : endDate || null,
      industry: industry.trim() || '',
      description: description.trim() || '',
    })

    setSaving(false)
    if (error) {
      toast('Failed to save. Please try again.', 'error')
      return
    }
    toast('Shore-side role added.', 'success')
    router.push('/app/attachment')
  }

  return (
    <PageTransition>
      <div className="flex flex-col gap-4 pb-24">
        <PageHeader backHref="/app/attachment" title="Add shore-side role" />

        <div className="flex flex-col gap-4">
          <Input
            label="Company"
            value={company}
            onChange={(e) => setCompany(e.target.value)}
            placeholder="e.g. The Ritz-Carlton, Nobu"
          />

          <Input
            label="Role"
            value={role}
            onChange={(e) => setRole(e.target.value)}
            placeholder="e.g. Head Chef, Restaurant Manager"
          />

          <DatePicker
            label="Start date"
            value={startDate || null}
            onChange={(v) => setStartDate(v ?? '')}
            includeDay
            maxYear={new Date().getFullYear()}
          />

          <div>
            <label className="flex items-center gap-3 py-3 px-4 rounded-xl hover:bg-[var(--color-surface-raised)] cursor-pointer min-h-[44px]">
              <input
                type="checkbox"
                checked={isCurrent}
                onChange={(e) => setIsCurrent(e.target.checked)}
                className="w-5 h-5 rounded accent-[var(--color-teal-700)]"
              />
              <span className="text-sm text-[var(--color-text-primary)]">Currently working here</span>
            </label>
            {!isCurrent && (
              <DatePicker
                label="End date"
                value={endDate || null}
                onChange={(v) => setEndDate(v ?? '')}
                includeDay
                maxYear={new Date().getFullYear()}
              />
            )}
          </div>

          <Input
            label="Industry"
            value={industry}
            onChange={(e) => setIndustry(e.target.value)}
            placeholder="e.g. Hospitality, Maritime services"
          />

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-[var(--color-text-primary)]">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value.slice(0, 2000))}
              placeholder="Describe your role and responsibilities..."
              className="min-h-[120px] resize-y rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-3 text-sm text-[var(--color-text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-interactive)]/20 focus:border-[var(--color-interactive)]"
            />
            <p className="text-xs text-[var(--color-text-tertiary)] text-right">
              {description.length}/2000
            </p>
          </div>

          <Button
            onClick={handleSave}
            disabled={!company.trim() || !role.trim() || saving}
            className="w-full mt-2"
            size="lg"
          >
            {saving ? 'Saving…' : 'Add role'}
          </Button>
        </div>
      </div>
    </PageTransition>
  )
}

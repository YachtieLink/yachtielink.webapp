'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { createClient } from '@/lib/supabase/client'
import { Button, Input, DatePicker } from '@/components/ui'
import { useToast } from '@/components/ui/Toast'
import { PageHeader } from '@/components/ui/PageHeader'
import { Skeleton } from '@/components/ui/skeleton'
import { PageTransition } from '@/components/ui/PageTransition'

export default function EditLandExperiencePage() {
  const router = useRouter()
  const params = useParams<{ id: string }>()
  const { toast } = useToast()
  const supabase = createClient()
  const prefersReducedMotion = useReducedMotion()

  const [userId, setUserId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [found, setFound] = useState(false)
  const [company, setCompany] = useState('')
  const [role, setRole] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [isCurrent, setIsCurrent] = useState(false)
  const [industry, setIndustry] = useState('')
  const [description, setDescription] = useState('')
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { setLoading(false); return }
      setUserId(user.id)

      const { data } = await supabase
        .from('land_experience')
        .select('id, company, role, start_date, end_date, industry, description')
        .eq('id', params.id)
        .eq('user_id', user.id)
        .single()

      if (data) {
        setFound(true)
        setCompany(data.company ?? '')
        setRole(data.role ?? '')
        setStartDate(data.start_date ?? '')
        setEndDate(data.end_date ?? '')
        setIsCurrent(!data.end_date)
        setIndustry(data.industry ?? '')
        setDescription(data.description ?? '')
      }
      setLoading(false)
    }
    load()
  }, [params.id])

  async function handleSave() {
    if (!company.trim() || !role.trim()) return
    if (!userId) {
      toast('Session expired. Please refresh and try again.', 'error')
      return
    }
    setSaving(true)

    const { error } = await supabase
      .from('land_experience')
      .update({
        company: company.trim(),
        role: role.trim(),
        start_date: startDate || null,
        end_date: isCurrent ? null : endDate || null,
        industry: industry.trim() || '',
        description: description.trim() || '',
      })
      .eq('id', params.id)
      .eq('user_id', userId)

    setSaving(false)
    if (error) {
      toast('Failed to save. Please try again.', 'error')
      return
    }
    toast('Shore-side role updated.', 'success')
    router.push('/app/attachment')
  }

  async function handleDelete() {
    if (!confirmDelete) { setConfirmDelete(true); return }
    if (!userId) {
      toast('Session expired. Please refresh and try again.', 'error')
      return
    }
    setDeleting(true)

    const { error } = await supabase
      .from('land_experience')
      .delete()
      .eq('id', params.id)
      .eq('user_id', userId)

    setDeleting(false)
    if (error) {
      toast('Failed to remove role.', 'error')
      return
    }
    toast('Shore-side role removed.', 'success')
    router.push('/app/attachment')
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
              <Skeleton className="h-6 w-40" />
            </div>
            <Skeleton className="h-12 w-full rounded-xl" />
            <Skeleton className="h-12 w-full rounded-xl" />
            <Skeleton className="h-12 w-full rounded-xl" />
          </motion.div>
        ) : (
          <motion.div
            key="content"
            initial={prefersReducedMotion ? false : { opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.15 }}
          >
            {!found ? (
              <div className="pt-8">
                <p className="text-sm text-[var(--color-text-secondary)]">Role not found.</p>
              </div>
            ) : (
              <div className="flex flex-col gap-4 pb-24">
                <PageHeader backHref="/app/attachment" title="Edit shore-side role" />

                <div className="flex flex-col gap-4">
                  <Input
                    label="Company"
                    value={company}
                    onChange={(e) => setCompany(e.target.value)}
                    placeholder="e.g. The Ritz-Carlton, Nobu"
                    maxLength={200}
                  />

                  <Input
                    label="Role"
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    placeholder="e.g. Head Chef, Restaurant Manager"
                    maxLength={200}
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
                    maxLength={200}
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
                    {saving ? 'Saving…' : 'Save changes'}
                  </Button>

                  <div className="border-t border-[var(--color-border)] pt-4 mt-2">
                    <Button
                      onClick={handleDelete}
                      disabled={deleting}
                      className="w-full"
                      size="lg"
                      variant={confirmDelete ? 'destructive' : 'ghost'}
                    >
                      {deleting ? 'Removing…' : confirmDelete ? 'Tap again to confirm removal' : 'Remove this role'}
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </PageTransition>
  )
}

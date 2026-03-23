'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { createClient } from '@/lib/supabase/client'
import { Button, Input, DatePicker, Select } from '@/components/ui'
import { useToast } from '@/components/ui/Toast'
import { BackButton } from '@/components/ui/BackButton'
import { Skeleton } from '@/components/ui/skeleton'
import { PageTransition } from '@/components/ui/PageTransition'
import { TransferSheet } from '@/components/attachment/TransferSheet'

interface Attachment {
  id: string
  role_label: string
  started_at: string
  ended_at: string | null
  yachts: { id: string; name: string } | null
}

export default function AttachmentEditPage() {
  const router = useRouter()
  const params = useParams<{ id: string }>()
  const { toast } = useToast()
  const supabase = createClient()

  const [attachment, setAttachment] = useState<Attachment | null>(null)
  const [roleLabel, setRoleLabel] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [isCurrent, setIsCurrent] = useState(false)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [loading, setLoading] = useState(true)
  const [transferOpen, setTransferOpen] = useState(false)
  const [userId, setUserId] = useState<string | null>(null)
  const [employmentType, setEmploymentType] = useState('')
  const [yachtProgram, setYachtProgram] = useState('')
  const [description, setDescription] = useState('')
  const [cruisingArea, setCruisingArea] = useState('')
  const prefersReducedMotion = useReducedMotion()

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) setUserId(user.id)
    })
    supabase
      .from('attachments')
      .select('id, role_label, started_at, ended_at, employment_type, yacht_program, description, cruising_area, yachts(id, name)')
      .eq('id', params.id)
      .single()
      .then(({ data }) => {
        if (data) {
          const att = data as unknown as Attachment
          setAttachment(att)
          setRoleLabel(att.role_label)
          setStartDate(att.started_at)
          setEndDate(att.ended_at ?? '')
          setIsCurrent(!att.ended_at)
          setEmploymentType((data as any).employment_type ?? '')
          setYachtProgram((data as any).yacht_program ?? '')
          setDescription((data as any).description ?? '')
          setCruisingArea((data as any).cruising_area ?? '')
        }
        setLoading(false)
      })
  }, [params.id])

  async function handleSave() {
    if (!roleLabel.trim() || !startDate) return
    setSaving(true)
    const { error } = await supabase
      .from('attachments')
      .update({
        role_label: roleLabel.trim(),
        started_at: startDate,
        ended_at: isCurrent ? null : endDate || null,
        employment_type: employmentType || null,
        yacht_program: yachtProgram || null,
        description: description.trim() || null,
        cruising_area: cruisingArea.trim() || null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', params.id)

    setSaving(false)
    if (error) {
      toast('Failed to save. Please try again.', 'error')
      return
    }
    toast('Attachment updated.', 'success')
    router.push('/app/profile')
  }

  async function handleDelete() {
    if (!confirmDelete) { setConfirmDelete(true); return }
    setDeleting(true)
    const { error } = await supabase
      .from('attachments')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', params.id)

    setDeleting(false)
    if (error) {
      toast('Failed to remove attachment.', 'error')
      return
    }
    toast('Attachment removed.', 'success')
    router.push('/app/profile')
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
            {!attachment ? (
              <div className="min-h-screen bg-[var(--color-surface)] pt-8">
                <p className="text-sm text-[var(--color-text-secondary)]">Attachment not found.</p>
              </div>
            ) : (
              <div className="min-h-screen bg-[var(--color-surface)] pt-8 pb-24">
                <div className="mb-6">
                  <BackButton href="/app/profile" />
                </div>

                <h1 className="text-[28px] font-bold tracking-tight text-[var(--color-text-primary)] mb-1">Edit attachment</h1>
                <p className="text-sm text-[var(--color-text-secondary)] mb-6">
                  {attachment.yachts?.name ?? 'Yacht'}
                </p>

                <div className="flex flex-col gap-4">
                  <div>
                    <label className="block text-xs font-medium text-[var(--color-text-secondary)] mb-1">
                      Role
                    </label>
                    <Input
                      value={roleLabel}
                      onChange={(e) => setRoleLabel(e.target.value)}
                      placeholder="Your role on this yacht"
                    />
                  </div>

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

                  {/* Employment Details */}
                  <div className="border-t border-[var(--color-border)] pt-4 mt-2">
                    <p className="text-sm font-medium text-[var(--color-text-primary)] mb-3">Employment Details</p>

                    <div className="flex flex-col gap-4">
                      <Select
                        label="Employment Type"
                        value={employmentType}
                        onChange={(e) => setEmploymentType(e.target.value)}
                      >
                        <option value="">Select...</option>
                        <option value="permanent">Permanent</option>
                        <option value="seasonal">Seasonal</option>
                        <option value="freelance">Freelance</option>
                        <option value="relief">Relief</option>
                        <option value="temporary">Temporary</option>
                      </Select>

                      <Select
                        label="Yacht Program"
                        value={yachtProgram}
                        onChange={(e) => setYachtProgram(e.target.value)}
                      >
                        <option value="">Select...</option>
                        <option value="private">Private</option>
                        <option value="charter">Charter</option>
                        <option value="private_charter">Private/Charter</option>
                      </Select>

                      <Input
                        label="Cruising Area"
                        value={cruisingArea}
                        onChange={(e) => setCruisingArea(e.target.value)}
                        placeholder="e.g. Mediterranean, Caribbean"
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
                    </div>
                  </div>

                  <Button
                    onClick={handleSave}
                    disabled={!roleLabel.trim() || !startDate || saving}
                    className="w-full mt-2"
                    size="lg"
                  >
                    {saving ? 'Saving…' : 'Save changes'}
                  </Button>

                  {/* Wrong yacht? */}
                  <div className="border-t border-[var(--color-border)] pt-4 mt-2">
                    <p className="text-sm font-medium text-[var(--color-text-primary)] mb-1">Wrong yacht?</p>
                    <p className="text-xs text-[var(--color-text-secondary)] mb-3">
                      If this role was on a different vessel, you can move it without losing your dates.
                    </p>
                    <Button
                      onClick={() => setTransferOpen(true)}
                      className="w-full"
                      size="lg"
                      variant="ghost"
                    >
                      Move to a different yacht
                    </Button>
                  </div>

                  {userId && attachment.yachts && (
                    <TransferSheet
                      open={transferOpen}
                      onClose={() => setTransferOpen(false)}
                      attachmentId={attachment.id}
                      userId={userId}
                      currentYachtId={attachment.yachts.id}
                      currentYachtName={attachment.yachts.name}
                      roleLabel={roleLabel || attachment.role_label}
                      startDate={startDate || attachment.started_at}
                      endDate={isCurrent ? null : (endDate || attachment.ended_at)}
                      onTransferComplete={() => {
                        toast('Moved to a different yacht.', 'success')
                        router.push('/app/profile')
                      }}
                    />
                  )}

                  <div className="border-t border-[var(--color-border)] pt-4 mt-2">
                    <p className="text-xs text-[var(--color-text-secondary)] mb-3">
                      Removing this attachment won&apos;t delete any endorsements you&apos;ve received for this yacht.
                    </p>
                    <Button
                      onClick={handleDelete}
                      disabled={deleting}
                      className="w-full"
                      size="lg"
                      variant={confirmDelete ? 'destructive' : 'ghost'}
                    >
                      {deleting ? 'Removing…' : confirmDelete ? 'Tap again to confirm removal' : 'Remove this yacht'}
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

'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui'
import { PageHeader } from '@/components/ui/PageHeader'
import { Textarea } from '@/components/ui/Textarea'
import { useToast } from '@/components/ui/Toast'
import { Skeleton } from '@/components/ui/skeleton'
import { PageTransition } from '@/components/ui/PageTransition'
import { SectionVisibilityToggle } from '@/components/profile/SectionVisibilityToggle'

const MAX_CHARS = 500

export default function AboutEditPage() {
  const router         = useRouter()
  const { toast }      = useToast()
  const supabase       = createClient()
  const [bio, setBio]  = useState('')
  const [saving, setSaving] = useState(false)
  const [loaded, setLoaded] = useState(false)
  const prefersReducedMotion = useReducedMotion()

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { data } = await supabase
        .from('users')
        .select('bio')
        .eq('id', user.id)
        .single()
      if (data?.bio) setBio(data.bio)
      setLoaded(true)
    }
    load()
  }, [supabase])

  async function handleSave() {
    if (bio.length > MAX_CHARS) return
    setSaving(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { toast('Not signed in.', 'error'); return }

      const { error } = await supabase
        .from('users')
        .update({ bio: bio.trim() || null })
        .eq('id', user.id)

      if (error) { toast(error.message, 'error'); return }

      toast('Bio saved.', 'success')
      router.push('/app/profile')
      router.refresh()
    } finally {
      setSaving(false)
    }
  }

  const remaining = MAX_CHARS - bio.length
  const overLimit = remaining < 0

  return (
    <PageTransition className="flex flex-col gap-6 pb-24">
      <PageHeader
        backHref="/app/profile"
        title="About"
        subtitle="Tell people about your background and experience."
      />

      <AnimatePresence mode="wait">
        {!loaded ? (
          <motion.div
            key="skeleton"
            exit={prefersReducedMotion ? undefined : { opacity: 0 }}
            transition={{ duration: 0.15 }}
          >
            <Skeleton className="h-40 w-full rounded-xl" />
          </motion.div>
        ) : (
          <motion.div
            key="content"
            initial={prefersReducedMotion ? false : { opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.15 }}
            className="flex flex-col gap-6"
          >
            <div className="flex flex-col gap-1">
              <Textarea
                label="Bio"
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="e.g. Experienced Chief Stewardess with 8 seasons on motor yachts across the Med and Caribbean…"
                rows={8}
                error={overLimit ? `${Math.abs(remaining)} characters over limit` : undefined}
                className="resize-none"
              />
              <p className={`text-xs text-right ${overLimit ? 'text-[var(--color-error)]' : 'text-[var(--color-text-secondary)]'}`}>
                {remaining}
              </p>
            </div>

            <SectionVisibilityToggle sectionKey="about" label="Bio" />

            <div className="flex gap-3">
              <Button
                variant="secondary"
                onClick={() => router.back()}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                onClick={handleSave}
                loading={saving}
                disabled={overLimit}
                className="flex-1"
              >
                Save
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </PageTransition>
  )
}

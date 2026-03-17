'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui'
import { useToast } from '@/components/ui/Toast'

const MAX_CHARS = 500

export default function AboutEditPage() {
  const router         = useRouter()
  const { toast }      = useToast()
  const supabase       = createClient()
  const [bio, setBio]  = useState('')
  const [saving, setSaving] = useState(false)
  const [loaded, setLoaded] = useState(false)

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
    <div className="flex flex-col gap-6 pb-8">
      <div>
        <h1 className="text-xl font-semibold text-[var(--color-text-primary)]">About</h1>
        <p className="text-sm text-[var(--color-text-secondary)] mt-1">
          Tell people about your background and experience.
        </p>
      </div>

      {!loaded ? (
        <div className="h-40 bg-[var(--color-surface-raised)] rounded-xl animate-pulse" />
      ) : (
        <>
          <div className="relative">
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="e.g. Experienced Chief Stewardess with 8 seasons on motor yachts across the Med and Caribbean…"
              rows={8}
              className={`w-full bg-[var(--color-surface)] border rounded-xl px-4 py-3 text-sm text-[var(--color-text-primary)] placeholder:text-[var(--color-text-secondary)] resize-none focus:outline-none focus:ring-2 focus:ring-[var(--color-interactive)] transition-shadow ${
                overLimit ? 'border-red-500' : 'border-[var(--color-border)]'
              }`}
            />
            <span
              className={`absolute bottom-3 right-4 text-xs ${
                overLimit ? 'text-red-500' : 'text-[var(--color-text-secondary)]'
              }`}
            >
              {remaining}
            </span>
          </div>

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
        </>
      )}
    </div>
  )
}

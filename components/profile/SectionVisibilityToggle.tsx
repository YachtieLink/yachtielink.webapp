'use client'

import { useState, useEffect, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Eye, EyeOff } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

interface SectionVisibilityToggleProps {
  sectionKey: string
  /** e.g. "Bio", "Skills" */
  label: string
}

/**
 * Self-contained toggle for controlling whether a profile section
 * is visible on the generated CV and public profile.
 * Loads its own state and calls the section-visibility API.
 */
export function SectionVisibilityToggle({ sectionKey, label }: SectionVisibilityToggleProps) {
  const [visible, setVisible] = useState(true)
  const [loaded, setLoaded] = useState(false)
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  useEffect(() => {
    async function load() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { data } = await supabase
        .from('users')
        .select('section_visibility')
        .eq('id', user.id)
        .single()
      const sv = (data?.section_visibility ?? {}) as Record<string, boolean>
      setVisible(sv[sectionKey] ?? true)
      setLoaded(true)
    }
    load()
  }, [sectionKey])

  function toggle() {
    const newValue = !visible
    setVisible(newValue)

    startTransition(async () => {
      try {
        const res = await fetch('/api/profile/section-visibility', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ section: sectionKey, visible: newValue }),
        })
        if (!res.ok) {
          setVisible(!newValue)
        } else {
          router.refresh()
        }
      } catch {
        setVisible(!newValue)
      }
    })
  }

  if (!loaded) return null

  return (
    <div className="rounded-xl bg-[var(--color-surface-raised)] p-4 flex items-center gap-3">
      <span className="text-[var(--color-text-tertiary)]">
        {visible ? <Eye size={18} /> : <EyeOff size={18} />}
      </span>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-[var(--color-text-primary)]">
          {visible ? `${label} is visible` : `${label} is hidden`}
        </p>
        <p className="text-xs text-[var(--color-text-tertiary)]">
          Controls whether this appears on your generated CV and public profile
        </p>
      </div>
      <button
        role="switch"
        aria-checked={visible}
        aria-label={`Show ${label} on CV and public profile`}
        onClick={toggle}
        disabled={isPending}
        className={`relative shrink-0 w-9 h-5 rounded-full transition-colors ${
          visible ? 'bg-[var(--color-interactive)]' : 'bg-[var(--color-border)]'
        } disabled:opacity-60`}
      >
        <span
          className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${
            visible ? 'translate-x-4' : 'translate-x-0'
          }`}
        />
      </button>
    </div>
  )
}

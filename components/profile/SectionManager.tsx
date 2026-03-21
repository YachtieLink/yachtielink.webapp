'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

type SectionKey = 'about' | 'experience' | 'endorsements' | 'certifications' | 'hobbies' | 'education' | 'skills' | 'photos' | 'gallery'

interface SectionConfig {
  key: SectionKey
  label: string
  editHref?: string
  addHref?: string
  hasData: boolean
}

interface SectionManagerProps {
  visibility: Record<SectionKey, boolean>
  sections: SectionConfig[]
}

export function SectionManager({ visibility: initialVisibility, sections }: SectionManagerProps) {
  const [visibility, setVisibility] = useState(initialVisibility)
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  async function toggle(section: SectionKey) {
    const newValue = !visibility[section]
    setVisibility((prev) => ({ ...prev, [section]: newValue })) // optimistic

    startTransition(async () => {
      try {
        const res = await fetch('/api/profile/section-visibility', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ section, visible: newValue }),
        })
        if (!res.ok) {
          setVisibility((prev) => ({ ...prev, [section]: !newValue })) // roll back
        } else {
          router.refresh()
        }
      } catch {
        setVisibility((prev) => ({ ...prev, [section]: !newValue })) // roll back
      }
    })
  }

  return (
    <div className="bg-[var(--color-surface)] rounded-2xl p-5 flex flex-col gap-3">
      <div>
        <p className="font-semibold text-[var(--color-text-primary)]">Profile Sections</p>
        <p className="text-xs text-[var(--color-text-secondary)] mt-0.5">Choose what shows on your public profile</p>
      </div>

      <div className="flex flex-col divide-y divide-[var(--color-border)]">
        {sections.map(({ key, label, editHref, addHref, hasData }) => {
          const checked = visibility[key]
          return (
            <div key={key} className="flex items-center gap-3 py-2.5">
              <button
                role="checkbox"
                aria-checked={checked}
                onClick={() => toggle(key)}
                disabled={isPending}
                className={`relative w-9 h-5 rounded-full transition-colors ${
                  checked ? 'bg-[var(--color-interactive)]' : 'bg-[var(--color-border)]'
                } disabled:opacity-60`}
              >
                <span
                  className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${
                    checked ? 'translate-x-4' : 'translate-x-0'
                  }`}
                />
              </button>
              <span className="flex-1 text-sm text-[var(--color-text-primary)]">{label}</span>
              {hasData && editHref ? (
                <Link href={editHref} className="text-xs text-[var(--color-interactive)] hover:underline">
                  Edit
                </Link>
              ) : !hasData && addHref ? (
                <Link href={addHref} className="text-xs text-[var(--color-interactive)] hover:underline">
                  Add
                </Link>
              ) : null}
            </div>
          )
        })}
      </div>
    </div>
  )
}

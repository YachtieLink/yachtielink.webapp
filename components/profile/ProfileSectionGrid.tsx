'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

type SectionKey =
  | 'about'
  | 'experience'
  | 'endorsements'
  | 'certifications'
  | 'hobbies'
  | 'education'
  | 'skills'
  | 'photos'
  | 'gallery'

export interface SectionItem {
  key: SectionKey
  label: string
  summary: string
  count: number
  visible: boolean
  editHref: string
  /** Optional chip-style preview items (e.g. skills, hobbies) */
  chips?: string[]
}

interface ProfileSectionGridProps {
  sections: SectionItem[]
}

export function ProfileSectionGrid({ sections }: ProfileSectionGridProps) {
  const [visibility, setVisibility] = useState<Record<string, boolean>>(() => {
    const map: Record<string, boolean> = {}
    for (const s of sections) map[s.key] = s.visible
    return map
  })
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  async function toggle(section: SectionKey) {
    const newValue = !visibility[section]
    setVisibility((prev) => ({ ...prev, [section]: newValue }))

    startTransition(async () => {
      try {
        const res = await fetch('/api/profile/section-visibility', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ section, visible: newValue }),
        })
        if (!res.ok) {
          setVisibility((prev) => ({ ...prev, [section]: !newValue }))
        } else {
          router.refresh()
        }
      } catch {
        setVisibility((prev) => ({ ...prev, [section]: !newValue }))
      }
    })
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="px-1">
        <p className="font-semibold text-[var(--color-text-primary)]">Profile Sections</p>
        <p className="text-xs text-[var(--color-text-secondary)] mt-0.5">
          Choose what shows on your public profile
        </p>
      </div>

      <div className="grid grid-cols-2 gap-2">
        {sections.map((section) => {
          const checked = visibility[section.key]
          return (
            <div
              key={section.key}
              className="bg-[var(--color-surface)] rounded-2xl p-3 flex flex-col gap-2"
            >
              {/* Title + toggle */}
              <div className="flex items-center justify-between gap-1">
                <span className="text-sm font-medium text-[var(--color-text-primary)] truncate">
                  {section.label}
                </span>
                <button
                  role="switch"
                  aria-checked={checked}
                  aria-label={`Show ${section.label} on public profile`}
                  onClick={() => toggle(section.key)}
                  disabled={isPending}
                  className={`relative shrink-0 w-9 h-5 rounded-full transition-colors ${
                    checked
                      ? 'bg-[var(--color-interactive)]'
                      : 'bg-[var(--color-border)]'
                  } disabled:opacity-60`}
                >
                  <span
                    className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${
                      checked ? 'translate-x-4' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>

              {/* Summary or chips */}
              {section.chips && section.chips.length > 0 ? (
                <div className="flex flex-wrap gap-1 min-h-[2rem]">
                  {section.chips.slice(0, 4).map((chip, i) => (
                    <span key={`${section.key}-${i}`} className="text-[10px] px-2 py-0.5 rounded-full bg-[var(--color-surface-raised)] text-[var(--color-text-secondary)] truncate max-w-[90px]">
                      {chip}
                    </span>
                  ))}
                  {section.chips.length > 4 && (
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-[var(--color-surface-raised)] text-[var(--color-text-tertiary)]">
                      +{section.chips.length - 4}
                    </span>
                  )}
                </div>
              ) : (
                <p className="text-xs text-[var(--color-text-secondary)] line-clamp-2 min-h-[2rem]">
                  {section.summary}
                </p>
              )}

              {/* Edit / Add button */}
              <Link
                href={section.editHref}
                className="text-xs font-medium text-[var(--color-interactive)] hover:underline self-start"
              >
                {section.count > 0 ? 'Edit' : 'Add'}
              </Link>
            </div>
          )
        })}
      </div>
    </div>
  )
}

'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ChevronRight } from 'lucide-react'

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
  | 'personal'
  | 'contact'
  | 'cv_details'
  | 'sea_time'
  | 'languages'

export interface SectionRowItem {
  key: SectionKey
  label: string
  summary: string
  count: number
  icon: React.ReactNode
  editHref: string
  /** Controls visibility toggle (public profile). If undefined, no toggle shown. */
  visibilityKey?: string
  visible?: boolean
  /** Positive empty state message — shown when count is 0 */
  emptyPrompt?: string
  /** Sublabel explaining what the toggle shows/hides on public profile */
  visibilityLabel?: string
}

interface ProfileSectionListProps {
  sections: SectionRowItem[]
  initialVisibility?: Record<string, boolean>
}

export function ProfileSectionList({ sections, initialVisibility }: ProfileSectionListProps) {
  const [visibility, setVisibility] = useState<Record<string, boolean>>(initialVisibility ?? {})
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  async function toggle(section: string) {
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
    <>
      {sections.map((section) => {
        const isEmpty = section.count === 0
        const showToggle = section.visibilityKey !== undefined
        const isVisible = section.visibilityKey ? (visibility[section.visibilityKey] ?? true) : true

        return (
          <Link
            key={section.key}
            href={section.editHref}
            className="flex items-center gap-3 px-4 py-3.5 hover:bg-[var(--color-surface-raised)]/30 transition-colors"
          >
            <span className="text-[var(--color-teal-700)] shrink-0">{section.icon}</span>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-[var(--color-text-primary)]">{section.label}</p>
              <p className="text-xs text-[var(--color-text-secondary)] truncate">
                {isEmpty && section.emptyPrompt
                  ? section.emptyPrompt
                  : section.summary}
              </p>
              {showToggle && section.visibilityLabel && (
                <p className="text-[11px] text-[var(--color-text-tertiary)] mt-0.5">{section.visibilityLabel}</p>
              )}
            </div>
            {showToggle && (
              <button
                role="switch"
                aria-checked={isVisible}
                aria-label={`Show ${section.label} on public profile`}
                onClick={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  if (section.visibilityKey) toggle(section.visibilityKey)
                }}
                disabled={isPending}
                className={`relative shrink-0 w-9 h-5 rounded-full transition-colors ${
                  isVisible ? 'bg-[var(--color-interactive)]' : 'bg-[var(--color-border)]'
                } disabled:opacity-60`}
              >
                <span
                  className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${
                    isVisible ? 'translate-x-4' : 'translate-x-0'
                  }`}
                />
              </button>
            )}
            {!showToggle && (
              <ChevronRight size={16} className="text-[var(--color-text-tertiary)] shrink-0" />
            )}
          </Link>
        )
      })}
    </>
  )
}

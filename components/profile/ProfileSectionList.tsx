'use client'

import Link from 'next/link'
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
  /** Positive empty state message — shown when count is 0 */
  emptyPrompt?: string
}

interface ProfileSectionListProps {
  sections: SectionRowItem[]
}

export function ProfileSectionList({ sections }: ProfileSectionListProps) {
  return (
    <>
      {sections.map((section) => {
        const isEmpty = section.count === 0

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
            </div>
            <ChevronRight size={16} className="text-[var(--color-text-tertiary)] shrink-0" />
          </Link>
        )
      })}
    </>
  )
}

'use client'

import { type SectionColor, getSectionTokens } from '@/lib/section-colors'

interface ProfileSectionGroupProps {
  title: string
  icon: React.ReactNode
  accentColor?: SectionColor
  children: React.ReactNode
}

export function ProfileSectionGroup({
  title,
  icon,
  accentColor = 'teal',
  children,
}: ProfileSectionGroupProps) {
  const tokens = getSectionTokens(accentColor === 'teal' ? 'profile' : accentColor)

  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center gap-2 px-1 pt-3 pb-1">
        <span style={{ color: tokens.text700 }}>{icon}</span>
        <span className="text-xs font-semibold uppercase tracking-wide text-[var(--color-text-tertiary)]">
          {title}
        </span>
      </div>
      <div className="bg-[var(--color-surface)] rounded-2xl overflow-hidden divide-y divide-[var(--color-border)]">
        {children}
      </div>
    </div>
  )
}

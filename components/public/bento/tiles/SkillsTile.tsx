'use client'

import { Wrench } from 'lucide-react'

interface SkillsTileProps {
  skills: string[]
  hobbies: string[]
}

export function SkillsTile({ skills, hobbies }: SkillsTileProps) {
  return (
    <div className="h-full rounded-xl bg-white/80 p-5 flex flex-col">
      <div className="flex items-center gap-2 mb-3">
        <Wrench size={14} className="text-[var(--color-text-tertiary)]" />
        <span className="text-xs font-semibold uppercase tracking-wide text-[var(--color-text-tertiary)]">Skills & Interests</span>
      </div>
      <div className="flex flex-wrap gap-1.5 flex-1">
        {skills.map((s) => (
          <span key={s} className="text-xs px-2.5 py-1 rounded-full bg-[var(--color-surface-raised)] text-[var(--color-text-primary)]">
            {s}
          </span>
        ))}
        {hobbies.length > 0 && skills.length > 0 && (
          <span className="text-xs text-[var(--color-text-tertiary)] self-center px-1">·</span>
        )}
        {hobbies.map((h) => (
          <span key={h} className="text-xs px-2.5 py-1 rounded-full bg-[var(--color-surface-raised)] text-[var(--color-text-secondary)]">
            {h}
          </span>
        ))}
      </div>
    </div>
  )
}

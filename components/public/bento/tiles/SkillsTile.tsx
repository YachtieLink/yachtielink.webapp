'use client'

import { Wrench } from 'lucide-react'

interface SkillsTileProps {
  skills: string[]
}

export function SkillsTile({ skills }: SkillsTileProps) {
  return (
    <div className="h-full rounded-xl bg-[var(--color-teal-50)]/50 p-5 flex flex-col">
      <div className="flex items-center gap-2 mb-3">
        <Wrench size={14} className="text-[var(--color-text-tertiary)]" />
        <span className="text-xs font-semibold uppercase tracking-wide text-[var(--color-text-tertiary)]">My Skills</span>
      </div>
      <div className="flex flex-wrap gap-1.5 flex-1">
        {skills.map((s) => (
          <span key={s} className="text-xs px-2.5 py-1 rounded-full bg-transparent text-[var(--color-text-primary)] border border-[var(--color-border-subtle)]">
            {s}
          </span>
        ))}
      </div>
    </div>
  )
}

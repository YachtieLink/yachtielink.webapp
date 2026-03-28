'use client'

import { Heart } from 'lucide-react'

interface HobbiesTileProps {
  hobbies: string[]
}

export function HobbiesTile({ hobbies }: HobbiesTileProps) {
  return (
    <div className="h-full rounded-xl bg-[var(--color-sand-100)]/50 p-5 flex flex-col">
      <div className="flex items-center gap-2 mb-3">
        <Heart size={14} className="text-[var(--color-text-tertiary)]" />
        <span className="text-xs font-semibold uppercase tracking-wide text-[var(--color-text-tertiary)]">Interests</span>
      </div>
      <div className="flex flex-wrap gap-1.5 flex-1">
        {hobbies.map((h) => (
          <span key={h} className="text-xs px-2.5 py-1 rounded-full bg-[var(--color-surface-raised)] text-[var(--color-text-secondary)]">
            {h}
          </span>
        ))}
      </div>
    </div>
  )
}

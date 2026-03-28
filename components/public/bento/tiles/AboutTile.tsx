'use client'

import { User } from 'lucide-react'

interface AboutTileProps {
  bio: string
  accentColor?: string
}

export function AboutTile({ bio }: AboutTileProps) {
  const isTruncated = bio.length > 200

  return (
    <div className="h-full rounded-xl bg-white/80 p-5 flex flex-col">
      <div className="flex items-center gap-2 mb-3">
        <User size={14} className="text-[var(--color-text-tertiary)]" />
        <span className="text-xs font-semibold uppercase tracking-wide text-[var(--color-text-tertiary)]">About</span>
      </div>
      <p className="text-sm text-[var(--color-text-primary)] leading-relaxed whitespace-pre-line line-clamp-6 flex-1">
        {bio}
      </p>
      {isTruncated && (
        <span className="mt-2 text-xs font-medium text-[var(--accent-500,#14b8a6)]">Read more &rarr;</span>
      )}
    </div>
  )
}

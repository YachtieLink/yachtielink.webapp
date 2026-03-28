'use client'

import Link from 'next/link'
import { FileText } from 'lucide-react'

interface CvTileProps {
  handle: string
}

export function CvTile({ handle }: CvTileProps) {
  return (
    <Link
      href={`/u/${handle}/cv`}
      className="h-full rounded-xl bg-white/80 p-4 flex flex-col items-center justify-center gap-2 hover:bg-white/90 transition-colors group"
    >
      <div className="flex items-center justify-center w-10 h-10 rounded-full bg-[var(--color-surface-raised)] group-hover:bg-[var(--accent-100,#ccfbf1)] transition-colors">
        <FileText size={18} className="text-[var(--accent-500,#14b8a6)]" />
      </div>
      <span className="text-xs font-semibold uppercase tracking-wide text-[var(--color-text-tertiary)]">
        View CV
      </span>
    </Link>
  )
}

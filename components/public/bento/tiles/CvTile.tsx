'use client'

import Link from 'next/link'
import { FileText } from 'lucide-react'

interface CvTileProps {
  handle: string
}

export function CvTile({ handle }: CvTileProps) {
  return (
    <div className="h-full rounded-xl bg-white/80 p-5 flex flex-col items-center justify-center gap-3">
      <FileText size={24} className="text-[var(--accent-500,#14b8a6)]" />
      <Link
        href={`/u/${handle}/cv`}
        className="text-sm font-semibold text-[var(--accent-500,#14b8a6)] hover:underline"
      >
        View my CV
      </Link>
    </div>
  )
}

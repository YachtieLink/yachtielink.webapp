'use client'

import Link from 'next/link'
import { GraduationCap } from 'lucide-react'
import type { Education } from '@/lib/queries/types'

interface EducationTileProps {
  education: Education[]
  handle: string
}

export function EducationTile({ education, handle }: EducationTileProps) {
  const shown = education.slice(0, 2)
  const remaining = education.length - shown.length

  return (
    <div className="h-full rounded-xl bg-white/80 p-5 flex flex-col">
      <div className="flex items-center gap-2 mb-3">
        <GraduationCap size={14} className="text-[var(--color-text-tertiary)]" />
        <span className="text-xs font-semibold uppercase tracking-wide text-[var(--color-text-tertiary)]">Education</span>
      </div>
      <div className="flex flex-col gap-2 flex-1">
        {shown.map((edu) => (
          <div key={edu.id}>
            <p className="text-sm font-medium text-[var(--color-text-primary)] truncate">{edu.institution}</p>
            {edu.qualification && <p className="text-xs text-[var(--color-text-secondary)] truncate">{edu.qualification}</p>}
          </div>
        ))}
      </div>
      {remaining > 0 && (
        <Link
          href={`/u/${handle}/education`}
          className="mt-2 text-xs font-medium text-[var(--accent-500,#14b8a6)] hover:underline"
        >
          +{remaining} more &rarr;
        </Link>
      )}
    </div>
  )
}

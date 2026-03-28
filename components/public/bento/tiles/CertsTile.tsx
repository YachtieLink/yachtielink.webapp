'use client'

import Link from 'next/link'
import { Shield } from 'lucide-react'
import type { PublicCertification } from '@/lib/queries/types'

interface CertsTileProps {
  certifications: PublicCertification[]
  handle: string
}

export function CertsTile({ certifications, handle }: CertsTileProps) {
  const maxShow = 4
  const shown = certifications.slice(0, maxShow)
  const remaining = certifications.length - shown.length

  return (
    <div className="h-full rounded-xl bg-[var(--color-teal-50)]/50 p-5 flex flex-col">
      <div className="flex items-center gap-2 mb-3">
        <Shield size={14} className="text-amber-500" />
        <span className="text-xs font-semibold uppercase tracking-wide text-[var(--color-text-tertiary)]">My Certifications</span>
      </div>
      <div className="flex flex-wrap gap-1.5 flex-1">
        {shown.map((cert) => {
          const name = cert.certification_types?.name ?? cert.custom_cert_name ?? 'Certificate'
          return (
            <span
              key={cert.id}
              className="text-xs px-2.5 py-1 rounded-full bg-[var(--color-surface-raised)] text-[var(--color-text-primary)] border border-[var(--color-border-subtle)]"
            >
              {name}
            </span>
          )
        })}
        {remaining > 0 && (
          <span className="text-xs px-2.5 py-1 rounded-full bg-[var(--accent-500,#14b8a6)]/10 text-[var(--accent-500,#14b8a6)] font-medium">
            +{remaining}
          </span>
        )}
      </div>
      <Link
        href={`/u/${handle}/certifications`}
        className="mt-2 text-xs font-medium text-[var(--accent-500,#14b8a6)] hover:underline"
      >
        See all &rarr;
      </Link>
    </div>
  )
}

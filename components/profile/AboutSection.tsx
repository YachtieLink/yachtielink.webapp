'use client'

import Link from 'next/link'
import { EmptyState } from '@/components/ui/EmptyState'

interface AboutSectionProps {
  bio?: string | null
}

export function AboutSection({ bio }: AboutSectionProps) {
  return (
    <div className="bg-[var(--color-surface)] rounded-2xl p-5">
      <div className="flex items-center justify-between mb-3">
        <h2 className="font-semibold text-[var(--color-text-primary)]">About</h2>
        <Link
          href="/app/about/edit"
          className="text-sm text-[var(--color-interactive)] hover:underline"
        >
          {bio ? 'Edit' : 'Add'}
        </Link>
      </div>

      {bio ? (
        <p className="text-sm text-[var(--color-text-primary)] whitespace-pre-wrap leading-relaxed">
          {bio}
        </p>
      ) : (
        <EmptyState variant="inline" title="No bio yet" />
      )}
    </div>
  )
}

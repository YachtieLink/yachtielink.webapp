'use client'

import Link from 'next/link'

interface AboutSectionProps {
  bio?: string | null
}

export function AboutSection({ bio }: AboutSectionProps) {
  return (
    <div className="bg-[var(--card)] rounded-2xl p-5">
      <div className="flex items-center justify-between mb-3">
        <h2 className="font-semibold text-[var(--foreground)]">About</h2>
        <Link
          href="/app/about/edit"
          className="text-sm text-[var(--ocean-500)] hover:underline"
        >
          {bio ? 'Edit' : 'Add'}
        </Link>
      </div>

      {bio ? (
        <p className="text-sm text-[var(--foreground)] whitespace-pre-wrap leading-relaxed">
          {bio}
        </p>
      ) : (
        <p className="text-sm text-[var(--muted-foreground)]">
          Add a short bio to tell people about yourself.
        </p>
      )}
    </div>
  )
}

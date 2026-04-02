'use client'

import Link from 'next/link'
import { EmptyState } from '@/components/ui/EmptyState'

interface Endorsement {
  id: string
  endorser_id: string
  content: string
  created_at: string
  yacht_id: string
  role_label?: string | null
  endorser: {
    display_name: string | null
    full_name: string
    handle: string | null
  } | null
  yachts: {
    name: string
  } | null
}

interface EndorsementsSectionProps {
  endorsements: Endorsement[]
  currentUserId?: string
}

const EXCERPT_LENGTH = 140

function excerpt(text: string): string {
  if (text.length <= EXCERPT_LENGTH) return text
  return text.slice(0, EXCERPT_LENGTH).trimEnd() + '…'
}

export function EndorsementsSection({ endorsements, currentUserId }: EndorsementsSectionProps) {
  if (endorsements.length === 0) {
    return (
      <div className="bg-[var(--color-surface)] rounded-2xl p-5">
        <h2 className="font-semibold text-[var(--color-text-primary)] mb-3">Endorsements</h2>
        <EmptyState variant="inline" title="No endorsements yet" />
      </div>
    )
  }

  return (
    <div className="bg-[var(--color-surface)] rounded-2xl p-5">
      <h2 className="font-semibold text-[var(--color-text-primary)] mb-3 flex items-center gap-2">
        Endorsements
        <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-[var(--color-coral-100)] text-[var(--color-coral-700)]">
          {endorsements.length}
        </span>
      </h2>

      <ul className="flex flex-col gap-4">
        {endorsements.map((e) => {
          const endorserName = e.endorser?.display_name ?? e.endorser?.full_name ?? 'Anonymous'
          const date = new Date(e.created_at).toLocaleDateString('en-GB', {
            month: 'short',
            year: 'numeric',
          })
          const isOwn = currentUserId && e.endorser_id === currentUserId

          return (
            <li key={e.id} className="border-l-2 border-[var(--color-interactive)] pl-4">
              <p className="text-sm text-[var(--color-text-primary)] leading-relaxed">
                &ldquo;{excerpt(e.content)}&rdquo;
              </p>
              <p className="text-xs font-medium text-[var(--color-text-secondary)] mt-1">
                {endorserName}
                {e.role_label && `, ${e.role_label}`}
                {e.yachts && ` on ${e.yachts.name}`}
              </p>
              <p className="text-xs text-[var(--color-text-tertiary)]">
                {date}
                {isOwn && (
                  <Link
                    href={`/app/endorsement/${e.id}/edit`}
                    className="text-xs text-[var(--color-interactive)] hover:underline ml-2"
                  >
                    Edit
                  </Link>
                )}
              </p>
            </li>
          )
        })}
      </ul>
    </div>
  )
}

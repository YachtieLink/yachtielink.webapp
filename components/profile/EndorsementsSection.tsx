'use client'

interface Endorsement {
  id: string
  content: string
  created_at: string
  yacht_id: string
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
}

const EXCERPT_LENGTH = 140

function excerpt(text: string): string {
  if (text.length <= EXCERPT_LENGTH) return text
  return text.slice(0, EXCERPT_LENGTH).trimEnd() + '…'
}

export function EndorsementsSection({ endorsements }: EndorsementsSectionProps) {
  if (endorsements.length === 0) {
    return (
      <div className="bg-[var(--card)] rounded-2xl p-5">
        <h2 className="font-semibold text-[var(--foreground)] mb-3">Endorsements</h2>
        <p className="text-sm text-[var(--muted-foreground)]">
          Endorsements add context to your work history.
        </p>
      </div>
    )
  }

  return (
    <div className="bg-[var(--card)] rounded-2xl p-5">
      <h2 className="font-semibold text-[var(--foreground)] mb-3">
        Endorsements{' '}
        <span className="font-normal text-[var(--muted-foreground)] text-sm">
          ({endorsements.length})
        </span>
      </h2>

      <ul className="flex flex-col gap-4">
        {endorsements.map((e) => {
          const endorserName = e.endorser?.display_name ?? e.endorser?.full_name ?? 'Anonymous'
          const date = new Date(e.created_at).toLocaleDateString('en-GB', {
            month: 'short',
            year: 'numeric',
          })

          return (
            <li key={e.id} className="border-l-2 border-[var(--ocean-500)] pl-4">
              <p className="text-sm text-[var(--foreground)] leading-relaxed">
                "{excerpt(e.content)}"
              </p>
              <p className="text-xs text-[var(--muted-foreground)] mt-1">
                {endorserName}
                {e.yachts ? ` · ${e.yachts.name}` : ''}
                {' · '}{date}
              </p>
            </li>
          )
        })}
      </ul>
    </div>
  )
}

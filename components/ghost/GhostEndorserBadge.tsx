import Link from 'next/link'

type Props = {
  ghostId: string
  fullName: string
  primaryRole: string | null
  /** When true, renders a link to the claim landing page. Set to false for CV/PDF contexts. */
  linkable?: boolean
}

/**
 * GhostEndorserBadge — visual distinction for endorsements written by ghost profiles.
 *
 * Shown wherever ghost endorsements appear in the public profile endorsements list.
 * Visually softer than a real-user endorser card — no avatar, no profile link.
 * Clicking leads to the claim landing page (/claim/[id]).
 *
 * Wiring note: The profile page endorsement queries need to be updated to select
 * ghost_endorser data alongside real endorser data before this component is displayed.
 * This component is built and ready — wiring is a follow-up task.
 */
export function GhostEndorserBadge({ ghostId, fullName, primaryRole, linkable = true }: Props) {
  const inner = (
    <div className="flex items-center gap-2">
      {/* Placeholder avatar */}
      <div className="h-8 w-8 rounded-full bg-[var(--color-surface-raised)] border border-[var(--color-border)] flex items-center justify-center shrink-0">
        <span className="text-xs text-[var(--color-text-tertiary)] font-medium select-none">
          {fullName.charAt(0).toUpperCase()}
        </span>
      </div>
      <div className="flex flex-col min-w-0">
        <span className="text-sm font-medium text-[var(--color-text-secondary)] truncate">
          {fullName}
        </span>
        {primaryRole && (
          <span className="text-xs text-[var(--color-text-tertiary)] truncate">
            {primaryRole}
          </span>
        )}
      </div>
    </div>
  )

  if (!linkable) return inner

  return (
    <Link
      href={`/claim/${ghostId}`}
      className="group flex items-center gap-2 rounded-lg hover:bg-[var(--color-surface-raised)] transition-colors p-1 -m-1"
      title="Claim this profile"
    >
      {/* Placeholder avatar */}
      <div className="h-8 w-8 rounded-full bg-[var(--color-surface-raised)] border border-[var(--color-border)] flex items-center justify-center shrink-0">
        <span className="text-xs text-[var(--color-text-tertiary)] font-medium select-none">
          {fullName.charAt(0).toUpperCase()}
        </span>
      </div>
      <div className="flex flex-col min-w-0">
        <span className="text-sm font-medium text-[var(--color-text-secondary)] group-hover:text-[var(--color-text-primary)] truncate transition-colors">
          {fullName}
        </span>
        {primaryRole && (
          <span className="text-xs text-[var(--color-text-tertiary)] truncate">
            {primaryRole}
          </span>
        )}
      </div>
    </Link>
  )
}

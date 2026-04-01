import { notFound, redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getGhostProfileSummary } from '@/lib/queries/ghost-profiles'
import { claimGhostProfile } from '@/lib/ghost/merge'
import Link from 'next/link'

interface PageProps {
  params: Promise<{ id: string }>
}

/**
 * /claim/[id] — Ghost profile claim landing page.
 *
 * Two paths:
 *
 * A. Unauthenticated visitor:
 *    Shows ghost summary (name, role, how many endorsements they've written)
 *    with auth CTAs. No magic links. Password / Google / Apple only.
 *    After auth, the callback redirects back here.
 *
 * B. Authenticated user:
 *    Immediately calls claim_ghost_profile RPC (atomic, idempotent).
 *    Redirects to /app/profile on success.
 *    The RPC sets onboarding_complete = true so the user bypasses the wizard.
 */
export default async function ClaimPage({ params }: PageProps) {
  const { id } = await params
  const supabase = await createClient()

  // Load ghost summary (SECURITY DEFINER RPC — works for anon users)
  const ghost = await getGhostProfileSummary(id)
  if (!ghost) return notFound()

  // Check authentication
  const { data: { user } } = await supabase.auth.getUser()

  if (user) {
    // Authenticated — trigger claim immediately then redirect
    try {
      if (user.email) {
        await claimGhostProfile(user.id, user.email)
      }
    } catch (err) {
      // Non-fatal — if claim fails (e.g. email mismatch), continue to profile anyway
      console.error('Ghost claim failed on landing page:', err)
    }
    redirect('/app/profile')
  }

  // Unauthenticated — show ghost summary + auth options
  const returnTo = encodeURIComponent(`/claim/${id}`)

  const verificationLabel =
    ghost.verified_via === 'email_token'    ? 'Verified via email link'   :
    ghost.verified_via === 'whatsapp_token' ? 'Verified via WhatsApp'     :
    'Unverified contact'

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[var(--color-surface)] px-4 py-12">
      <div className="max-w-sm w-full">
        {/* Ghost profile card */}
        <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-raised)] px-5 py-5 mb-6">
          <div className="flex items-center gap-3 mb-4">
            {/* Ghost avatar placeholder */}
            <div className="h-12 w-12 rounded-full bg-[var(--color-teal-50)] border border-[var(--color-teal-200)] flex items-center justify-center shrink-0">
              <span className="text-base font-semibold text-[var(--color-teal-600)] select-none">
                {ghost.full_name.charAt(0).toUpperCase()}
              </span>
            </div>
            <div>
              <p className="font-bold text-[var(--color-text-primary)]">{ghost.full_name}</p>
              {ghost.primary_role && (
                <p className="text-sm text-[var(--color-text-secondary)]">{ghost.primary_role}</p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs text-[var(--color-text-tertiary)]">
            <span className="h-1.5 w-1.5 rounded-full bg-[var(--color-teal-400)]" />
            {ghost.endorsement_count === 1
              ? '1 endorsement written'
              : `${ghost.endorsement_count} endorsements written`}
            <span className="mx-1">·</span>
            {verificationLabel}
          </div>
        </div>

        <h1 className="text-xl font-bold text-[var(--color-text-primary)] mb-2">
          Claim your profile
        </h1>
        <p className="text-sm text-[var(--color-text-secondary)] mb-6 leading-relaxed">
          You've already written {ghost.endorsement_count === 1 ? 'an endorsement' : 'endorsements'} on YachtieLink.
          Create an account to see who's endorsed you and build your own profile.
        </p>

        <div className="flex flex-col gap-3">
          <Link
            href={`/signup?returnTo=${returnTo}`}
            className="flex h-12 items-center justify-center rounded-xl bg-[var(--color-teal-700)] text-white text-sm font-semibold"
          >
            Create account
          </Link>
          <Link
            href={`/login?returnTo=${returnTo}`}
            className="flex h-12 items-center justify-center rounded-xl border border-[var(--color-border)] text-[var(--color-text-primary)] text-sm font-semibold"
          >
            Sign in
          </Link>
          <Link
            href="/"
            className="flex h-10 items-center justify-center text-sm text-[var(--color-text-tertiary)]"
          >
            Not now
          </Link>
        </div>
      </div>
    </div>
  )
}

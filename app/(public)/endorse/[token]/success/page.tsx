import Link from 'next/link'

interface PageProps {
  params: Promise<{ token: string }>
  searchParams: Promise<{ ghost_id?: string }>
}

/**
 * /endorse/[token]/success — Thank-you page after a ghost endorsement is submitted.
 *
 * Shows a warm "we've reserved a profile" message with two equal-weight CTAs:
 *   - Claim my profile → /claim/[ghost_id]
 *   - Done              → / (marketing homepage)
 *
 * Not pushy — the ghost just did someone a favour.
 */
export default async function EndorseSuccessPage({ params, searchParams }: PageProps) {
  const { token } = await params
  const { ghost_id } = await searchParams

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[var(--color-surface)] px-4 py-12">
      <div className="max-w-sm w-full text-center">
        {/* Success mark */}
        <div className="w-16 h-16 rounded-full bg-[var(--color-teal-50)] border border-[var(--color-teal-200)] flex items-center justify-center mx-auto mb-6">
          <svg className="w-8 h-8 text-[var(--color-teal-600)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </div>

        <h1 className="text-2xl font-bold text-[var(--color-text-primary)] mb-3">
          Endorsement sent
        </h1>
        <p className="text-sm text-[var(--color-text-secondary)] leading-relaxed mb-8">
          Your endorsement is on their profile. We've reserved a profile for you with your endorsement already listed — you can claim it whenever you're ready.
        </p>

        <div className="flex flex-col gap-3">
          {ghost_id ? (
            <Link
              href={`/claim/${ghost_id}`}
              className="flex h-12 items-center justify-center rounded-xl bg-[var(--color-teal-700)] text-white text-sm font-semibold"
            >
              Claim my profile
            </Link>
          ) : (
            <Link
              href={`/r/${token}`}
              className="flex h-12 items-center justify-center rounded-xl bg-[var(--color-teal-700)] text-white text-sm font-semibold"
            >
              Claim my profile
            </Link>
          )}
          <Link
            href="/"
            className="flex h-12 items-center justify-center rounded-xl border border-[var(--color-border)] text-[var(--color-text-secondary)] text-sm font-medium"
          >
            Done
          </Link>
        </div>
      </div>
    </div>
  )
}

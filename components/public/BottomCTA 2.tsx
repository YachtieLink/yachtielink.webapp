'use client'

import Link from 'next/link'

interface BottomCTAProps {
  isLoggedIn?: boolean
  isOwnProfile?: boolean
  displayName: string
}

export function BottomCTA({ isLoggedIn, isOwnProfile, displayName }: BottomCTAProps) {
  return (
    <>
      <div className="flex flex-col gap-3 mt-2 max-w-[680px] mx-auto w-full">
        {!isLoggedIn ? (
          <>
            <Link
              href="/signup"
              className="w-full flex items-center justify-center text-center rounded-xl bg-[var(--color-interactive)] px-6 py-3 text-sm font-medium text-white hover:bg-[var(--color-interactive-hover)] transition-colors"
            >
              Build your crew profile — it&apos;s free
            </Link>
            <Link
              href="/login"
              className="w-full flex items-center justify-center text-center rounded-xl border border-[#0f9b8e] px-6 py-3 text-sm font-medium text-[#0f9b8e] hover:bg-[#0f9b8e]/5 transition-colors"
            >
              Sign in to see how you know<br />{displayName}
            </Link>
          </>
        ) : (
          <Link
            href="/app/profile"
            className="w-full flex items-center justify-center rounded-xl border border-[var(--color-border)] px-6 py-3 text-sm font-medium text-[var(--color-text-primary)] hover:bg-[var(--color-surface-raised)] transition-colors"
          >
            Back to My Profile
          </Link>
        )}
      </div>

      <footer className="text-center py-6 mt-4">
        <p className="text-xs text-[var(--color-text-secondary)]">
          <Link href="/welcome" className="hover:underline">YachtieLink</Link> — Professional profiles for yacht crew
        </p>
      </footer>
    </>
  )
}

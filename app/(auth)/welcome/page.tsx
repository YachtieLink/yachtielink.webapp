/**
 * /welcome — Auth method selection
 *
 * Phase 1A: email/password only.
 * Google OAuth and Apple OAuth are placeholders — activate when there's
 * enough paying users to justify the developer account costs.
 */
import Link from "next/link";

export default function WelcomePage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-8 px-6 py-12 bg-[var(--color-surface)]">
      {/* Logo / wordmark placeholder */}
      <div className="text-center">
        <h1 className="text-3xl font-serif tracking-tight text-[var(--color-teal-800)] dark:text-[var(--color-teal-100)]">
          YachtieLink
        </h1>
        <p className="mt-2 text-sm text-[var(--color-text-secondary)]">
          Your professional identity on the water.
        </p>
      </div>

      {/* Auth options */}
      <div className="flex w-full max-w-sm flex-col gap-3">
        <Link
          href="/login"
          className="flex h-12 w-full items-center justify-center rounded-xl bg-[var(--color-teal-700)] text-sm font-semibold text-white transition-colors hover:bg-[var(--color-teal-800)]"
        >
          Sign in with email
        </Link>

        <Link
          href="/signup"
          className="flex h-12 w-full items-center justify-center rounded-xl border border-[var(--color-border)] text-sm font-semibold text-[var(--color-text-primary)] transition-colors hover:bg-[var(--color-surface-raised)]"
        >
          Create account
        </Link>

        {/* OAuth placeholders — activate later */}
        {/* <OAuthButton provider="google" label="Continue with Google" /> */}
        {/* <OAuthButton provider="apple"  label="Continue with Apple"  /> */}
      </div>

      <p className="text-center text-xs text-[var(--color-text-tertiary)]">
        By continuing you agree to our{" "}
        <Link href="/terms" className="underline underline-offset-2">
          Terms
        </Link>{" "}
        and{" "}
        <Link href="/privacy" className="underline underline-offset-2">
          Privacy Policy
        </Link>
        .
      </p>
    </div>
  );
}

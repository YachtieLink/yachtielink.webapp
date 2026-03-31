import Link from 'next/link'

export function PublicHeader() {
  return (
    <header className="sticky top-0 z-40 bg-[var(--color-surface)]/95 backdrop-blur-sm border-b border-[var(--color-border)]">
      <div className="max-w-5xl mx-auto flex items-center justify-between px-4 py-3">
        <Link href="/" className="font-semibold text-lg text-[var(--color-text-primary)]">
          YachtieLink
        </Link>
        <div className="flex items-center gap-3">
          <Link
            href="/login"
            className="text-sm text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-colors"
          >
            Log in
          </Link>
          <Link
            href="/welcome"
            className="text-sm font-medium px-4 py-2 rounded-full bg-[var(--color-interactive)] text-white hover:bg-[var(--color-interactive-hover)] transition-colors"
          >
            Sign up
          </Link>
        </div>
      </div>
    </header>
  )
}

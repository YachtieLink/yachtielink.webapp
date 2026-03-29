import Link from 'next/link'

export function PublicFooter() {
  return (
    <footer className="border-t border-[var(--color-border)] bg-[var(--color-surface)]">
      <div className="max-w-5xl mx-auto px-4 py-8 flex flex-col sm:flex-row items-center justify-between gap-4">
        <p className="text-xs text-[var(--color-text-tertiary)]">
          &copy; {new Date().getFullYear()} YachtieLink
        </p>
        <div className="flex gap-6">
          <Link href="/terms" className="text-xs text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-colors">
            Terms
          </Link>
          <Link href="/privacy" className="text-xs text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-colors">
            Privacy
          </Link>
        </div>
      </div>
    </footer>
  )
}

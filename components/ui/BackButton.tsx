import Link from 'next/link'

interface BackButtonProps {
  href: string
  label?: string
}

/**
 * Standard back-navigation button used across all pages.
 * Pill shape with border, arrow icon, hover fill.
 */
export function BackButton({ href, label = 'Back' }: BackButtonProps) {
  return (
    <Link
      href={href}
      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-[var(--color-text-primary)] bg-[var(--color-surface-raised)] border border-[var(--color-border)] rounded-xl hover:bg-[var(--color-interactive)] hover:text-white hover:border-[var(--color-interactive)] transition-colors"
    >
      <svg width="14" height="14" viewBox="0 0 16 16" fill="none" className="shrink-0">
        <path d="M10 12L6 8l4-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      {label}
    </Link>
  )
}

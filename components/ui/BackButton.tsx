import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'

interface BackButtonProps {
  href: string
  label?: string
}

/**
 * Standard back-navigation button used across all pages.
 * Pill shape with border, arrow icon, hover fill.
 * 44x44 minimum tap target for accessibility.
 */
export function BackButton({ href, label = 'Back' }: BackButtonProps) {
  return (
    <Link
      href={href}
      className="inline-flex items-center justify-center gap-1.5 min-w-[44px] min-h-[44px] px-3 py-2 text-sm font-medium text-[var(--color-text-primary)] bg-[var(--color-surface-raised)] border border-[var(--color-border)] rounded-xl hover:bg-[var(--color-interactive)] hover:text-white hover:border-[var(--color-interactive)] transition-colors"
    >
      <ChevronLeft size={18} className="shrink-0" />
      {label}
    </Link>
  )
}

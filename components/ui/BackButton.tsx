import Link from 'next/link'

interface BackButtonProps {
  href: string
  label?: string
}

/**
 * Standard back-navigation button used across all pages.
 * Consistent styling: teal interactive text, hover underline, ← arrow prefix.
 */
export function BackButton({ href, label = 'Back' }: BackButtonProps) {
  return (
    <Link
      href={href}
      className="text-sm text-[var(--color-interactive)] hover:underline"
    >
      ← {label}
    </Link>
  )
}

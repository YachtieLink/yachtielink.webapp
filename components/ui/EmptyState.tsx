import Link from 'next/link'

import { Button } from '@/components/ui/Button'
import type { SectionColor } from '@/lib/section-colors'

interface EmptyStateProps {
  /** Emoji or React node displayed above the title */
  icon?: React.ReactNode
  /** Primary message */
  title: string
  /** Optional secondary description */
  description?: string
  /** CTA button label */
  actionLabel?: string
  /** CTA link destination */
  actionHref?: string
  /**
   * 'card' — renders its own rounded card wrapper (for standalone use)
   * 'inline' — renders just the text content (for use inside an existing card)
   */
  variant?: 'card' | 'inline'
  /** Optional section accent color for the icon tint */
  accentColor?: SectionColor
}

export function EmptyState({
  icon,
  title,
  description,
  actionLabel,
  actionHref,
  variant = 'card',
  accentColor,
}: EmptyStateProps) {
  const content = (
    <>
      {icon && <div className="text-2xl mb-3">{icon}</div>}
      <p className="text-sm font-medium text-[var(--color-text-primary)]">{title}</p>
      {description && (
        <p className="text-xs text-[var(--color-text-secondary)] mt-1">{description}</p>
      )}
      {actionLabel && actionHref && (
        <Link href={actionHref} className="inline-block mt-3">
          <Button variant="outline" size="sm">{actionLabel}</Button>
        </Link>
      )}
    </>
  )

  if (variant === 'inline') {
    return <div className="text-center py-2">{content}</div>
  }

  return (
    <div className="bg-[var(--color-surface-raised)] border border-[var(--color-border)] rounded-2xl p-6 text-center">
      {content}
    </div>
  )
}

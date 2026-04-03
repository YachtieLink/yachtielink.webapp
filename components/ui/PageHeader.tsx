'use client'

import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'
import { type SectionColor, sectionClassMap, sectionColors } from '@/lib/section-colors'

interface PageHeaderProps {
  /** Link destination for the back button */
  backHref?: string
  /** Callback for back button (multi-step flows) — takes precedence over backHref */
  onBack?: () => void
  /** Label shown next to the back chevron (e.g. "Profile", "Network"). Auto-derived from backHref if omitted. */
  backLabel?: string
  title: string
  subtitle?: string
  actions?: React.ReactNode
  count?: number
  /** Section color for the sticky bar's bottom border. Auto-derived from backHref path if omitted. */
  sectionColor?: SectionColor
}

/** Nav-tab-level colors — only the 5 top-level tabs.
 *  Sub-pages fall through to the canonical sectionColors map in lib/section-colors.ts. */
const navTabColors: Record<string, SectionColor> = {
  profile: 'teal',
  network: 'navy',
  cv: 'amber',
  insights: 'coral',
  more: 'sand',
}

const pathToLabel: Record<string, string> = {
  profile: 'Profile',
  network: 'Network',
  cv: 'CV',
  insights: 'Insights',
  more: 'Settings',
  yacht: 'Yacht',
}

function deriveFromPath(path?: string): { color: SectionColor; label: string } {
  if (!path) return { color: 'teal', label: 'Back' }
  const segment = path.replace(/^\/app\//, '').split('/')[0]
  return {
    color: navTabColors[segment] ?? sectionColors[segment] ?? 'teal',
    label: pathToLabel[segment] ?? 'Back',
  }
}

export function PageHeader({
  backHref,
  onBack,
  backLabel,
  title,
  subtitle,
  actions,
  count,
  sectionColor,
}: PageHeaderProps) {
  const derived = deriveFromPath(backHref)
  const color = sectionColor ?? derived.color
  const label = backLabel ?? derived.label
  const classes = sectionClassMap[color]

  const backContent = (
    <>
      <ChevronLeft size={18} className="shrink-0" />
      <span className="text-sm">{label}</span>
    </>
  )

  const backClasses =
    'flex items-center gap-1 min-h-[44px] text-[var(--color-text-primary)] hover:text-[var(--color-text-secondary)] transition-colors'

  return (
    <>
      {/* Sticky back bar — navigation only */}
      <div
        className={`sticky top-0 z-10 -mx-4 px-4 md:-mx-6 md:px-6 bg-[var(--color-surface)] border-b-2 ${classes.border}`}
      >
        {onBack ? (
          <button type="button" onClick={onBack} className={backClasses}>
            {backContent}
          </button>
        ) : backHref ? (
          <Link href={backHref} className={backClasses}>
            {backContent}
          </Link>
        ) : null}
      </div>

      {/* Title row — scrolls with content */}
      <div className="pt-4 mb-4">
        <div className="flex items-center gap-2">
          <h1 className="text-xl font-serif tracking-tight text-[var(--color-text-primary)]">
            {title}
          </h1>
          {count !== undefined && count > 0 && (
            <span className="text-sm text-[var(--color-text-secondary)]">({count})</span>
          )}
          {actions && <div className="ml-auto">{actions}</div>}
        </div>
        {subtitle && (
          <p className="text-sm text-[var(--color-text-secondary)] mt-1">{subtitle}</p>
        )}
      </div>
    </>
  )
}

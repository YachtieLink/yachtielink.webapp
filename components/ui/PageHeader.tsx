import { BackButton } from './BackButton'

interface PageHeaderProps {
  backHref: string
  backLabel?: string
  title: string
  subtitle?: string
  actions?: React.ReactNode
  count?: number
}

export function PageHeader({ backHref, backLabel, title, subtitle, actions, count }: PageHeaderProps) {
  return (
    <div className="flex items-start gap-3 pt-2 mb-6">
      <BackButton href={backHref} label={backLabel} />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <h1 className="text-xl font-serif tracking-tight text-[var(--color-text-primary)]">
            {title}
          </h1>
          {count !== undefined && (
            <span className="text-sm text-[var(--color-text-secondary)]">({count})</span>
          )}
          {actions && <div className="ml-auto">{actions}</div>}
        </div>
        {subtitle && (
          <p className="text-sm text-[var(--color-text-secondary)] mt-1">{subtitle}</p>
        )}
      </div>
    </div>
  )
}

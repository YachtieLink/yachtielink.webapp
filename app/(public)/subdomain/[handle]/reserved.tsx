const PRO_BENEFITS = [
  { label: 'Custom subdomain', detail: 'yourname.yachtie.link' },
  { label: 'Profile analytics', detail: 'See who viewed your profile' },
  { label: 'Cert expiry reminders', detail: 'Never miss a renewal' },
  { label: 'Pro CV templates', detail: 'Stand out on paper' },
  { label: 'Extended photo & gallery limits', detail: 'Show your work' },
]

interface ReservedPageProps {
  handle: string
  hasUser: boolean
}

export function ReservedPage({ handle, hasUser }: ReservedPageProps) {
  return (
    <div className="min-h-screen bg-gradient-to-b from-[var(--color-teal-50)] to-white flex flex-col items-center justify-center px-6 py-16">
      <div className="w-full max-w-md flex flex-col items-center gap-8 text-center">
        {/* Logo */}
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-[var(--color-teal-700)] flex items-center justify-center">
            <span className="text-sm font-bold text-white tracking-tight">YL</span>
          </div>
          <span className="text-lg font-semibold text-[var(--color-text-primary)]">YachtieLink</span>
        </div>

        {/* Heading */}
        <div className="flex flex-col gap-2">
          <h1 className="text-2xl font-bold text-[var(--color-text-primary)]">
            This page is reserved
          </h1>
          <p className="text-sm text-[var(--color-text-secondary)]">
            <span className="font-medium text-[var(--color-interactive)]">{handle}.yachtie.link</span>
            {hasUser
              ? ' is claimed by a YachtieLink member.'
              : ' could be yours on YachtieLink.'}
          </p>
        </div>

        {/* Pro benefits */}
        <div className="w-full bg-[var(--color-surface)] rounded-2xl p-5 flex flex-col gap-3">
          <p className="text-sm font-semibold text-[var(--color-text-primary)]">
            Unlock with Pro
          </p>
          <ul className="flex flex-col gap-2.5">
            {PRO_BENEFITS.map((b) => (
              <li key={b.label} className="flex items-start gap-3 text-left">
                <span className="shrink-0 mt-0.5 w-5 h-5 rounded-full bg-[var(--color-teal-100)] text-[var(--color-teal-700)] flex items-center justify-center text-xs font-bold">
                  ✓
                </span>
                <div>
                  <p className="text-sm font-medium text-[var(--color-text-primary)]">{b.label}</p>
                  <p className="text-xs text-[var(--color-text-secondary)]">{b.detail}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>

        {/* CTAs */}
        <div className="w-full flex flex-col gap-3">
          <a
            href="https://yachtie.link/signup?returnTo=/app/settings/plan"
            className="w-full py-3 rounded-xl bg-[var(--color-interactive)] text-white text-sm font-semibold text-center hover:bg-[var(--color-interactive-hover)] transition-colors"
          >
            Activate with Pro
          </a>
          {hasUser && (
            <a
              href={`https://yachtie.link/u/${handle}`}
              className="w-full py-3 rounded-xl bg-[var(--color-surface-raised)] text-[var(--color-text-primary)] text-sm font-medium text-center hover:bg-[var(--color-text-secondary)]/10 transition-colors"
            >
              View their profile
            </a>
          )}
        </div>
      </div>
    </div>
  )
}

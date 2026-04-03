import Link from 'next/link'
import { getSectionTokens } from '@/lib/section-colors'

export interface ProUpsellCardProps {
  variant: 'inline' | 'banner' | 'card'
  /** Short phrase describing the unlocked feature, e.g. "15 gallery photos", "premium CV templates" */
  feature: string
  /** Optional supporting copy shown below the headline in banner/card variants */
  description?: string
  context?: 'insights' | 'photos' | 'network' | 'profile' | 'cv' | 'certs'
}

const CONTEXT_SECTION_KEY: Record<string, string> = {
  insights: 'insights',
  photos: 'gallery',
  network: 'network',
  profile: 'profile',
  cv: 'cv',
  certs: 'certifications',
}

/**
 * Standard Pro upsell CTA.
 *
 * Copy formula: "{Benefit} with Crew Pro" — never "Go Pro" or "Get Pro".
 * All variants link to /app/settings/plan.
 *
 * - inline: single-line text link, drops into any paragraph or compact row
 * - banner: full-width card with benefit headline + CTA button
 * - card: compact card for use in page content areas
 */
export function ProUpsellCard({
  variant,
  feature,
  description,
  context = 'profile',
}: ProUpsellCardProps) {
  const sectionKey = CONTEXT_SECTION_KEY[context] ?? 'profile'
  const tokens = getSectionTokens(sectionKey)

  if (variant === 'inline') {
    return (
      <p className="text-xs text-[var(--color-text-secondary)]">
        Unlock {feature} with{' '}
        <Link
          href="/app/settings/plan"
          className="font-semibold hover:underline"
          style={{ color: tokens.text700 }}
        >
          Crew Pro →
        </Link>
      </p>
    )
  }

  return (
    <div
      className="rounded-2xl border p-4 flex flex-col gap-3"
      style={{
        background: tokens.bg50,
        borderColor: tokens.bg200,
      }}
    >
      <div className={variant === 'card' ? 'text-center' : undefined}>
        <p className="text-sm font-semibold text-[var(--color-text-primary)]">
          Unlock {feature} with Crew Pro
        </p>
        {description && (
          <p className="text-xs text-[var(--color-text-secondary)] mt-1">
            {description}
          </p>
        )}
      </div>

      <Link
        href="/app/settings/plan"
        className={`inline-flex items-center justify-center rounded-xl bg-[var(--color-teal-700)] text-white text-sm font-semibold px-4 py-2.5 hover:bg-[var(--color-teal-800)] transition-colors${variant === 'card' ? ' w-full' : ''}`}
      >
        Upgrade to Crew Pro
      </Link>
    </div>
  )
}

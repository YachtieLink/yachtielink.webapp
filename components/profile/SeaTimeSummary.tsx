import Link from 'next/link'
import { formatSeaTime } from '@/lib/sea-time'

interface SeaTimeSummaryProps {
  totalDays: number
  yachtCount: number
}

export function SeaTimeSummary({ totalDays, yachtCount }: SeaTimeSummaryProps) {
  if (totalDays <= 0) return null

  const formatted = formatSeaTime(totalDays)

  return (
    <div className="bg-[var(--color-surface-raised)] rounded-2xl p-5">
      <div className="flex items-start justify-between">
        <div>
          <h3 className="text-sm font-semibold text-[var(--color-text-primary)] mb-1">⚓ Sea Time</h3>
          <p className="text-lg font-bold text-[var(--color-text-primary)]">
            {formatted.displayLong} at sea
          </p>
          <p className="text-sm text-[var(--color-text-secondary)]">
            across {yachtCount} {yachtCount === 1 ? 'yacht' : 'yachts'}
          </p>
        </div>
        <Link
          href="/app/profile/sea-time"
          className="text-sm text-[var(--color-interactive)] hover:underline shrink-0 mt-1"
        >
          View ▸
        </Link>
      </div>
    </div>
  )
}

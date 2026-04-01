import Link from 'next/link'
import { formatSeaTime } from '@/lib/sea-time'
import { prefixedYachtName } from '@/lib/yacht-prefix'

interface SeaTimeEntry {
  yacht_id: string
  yacht_name: string
  role_label: string
  started_at: string
  ended_at: string | null
  days: number
  is_current: boolean
}

interface SeaTimeBreakdownProps {
  entries: SeaTimeEntry[]
  totalDays: number
  yachtTypeMap?: Map<string, string | null>
}

export function SeaTimeBreakdown({ entries, totalDays, yachtTypeMap }: SeaTimeBreakdownProps) {
  const total = formatSeaTime(totalDays)

  return (
    <div>
      <p className="text-lg font-bold text-[var(--color-text-primary)] mb-4">
        Total: {total.displayFull}
      </p>

      <div className="divide-y divide-[var(--color-border)] rounded-2xl bg-[var(--color-surface-raised)] overflow-hidden">
        {entries.map((entry, i) => {
          const entryFormatted = formatSeaTime(entry.days)
          const start = new Date(entry.started_at).toLocaleDateString('en-GB', { month: 'short', year: 'numeric' })
          const end = entry.ended_at
            ? new Date(entry.ended_at).toLocaleDateString('en-GB', { month: 'short', year: 'numeric' })
            : 'Present'

          return (
            <div key={`${entry.yacht_id}-${i}`} className="p-4">
              <div className="flex items-start justify-between mb-1">
                <Link
                  href={`/app/yacht/${entry.yacht_id}`}
                  className="text-sm font-semibold text-[var(--color-text-primary)] hover:text-[var(--color-interactive)] transition-colors"
                >
                  {prefixedYachtName(entry.yacht_name, yachtTypeMap?.get(entry.yacht_id))}
                </Link>
                {entry.is_current && (
                  <span className="text-xs bg-[var(--color-interactive)]/10 text-[var(--color-interactive)] px-2 py-0.5 rounded-full font-medium shrink-0 ml-2">
                    Current
                  </span>
                )}
              </div>
              <p className="text-xs text-[var(--color-text-secondary)]">
                {entry.role_label} · {start} – {end}
              </p>
              <p className="text-xs text-[var(--color-text-secondary)] mt-0.5">
                {entryFormatted.displayLong} ({entry.days.toLocaleString()} days)
              </p>
            </div>
          )
        })}
      </div>
    </div>
  )
}

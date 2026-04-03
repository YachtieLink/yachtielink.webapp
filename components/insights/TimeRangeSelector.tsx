'use client'

import Link from 'next/link'

interface TimeRangeSelectorProps {
  currentRange: string
}

const ranges = [
  { value: '7', label: '7d' },
  { value: '30', label: '30d' },
  { value: 'all', label: 'All time' },
] as const

export function TimeRangeSelector({ currentRange }: TimeRangeSelectorProps) {
  return (
    <div className="flex bg-[var(--color-surface-raised)] rounded-xl p-1">
      {ranges.map((r) => (
        <Link
          key={r.value}
          href={`/app/insights?range=${r.value}`}
          className={`flex-1 text-center py-2 rounded-lg text-sm font-medium transition-colors ${
            currentRange === r.value
              ? 'bg-[var(--color-surface)] text-[var(--color-text-primary)] shadow-sm'
              : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]'
          }`}
        >
          {r.label}
        </Link>
      ))}
    </div>
  )
}

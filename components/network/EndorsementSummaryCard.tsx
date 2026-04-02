'use client'

interface EndorsementSummaryCardProps {
  received: number
  given: number
  pending: number
}

export function EndorsementSummaryCard({ received, given, pending }: EndorsementSummaryCardProps) {
  if (received === 0 && given === 0 && pending === 0) return null

  return (
    <div className="card-soft rounded-2xl p-4 flex items-center gap-4">
      <div className="flex items-center gap-1.5 text-[var(--color-navy-700)]">
        <span className="text-lg">⚓</span>
        <span className="text-sm font-semibold">{received}</span>
        <span className="text-xs text-[var(--color-text-secondary)]">received</span>
      </div>
      <span className="text-[var(--color-border)]">·</span>
      <div className="flex items-center gap-1.5">
        <span className="text-sm font-semibold text-[var(--color-text-primary)]">{given}</span>
        <span className="text-xs text-[var(--color-text-secondary)]">given</span>
      </div>
      {pending > 0 && (
        <>
          <span className="text-[var(--color-border)]">·</span>
          <div className="flex items-center gap-1.5">
            <span className="text-sm font-semibold text-[var(--color-text-primary)]">{pending}</span>
            <span className="text-xs text-[var(--color-text-secondary)]">pending</span>
          </div>
        </>
      )}
    </div>
  )
}

export default function InsightsLoading() {
  return (
    <div className="flex flex-col gap-4 pb-24 -mx-4 px-4 md:-mx-6 md:px-6 bg-[var(--color-coral-50)]">
      {/* Page title */}
      <div className="flex items-center justify-between pt-2">
        <div className="animate-pulse h-8 w-44 rounded-lg bg-[var(--color-coral-200)]" />
      </div>

      {/* Time range selector skeleton */}
      <div className="flex gap-2">
        {[1, 2, 3].map((i) => (
          <div key={i} className="animate-pulse h-8 flex-1 rounded-full bg-[var(--color-coral-100)]" />
        ))}
      </div>

      {/* Career snapshot stat cards skeleton (3 equal cards) */}
      <div className="flex gap-2">
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex-1 rounded-2xl bg-[var(--color-coral-100)] px-3 pt-2.5 pb-3 flex flex-col items-center gap-2">
            <div className="animate-pulse h-2 w-12 rounded bg-[var(--color-coral-200)]" />
            <div className="animate-pulse h-6 w-10 rounded bg-[var(--color-coral-200)]" />
          </div>
        ))}
      </div>

      {/* Profile strength card skeleton */}
      <div className="bg-[var(--color-surface)] rounded-2xl p-4 flex items-center gap-3">
        <div className="animate-pulse w-12 h-12 rounded-full bg-[var(--color-coral-200)] shrink-0" />
        <div className="flex flex-col gap-1.5 flex-1">
          <div className="animate-pulse h-4 w-32 rounded bg-[var(--color-coral-200)]" />
          <div className="animate-pulse h-3 w-24 rounded bg-[var(--color-coral-100)]" />
        </div>
      </div>

      {/* Metric cards grid skeleton (2x2) */}
      <div className="grid grid-cols-2 gap-3">
        <div className="col-span-2 bg-[var(--color-surface)] rounded-2xl p-4 flex flex-col gap-2">
          <div className="animate-pulse h-4 w-28 rounded bg-[var(--color-coral-200)]" />
          <div className="animate-pulse h-8 w-16 rounded bg-[var(--color-coral-200)]" />
          <div className="animate-pulse h-10 w-full rounded bg-[var(--color-coral-100)]" />
        </div>
        {[1, 2].map((i) => (
          <div key={i} className="bg-[var(--color-surface)] rounded-2xl p-4 flex flex-col gap-2">
            <div className="animate-pulse h-3 w-20 rounded bg-[var(--color-coral-200)]" />
            <div className="animate-pulse h-7 w-12 rounded bg-[var(--color-coral-200)]" />
          </div>
        ))}
      </div>
    </div>
  )
}

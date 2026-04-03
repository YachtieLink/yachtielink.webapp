export default function NetworkLoading() {
  return (
    <div className="flex flex-col gap-3 pb-24 -mx-4 px-4 md:-mx-6 md:px-6 bg-[var(--color-navy-50)]">
      {/* Page title */}
      <div className="pt-4 px-1">
        <div className="animate-pulse h-8 w-36 rounded-lg bg-[var(--color-navy-200)]" />
      </div>

      {/* Endorsement CTA card skeleton */}
      <div className="bg-[var(--color-surface)] rounded-2xl p-4 flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <div className="animate-pulse h-4 w-32 rounded bg-[var(--color-navy-200)]" />
          <div className="animate-pulse h-4 w-10 rounded bg-[var(--color-navy-200)]" />
        </div>
        <div className="animate-pulse h-3 w-48 rounded bg-[var(--color-navy-100)]" />
        <div className="animate-pulse h-9 w-40 rounded-xl mt-1 bg-[var(--color-navy-200)]" />
      </div>

      {/* Endorsement summary card skeleton */}
      <div className="bg-[var(--color-surface)] rounded-2xl p-4">
        <div className="flex items-center gap-3">
          <div className="animate-pulse h-5 w-5 rounded bg-[var(--color-navy-200)]" />
          <div className="animate-pulse h-4 w-40 rounded bg-[var(--color-navy-200)]" />
        </div>
      </div>

      {/* Yacht accordion rows skeleton */}
      {[1, 2, 3].map((i) => (
        <div key={i} className="bg-[var(--color-surface)] rounded-2xl overflow-hidden">
          <div className="flex items-center gap-3 p-4">
            <div className="animate-pulse w-12 h-12 rounded-xl bg-[var(--color-navy-200)] shrink-0" />
            <div className="flex-1 flex flex-col gap-1.5">
              <div className="animate-pulse h-4 w-28 rounded bg-[var(--color-navy-200)]" />
              <div className="animate-pulse h-3 w-40 rounded bg-[var(--color-navy-100)]" />
            </div>
            <div className="animate-pulse w-4 h-4 rounded bg-[var(--color-navy-100)]" />
          </div>
        </div>
      ))}

      {/* Yacht search skeleton */}
      <div className="bg-[var(--color-surface)] rounded-2xl p-4">
        <div className="animate-pulse h-10 w-full rounded-xl bg-[var(--color-navy-100)]" />
      </div>
    </div>
  )
}

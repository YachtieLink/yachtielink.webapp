export default function RequestEndorsementLoading() {
  return (
    <div className="min-h-screen bg-[var(--color-navy-50)] pb-24 -mx-4 px-4 md:-mx-6 md:px-6">
      {/* PageHeader back nav skeleton */}
      <div className="sticky top-0 z-10 -mx-4 px-4 md:-mx-6 md:px-6 bg-[var(--color-surface)] border-b-2 border-[var(--color-navy-500)] mb-4">
        <div className="flex items-center gap-1 py-3">
          <div className="animate-pulse w-4 h-4 rounded bg-[var(--color-navy-200)]" />
          <div className="animate-pulse h-4 w-20 rounded bg-[var(--color-navy-200)]" />
        </div>
      </div>

      {/* Page title */}
      <div className="animate-pulse h-6 w-48 rounded-lg bg-[var(--color-navy-200)] mb-6" />

      {/* Your Colleagues section header */}
      <div className="animate-pulse h-3 w-32 rounded bg-[var(--color-navy-200)] mb-3" />

      {/* Yacht accordion rows */}
      <div className="flex flex-col gap-2">
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-[var(--color-surface)] rounded-2xl overflow-hidden">
            <div className="flex items-center gap-3 p-4">
              <div className="animate-pulse w-12 h-12 rounded-xl bg-[var(--color-navy-200)] shrink-0" />
              <div className="flex-1 flex flex-col gap-1.5">
                <div className="animate-pulse h-4 w-32 rounded bg-[var(--color-navy-200)]" />
                <div className="animate-pulse h-3 w-44 rounded bg-[var(--color-navy-100)]" />
              </div>
              <div className="animate-pulse w-4 h-4 rounded bg-[var(--color-navy-100)]" />
            </div>
          </div>
        ))}
      </div>

      {/* Invite section skeleton */}
      <div className="mt-6">
        <div className="animate-pulse h-3 w-24 rounded bg-[var(--color-navy-200)] mb-3" />
        <div className="bg-[var(--color-surface)] rounded-2xl p-4 flex flex-col gap-2">
          <div className="animate-pulse h-4 w-40 rounded bg-[var(--color-navy-200)]" />
          <div className="animate-pulse h-3 w-56 rounded bg-[var(--color-navy-100)]" />
          <div className="animate-pulse h-9 w-36 rounded-xl bg-[var(--color-navy-200)]" />
        </div>
      </div>
    </div>
  )
}

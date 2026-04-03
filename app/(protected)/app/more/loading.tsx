export default function MoreLoading() {
  return (
    <div className="flex flex-col pb-24 -mx-4 px-4 md:-mx-6 md:px-6 bg-[var(--color-sand-100)]">
      {/* Page title */}
      <div className="animate-pulse h-8 w-28 rounded-lg bg-[var(--color-sand-300)] mx-1 mt-2 mb-1" />

      {/* Account section */}
      <div className="animate-pulse h-3 w-20 rounded bg-[var(--color-sand-300)] mx-1 mt-5 mb-2" />
      <div className="bg-[var(--color-surface)] rounded-2xl overflow-hidden divide-y divide-[var(--color-border)]">
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex items-center gap-3 px-4 py-3.5">
            <div className="animate-pulse w-4 h-4 rounded bg-[var(--color-sand-300)] shrink-0" />
            <div className="flex flex-col gap-1">
              <div className="animate-pulse h-4 w-36 rounded bg-[var(--color-sand-300)]" />
              <div className="animate-pulse h-3 w-48 rounded bg-[var(--color-sand-200)]" />
            </div>
          </div>
        ))}
      </div>

      {/* Plan section */}
      <div className="animate-pulse h-3 w-10 rounded bg-[var(--color-sand-300)] mx-1 mt-5 mb-2" />
      <div className="bg-[var(--color-surface)] rounded-2xl overflow-hidden">
        <div className="flex items-center gap-3 px-4 py-3.5">
          <div className="animate-pulse w-4 h-4 rounded bg-[var(--color-sand-300)] shrink-0" />
          <div className="flex flex-col gap-1">
            <div className="animate-pulse h-4 w-40 rounded bg-[var(--color-sand-300)]" />
            <div className="animate-pulse h-3 w-32 rounded bg-[var(--color-sand-200)]" />
          </div>
        </div>
      </div>

      {/* App section */}
      <div className="animate-pulse h-3 w-8 rounded bg-[var(--color-sand-300)] mx-1 mt-5 mb-2" />
      <div className="bg-[var(--color-surface)] rounded-2xl overflow-hidden divide-y divide-[var(--color-border)]">
        {[1, 2].map((i) => (
          <div key={i} className="flex items-center gap-3 px-4 py-3.5">
            <div className="animate-pulse w-4 h-4 rounded bg-[var(--color-sand-300)] shrink-0" />
            <div className="flex flex-col gap-1">
              <div className="animate-pulse h-4 w-28 rounded bg-[var(--color-sand-300)]" />
              <div className="animate-pulse h-3 w-36 rounded bg-[var(--color-sand-200)]" />
            </div>
          </div>
        ))}
      </div>

      {/* Community section */}
      <div className="animate-pulse h-3 w-20 rounded bg-[var(--color-sand-300)] mx-1 mt-5 mb-2" />
      <div className="bg-[var(--color-surface)] rounded-2xl overflow-hidden divide-y divide-[var(--color-border)]">
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex items-center gap-3 px-4 py-3.5">
            <div className="animate-pulse w-4 h-4 rounded bg-[var(--color-sand-300)] shrink-0" />
            <div className="flex flex-col gap-1">
              <div className="animate-pulse h-4 w-44 rounded bg-[var(--color-sand-300)]" />
              <div className="animate-pulse h-3 w-52 rounded bg-[var(--color-sand-200)]" />
            </div>
          </div>
        ))}
      </div>

      {/* Legal section */}
      <div className="animate-pulse h-3 w-12 rounded bg-[var(--color-sand-300)] mx-1 mt-5 mb-2" />
      <div className="bg-[var(--color-surface)] rounded-2xl overflow-hidden divide-y divide-[var(--color-border)]">
        {[1, 2].map((i) => (
          <div key={i} className="flex items-center gap-3 px-4 py-3.5">
            <div className="animate-pulse w-4 h-4 rounded bg-[var(--color-sand-300)] shrink-0" />
            <div className="animate-pulse h-4 w-32 rounded bg-[var(--color-sand-300)]" />
          </div>
        ))}
      </div>
    </div>
  )
}

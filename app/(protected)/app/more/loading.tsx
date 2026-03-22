import { Skeleton } from '@/components/ui/skeleton'

export default function MoreLoading() {
  return (
    <div className="flex flex-col pb-24">
      {/* Appearance section */}
      <Skeleton className="h-3 w-24 mx-1 mt-4 mb-1" />
      <div className="bg-[var(--color-surface)] rounded-2xl p-5">
        <Skeleton className="h-4 w-16 mb-3" />
        <div className="flex gap-2">
          <Skeleton className="h-9 flex-1 rounded-lg" />
          <Skeleton className="h-9 flex-1 rounded-lg" />
          <Skeleton className="h-9 flex-1 rounded-lg" />
        </div>
      </div>

      {/* Account section */}
      <Skeleton className="h-3 w-20 mx-1 mt-4 mb-1" />
      <div className="bg-[var(--color-surface)] rounded-2xl overflow-hidden">
        {[1, 2].map((i) => (
          <div key={i} className="px-5 py-4 flex items-center justify-between">
            <div className="space-y-1.5">
              <Skeleton className="h-4 w-40" />
              <Skeleton className="h-3 w-56" />
            </div>
          </div>
        ))}
      </div>

      {/* Privacy section */}
      <Skeleton className="h-3 w-16 mx-1 mt-4 mb-1" />
      <div className="bg-[var(--color-surface)] rounded-2xl overflow-hidden">
        {[1, 2, 3].map((i) => (
          <div key={i} className="px-5 py-4 flex items-center justify-between">
            <div className="space-y-1.5">
              <Skeleton className="h-4 w-36" />
              <Skeleton className="h-3 w-52" />
            </div>
          </div>
        ))}
      </div>

      {/* Billing section */}
      <Skeleton className="h-3 w-14 mx-1 mt-4 mb-1" />
      <div className="bg-[var(--color-surface)] rounded-2xl overflow-hidden">
        <div className="px-5 py-4">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-3 w-24 mt-1.5" />
        </div>
      </div>

      {/* Help section */}
      <Skeleton className="h-3 w-10 mx-1 mt-4 mb-1" />
      <div className="bg-[var(--color-surface)] rounded-2xl overflow-hidden">
        <div className="px-5 py-4">
          <Skeleton className="h-4 w-28" />
          <Skeleton className="h-3 w-36 mt-1.5" />
        </div>
      </div>

      {/* Legal section */}
      <Skeleton className="h-3 w-12 mx-1 mt-4 mb-1" />
      <div className="bg-[var(--color-surface)] rounded-2xl overflow-hidden">
        {[1, 2].map((i) => (
          <div key={i} className="px-5 py-4">
            <Skeleton className="h-4 w-32" />
          </div>
        ))}
      </div>

      {/* Sign out */}
      <Skeleton className="h-3 w-12 mx-1 mt-4 mb-1" />
      <div className="bg-[var(--color-surface)] rounded-2xl overflow-hidden">
        <div className="px-5 py-4">
          <Skeleton className="h-4 w-16" />
        </div>
      </div>
    </div>
  )
}

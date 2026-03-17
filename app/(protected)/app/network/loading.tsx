import { Skeleton } from '@/components/ui/skeleton'

export default function NetworkLoading() {
  return (
    <div className="min-h-screen bg-[var(--color-surface)] px-4 pt-8 pb-24">
      {/* Request endorsements CTA skeleton */}
      <div className="bg-[var(--color-surface)] rounded-2xl p-4 mb-6 space-y-2">
        <Skeleton className="h-4 w-40" />
        <Skeleton className="h-3 w-64" />
      </div>
      {/* Tab bar skeleton */}
      <div className="flex gap-2 mb-6">
        <Skeleton className="h-9 flex-1 rounded-lg" />
        <Skeleton className="h-9 flex-1 rounded-lg" />
        <Skeleton className="h-9 flex-1 rounded-lg" />
      </div>
      {/* List rows skeleton */}
      {[1, 2, 3, 4, 5].map((i) => (
        <div key={i} className="flex items-center gap-3 py-3">
          <Skeleton className="h-10 w-10 rounded-full shrink-0" />
          <div className="flex-1 space-y-1.5">
            <Skeleton className="h-4 w-1/3" />
            <Skeleton className="h-3 w-1/2" />
          </div>
        </div>
      ))}
    </div>
  )
}

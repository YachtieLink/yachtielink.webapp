import { Skeleton } from '@/components/ui/skeleton'

export default function CvLoading() {
  return (
    <div className="flex flex-col gap-4 pb-24">
      {/* CvActions skeleton */}
      <div className="bg-[var(--color-surface)] rounded-2xl p-5 space-y-3">
        <Skeleton className="h-5 w-32" />
        <div className="flex gap-2">
          <Skeleton className="h-10 flex-1 rounded-xl" />
          <Skeleton className="h-10 flex-1 rounded-xl" />
        </div>
      </div>
      {/* Public profile preview skeleton */}
      <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-raised)] p-4 space-y-4">
        <Skeleton className="h-3 w-36" />
        <div className="flex items-center gap-3">
          <Skeleton className="h-16 w-16 rounded-full" />
          <div className="space-y-2 flex-1">
            <Skeleton className="h-5 w-1/2" />
            <Skeleton className="h-3 w-1/3" />
          </div>
        </div>
        <Skeleton className="h-3 w-full" />
        <Skeleton className="h-3 w-5/6" />
        <Skeleton className="h-3 w-4/6" />
      </div>
    </div>
  )
}

import { Skeleton } from '@/components/ui/skeleton'

export default function CertsLoading() {
  return (
    <div className="flex flex-col gap-4 pb-24">
      {/* Header skeleton */}
      <Skeleton className="h-7 w-40" />
      {/* Cert card skeletons */}
      {[1, 2, 3].map((i) => (
        <div key={i} className="bg-[var(--color-surface)] rounded-2xl p-5 space-y-3">
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-3 w-1/2" />
          <Skeleton className="h-3 w-1/3" />
        </div>
      ))}
    </div>
  )
}

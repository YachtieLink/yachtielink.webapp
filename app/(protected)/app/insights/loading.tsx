import { Skeleton } from '@/components/ui/skeleton'

export default function InsightsLoading() {
  return (
    <div className="flex flex-col gap-4 pb-24">
      {/* Header row */}
      <div className="flex items-center justify-between">
        <Skeleton className="h-7 w-24" />
      </div>
      {/* Teaser/analytics cards */}
      {[1, 2, 3, 4, 5].map((i) => (
        <div key={i} className="bg-[var(--color-surface)] rounded-2xl p-4 space-y-2">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-3 w-48" />
        </div>
      ))}
      {/* Upgrade CTA / plan card */}
      <div className="bg-[var(--color-surface)] rounded-2xl p-5 space-y-3">
        <Skeleton className="h-4 w-40" />
        <Skeleton className="h-3 w-56" />
        <Skeleton className="h-10 w-36 rounded-xl" />
      </div>
    </div>
  )
}

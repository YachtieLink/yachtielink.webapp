import { Skeleton } from '@/components/ui/skeleton'

export default function ProfileLoading() {
  return (
    <div className="flex flex-col gap-4 pb-24">
      {/* IdentityCard skeleton */}
      <div className="bg-[var(--color-surface)] rounded-2xl p-5 flex flex-col gap-4">
        <div className="flex items-center gap-4">
          <Skeleton className="h-[72px] w-[72px] rounded-full shrink-0" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-5 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
            <Skeleton className="h-3 w-1/3" />
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Skeleton className="h-4 flex-1" />
          <Skeleton className="h-8 w-16 rounded-lg" />
          <Skeleton className="h-8 w-14 rounded-lg" />
          <Skeleton className="h-8 w-10 rounded-lg" />
        </div>
      </div>
      {/* WheelACard skeleton */}
      <div className="bg-[var(--color-surface)] rounded-2xl p-5">
        <div className="flex items-center gap-4">
          <Skeleton className="h-16 w-16 rounded-full" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-1/2" />
            <Skeleton className="h-3 w-3/4" />
          </div>
        </div>
      </div>
      {/* Section skeletons (About, Yachts, Certs, Endorsements) */}
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="bg-[var(--color-surface)] rounded-2xl p-5 space-y-3">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-3 w-full" />
          <Skeleton className="h-3 w-5/6" />
        </div>
      ))}
    </div>
  )
}

# Spec 03 — Loading Architecture (Skeletons)

**Goal:** Add `loading.tsx` files with skeleton screens for all 5 tab routes so tab navigation shows immediate visual feedback instead of a blank screen.

---

## Files to create

- `app/(protected)/app/profile/loading.tsx`
- `app/(protected)/app/cv/loading.tsx`
- `app/(protected)/app/insights/loading.tsx`
- `app/(protected)/app/network/loading.tsx`
- `app/(protected)/app/more/loading.tsx`

## Existing component to use

- `components/ui/skeleton.tsx` — already exists, exports `Skeleton` component. Currently imported by zero files.

---

## Important: Skeleton Dimensions Must Match Real Content

Each skeleton must use the **same wrapper classes** as the real page content to prevent layout shift (CLS). If the real IdentityCard is `rounded-2xl p-5`, the skeleton must use `rounded-2xl p-5`.

---

## Step 1: Profile Loading Skeleton

**Create `app/(protected)/app/profile/loading.tsx`:**

```tsx
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
```

---

## Step 2: CV Loading Skeleton

**Create `app/(protected)/app/cv/loading.tsx`:**

```tsx
import { Skeleton } from '@/components/ui/skeleton'

export default function CvLoading() {
  return (
    <div className="flex flex-col gap-4 pb-24">
      {/* Actions card */}
      <div className="bg-[var(--color-surface)] rounded-2xl p-5 space-y-3">
        <Skeleton className="h-5 w-32" />
        <div className="flex gap-2">
          <Skeleton className="h-10 flex-1 rounded-xl" />
          <Skeleton className="h-10 flex-1 rounded-xl" />
        </div>
      </div>

      {/* Preview skeleton */}
      <div className="bg-[var(--color-surface)] rounded-2xl p-5 space-y-4">
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
```

---

## Step 3: Insights Loading Skeleton

**Create `app/(protected)/app/insights/loading.tsx`:**

```tsx
import { Skeleton } from '@/components/ui/skeleton'

export default function InsightsLoading() {
  return (
    <div className="flex flex-col gap-4 px-4 pt-6 pb-24">
      <Skeleton className="h-7 w-24" />
      <Skeleton className="h-4 w-48" />

      {/* Analytics cards */}
      {[1, 2, 3].map((i) => (
        <div key={i} className="bg-[var(--color-surface)] rounded-2xl p-5 space-y-2">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-8 w-16" />
          <Skeleton className="h-3 w-24" />
        </div>
      ))}

      {/* Chart placeholder */}
      <div className="bg-[var(--color-surface)] rounded-2xl p-5">
        <Skeleton className="h-4 w-32 mb-4" />
        <Skeleton className="h-40 w-full rounded-lg" />
      </div>
    </div>
  )
}
```

---

## Step 4: Network Loading Skeleton

**Create `app/(protected)/app/network/loading.tsx`:**

```tsx
import { Skeleton } from '@/components/ui/skeleton'

export default function NetworkLoading() {
  return (
    <div className="flex flex-col gap-4 px-4 pt-6 pb-24">
      <Skeleton className="h-7 w-24" />

      {/* Tab bar skeleton */}
      <div className="flex gap-2">
        <Skeleton className="h-9 flex-1 rounded-lg" />
        <Skeleton className="h-9 flex-1 rounded-lg" />
        <Skeleton className="h-9 flex-1 rounded-lg" />
      </div>

      {/* List items */}
      {[1, 2, 3, 4, 5].map((i) => (
        <div key={i} className="flex items-center gap-3 py-2">
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
```

---

## Step 5: More Loading Skeleton

**Create `app/(protected)/app/more/loading.tsx`:**

```tsx
import { Skeleton } from '@/components/ui/skeleton'

export default function MoreLoading() {
  return (
    <div className="flex flex-col pb-24">
      {/* Section: Appearance */}
      <Skeleton className="h-3 w-24 mx-1 mt-4 mb-1" />
      <div className="bg-[var(--color-surface)] rounded-2xl p-5">
        <Skeleton className="h-4 w-16 mb-3" />
        <div className="flex gap-2">
          <Skeleton className="h-9 flex-1 rounded-lg" />
          <Skeleton className="h-9 flex-1 rounded-lg" />
          <Skeleton className="h-9 flex-1 rounded-lg" />
        </div>
      </div>

      {/* Section: Account */}
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

      {/* Section: Privacy */}
      <Skeleton className="h-3 w-16 mx-1 mt-4 mb-1" />
      <div className="bg-[var(--color-surface)] rounded-2xl overflow-hidden">
        {[1, 2, 3].map((i) => (
          <div key={i} className="px-5 py-4">
            <Skeleton className="h-4 w-36" />
          </div>
        ))}
      </div>
    </div>
  )
}
```

---

## Verification

1. `npm run build` — no type errors
2. Navigate between tabs in the app — each tab switch should show a skeleton immediately instead of a blank screen
3. Skeletons should roughly match the shape of the real content (no large layout shifts when real content loads)

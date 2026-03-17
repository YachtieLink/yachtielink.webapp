# Spec 10 — Growth Features

**Goal:** Add high-impact growth features: founding member badge, sea time calculator, notification badges on Network tab, and availability status.

---

## Feature 1: Founding Member Badge on Public Profile

### File: `components/public/PublicProfileContent.tsx`

**Add to props interface:**
```tsx
export interface PublicProfileContentProps {
  // ... existing ...
  isFoundingMember?: boolean
  isPro?: boolean
}
```

**After the name `<h1>` (line 148), add:**
```tsx
{isFoundingMember && (
  <span className="mt-2 inline-flex items-center gap-1 rounded-full bg-amber-50 dark:bg-amber-900/20 px-2.5 py-0.5 text-xs font-semibold text-amber-700 dark:text-amber-400">
    Founding Member
  </span>
)}
```

### File: `app/(public)/u/[handle]/page.tsx`

Fetch `founding_member` and `subscription_status` for the viewed user. Add to the `getUserByHandle` select in `lib/queries/profile.ts`:

```tsx
// Add to the select string:
subscription_status, founding_member
```

**Pass to PublicProfileContent:**
```tsx
<PublicProfileContent
  ...
  isFoundingMember={user.founding_member === true}
  isPro={user.subscription_status === 'pro'}
/>
```

**Note:** This is cosmetic only — per the constitutional rule, it does not affect trust or endorsement visibility.

---

## Feature 2: Sea Time Auto-Calculator

Compute total sea time from attachment date ranges and display on the public profile.

### File: `components/public/PublicProfileContent.tsx`

**Add a helper function:**
```tsx
function computeSeaTime(attachments: Attachment[]): string | null {
  if (attachments.length === 0) return null

  let totalDays = 0
  const now = new Date()

  for (const att of attachments) {
    if (!att.started_at) continue
    const start = new Date(att.started_at)
    const end = att.ended_at ? new Date(att.ended_at) : now
    const days = Math.max(0, Math.floor((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)))
    totalDays += days
  }

  if (totalDays === 0) return null

  const years = Math.floor(totalDays / 365)
  const months = Math.floor((totalDays % 365) / 30)

  if (years > 0 && months > 0) return `${years}y ${months}m at sea`
  if (years > 0) return `${years}y at sea`
  if (months > 0) return `${months}m at sea`
  return `${totalDays}d at sea`
}
```

**In the hero section, after the role line (around line 153), add:**
```tsx
{(() => {
  const seaTime = computeSeaTime(attachments)
  return seaTime ? (
    <p className="mt-1 text-xs font-medium text-[var(--color-text-secondary)]">
      {seaTime} · {attachments.length} yacht{attachments.length !== 1 ? 's' : ''}
      {endorsements.length > 0 ? ` · ${endorsements.length} endorsement${endorsements.length !== 1 ? 's' : ''}` : ''}
    </p>
  ) : null
})()}
```

This adds a one-line stats bar: "4y 7m at sea · 5 yachts · 12 endorsements" — the instant summary captains need.

---

## Feature 3: Notification Badge on Network Tab

### File: `components/nav/BottomTabBar.tsx`

**Add a prop for badge count:**

The tab bar is a client component. To show a badge, it needs to know about pending endorsement requests. Two approaches:

**Approach A (simpler, recommended):** Fetch pending request count server-side in the app layout and pass it down via a React context or data attribute.

**Create `lib/queries/notifications.ts`:**

```tsx
import { cache } from 'react'
import { createClient } from '@/lib/supabase/server'

export const getPendingRequestCount = cache(async (userId: string, userEmail: string) => {
  const supabase = await createClient()
  const { count } = await supabase
    .from('endorsement_requests')
    .select('id', { count: 'exact', head: true })
    .or(`recipient_user_id.eq.${userId},recipient_email.eq.${userEmail}`)
    .eq('status', 'pending')
  return count ?? 0
})
```

**Update `app/(protected)/app/layout.tsx`:**

```tsx
import { getPendingRequestCount } from '@/lib/queries/notifications'

// After getting user:
const pendingCount = await getPendingRequestCount(user.id, user.email ?? '')

// Pass to BottomTabBar:
<BottomTabBar networkBadge={pendingCount} />
```

**Update `components/nav/BottomTabBar.tsx`:**

Add prop:
```tsx
interface BottomTabBarProps {
  networkBadge?: number
}

export function BottomTabBar({ networkBadge = 0 }: BottomTabBarProps) {
```

In the Network tab item, add a badge dot:
```tsx
{tab.href === '/app/network' && networkBadge > 0 && (
  <span className="absolute -top-0.5 -right-0.5 h-2 w-2 rounded-full bg-[var(--color-error)]" />
)}
```

Make the icon wrapper `relative` to position the badge:
```tsx
<span className="relative h-6 w-6">
  {isActive ? tab.activeIcon : tab.icon}
  {tab.href === '/app/network' && networkBadge > 0 && (
    <span className="absolute -top-0.5 -right-0.5 h-2 w-2 rounded-full bg-[var(--color-error)]" />
  )}
</span>
```

---

## Feature 4: Availability Status (Minimal Version)

### Database: Add column to users table

**Create migration `supabase/migrations/XXXXXX_add_availability.sql`:**

```sql
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS available_for_work boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS available_from date;
```

### File: `components/public/PublicProfileContent.tsx`

**Add to UserProfile interface:**
```tsx
interface UserProfile {
  // ... existing ...
  available_for_work?: boolean
  available_from?: string | null
}
```

**In the hero section, after the role line, add:**
```tsx
{user.available_for_work && (
  <span className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-green-50 dark:bg-green-900/20 px-3 py-1 text-xs font-medium text-green-700 dark:text-green-400">
    <span className="h-1.5 w-1.5 rounded-full bg-current animate-pulse" />
    {user.available_from
      ? `Available from ${new Date(user.available_from).toLocaleDateString('en-GB', { month: 'short', year: 'numeric' })}`
      : 'Available for work'}
  </span>
)}
```

### File: Update queries to include availability fields

In `lib/queries/profile.ts`, add `available_for_work, available_from` to both `getUserById` and `getUserByHandle` select strings.

### File: Add availability toggle to settings

**Create or update `app/(protected)/app/profile/settings/page.tsx`** (or wherever contact settings live):

Add a toggle for "Available for work" with an optional date picker for "Available from". This is a simple form that updates the `users` table.

---

## Verification

1. `npm run build` — no type errors
2. View a founding member's public profile — gold "Founding Member" badge should appear
3. View a profile with yacht history — sea time stat bar should show "Xy Xm at sea · X yachts"
4. Send an endorsement request to the dev account — Network tab should show a red dot badge
5. Set available_for_work=true for dev account — green "Available" badge on public profile

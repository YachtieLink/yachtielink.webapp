# Spec 02 — Performance: Query Parallelization & Deduplication

**Goal:** Reduce profile page load from 7 sequential Supabase round trips to 2-3 parallel batches. Extract shared query helper. Add React.cache() deduplication.

---

## Files to modify

- `app/(protected)/app/profile/page.tsx`
- `app/(protected)/app/layout.tsx`
- `app/(public)/u/[handle]/page.tsx`
- `app/(protected)/app/insights/page.tsx`

## Files to create

- `lib/queries/profile.ts` — shared getFullProfile helper

---

## Step 1: Create shared profile query helper

**Create `lib/queries/profile.ts`:**

```tsx
import { cache } from 'react'
import { createClient } from '@/lib/supabase/server'

/**
 * Fetch a user by ID with all profile sections.
 * Wrapped in React.cache() so multiple calls in the same request are deduplicated.
 */
export const getUserById = cache(async (userId: string) => {
  const supabase = await createClient()
  const { data } = await supabase
    .from('users')
    .select(`
      id, full_name, display_name, handle, bio, profile_photo_url,
      primary_role, departments, onboarding_complete,
      phone, whatsapp, email, location_country, location_city,
      show_phone, show_whatsapp, show_email, show_location,
      subscription_status, subscription_plan, subscription_ends_at,
      stripe_customer_id, founding_member, show_watermark, template_id
    `)
    .eq('id', userId)
    .single()
  return data
})

/**
 * Fetch a user by handle. Used by public profile page.
 * Wrapped in React.cache() to deduplicate generateMetadata + page function calls.
 */
export const getUserByHandle = cache(async (handle: string) => {
  const supabase = await createClient()
  const { data } = await supabase
    .from('users')
    .select(`
      id, full_name, display_name, handle, bio, profile_photo_url,
      primary_role, departments,
      phone, whatsapp, email, location_country, location_city,
      show_phone, show_whatsapp, show_email, show_location
    `)
    .eq('handle', handle.toLowerCase())
    .single()
  return data
})

/**
 * Fetch attachments, certs, and endorsements in parallel for a given user.
 */
export async function getProfileSections(userId: string) {
  const supabase = await createClient()

  const [attRes, certRes, endRes] = await Promise.all([
    supabase
      .from('attachments')
      .select(`
        id, role_label, started_at, ended_at,
        yachts ( id, name, yacht_type, length_m, flag_state )
      `)
      .eq('user_id', userId)
      .is('deleted_at', null)
      .order('started_at', { ascending: false }),

    supabase
      .from('certifications')
      .select(`
        id, custom_cert_name, issued_at, expires_at, document_url,
        certification_types ( name, short_name, category )
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false }),

    supabase
      .from('endorsements')
      .select(`
        id, content, created_at, endorser_role_label, recipient_role_label, yacht_id,
        endorser:endorser_id ( display_name, full_name, handle, profile_photo_url ),
        yachts ( name )
      `)
      .eq('recipient_id', userId)
      .is('deleted_at', null)
      .order('created_at', { ascending: false }),
  ])

  return {
    attachments: attRes.data ?? [],
    certifications: certRes.data ?? [],
    endorsements: endRes.data ?? [],
  }
}
```

---

## Step 2: Refactor Profile Page

**File:** `app/(protected)/app/profile/page.tsx`

Replace the sequential queries (lines 12-62) with the shared helper:

```tsx
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { getUserById, getProfileSections } from '@/lib/queries/profile'
import { IdentityCard } from '@/components/profile/IdentityCard'
import { WheelACard, type WheelAMilestones } from '@/components/profile/WheelACard'
import { AboutSection } from '@/components/profile/AboutSection'
import { YachtsSection } from '@/components/profile/YachtsSection'
import { CertsSection } from '@/components/profile/CertsSection'
import { EndorsementsSection } from '@/components/profile/EndorsementsSection'

export default async function ProfilePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/welcome')

  // Fetch profile + sections in parallel (profile is cached from layout)
  const [profile, sections] = await Promise.all([
    getUserById(user.id),
    getProfileSections(user.id),
  ])

  if (!profile || !profile.onboarding_complete) {
    redirect('/onboarding')
  }

  const { attachments, certifications: certs, endorsements } = sections

  // ... rest of the component stays the same from the milestones computation onward
```

**Key change:** The `getUserById(user.id)` call is deduplicated with the layout's call via `React.cache()`.

---

## Step 3: Refactor App Layout to use cached query

**File:** `app/(protected)/app/layout.tsx`

```tsx
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getUserById } from "@/lib/queries/profile";
import { BottomTabBar } from "@/components/nav/BottomTabBar";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/welcome");

  // This call is deduplicated with child page calls via React.cache()
  const profile = await getUserById(user.id);
  if (!profile?.onboarding_complete) redirect("/onboarding");

  return (
    <div className="relative flex min-h-screen flex-col bg-[var(--color-surface)]">
      <main className="flex-1 pb-tab-bar">{children}</main>
      <BottomTabBar />
    </div>
  );
}
```

---

## Step 4: Refactor Public Profile Page

**File:** `app/(public)/u/[handle]/page.tsx`

Use `getUserByHandle` (cached) to deduplicate the generateMetadata + page function queries:

```tsx
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { getUserByHandle, getProfileSections } from '@/lib/queries/profile'
import { PublicProfileContent } from '@/components/public/PublicProfileContent'

interface Props {
  params: Promise<{ handle: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { handle } = await params
  const user = await getUserByHandle(handle)  // cached!
  if (!user) return { title: 'Profile Not Found' }

  const name = user.display_name || user.full_name
  const description = user.bio || `${name} — ${user.primary_role || 'Yacht Professional'} on YachtieLink`

  return {
    title: `${name} — YachtieLink`,
    description,
    openGraph: {
      title: `${name} — ${user.primary_role || 'Yacht Professional'}`,
      description,
      images: user.profile_photo_url ? [{ url: user.profile_photo_url }] : [],
      type: 'profile',
      url: `https://yachtie.link/u/${handle}`,
    },
    twitter: {
      card: user.profile_photo_url ? 'summary_large_image' : 'summary',
      title: `${name} — YachtieLink`,
      description,
    },
  }
}

export default async function PublicProfilePage({ params }: Props) {
  const { handle } = await params
  const supabase = await createClient()

  // Phase 1: fetch user (deduplicated with generateMetadata via cache)
  const user = await getUserByHandle(handle)
  if (!user) notFound()

  // Fire-and-forget profile view
  void supabase.rpc('record_profile_event', {
    p_user_id: user.id,
    p_event_type: 'profile_view',
  }).then(() => {})

  // Phase 2: fetch sections + viewer auth in parallel
  const [sections, { data: { user: viewer } }] = await Promise.all([
    getProfileSections(user.id),
    supabase.auth.getUser(),
  ])

  // Phase 3: viewer relationship (keep existing logic but it now runs
  // after sections are already fetched, not blocking them)
  // ... existing viewer relationship code stays the same ...
```

**Key savings:**
- User query deduplicated between `generateMetadata` and page function
- Sections fetch and viewer auth now run in parallel
- Eliminates 2 unnecessary round trips

---

## Step 5: Merge Insights Page Promise.all blocks

**File:** `app/(protected)/app/insights/page.tsx`

Find the two sequential `Promise.all()` blocks and merge them into one. The first block fetches profile + pro status. The second fetches attachments + certs for milestones. These are independent.

**Current pattern:**
```tsx
const [profileRes, proStatus] = await Promise.all([...])
const [attRes, certRes] = await Promise.all([...])
```

**Change to:**
```tsx
const [profileRes, proStatus, attRes, certRes] = await Promise.all([
  // ... all four queries in one block
])
```

---

## Verification

1. `npm run build` — no type errors
2. Navigate between all 5 tabs — each should load noticeably faster
3. Public profile page: open the same profile twice — second load should be near-instant if ISR is added later
4. Check that profile data is identical before and after refactor (no missing fields)

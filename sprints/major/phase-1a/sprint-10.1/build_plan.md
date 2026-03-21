# Sprint 10.1: Close & Polish Phase 1A — Detailed Build Plan

## Context

Sprint 10 built the Phase 1A engine: profile robustness, photo galleries, saved profiles API, education, skills, hobbies, section visibility, and AI summaries. Sprint 10.1 is the full polish pass — fixing every bug, inconsistency, and gap found in the 2026-03-21 six-agent audit.

**Dependencies from Sprint 10:**
- All API routes functional and deployed on `feat/ui-refresh-phase1`
- `lib/motion.ts` presets defined (but unused)
- `lib/storage/upload.ts` covers 5 of 7 buckets (missing `user-photos`, `user-gallery`)
- DM Serif Display loaded in `layout.tsx` (but never applied)
- `globals.css` has full light/dark variable system including `--chart-*` vars

**What Sprint 10.1 delivers:**
1. Education edit page + GET-by-ID API route
2. Saved profiles promoted to dedicated page
3. Dark mode implementation across all Sprint 10 components
4. Animation pass wiring `lib/motion.ts` into the app
5. Typography pass wiring DM Serif Display
6. Route dedup, layout fixes, API hardening
7. Storage migration + abstraction completion
8. Shared EmptyState component

---

## Part 1: Wave 0 — Unblock Dependencies

These three items must land first. Everything else in the sprint depends on one or more of them.

### 1a. EmptyState Component (Section H)

**File to create:** `components/ui/EmptyState.tsx`

```tsx
import Link from 'next/link'

interface EmptyStateProps {
  /** Emoji or React node displayed above the title */
  icon?: React.ReactNode
  /** Primary message */
  title: string
  /** Optional secondary description */
  description?: string
  /** CTA button label */
  actionLabel?: string
  /** CTA link destination */
  actionHref?: string
  /**
   * 'card' — renders its own rounded card wrapper (for standalone use)
   * 'inline' — renders just the text content (for use inside an existing card)
   */
  variant?: 'card' | 'inline'
}

export function EmptyState({
  icon,
  title,
  description,
  actionLabel,
  actionHref,
  variant = 'card',
}: EmptyStateProps) {
  const content = (
    <>
      {icon && <div className="text-2xl mb-3">{icon}</div>}
      <p className="text-sm font-medium text-[var(--color-text-primary)]">{title}</p>
      {description && (
        <p className="text-xs text-[var(--color-text-secondary)] mt-1">{description}</p>
      )}
      {actionLabel && actionHref && (
        <Link
          href={actionHref}
          className="inline-block mt-3 text-sm font-medium text-[var(--color-interactive)] hover:underline"
        >
          {actionLabel} →
        </Link>
      )}
    </>
  )

  if (variant === 'inline') {
    return <div className="text-center py-2">{content}</div>
  }

  return (
    <div className="bg-[var(--color-surface)] rounded-2xl p-6 text-center">
      {content}
    </div>
  )
}
```

**Replace existing empty states:**

| Location | Variant | Props |
|---|---|---|
| `AboutSection.tsx` | `inline` | `title="No bio yet"` |
| `YachtsSection.tsx` | `inline` | `title="No yacht experience added"`, `actionLabel="Add a yacht"`, `actionHref="/app/attachment/new"` |
| `CertsSection.tsx` | `inline` | `title="No certifications added"`, `actionLabel="Add certification"`, `actionHref="/app/certification/new"` |
| `EndorsementsSection.tsx` | `inline` | `title="No endorsements yet"` |
| `AudienceTabs` endorsements | `card` | `title="No endorsements yet"`, `actionLabel="Request endorsements"`, `actionHref="/app/endorsement/request"` |
| `AudienceTabs` colleagues | `card` | `title="Your colleague list will populate once you and a crewmate have both attached the same yacht"`, `actionLabel="Add a yacht"`, `actionHref="/app/attachment/new"` |

The `AudienceTabs` SavedTab empty state stays as-is for now — it moves to the new `/app/network/saved` page in A2.

---

### 1b. New API Routes (Section F3)

#### `GET /api/user-education/[id]`

**File to modify:** `app/api/user-education/[id]/route.ts`

Add this `GET` handler above the existing `PUT`:

```ts
export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { data, error } = await supabase
      .from('user_education')
      .select('id, institution, qualification, field_of_study, started_at, ended_at, sort_order')
      .eq('id', id)
      .eq('user_id', user.id)
      .single()
    if (error || !data) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    return NextResponse.json({ education: data })
  } catch (e) {
    return handleApiError(e)
  }
}
```

#### `PATCH /api/saved-profiles/[id]`

**File to create:** `app/api/saved-profiles/[id]/route.ts`

```ts
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { validateBody } from '@/lib/validation/validate'
import { moveToFolderSchema } from '@/lib/validation/schemas'
import { handleApiError } from '@/lib/api/errors'

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const result = await validateBody(req, moveToFolderSchema)
    if ('error' in result) return result.error
    const { folder_id } = result.data

    // Verify the folder belongs to this user (if not null)
    if (folder_id) {
      const { data: folder } = await supabase
        .from('profile_folders')
        .select('id')
        .eq('id', folder_id)
        .eq('user_id', user.id)
        .single()
      if (!folder) return NextResponse.json({ error: 'Folder not found' }, { status: 404 })
    }

    const { data, error } = await supabase
      .from('saved_profiles')
      .update({ folder_id })
      .eq('id', id)
      .eq('user_id', user.id)
      .select()
      .single()
    if (error) throw error
    if (!data) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    return NextResponse.json({ saved: data })
  } catch (e) {
    return handleApiError(e)
  }
}
```

---

### 1c. Database Migration (Section G1 + G2)

**File to create:** `supabase/migrations/20260321000001_fix_storage_buckets.sql`

```sql
-- Migration: Fix storage buckets + function consistency
-- Sprint 10.1 — 2026-03-21
--
-- IMPORTANT: RLS policies for user-photos and user-gallery already exist
-- from migration 20260317000021_profile_robustness.sql.
-- This migration ONLY creates the bucket rows. Do NOT duplicate policies.

-- ─── Create user-photos bucket ───
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'user-photos',
  'user-photos',
  true,
  5242880,                      -- 5 MB limit
  array['image/jpeg', 'image/png', 'image/webp']
) on conflict (id) do nothing;

-- ─── Create user-gallery bucket ───
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'user-gallery',
  'user-gallery',
  true,
  5242880,                      -- 5 MB limit
  array['image/jpeg', 'image/png', 'image/webp']
) on conflict (id) do nothing;

-- ─── Fix yacht-photos RLS: ex-crew should not be able to write ───
-- Drop the existing insert policy and recreate with deleted_at check
drop policy if exists "yacht-photos: crew insert" on storage.objects;

create policy "yacht-photos: crew insert (active only)"
  on storage.objects for insert
  with check (
    bucket_id = 'yacht-photos'
    and exists (
      select 1 from public.attachments
      where yacht_id::text = (string_to_array(name, '/'))[1]
        and user_id = auth.uid()
        and deleted_at is null
    )
  );

-- Also fix the update and delete policies
drop policy if exists "yacht-photos: crew update" on storage.objects;

create policy "yacht-photos: crew update (active only)"
  on storage.objects for update
  using (
    bucket_id = 'yacht-photos'
    and exists (
      select 1 from public.attachments
      where yacht_id::text = (string_to_array(name, '/'))[1]
        and user_id = auth.uid()
        and deleted_at is null
    )
  );

drop policy if exists "yacht-photos: crew delete" on storage.objects;

create policy "yacht-photos: crew delete (active only)"
  on storage.objects for delete
  using (
    bucket_id = 'yacht-photos'
    and exists (
      select 1 from public.attachments
      where yacht_id::text = (string_to_array(name, '/'))[1]
        and user_id = auth.uid()
        and deleted_at is null
    )
  );

-- ─── Fix get_sea_time() — add SECURITY DEFINER + search_path ───
create or replace function public.get_sea_time(p_user_id uuid)
returns table (total_days int, yacht_count int)
language sql stable
security definer
set search_path = public
as $$
  select
    coalesce(sum(
      case
        when ended_at is not null then (ended_at - started_at)
        else (current_date - started_at)
      end
    ), 0)::int as total_days,
    count(distinct yacht_id)::int as yacht_count
  from attachments
  where user_id = p_user_id
    and deleted_at is null
    and started_at is not null;
$$;
```

---

## Part 2: Pages (Section A)

### 2a. Education Edit Page

**File to create:** `app/(protected)/app/education/[id]/edit/page.tsx`

```tsx
'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'

export default function EducationEditPage() {
  const router = useRouter()
  const params = useParams<{ id: string }>()
  const [form, setForm] = useState({
    institution: '',
    qualification: '',
    field_of_study: '',
    started_at: '',
    ended_at: '',
  })
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState('')
  const [loaded, setLoaded] = useState(false)
  const [notFound, setNotFound] = useState(false)

  useEffect(() => {
    async function load() {
      const res = await fetch(`/api/user-education/${params.id}`)
      if (!res.ok) { setNotFound(true); setLoaded(true); return }
      const { education } = await res.json()
      setForm({
        institution: education.institution ?? '',
        qualification: education.qualification ?? '',
        field_of_study: education.field_of_study ?? '',
        started_at: education.started_at ?? '',
        ended_at: education.ended_at ?? '',
      })
      setLoaded(true)
    }
    load()
  }, [params.id])

  function update(key: string, value: string) {
    setForm((prev) => ({ ...prev, [key]: value }))
    setError('')
  }

  async function save(e: React.FormEvent) {
    e.preventDefault()
    if (!form.institution.trim()) {
      setError('Institution is required')
      return
    }
    setSaving(true)
    try {
      const res = await fetch(`/api/user-education/${params.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          institution: form.institution.trim(),
          qualification: form.qualification.trim() || undefined,
          field_of_study: form.field_of_study.trim() || undefined,
          started_at: form.started_at || null,
          ended_at: form.ended_at || null,
        }),
      })
      if (!res.ok) {
        const d = await res.json()
        setError(d.error ?? 'Failed to save')
        return
      }
      router.push('/app/profile')
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete() {
    if (!confirm('Delete this education entry? This cannot be undone.')) return
    setDeleting(true)
    try {
      const res = await fetch(`/api/user-education/${params.id}`, { method: 'DELETE' })
      if (res.ok) router.push('/app/profile')
      else {
        const d = await res.json()
        setError(d.error ?? 'Failed to delete')
      }
    } finally {
      setDeleting(false)
    }
  }

  if (!loaded) {
    return (
      <div className="flex flex-col gap-4 pb-24">
        <div className="h-6 w-32 rounded bg-[var(--color-surface-raised)] animate-pulse" />
        <div className="flex flex-col gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-10 rounded-xl bg-[var(--color-surface-raised)] animate-pulse" />
          ))}
        </div>
      </div>
    )
  }

  if (notFound) {
    return (
      <div className="flex flex-col gap-4 pb-24">
        <Link href="/app/profile" className="text-sm text-[var(--color-interactive)] hover:underline">← Back</Link>
        <p className="text-sm text-[var(--color-text-secondary)]">Education record not found.</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4 pb-24">
      <div className="flex items-center gap-3">
        <Link href="/app/profile" className="text-sm text-[var(--color-interactive)] hover:underline">← Back</Link>
        <h1 className="font-semibold text-lg text-[var(--color-text-primary)]">Edit Education</h1>
      </div>

      <form onSubmit={save} className="flex flex-col gap-4">
        <div>
          <label className="block text-sm font-medium text-[var(--color-text-primary)] mb-1">Institution *</label>
          <input
            value={form.institution}
            onChange={(e) => update('institution', e.target.value)}
            placeholder="e.g. UKSA, Maritime Academy"
            className="w-full px-3 py-2 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-interactive)]"
            maxLength={200}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-[var(--color-text-primary)] mb-1">Qualification</label>
          <input
            value={form.qualification}
            onChange={(e) => update('qualification', e.target.value)}
            placeholder="e.g. BSc Marine Engineering, STCW Basic"
            className="w-full px-3 py-2 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-interactive)]"
            maxLength={200}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-[var(--color-text-primary)] mb-1">Field of Study</label>
          <input
            value={form.field_of_study}
            onChange={(e) => update('field_of_study', e.target.value)}
            placeholder="e.g. Nautical Science"
            className="w-full px-3 py-2 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-interactive)]"
            maxLength={200}
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-[var(--color-text-primary)] mb-1">Start date</label>
            <input
              type="date"
              value={form.started_at}
              onChange={(e) => update('started_at', e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-interactive)]"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-[var(--color-text-primary)] mb-1">End date</label>
            <input
              type="date"
              value={form.ended_at}
              onChange={(e) => update('ended_at', e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-interactive)]"
            />
          </div>
        </div>

        {error && <p className="text-sm text-[var(--color-error)]">{error}</p>}

        <button
          type="submit"
          disabled={saving}
          className="w-full py-3 rounded-xl bg-[var(--color-interactive)] text-white font-medium disabled:opacity-60 hover:bg-[var(--color-interactive-hover)] transition-colors"
        >
          {saving ? 'Saving…' : 'Save changes'}
        </button>

        <button
          type="button"
          onClick={handleDelete}
          disabled={deleting}
          className="w-full py-3 rounded-xl border border-[var(--color-error)] text-[var(--color-error)] font-medium hover:bg-[var(--color-error)]/10 transition-colors disabled:opacity-60"
        >
          {deleting ? 'Deleting…' : 'Delete this entry'}
        </button>
      </form>
    </div>
  )
}
```

**Notes on A1 implementation:**
- **Zod validation:** The existing `PUT /api/user-education/[id]` route already validates with `userEducationSchema` via `validateBody()`. The edit page's form submission hits this route, so server-side validation is already covered. The client-side `institution.trim()` check is a UX courtesy, not the only validation layer.
- **Optimistic update:** The current implementation uses a standard async save (matching the pattern in `education/new`). For a true optimistic update, the agent implementing this should: (1) show a success toast immediately on submit, (2) navigate to `/app/profile`, (3) use `router.refresh()` on the profile page to pick up the updated data. This is effectively what the current pattern does — the navigation itself is the optimistic signal.

**Also needed:** Update the profile page's education section to link each entry to its edit page. In the education accordion content, each education item should have an edit link:
```tsx
<Link href={`/app/education/${edu.id}/edit`} className="text-xs text-[var(--color-interactive)]">Edit</Link>
```

---

### 2b. Saved Profiles Page

**File to create:** `app/(protected)/app/network/saved/page.tsx`

This is a server-rendered page that promotes and replaces the client-side `SavedTab` from `AudienceTabs.tsx`.

Key differences from the old `SavedTab`:
- Server-side data fetching (not `useEffect` + silent error swallowing)
- Uses the `EmptyState` component
- Has folder CRUD and move-to-folder via `PATCH /api/saved-profiles/[id]`
- Has its own `loading.tsx`

The page follows the same visual pattern as the existing `SavedTab` (folder filter pills, profile cards, unsave action) but with proper error handling and server rendering.

**File to create:** `app/(protected)/app/network/saved/loading.tsx`

```tsx
import { Skeleton } from '@/components/ui/skeleton'

export default function SavedProfilesLoading() {
  return (
    <div className="flex flex-col gap-4 pb-24">
      <Skeleton className="h-6 w-40" />
      <div className="flex gap-2">
        <Skeleton className="h-8 w-16 rounded-full" />
        <Skeleton className="h-8 w-20 rounded-full" />
      </div>
      <div className="flex flex-col gap-3">
        {[1, 2, 3, 4].map((i) => (
          <Skeleton key={i} className="h-16 rounded-2xl" />
        ))}
      </div>
    </div>
  )
}
```

**Implementation guidance for the page component:**

The page should be a server component that fetches data, with a client component for interactivity (folder switching, unsave, move-to-folder). Follow the same architecture as `network/page.tsx` (server fetch + client `AudienceTabs`):

1. **Server component** (`page.tsx`): fetch saved profiles + folders via Supabase server client, pass as props to client component
2. **Client component** (`SavedProfilesClient.tsx`): receives data as props, handles folder filter pills, unsave action, move-to-folder via `PATCH /api/saved-profiles/[id]`, folder CRUD
3. **Visual pattern:** match the existing `SavedTab` UI exactly (folder pills, profile cards with photo + name + role + unsave button) — we're promoting it, not redesigning it
4. **Key differences from old SavedTab:** server-side initial fetch (no loading spinner on first paint), proper error boundaries, uses `EmptyState` component, adds folder CRUD (create via modal/sheet, rename, delete with confirmation)

The existing `SavedTab` code (lines 393–522 of `AudienceTabs.tsx`) is the reference implementation — extract and enhance it, don't build from scratch. The `deleteUserPhoto`/`deleteGalleryItem` helpers are client-only (use `createClient()` from browser). For server-side deletion in API routes, use the `extractStoragePath` utility with the server supabase client directly.

**Modify `AudienceTabs.tsx`:** Replace the inline `SavedTab` component (lines 393–522) with a link card:

```tsx
function SavedTab() {
  return (
    <Link
      href="/app/network/saved"
      className="bg-[var(--color-surface)] rounded-2xl p-5 flex items-center gap-3 hover:bg-[var(--color-surface-raised)] transition-colors"
    >
      <span className="text-2xl">🔖</span>
      <div className="flex-1">
        <p className="text-sm font-medium text-[var(--color-text-primary)]">Saved Profiles</p>
        <p className="text-xs text-[var(--color-text-secondary)]">View and organise your saved profiles</p>
      </div>
      <span className="text-[var(--color-text-secondary)]">›</span>
    </Link>
  )
}
```

---

## Part 3: Dark Mode (Section B)

### 3a. New CSS variables for ProfileStrength

**File to modify:** `app/globals.css`

Add to the `@theme inline` block (after the `--color-info` line):

```css
/* Profile strength arc colours */
--color-strength-low:  var(--color-text-secondary);
--color-strength-mid:  var(--color-amber-500);
--color-strength-high: var(--color-teal-700);
--color-strength-full: var(--color-success);
```

Add to the `.dark` block (after `--color-interactive-muted`):

```css
--color-strength-low:  var(--muted-foreground);
--color-strength-mid:  var(--color-amber-200);
--color-strength-high: #11BABB;
--color-strength-full: #34d399;
```

### 3b. ProfileStrength.tsx fix

Replace the `arcColor` logic:

```tsx
const arcColor = score <= 30
  ? 'var(--color-strength-low)'
  : score <= 60
  ? 'var(--color-strength-mid)'
  : score <= 85
  ? 'var(--color-strength-high)'
  : 'var(--color-strength-full)'
```

### 3c. Insights chart colours

In `app/(protected)/app/insights/page.tsx`, replace any hardcoded hex chart colours:

```tsx
// Before:
color="#0D7377"   →   color="var(--chart-1)"
color="#0D9488"   →   color="var(--chart-2)"
color="#14B8A6"   →   color="var(--chart-3)"
```

### 3d. SidebarNav badge

In `components/nav/SidebarNav.tsx`, replace:
```tsx
// Before:
className="... bg-red-500 ..."
// After:
className="... bg-[var(--color-error)] ..."
```

### 3e. Component dark mode classes

The README says "add `dark:` variants" but the audit found these components use CSS variables (`--color-surface`, `--color-border`, `--color-text-primary`) which already have `.dark` overrides in `globals.css` (lines 204–215). This means **no explicit `dark:` Tailwind classes are needed** — the CSS vars auto-adapt.

**Verification required (not code changes):**

- **ProfileAccordion.tsx**: Uses `bg-[var(--color-surface)]`, `border-[var(--color-border)]`, `text-[var(--color-text-primary)]`, `text-[var(--color-text-secondary)]` — all auto-adapt. **Verified: no code changes needed.**
- **PhotoGallery.tsx**: Uses `bg-[var(--color-surface-raised)]` on empty state — auto-adapts. Arrow buttons use `bg-black/40` which works in both modes. **Verified: no code changes needed.**
- **SaveProfileButton.tsx**: Uses `bg-[var(--color-surface-raised)]`, `text-[var(--color-text-primary)]` — auto-adapts. **Verified: no code changes needed.**
- **SectionManager.tsx**: Toggle uses `bg-[var(--color-interactive)]` (auto-adapts) / `bg-[var(--color-border)]` (auto-adapts). **One issue:** the toggle knob is `bg-white` — visible against `bg-[var(--color-border)]` (#334155 in dark mode) ✓, visible against `bg-[var(--color-interactive)]` (#11BABB in dark mode) ✓. **No code changes needed.**
- **SocialLinksRow.tsx**: Already has `dark:hover:text-white`. **No code changes needed.**

**Evidence:** `globals.css` lines 204–215 define dark overrides for all `--color-*` semantic tokens. Any component using these tokens inherits dark mode automatically. The only real dark mode implementation work in this sprint is ProfileStrength arc colours (3a/3b) and Insights chart colours (3c).

### 3f. AudienceTabs status pills

Verify that the opacity-based status pills render acceptably on dark backgrounds:
- `bg-blue-500/10 text-blue-400` — on `--color-surface` (#0f172a dark) → semi-transparent blue on dark navy ✓
- `bg-emerald-500/10 text-emerald-400` — on `--color-surface` → semi-transparent green on dark navy ✓

If these look washed out in dark mode, add explicit overrides:
```tsx
// Only if visual check fails:
className="bg-blue-500/10 text-blue-400 dark:bg-blue-400/15 dark:text-blue-300"
```

---

## Part 4: Animation Pass (Section C)

### 4a. Extend `lib/motion.ts`

Add after the existing `easeFast`:

```ts
/** Duration-based ease for accordion/expand animations where spring overshoot is undesirable */
export const easeGentle: Transition = {
  duration: 0.25,
  ease: "easeOut",
};
```

Update `scrollReveal` — add a helper for the `whileInView` viewport config:

```ts
/** Viewport options for scroll-triggered reveals */
export const scrollRevealViewport = {
  once: true,
  margin: "-50px" as const,
};
```

### 4b. Wire presets into existing components

**ProfileAccordion.tsx** — replace inline transitions:

```tsx
// Chevron rotation (line ~55):
// Before: transition={{ duration: 0.2, ease: 'easeOut' }}
// After:
import { easeGentle } from '@/lib/motion'
// ...
transition={easeGentle}

// Content expand (line ~70):
// Before: transition={{ duration: 0.25, ease: 'easeOut' }}
// After:
transition={easeGentle}
```

**IdentityCard.tsx** — QR panel:
```tsx
// Before: transition={{ duration: 0.25, ease: 'easeOut' }}
import { easeGentle } from '@/lib/motion'
// After:
transition={easeGentle}
```

**Toast.tsx**:
```tsx
// Before: { type: "spring", damping: 20, stiffness: 300 }
import { springSnappy } from '@/lib/motion'
// After:
transition={prefersReducedMotion ? { duration: 0 } : springSnappy}
```

**BottomSheet.tsx**:
```tsx
// Before: { type: "spring", damping: 25, stiffness: 300 }
import { springSnappy } from '@/lib/motion'
// After:
transition={prefersReducedMotion ? { duration: 0 } : springSnappy}
```

### 4c. Add entrance animations

For page wrappers, wrap the outer `<div>` in a `motion.div`:

```tsx
import { motion } from 'framer-motion'
import { fadeUp } from '@/lib/motion'

// Wrap page content:
<motion.div
  variants={fadeUp}
  initial="hidden"
  animate="visible"
  className="flex flex-col gap-4 pb-24"
>
  {/* page content */}
</motion.div>
```

Apply to: `profile/page.tsx`, `network/page.tsx`, `insights/page.tsx`, `cv/page.tsx`, `more/page.tsx`.

For card lists, wrap the parent in a stagger container and each card in a `fadeUp` child:

```tsx
import { motion } from 'framer-motion'
import { staggerContainer, fadeUp } from '@/lib/motion'

<motion.div variants={staggerContainer} initial="hidden" animate="visible" className="flex flex-col gap-3">
  {items.map((item) => (
    <motion.div key={item.id} variants={fadeUp}>
      {/* card content */}
    </motion.div>
  ))}
</motion.div>
```

For scroll reveals on public profile sections:

```tsx
import { motion } from 'framer-motion'
import { scrollReveal, scrollRevealViewport } from '@/lib/motion'

<motion.div
  variants={scrollReveal}
  initial="hidden"
  whileInView="visible"
  viewport={scrollRevealViewport}
>
  <ProfileAccordion ...>
</motion.div>
```

For `cardHover` on interactive cards (yacht cards, endorsement cards, saved profile cards):

```tsx
import { motion } from 'framer-motion'
import { cardHover } from '@/lib/motion'

// Wrap each interactive card:
<motion.div {...cardHover}>
  {/* card content */}
</motion.div>
```

Apply to: yacht cards in experience section, endorsement cards in `PublicProfileContent.tsx`, saved profile cards in `/app/network/saved`.

For `popIn` on badges:

```tsx
<motion.span variants={popIn} initial="hidden" animate="visible">
  {badgeCount}
</motion.span>
```

---

## Part 5: Typography Pass (Section D)

DM Serif Display is loaded at weight 400 only. **Drop `font-semibold`/`font-bold` from any heading that gets `font-serif`.**

### Where to apply:

**Public profile hero** (`components/public/PublicProfileContent.tsx`):
```tsx
// Profile name — was something like:
<h1 className="font-semibold text-xl ...">
// Change to:
<h1 className="font-serif text-2xl ...">
```

**Public profile section headings** — the `ProfileAccordion` title:
```tsx
// In ProfileAccordion.tsx, the title span:
// Before: className="font-semibold text-base text-[var(--color-text-primary)]"
// After:  className="font-serif text-base text-[var(--color-text-primary)]"
```

**Authenticated page titles** — the `<h1>` on each main page:
```tsx
// Pattern across profile, network, insights, cv, more pages:
// Before: <h1 className="font-semibold text-lg ...">Profile</h1>
// After:  <h1 className="font-serif text-lg ...">Profile</h1>
```

**Auth pages** — Welcome, Login, Signup:
```tsx
// Before: <h1 className="text-2xl font-bold ...">
// After:  <h1 className="font-serif text-2xl ...">
```

---

## Part 6: Route & Layout Cleanup (Section E) + API Hardening (Section F) + Minor Fixes (Section I)

### 6a. Delete audience route

```bash
rm -rf app/(protected)/app/audience/
```

In `app/(protected)/app/network/page.tsx`, rename the function:
```tsx
// Before:
export default async function AudiencePage() {
// After:
export default async function NetworkPage() {
```

Grep for `/audience` across the codebase and update any references.

### 6b. Fix edit page bottom padding

In these files, search for `pb-8` and replace with `pb-24`:
- `app/(protected)/app/about/edit/page.tsx`
- `app/(protected)/app/certification/[id]/edit/page.tsx`
- `app/(protected)/app/certification/new/page.tsx`
- `app/(protected)/app/more/account/page.tsx`
- `app/(protected)/app/profile/settings/page.tsx`
- `app/(protected)/app/profile/photo/page.tsx`

### 6c. Delete ghost directories

```bash
find app/api -name "* 2" -type d -empty -delete
```

### 6d. API hardening — error handling

For each of these files, wrap the handler body in try/catch + `handleApiError`:

- `app/api/stripe/portal/route.ts` — add try/catch around `stripe.billingPortal.sessions.create()`
- `app/api/endorsement-requests/[id]/route.ts` — wrap both GET and PUT
- `app/api/cron/analytics-nudge/route.ts` — wrap handler
- `app/api/cron/cert-expiry/route.ts` — wrap handler

Pattern:
```ts
try {
  // existing logic
} catch (e) {
  return handleApiError(e)
}
```

### 6e. API hardening — validation

**`DELETE /api/saved-profiles`** — replace raw body parsing:
```ts
// Before:
const body = await req.json()
const saved_user_id = body?.saved_user_id
if (!saved_user_id) return ...

// After:
import { z } from 'zod'
const schema = z.object({ saved_user_id: z.string().uuid() })
const result = await validateBody(req, schema)
if ('error' in result) return result.error
const { saved_user_id } = result.data
```

**`POST /api/profile/ai-summary`** — add minimal schema:
```ts
const aiSummaryRequestSchema = z.object({ force: z.boolean().optional() })
```

### 6f. Health endpoint fix

**`app/api/health/supabase/route.ts`** — fix the table name and sanitise errors:

```ts
export async function GET() {
  const supabase = await createClient()

  const { error } = await supabase
    .from('users')
    .select('id')
    .limit(1)

  return NextResponse.json({
    ok: !error,
    error: error ? 'Database check failed' : null,
  })
}
```

### 6g. Minor fixes

- **`AudienceTabs.tsx` saved loading** — replace `animate-pulse` divs with `<Skeleton className="h-16 rounded-2xl" />`
- **`PublicProfileContent.tsx` "N more endorsements" text** — remove `text-[var(--color-interactive)]` class, or wrap in a `<button>` that calls `setShowAllEndorsements(true)` state
- **`PublicProfileContent.tsx` "N more photos" text** — same fix: remove interactive colour styling or make it a functional expand button
- **`admin.ts`** — first run `npm install server-only`, then add `import 'server-only'` as the first line of the file
- **Privacy page TODO** — add to CHANGELOG: `- **Pre-launch blocker:** Privacy page missing registered business address (TODO in /privacy/page.tsx line 128)`
- **Commit sprint docs** — before starting any implementation, commit the 4 uncommitted sprint documentation files for a clean baseline: `git add sprints/ && git commit -m "docs: Sprint 10.1 + Phase 1B draft plans"`
- **Confirm nav links** — verify `BottomTabBar.tsx` and `SidebarNav.tsx` both link to `/app/network` (they already do — no code change needed, just confirm)

---

## Part 7: Storage Abstraction + Cleanup (Section G3 + G4)

### 7a. Add user-photos helpers to `lib/storage/upload.ts`

Add after the existing `getPdfExportUrl` function:

```ts
// ─────────────────────────────────────────
// User photos (multi-photo profile gallery)
// ─────────────────────────────────────────

const MAX_USER_PHOTO_PX = 1200

export async function uploadUserPhoto(
  userId: string,
  file: File,
): Promise<UploadPhotoResult> {
  if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
    return { ok: false, error: 'Only JPEG, PNG, or WebP images are allowed.' }
  }
  if (file.size > MAX_PHOTO_BYTES) {
    return { ok: false, error: 'Photo must be under 5 MB.' }
  }

  let blob: Blob
  try {
    blob = await resizeImage(file, MAX_USER_PHOTO_PX)
  } catch {
    return { ok: false, error: 'Could not process image.' }
  }

  const ext = blob.type === 'image/webp' ? 'webp' : 'jpeg'
  const path = `${userId}/${crypto.randomUUID()}.${ext}`

  const supabase = createClient()
  const { error } = await supabase.storage
    .from('user-photos')
    .upload(path, blob, { contentType: blob.type, upsert: false })

  if (error) return { ok: false, error: error.message }

  const { data } = supabase.storage.from('user-photos').getPublicUrl(path)
  return { ok: true, url: `${data.publicUrl}?t=${Date.now()}` }
}

export async function deleteUserPhoto(photoUrl: string): Promise<void> {
  const url = new URL(photoUrl)
  const storagePath = url.pathname.split('/object/public/user-photos/')[1]
  if (!storagePath) return
  const supabase = createClient()
  await supabase.storage.from('user-photos').remove([storagePath])
}

// ─────────────────────────────────────────
// User gallery (work samples)
// ─────────────────────────────────────────

export async function uploadGalleryItem(
  userId: string,
  file: File,
): Promise<UploadPhotoResult> {
  if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
    return { ok: false, error: 'Only JPEG, PNG, or WebP images are allowed.' }
  }
  if (file.size > MAX_PHOTO_BYTES) {
    return { ok: false, error: 'Photo must be under 5 MB.' }
  }

  let blob: Blob
  try {
    blob = await resizeImage(file, MAX_USER_PHOTO_PX)
  } catch {
    return { ok: false, error: 'Could not process image.' }
  }

  const ext = blob.type === 'image/webp' ? 'webp' : 'jpeg'
  const path = `${userId}/${crypto.randomUUID()}.${ext}`

  const supabase = createClient()
  const { error } = await supabase.storage
    .from('user-gallery')
    .upload(path, blob, { contentType: blob.type, upsert: false })

  if (error) return { ok: false, error: error.message }

  const { data } = supabase.storage.from('user-gallery').getPublicUrl(path)
  return { ok: true, url: `${data.publicUrl}?t=${Date.now()}` }
}

export async function deleteGalleryItem(imageUrl: string): Promise<void> {
  const url = new URL(imageUrl)
  const storagePath = url.pathname.split('/object/public/user-gallery/')[1]
  if (!storagePath) return
  const supabase = createClient()
  await supabase.storage.from('user-gallery').remove([storagePath])
}
```

### 7b. Refactor photos page

In `app/(protected)/app/profile/photos/page.tsx`, replace the `handleUpload` function's direct storage calls:

```tsx
// Before:
import { createClient } from '@/lib/supabase/client'
// ...
const supabase = createClient()
const { data: { user } } = await supabase.auth.getUser()
const path = `${user.id}/${crypto.randomUUID()}.${ext}`
const { error: uploadErr } = await supabase.storage.from('user-photos').upload(path, file, { upsert: false })
const { data: urlData } = supabase.storage.from('user-photos').getPublicUrl(path)
const photoUrl = urlData.publicUrl

// After:
import { uploadUserPhoto } from '@/lib/storage/upload'
import { createClient } from '@/lib/supabase/client'
// ...
const supabase = createClient()
const { data: { user } } = await supabase.auth.getUser()
if (!user) return
const result = await uploadUserPhoto(user.id, file)
if (!result.ok) { alert(result.error); return }
const photoUrl = result.url
```

Apply same pattern to `profile/gallery/page.tsx` using `uploadGalleryItem`.

### 7c. Refactor deletion routes

In `app/api/user-photos/[id]/route.ts`, the storage deletion becomes server-side. Since `deleteUserPhoto` uses the browser client, create a server-side variant or inline the deletion using the server client:

```ts
// In the DELETE handler, replace:
const url = new URL(photo.photo_url)
const storagePath = url.pathname.split('/object/public/user-photos/')[1]
if (storagePath) {
  await supabase.storage.from('user-photos').remove([storagePath])
}

// This pattern is correct as-is (server client). The abstraction for server-side
// deletion is a simple utility. Add to lib/storage/upload.ts:
```

Add server-side deletion helpers:

```ts
// Server-side deletion (for API routes using the server supabase client)
export function extractStoragePath(publicUrl: string, bucket: string): string | null {
  try {
    const url = new URL(publicUrl)
    const marker = `/object/public/${bucket}/`
    const idx = url.pathname.indexOf(marker)
    if (idx === -1) return null
    return url.pathname.slice(idx + marker.length)
  } catch {
    return null
  }
}
```

Then the API routes can use:
```ts
import { extractStoragePath } from '@/lib/storage/upload'
// ...
const storagePath = extractStoragePath(photo.photo_url, 'user-photos')
if (storagePath) await supabase.storage.from('user-photos').remove([storagePath])
```

### 7d. Account deletion cleanup

In `app/api/account/delete/route.ts`, add to the `Promise.allSettled` array:

```ts
await Promise.allSettled([
  admin.storage.from('profile-photos').remove([`${user.id}/`]),
  admin.storage.from('cert-documents').remove([`${user.id}/`]),
  admin.storage.from('cv-uploads').remove([`${user.id}/`]),
  admin.storage.from('pdf-exports').remove([`${user.id}/`]),
  admin.storage.from('user-photos').remove([`${user.id}/`]),    // ← ADD
  admin.storage.from('user-gallery').remove([`${user.id}/`]),   // ← ADD
])
```

### 7e. PDF deduplication

In `app/api/cv/generate-pdf/route.ts`, before uploading the new PDF, delete the old one:

```ts
// After fetching the user profile, before generating the new PDF:
const { data: currentUser } = await supabase
  .from('users')
  .select('latest_pdf_path')
  .eq('id', user.id)
  .single()

// Delete previous PDF if it exists
if (currentUser?.latest_pdf_path) {
  await admin.storage.from('pdf-exports').remove([currentUser.latest_pdf_path])
}
```

---

## Part 8: Git (Section J)

### Pre-merge checklist

1. Run `npm run build` — verify no TypeScript errors
2. Run `npm run lint` — verify no lint errors
3. Visual check: toggle dark mode on profile, network, insights, public profile
4. Mobile check: verify at 375px — edit pages have correct bottom padding
5. Verify animation: page entrance, accordion expand, scroll reveal on public profile

### Merge

```bash
git checkout main
git merge feat/ui-refresh-phase1
git tag v1.0-phase-1a
git push origin main --tags
```

### CHANGELOG entry

```markdown
## [Sprint 10.1] — 2026-03-XX

### Added
- Education edit page (`/app/education/[id]/edit`)
- Saved profiles dedicated page (`/app/network/saved`) with folder organisation
- `EmptyState` component (card + inline variants) — Salty mounting point for Sprint 11
- `GET /api/user-education/[id]` and `PATCH /api/saved-profiles/[id]` routes
- Storage bucket migration for `user-photos` and `user-gallery`
- Storage abstraction: `uploadUserPhoto`, `uploadGalleryItem`, `deleteUserPhoto`, `deleteGalleryItem`
- DM Serif Display applied to headings and profile names
- Entrance animations (`fadeUp`, `staggerContainer`, `scrollReveal`, `popIn`) across all pages
- Dark mode semantic tokens: `--color-strength-low/mid/high/full`

### Fixed
- Dark mode: ProfileStrength arc colours, Insights chart colours now use CSS variables
- Dark mode: SidebarNav badge uses `--color-error` (was hardcoded `bg-red-500`)
- Edit page bottom padding: `pb-8` → `pb-24` (content was obscured by tab bar)
- Health endpoint queries correct table (`users`, was `profiles`)
- Stripe portal route wrapped in try/catch (was unhandled)
- Endorsement request routes wrapped in handleApiError
- Cron routes wrapped in try/catch
- `DELETE /api/saved-profiles` now validates `saved_user_id` with Zod
- Account deletion now cleans up `user-photos` and `user-gallery` buckets
- PDF generation deletes previous export before creating new one (was accumulating)
- Yacht-photos RLS: ex-crew with soft-deleted attachments can no longer write
- `get_sea_time()` now uses SECURITY DEFINER consistently with all other functions
- `admin.ts` guarded with `import 'server-only'`

### Changed
- `/app/audience` removed — `/app/network` is the canonical route
- Animation presets from `lib/motion.ts` now used throughout (zero inline spring values)
- `ProfileAccordion` section headings use DM Serif Display
- `user-photos` and `user-gallery` uploads now compressed (max 1200px, WebP 0.88)
- All `supabase.storage` calls routed through `lib/storage/` abstraction layer
- Saved profiles tab in AudienceTabs replaced with link card to dedicated page

### Removed
- 10 empty iCloud " 2" ghost directories under `app/api/`
- Duplicate `/app/audience` route

### Notes
- Phase 1A complete — branch merged to `main`, tagged `v1.0-phase-1a`
- Pre-launch blocker logged: Privacy page needs registered business address
```

---

## Testing & QA

### Automated
- `npm run build` — zero errors
- `npm run lint` — zero warnings

### Manual — per section
| Section | Test |
|---|---|
| A1 | Navigate to `/app/education/{id}/edit` → form loads → edit → save → verify on profile → delete → verify removed |
| A2 | Navigate to `/app/network/saved` → profiles load → create folder → move profile to folder → unsave → empty state shows |
| B | Toggle dark mode → check: profile, insights (charts), network, public profile, ProfileStrength widget |
| C | Page entrance: navigate between tabs → content fades up. Accordion: expand/collapse is smooth. Scroll: public profile sections reveal on scroll |
| D | Headings show DM Serif Display (visually distinct from body text). No synthetic bold artifacts |
| E | Navigate to `/app/audience` → 404. Edit pages → content not cut off by tab bar. No " 2" directories in `app/api/` |
| F | Trigger Stripe portal error (disconnect Stripe) → returns 500 JSON, not raw error. Delete saved profile with invalid UUID → returns 400 validation error |
| G | Upload photo to user-photos → compressed, WebP. Delete account → verify user-photos and user-gallery folders removed. Regenerate PDF → old PDF deleted |
| H | All empty states use EmptyState component. Card variant has rounded wrapper. Inline variant has no double-border |
| I | "N more endorsements" text is not styled as interactive (or expands on click). Health check returns `ok: true` |

### Viewports
- 375px (iPhone SE)
- 768px (iPad)
- 1280px (Desktop)

### Browsers
- Mobile Safari (animation performance)
- Chrome (primary)
- Firefox (secondary)

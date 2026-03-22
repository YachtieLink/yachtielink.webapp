# Sprint 12 — Yacht Graph: Build Plan

## Context

The yacht graph is YachtieLink's core differentiator. Crew build employment history by attaching to yachts. Those shared attachments create a colleague graph. Sprint 12 makes that graph visible, browsable, and useful.

### The Graph Is The Navigation

The yacht graph is not a visualization or a search feature. It's the navigation itself. Every touchpoint is a link into the graph:

- **Profile → Yachts:** Every yacht on someone's profile links to the yacht detail page
- **Yacht → Crew:** Every crew member on a yacht page links to their profile
- **Profile → Mutual Colleagues:** "3 of your colleagues have worked with Sam" → expand → tap one → see their profile
- **Colleague Explorer → Profiles:** Every colleague card links to their profile

The result: a user can start on any profile and click-click-click through the entire network. Profile → yacht → crew member → their yachts → another yacht's crew → keep going. No search needed. No graph visualization. Just links between people and yachts.

**This is the core product loop. Every new page and component in Sprint 12 must make everything a link into the graph. No dead ends.**

**Graph link audit — every touchpoint must link:**
- Yacht names on profiles (employment history) → `/app/yacht/[id]`
- Yacht names on public profiles → `/app/yacht/[id]`
- Crew member cards on yacht pages → `/u/[handle]`
- Yacht names in endorsement cards → `/app/yacht/[id]`
- Colleague cards in explorer → `/u/[handle]`
- Mutual colleagues on profiles → `/u/[handle]`
- Yacht names in sea time breakdown → `/app/yacht/[id]`

**What already exists:**
- `/app/yacht/[id]` — yacht detail page with cover photo, name, metadata, flat crew list, crew count stat, "add to profile" CTA
- `get_colleagues(p_user_id)` RPC — returns `TABLE(colleague_id uuid, shared_yachts uuid[])` from shared attachments
- `get_sea_time(p_user_id)` RPC — returns `JSONB {total_days, yacht_count}` (no per-yacht breakdown)
- `search_yachts(p_query, p_limit)` RPC — trigram fuzzy search with similarity scores
- `YachtPicker` component — search + create yacht with near-miss duplicate detection
- `/app/network` page — `AudienceTabs` with colleagues tab, endorsement tabs
- Endorsement system with coworker gating (`are_coworkers_on_yacht()`)
- `yacht-photos` storage bucket (public, RLS-gated to attached crew)

**What this sprint adds:**
- Yacht detail page: current/alumni crew split, profile links, mutual connections, endorsement cross-references, richer stats
- Colleague explorer: grouped-by-yacht view with endorsement status and quick actions
- Sea time display: profile summary + per-yacht breakdown
- Yacht search: improved fuzzy matching UX (no merge flow — blocked by D-006)

**Dependencies:**
- Sprint 10.1 complete (Phase 1A closed)
- Sprint 11 complete (section colours, Salty, public profile polish)
- `yachts`, `attachments`, `endorsements`, `users` tables exist with RLS
- `get_colleagues()`, `get_sea_time()`, `search_yachts()`, `are_coworkers_on_yacht()` RPCs exist
- `YachtPicker` component exists

**Codebase patterns to follow:**
- Server components fetch data via `createClient()` from `@/lib/supabase/server` — no API routes for reads
- Independent queries wrapped in `Promise.all()` for performance
- RPCs for complex computed queries; regular Supabase selects for simple joins
- RPCs use `security definer` (codebase convention) — all existing RPCs use this pattern
- `GRANT EXECUTE ON FUNCTION ... TO authenticated` on every new RPC (lesson learned)
- All colour references use semantic CSS custom properties from `globals.css`
- Mobile-first: 375px base, `md:` breakpoints for tablet/desktop

**Sprint 11 contingency:** If Sprint 11 ships without section colours or Salty, Sprint 12 uses default teal and standard empty states. These can be upgraded later without breaking changes.

**Deferrable items if sprint runs long:**
- Yacht search "match quality indicator" (Part 5.1) — nice-to-have UX
- Established yacht badge in YachtPicker results (Part 5.3)
- Public profile sea time stat line (Part 4.3) — can ship with breakdown page only
- Colleague explorer search/filter (Part 3.3) — can ship with just grouped view first

---

## Part 1: Database Migration

**File to create:** `supabase/migrations/YYYYMMDD000001_sprint12_yacht_graph.sql`

### 1.1 — Enhanced Sea Time Function

The existing `get_sea_time()` returns only totals. We need a per-yacht breakdown.

**BUG FIX:** The existing `get_sea_time()` in migration `20260317000021_profile_robustness.sql` uses `extract(day from interval)` which returns only the day-of-month component (0-30), NOT total days. A 60-day interval returns 0. This sprint's new function uses correct date subtraction (`ended_at - started_at` on DATE types returns integer days). The existing `get_sea_time()` should be patched in this migration as well:

```sql
-- Sprint 12: Yacht Graph — sea time, colleague helpers

-- ═══════════════════════════════════════════════════════════
-- 0. FIX EXISTING get_sea_time() DATE ARITHMETIC BUG
-- ═══════════════════════════════════════════════════════════

-- Original used extract(day from interval) which returns day-of-month (0-30), not total days.
-- Fix: use date subtraction on DATE types which returns integer days.
create or replace function get_sea_time(p_user_id uuid)
returns jsonb
language sql stable
as $$
  select coalesce(
    jsonb_build_object(
      'total_days', sum(coalesce(ended_at, current_date) - started_at)::int,
      'yacht_count', count(distinct yacht_id)
    ),
    '{"total_days": 0, "yacht_count": 0}'::jsonb
  )
  from attachments
  where user_id = p_user_id
    and deleted_at is null
$$;

-- ═══════════════════════════════════════════════════════════
-- 1. PER-YACHT SEA TIME BREAKDOWN
-- ═══════════════════════════════════════════════════════════

-- Sea time is treated as public information (shown on public profiles).
-- Uses security definer for consistency with all other RPCs in the codebase.
-- Access control: sea time is derived from attachments which are already public
-- on yacht detail pages, so no additional gating needed.

create or replace function get_sea_time_detailed(p_user_id uuid)
returns table (
  yacht_id uuid,
  yacht_name text,
  role_label text,
  started_at date,
  ended_at date,
  days int,
  is_current boolean
)
language sql stable security definer
as $$
  select
    a.yacht_id,
    y.name as yacht_name,
    a.role_label,
    a.started_at,
    a.ended_at,
    -- NOTE: Use date subtraction (returns integer days), NOT extract(day from interval)
    -- which only returns the day-of-month component (0-30), not total days.
    (coalesce(a.ended_at, current_date) - a.started_at)::int as days,
    (a.ended_at is null) as is_current
  from attachments a
  join yachts y on y.id = a.yacht_id
  where a.user_id = p_user_id
    and a.deleted_at is null
  order by a.started_at desc;
$$;

grant execute on function get_sea_time_detailed(uuid) to authenticated;
```

### 1.2 — Yacht Endorsement Summary

Returns endorsements written between crew who share a given yacht.

```sql
-- ═══════════════════════════════════════════════════════════
-- 2. ENDORSEMENTS ON A YACHT
-- ═══════════════════════════════════════════════════════════

create or replace function get_yacht_endorsement_count(p_yacht_id uuid)
returns int
language sql stable security definer
as $$
  select count(*)::int
  from endorsements
  where yacht_id = p_yacht_id
    and deleted_at is null;
$$;

grant execute on function get_yacht_endorsement_count(uuid) to authenticated;
```

### 1.3 — Average Tenure on a Yacht

```sql
-- ═══════════════════════════════════════════════════════════
-- 3. AVERAGE TENURE (days) ON A YACHT
-- ═══════════════════════════════════════════════════════════

create or replace function get_yacht_avg_tenure_days(p_yacht_id uuid)
returns int
language sql stable security definer
as $$
  select coalesce(
    avg(
      -- Use date subtraction for correct total days (not extract(day from interval))
      (coalesce(ended_at, current_date) - started_at)
    )::int,
    0
  )
  from attachments
  where yacht_id = p_yacht_id
    and deleted_at is null;
$$;

grant execute on function get_yacht_avg_tenure_days(uuid) to authenticated;
```

### 1.4 — Mutual Colleagues (2nd-Degree Social Proof)

When viewing someone's profile, show which of your colleagues have also worked with them — and let you click through to explore the graph.

This is a social proof signal AND a graph entry point. "3 of your colleagues have worked with Sam" → tap to see who → tap one of them → see their profile → see their yachts → tap a yacht → see its crew → keep exploring.

```sql
-- ═══════════════════════════════════════════════════════════
-- 4. MUTUAL COLLEAGUES (2nd-degree social proof)
-- ═══════════════════════════════════════════════════════════

-- Given a viewer and a profile they're looking at, returns the viewer's
-- colleagues who have ALSO worked with the profile owner.
-- Returns the actual colleague IDs so they can be displayed and linked.

create or replace function get_mutual_colleagues(
  p_viewer_id uuid,
  p_profile_id uuid
)
returns table (
  mutual_colleague_id uuid
)
language sql stable security definer
as $$
  with viewer_colleagues as (
    select distinct a2.user_id as colleague_id
    from attachments a1
    join attachments a2
      on a1.yacht_id = a2.yacht_id
      and a2.user_id != p_viewer_id
    where a1.user_id = p_viewer_id
      and a1.deleted_at is null
      and a2.deleted_at is null
  ),
  profile_colleagues as (
    select distinct a2.user_id as colleague_id
    from attachments a1
    join attachments a2
      on a1.yacht_id = a2.yacht_id
      and a2.user_id != p_profile_id
    where a1.user_id = p_profile_id
      and a1.deleted_at is null
      and a2.deleted_at is null
  )
  select vc.colleague_id as mutual_colleague_id
  from viewer_colleagues vc
  where vc.colleague_id in (select colleague_id from profile_colleagues)
    and vc.colleague_id != p_profile_id;
$$;

grant execute on function get_mutual_colleagues(uuid, uuid) to authenticated;
```

**Returns:** List of user IDs (not just a count). The page fetches their profiles so they can be displayed with photos and linked to `/u/[handle]`.

### 1.5 — Add handle to users select (verify index)

The `handle` column is already on `users`. Verify it has an index for efficient lookups. The yacht detail page crew query will add `handle` to the select.

```sql
-- Ensure handle index exists (may already exist — CREATE IF NOT EXISTS not available for indexes, so use a DO block)
do $$
begin
  if not exists (select 1 from pg_indexes where indexname = 'users_handle_idx') then
    create unique index users_handle_idx on public.users(handle) where handle is not null;
  end if;
end
$$;
```

---

## Part 2: Yacht Detail Page Enhancement

**File to modify:** `app/(protected)/app/yacht/[id]/page.tsx`

The existing page renders yacht info + a flat crew list. Sprint 12 enhances it with:

### 2.1 — Data Fetching (server component)

Replace the current sequential queries with `Promise.all()`:

```typescript
const [yachtRes, crewRes, endorsementsRes, endorsementCountRes, avgTenureRes, colleaguesRes] =
  await Promise.all([
    // 1. Yacht details (existing)
    supabase.from('yachts')
      .select('id, name, yacht_type, length_meters, flag_state, year_built, is_established, cover_photo_url')
      .eq('id', id).single(),

    // 2. Crew list — ADD handle to select
    supabase.from('attachments')
      .select(`id, role_label, started_at, ended_at,
        users!inner(id, display_name, full_name, profile_photo_url, primary_role, handle)`)
      .eq('yacht_id', id).is('deleted_at', null)
      .order('started_at', { ascending: false }),

    // 3. NEW: endorsements on this yacht
    supabase.from('endorsements')
      .select(`id, content, created_at,
        endorser:users!endorser_id(id, display_name, full_name, profile_photo_url, handle),
        recipient:users!recipient_id(id, display_name, full_name, profile_photo_url, handle)`)
      .eq('yacht_id', id).is('deleted_at', null)
      .order('created_at', { ascending: false })
      .limit(10),

    // 4. NEW: endorsement count (RPC)
    supabase.rpc('get_yacht_endorsement_count', { p_yacht_id: id }),

    // 5. NEW: average tenure (RPC)
    supabase.rpc('get_yacht_avg_tenure_days', { p_yacht_id: id }),

    // 6. NEW: current user's colleagues (for mutual connection badges)
    supabase.rpc('get_colleagues', { p_user_id: user.id }),
  ])
```

### 2.2 — Current vs Alumni Crew Split

Split the crew list into two sections based on `ended_at`:

```
Current Crew (ended_at IS NULL)
├── Captain John Smith — Jan 2024–Present
├── Chief Stew Sarah Jones — Mar 2024–Present
└── ...

Alumni (ended_at IS NOT NULL)
├── 2nd Engineer Mike Davis — Jun 2023–Dec 2023
├── Deckhand Anna Lee — Jan 2023–May 2023
└── ...
```

- "Current Crew" section header shown only if any current crew exist
- "Alumni" section header shown only if any alumni exist
- Each section sorted by `started_at` descending

### 2.3 — Crew Cards Enhancement

Each crew card becomes tappable, linking to the crew member's profile:

```
┌─────────────────────────────────────────────────┐
│ [Photo]  John Smith                    →        │
│          Captain · Jan 2024–Present             │
│          🤝 Also worked with you on M/Y Horizon │
│          ✅ Endorsed you                         │
└─────────────────────────────────────────────────┘
```

- Tap → navigate to `/u/[handle]` (or no link if no handle)
- "Also worked with you on..." badge: shown when the viewer and this crew member share OTHER yachts beyond the current one. Computed by cross-referencing the current user's colleague data with crew member IDs.
- Endorsement indicator: shown when an endorsement exists between viewer and this crew member (either direction). Computed from the endorsement query. Use single icon (check, double-check, empty) + short text, not long labels.
- "(you)" label on the current user's own card (existing behavior)
- If crew member has no `handle`, render card as non-tappable `<div>` (no cursor change, no hover state)
- **Mobile width:** Keep badges to abbreviated form at 375px. "Also worked with you on M/Y Very Long Name Here" → truncate yacht name with CSS `truncate` class. Endorsement status as icon + short text ("Endorsed", "Mutual", not full sentences).

**Component to extract:** `components/yacht/CrewCard.tsx` — client component for the interactive crew card.

Props:
```typescript
interface CrewCardProps {
  name: string
  handle: string | null
  profilePhotoUrl: string | null
  roleLabel: string
  startDate: string
  endDate: string | null
  isCurrentUser: boolean
  otherSharedYachts: string[]  // yacht names shared beyond current yacht
  endorsementRelation: 'endorsed_you' | 'you_endorsed' | 'mutual' | null
}
```

### 2.4 — Enhanced Stats Row

Replace the simple crew count + length stats with a richer row:

```
┌────────────┐ ┌────────────┐ ┌────────────┐
│    12      │ │  ~14 mo    │ │     8      │
│ crew total │ │ avg tenure │ │endorsements│
└────────────┘ └────────────┘ └────────────┘
```

- **Crew total:** existing `crewCount` (count of non-deleted attachments)
- **Avg tenure:** from `get_yacht_avg_tenure_days()` RPC, formatted as months (divide by 30.44, round)
- **Endorsements:** from `get_yacht_endorsement_count()` RPC
- If yacht has `length_meters`, show as a 4th stat pill

**Mobile layout (375px):** 3 stats fit in a `flex gap-4` row at ~85px each. If 4 stats (with length), use a 2x2 grid at mobile: `grid grid-cols-2 gap-3 md:grid-cols-4`

### 2.5 — Endorsement Cross-References Section

New section below crew list showing endorsements written between crew of this yacht:

```
┌─────────────────────────────────────────────────┐
│ Endorsements on this yacht (8)                  │
├─────────────────────────────────────────────────┤
│ [Photo] John Smith endorsed Sarah Jones         │
│ "Sarah was an exceptional chief stew..."        │
│ Jan 2024                                        │
├─────────────────────────────────────────────────┤
│ [Photo] Sarah Jones endorsed John Smith         │
│ "John ran the bridge with calm authority..."    │
│ Feb 2024                                        │
├─────────────────────────────────────────────────┤
│ Show all 8 endorsements ▼                       │
└─────────────────────────────────────────────────┘
```

- Initially shows 3 endorsements, expandable to show all
- Each card shows: endorser photo, "X endorsed Y", truncated content (2 lines), date
- Tap endorser/recipient name → `/u/[handle]`
- If 0 endorsements, section is hidden entirely (not an empty state — just absent)
- **D-011 framing:** The section header says "Endorsements between crew on this yacht" — neutral language. No counting of who lacks endorsements, no "X has no endorsements" messaging. Absence is invisible, per D-011.

**Component:** `components/yacht/YachtEndorsements.tsx` — client component (handles expand/collapse).

Props:
```typescript
interface YachtEndorsementsProps {
  endorsements: Array<{
    id: string
    content: string
    created_at: string
    endorser: { id: string; display_name: string | null; full_name: string; profile_photo_url: string | null; handle: string | null }
    recipient: { id: string; display_name: string | null; full_name: string; profile_photo_url: string | null; handle: string | null }
  }>
  totalCount: number
}
```

---

## Part 3: Colleague Explorer

**New page:** `app/(protected)/app/network/colleagues/page.tsx`

A dedicated page for browsing your colleague network, grouped by yacht.

### 3.1 — Entry Point

Add a "View full network" link in the existing colleagues section of `AudienceTabs`:

```typescript
// In the colleagues tab, after the list
<Link href="/app/network/colleagues" className="...">
  Explore your network →
</Link>
```

Also add a link on the profile page near the employment section.

### 3.2 — Data Fetching (server component)

```typescript
// Parallel fetch
const [colleaguesRes, endorsementsRes] = await Promise.all([
  // 1. Colleagues + shared yachts
  supabase.rpc('get_colleagues', { p_user_id: user.id }),

  // 2. All endorsements involving current user
  supabase.from('endorsements')
    .select('id, endorser_id, recipient_id, yacht_id')
    .or(`endorser_id.eq.${user.id},recipient_id.eq.${user.id}`)
    .is('deleted_at', null),
])

// Then fetch profiles + yacht details for colleagues
const colleagueIds = colleagueRows.map(r => r.colleague_id)
const allYachtIds = Array.from(new Set(colleagueRows.flatMap(r => r.shared_yachts)))

const [profilesRes, yachtsRes, attachmentsRes] = await Promise.all([
  supabase.from('users')
    .select('id, full_name, display_name, profile_photo_url, primary_role, handle')
    .in('id', colleagueIds),
  supabase.from('yachts')
    .select('id, name')
    .in('id', allYachtIds),
  // Fetch role labels for each colleague on each shared yacht
  supabase.from('attachments')
    .select('user_id, yacht_id, role_label')
    .in('yacht_id', allYachtIds)
    .in('user_id', [...colleagueIds, user.id])
    .is('deleted_at', null),
])
```

### 3.3 — Grouped View (client component)

**Component:** `components/network/ColleagueExplorer.tsx`

Layout — grouped by yacht, accordion pattern:

```
┌─────────────────────────────────────────────────┐
│ 🔍 Search colleagues...                        │
├─────────────────────────────────────────────────┤
│                                                 │
│ M/Y Horizon — 4 colleagues               ▼     │
│ ┌───────────────────────────────────────────┐   │
│ │ [Photo] John Smith                        │   │
│ │ Captain · 2 shared yachts                 │   │
│ │ ✅ Mutual endorsements    [Endorse ↗]     │   │
│ ├───────────────────────────────────────────┤   │
│ │ [Photo] Sarah Jones                       │   │
│ │ Chief Stew · 1 shared yacht               │   │
│ │ ⬜ No endorsement yet     [Endorse ↗]     │   │
│ └───────────────────────────────────────────┘   │
│                                                 │
│ M/Y Atlas — 2 colleagues                 ▶     │
│                                                 │
│ M/Y Seahorse — 1 colleague               ▶     │
│                                                 │
└─────────────────────────────────────────────────┘
```

**State:**
- `searchQuery: string` — filters colleagues by name
- `expandedYachts: Set<string>` — which yacht groups are expanded (first group open by default)

**Colleague card details:**
- Photo (36px circle), name, primary role
- Shared yacht count (if > 1: "2 shared yachts")
- Endorsement status:
  - "Mutual endorsements" (both directions) — teal text
  - "Endorsed you" — teal text
  - "You endorsed them" — teal text
  - "No endorsement yet" — muted text
- "Endorse" quick-action button: navigates to `/app/endorsement/request?colleague={id}&yacht={yacht_id}`
  - Only shown when: no endorsement from current user to this colleague on this yacht
  - Hidden when: endorsement already exists for this yacht pair
- Tap card body → navigate to `/u/[handle]`

**Props:**
```typescript
interface ColleagueExplorerProps {
  yachtGroups: Array<{
    yacht: { id: string; name: string }
    colleagues: Array<{
      id: string
      name: string
      handle: string | null
      photoUrl: string | null
      role: string | null
      theirRoleOnYacht: string | null
      sharedYachtCount: number
      endorsementStatus: 'mutual' | 'endorsed_you' | 'you_endorsed' | null
      canEndorse: boolean  // no existing endorsement from viewer → colleague on this yacht
    }>
  }>
}
```

### 3.4 — Summary Stats

At the top of the page, before the search bar:

```
┌────────────┐ ┌────────────┐ ┌────────────┐
│    23      │ │     6      │ │    14      │
│ colleagues │ │   yachts   │ │endorsements│
└────────────┘ └────────────┘ └────────────┘
```

- **Colleagues:** total unique colleagues
- **Yachts:** total yachts from shared_yachts
- **Endorsements:** count of endorsements where current user is endorser or recipient

---

## Part 4: Sea Time Display

### 4.1 — Profile Sea Time Card

**File to modify:** Profile page (the exact file depends on Sprint 11's final structure — likely `app/(protected)/app/profile/page.tsx`)

Add a sea time summary card to the profile page, positioned after the hero card or in the stats area.

**Data fetch:** Add `supabase.rpc('get_sea_time', { p_user_id: user.id })` to the profile page's `Promise.all()`.

**Component:** `components/profile/SeaTimeSummary.tsx`

```
┌─────────────────────────────────────────────────┐
│ ⚓ Sea Time                                     │
│                                                 │
│ 4 years, 3 months at sea                        │
│ across 6 yachts                                 │
│                                         View ▸  │
└─────────────────────────────────────────────────┘
```

- Shows total sea time formatted as years + months (from `total_days / 365.25` and remainder)
- Shows yacht count
- "View" link → `/app/profile/sea-time` (breakdown page)
- Hidden if user has 0 attachments

Props:
```typescript
interface SeaTimeSummaryProps {
  totalDays: number
  yachtCount: number
}
```

### 4.2 — Sea Time Breakdown Page

**New page:** `app/(protected)/app/profile/sea-time/page.tsx`

Server component. Calls `get_sea_time_detailed(user.id)`.

```
┌─────────────────────────────────────────────────┐
│ ← Sea Time                                     │
│                                                 │
│ Total: 4 years, 3 months (1,553 days)           │
│                                                 │
│ ┌───────────────────────────────────────────┐   │
│ │ M/Y Horizon              ⚓ Current       │   │
│ │ Captain · Jan 2024 – Present              │   │
│ │ 1 year, 2 months (428 days)               │   │
│ ├───────────────────────────────────────────┤   │
│ │ M/Y Atlas                                 │   │
│ │ Chief Officer · Mar 2022 – Dec 2023       │   │
│ │ 1 year, 9 months (640 days)               │   │
│ ├───────────────────────────────────────────┤   │
│ │ M/Y Seahorse                              │   │
│ │ 2nd Officer · Jun 2020 – Feb 2022         │   │
│ │ 1 year, 8 months (485 days)               │   │
│ └───────────────────────────────────────────┘   │
└─────────────────────────────────────────────────┘
```

- Each row: yacht name, role, date range, duration
- Current positions marked with "Current" badge
- Sorted by `started_at DESC` (most recent first)
- Total at top: formatted as years + months + raw days
- BackButton to `/app/profile`

**Component:** `components/profile/SeaTimeBreakdown.tsx` — pure display, server-rendered.

### 4.3 — Public Profile Sea Time + Mutual Colleagues

Also show total sea time on the public profile page (`/u/[handle]`):

- Add `supabase.rpc('get_sea_time', { p_user_id: profile.id })` to the public profile's data fetching
- Display as a stat line: "4 years, 3 months at sea · 6 yachts"
- Position: below the identity section or alongside role/department info
- Only shown if `total_days > 0`

### 4.4 — Mutual Colleagues Social Proof (2nd-Degree)

When a logged-in user views someone else's profile, show which of their own colleagues have also worked with this person — and make each one clickable.

**Data fetch:** Add to the public profile's `Promise.all()`:
1. `supabase.rpc('get_mutual_colleagues', { p_viewer_id: user.id, p_profile_id: profile.id })` — returns mutual colleague IDs
2. Then fetch profiles for those IDs: `supabase.from('users').select('id, full_name, display_name, profile_photo_url, handle').in('id', mutualIds)`

**Display — collapsed state:**

```
┌─────────────────────────────────────────────────┐
│ [Photo] Sam Chen                                │
│ Chief Stewardess · Interior                     │
│ 4 years, 3 months at sea · 6 yachts             │
│                                                 │
│ 👥 3 of your colleagues have worked with Sam  ▼ │
└─────────────────────────────────────────────────┘
```

**Display — expanded (tap the line):**

```
┌─────────────────────────────────────────────────┐
│ 👥 3 of your colleagues have worked with Sam  ▲ │
│                                                 │
│ [Photo] John Smith · Captain           View ▸   │
│ [Photo] Maria Santos · 2nd Stew        View ▸   │
│ [Photo] Alex Turner · Deckhand         View ▸   │
└─────────────────────────────────────────────────┘
```

- Tap a colleague → navigates to `/u/[handle]` → you see their profile → see their yachts → tap a yacht → see its crew → keep exploring
- This is a graph entry point, not just a stat
- Each colleague shown with: small photo (28px), name, role, "View" link to their profile

**Display rules:**
- Only shown when viewer is logged in
- Shown for BOTH direct colleagues and non-direct contacts (useful either way — "you both know these people")
- Hidden when count is 0
- Position: below the hero section, before endorsements

**Component:** `components/profile/MutualColleagues.tsx` — client component (handles expand/collapse).

```typescript
interface MutualColleaguesProps {
  profileName: string  // first name of profile owner
  mutuals: Array<{
    id: string
    name: string
    handle: string | null
    photoUrl: string | null
    role: string | null
  }>
}
```

---

## Part 5: Yacht Search Improvements

### 5.1 — Improved Fuzzy Matching UX in YachtPicker

**File to modify:** `components/yacht/YachtPicker.tsx`

Current behavior: fuzzy search via `search_yachts()` RPC with similarity threshold. Sprint 12 improvements:

- Lower the minimum similarity threshold for suggestions (currently likely 0.3, try 0.2 for broader matches)
- Show similarity score visually (e.g., "Strong match" / "Possible match") for results above 0.6 vs below
- Better empty state when no matches: "No yachts found matching '[query]'. You can create a new one below."
- Debounce already exists (300ms) — keep it

### 5.2 — Natural Deduplication via Crew Count Signal

No merge tool needed. The yacht with more crew is naturally canonical — users just need to see that signal.

When creating a new yacht and near-misses are found:

Current behavior: shows similar yachts with a "use existing" or "create new" choice.

Enhancement — make the "right" choice obvious by showing crew count:

```
┌─────────────────────────────────────────────────┐
│ ⚠️ Similar yacht found                          │
│                                                 │
│ You entered:        Existing yacht:             │
│ "MY Example"        "M/Y Example"               │
│                     Motor · 62m · Cayman Islands │
│                     12 crew · Established ✓      │
│                                                 │
│ [Use existing yacht]     [Create new anyway]    │
└─────────────────────────────────────────────────┘
```

- **Crew count is the key signal** — a yacht with 12 crew is obviously the real entry. Show this prominently.
- Show established status — an established yacht has been verified by usage threshold
- Add crew count to the comparison by querying `yacht_crew_count()` for near-miss results
- Sort near-miss results by crew count descending (most popular first)
- Log the decision to `yacht_near_miss_log` (existing behavior, keep it)

**Also show crew count in search results** — when searching for a yacht to attach, each result should show "M/Y Example · Motor · 62m · 12 crew". This naturally guides users toward the canonical entry without any merge infrastructure.

### 5.3 — Established Yacht Badge

The `is_established` flag is already displayed on the yacht detail page. Sprint 12 enhancement:

- Show established badge in YachtPicker search results (next to yacht name)
- Show established badge on crew cards when viewing yacht info on profile
- Consistent styling with the yacht detail page badge

---

## Removed From Original Draft

| Item | Reason |
|------|--------|
| Yacht merge flow (`POST /api/yacht/merge`) | Not needed. The graph self-heals: the yacht entry with more crew attached is naturally canonical. Improved duplicate detection UX in YachtPicker (showing crew count) steers users to the right entry. Prevention > correction. |
| API routes for read operations | Codebase pattern uses server-component queries via `createClient()`, not API routes for reads. Only mutations use API routes. |
| Gap analysis (periods between yachts) | Founder decision: out for now. Can be computed from sea time breakdown data later if needed. |
| D3.js / force-directed graph | Correctly excluded in original draft. Clean list/accordion view is sufficient for MVP. |

---

## Part 6: Shared Utilities

### 6.1 — Sea Time Formatter

**File to create:** `lib/sea-time.ts`

Sea time is displayed in 3 places (profile card, breakdown page, public profile). Use a shared formatter:

```typescript
export function formatSeaTime(totalDays: number): {
  years: number
  months: number
  displayShort: string   // "4y 3mo"
  displayLong: string    // "4 years, 3 months"
  displayFull: string    // "4 years, 3 months (1,553 days)"
} {
  const years = Math.floor(totalDays / 365.25)
  const months = Math.floor((totalDays % 365.25) / 30.44)
  return {
    years,
    months,
    displayShort: years > 0 ? `${years}y ${months}mo` : `${months}mo`,
    displayLong: [
      years > 0 ? `${years} ${years === 1 ? 'year' : 'years'}` : null,
      months > 0 ? `${months} ${months === 1 ? 'month' : 'months'}` : null,
    ].filter(Boolean).join(', ') || 'Less than a month',
    displayFull: `${/* displayLong */ ''} (${totalDays.toLocaleString()} days)`,
  }
}
```

Use this everywhere sea time is formatted. Do not duplicate the logic.

---

## Part 7: Loading, Error, and Empty States

### 7.1 — Yacht Detail Page

**Loading:** Use `PageTransition` wrapper (existing component) for fade-in on load. Since this is a server component, the page renders after all queries resolve — no skeleton needed unless queries are slow. If performance becomes an issue, convert stats/endorsement sections to streaming with `<Suspense>`.

**Error handling:** Wrap the `Promise.all()` in try/catch. If critical queries fail (yacht, crew), redirect to 404. If non-critical queries fail (endorsements, stats, colleagues), render the page without those sections (graceful degradation — show crew list without badges, hide endorsement section, show crew count only in stats).

### 7.2 — Colleague Explorer

**Loading:** Use `PageTransition` wrapper. Show a loading skeleton for the accordion groups while data fetches.

**Empty state:** If user has 0 colleagues, show empty state with message: "Your colleague list will populate once you and a crewmate have both attached the same yacht." Use `SaltyEmptyState` (from Sprint 11) if available, otherwise standard `EmptyState` component from AudienceTabs.

**Error state:** If `get_colleagues()` fails, show error message: "Couldn't load your network. Please try again." with retry button.

### 7.3 — Sea Time

**Profile card:** Hidden if user has 0 attachments (no empty state — card simply doesn't render).

**Breakdown page:** If user navigates to `/app/profile/sea-time` directly via URL with 0 attachments, show empty state: "Add a yacht to your profile to start tracking sea time." with CTA linking to `/app/attachment/new`. Use `SaltyEmptyState` if available.

### 7.4 — Accessibility Notes

- Accordion expand/collapse: Use `aria-expanded`, `aria-controls`, `aria-label` on accordion triggers. 44px minimum touch target height on section headers.
- Endorsement status indicators: Always render text labels alongside icons (not icon-only). Screen readers must be able to read the status.
- Stats row: Use `<dl>` (definition list) with `<dt>` for labels, `<dd>` for values. Provides semantic meaning for screen readers.
- Crew card links: Use `aria-label="View {name}'s profile"` on tappable crew cards.
- Search input: Use `<label>` (can be visually hidden) with `htmlFor` association. Result updates use `aria-live="polite"`.

---

## Part 8: Pre-Implementation Verification

Before starting app code, verify these assumptions:

### 8.1 — Endorsement Request Route Pre-fill

The "Endorse" quick-action in colleague explorer links to `/app/endorsement/request?colleague={id}&yacht={yacht_id}`. **Before building the ColleagueExplorer, verify:**

1. Does `/app/endorsement/request` accept `?colleague` and `?yacht` query params?
2. If yes, does it pre-fill the endorsement request form?
3. If no, add query param handling to the endorsement request page as part of Sprint 12.

The endorsement request flow MUST enforce `are_coworkers_on_yacht()` on the final yacht selected (D-009). The pre-fill is convenience, not a security boundary.

### 8.2 — Migration Smoke Test

After applying the migration to dev Supabase:

1. Call `get_sea_time_detailed(dev_user_id)` from SQL editor — verify it returns correct per-yacht rows with accurate day counts
2. Call `get_yacht_endorsement_count(some_yacht_id)` — verify count matches manual check
3. Call `get_yacht_avg_tenure_days(some_yacht_id)` — verify reasonable average
4. Test edge cases: user with 0 attachments (should return empty), yacht with 0 crew (should return 0)

### 8.3 — Sprint 11 File Paths

Before starting Parts 4 (sea time on profile) and 3 (colleague explorer), confirm:
- Actual profile page file path (Sprint 11 may restructure)
- Whether `SaltyEmptyState` component exists and its import path
- Whether section colours (coral, navy, amber) are available as CSS vars

---

## Part 9: Attachment Transfer

### 9.1 — Database (in Sprint 12 migration)

Two new tables + two RPCs. See `supabase/migrations/20260322000010_attachment_transfers_reports.sql` for the complete SQL.

**`attachment_transfers`** — immutable audit log. One row per transfer. Records `from_yacht_id`, `to_yacht_id`, which endorsements moved vs skipped, and optional reason.

**`reports`** — generic user flagging. CHECK constraints on `target_type` (user/endorsement/yacht/attachment), `category` (spam/harassment/fake_identity/etc), `status` (pending/reviewing/resolved/dismissed). Partial unique index prevents duplicate active reports. No UI in Sprint 12 — foundation only.

**`transfer_attachment()`** RPC — atomic operation:
1. Validates caller owns the attachment (`auth.uid()`, `FOR UPDATE` lock)
2. Validates target yacht exists and is different
3. Enforces 5-transfer lifetime limit per attachment
4. Updates `attachments.yacht_id`
5. If `p_cascade_endorsements = true`: moves endorsements where both parties have attachments to the destination yacht. Endorsements where the other party has NO attachment to the destination are skipped (stay on old yacht).
6. Moves pending `endorsement_requests` when cascade is enabled
7. Logs everything to `attachment_transfers`
8. Returns structured JSONB: `{ success, transfer_id, endorsements_moved, endorsements_skipped, skipped_endorsement_ids }`

**`submit_report()`** RPC — validates target existence, checks for duplicate active reports, inserts.

### 9.2 — API Route

**File to create:** `app/api/attachment/transfer/route.ts`

```typescript
// POST /api/attachment/transfer
// Body: { attachmentId, toYachtId, cascadeEndorsements, reason? }
// Calls transfer_attachment() RPC
// Returns: RPC result (success/failure with details)
```

Thin wrapper around the RPC. Validates request body with Zod. Returns the RPC response directly.

### 9.3 — Transfer UI on Attachment Edit Page

**File to modify:** `app/(protected)/app/attachment/[id]/edit/page.tsx`

Add a "Wrong yacht?" section between "Save changes" and the danger zone:

```
┌─────────────────────────────────────┐
│  Save changes                       │  ← existing primary CTA
├─────────────────────────────────────┤
│                                     │
│  Wrong yacht?                       │
│  If this role was on a different    │
│  vessel, you can move it without    │
│  losing your dates.                 │
│                                     │
│  [ Move to a different yacht ]      │  ← ghost variant button
│                                     │
├─────────────────────────────────────┤
│  Remove this yacht                  │  ← existing danger zone
└─────────────────────────────────────┘
```

### 9.4 — Transfer BottomSheet Flow

**File to create:** `components/attachment/TransferSheet.tsx` — client component

**Step 1: Yacht selection** — reuses YachtPicker inside a BottomSheet. User searches for destination yacht.

**Step 2: Impact preview** — shows before user confirms:

```
┌─────────────────────────────────────┐
│  Confirm transfer                   │
│                                     │
│  M/Y Lady M  ──→  M/Y Aqua Blue    │
│                                     │
│  What stays the same                │
│  · Your role: Chief Stewardess      │
│  · Your dates: Mar 2022 – Nov 2023  │
│                                     │
│  What changes                       │
│  · 2 endorsements will move         │
│  · You'll join 8 crew on Aqua Blue  │
│  · You'll leave 12 crew on Lady M   │
│                                     │
│  ⚠ 1 endorsement can't move        │  ← only if skipped > 0
│  (endorser not on Aqua Blue)        │
│                                     │
│  ☑ Move my endorsements too         │  ← cascade checkbox, default on
│                                     │
│  [ Confirm transfer ]               │
│  Cancel                             │
└─────────────────────────────────────┘
```

**Step 3: Success** — sheet closes, toast "Moved to M/Y Aqua Blue", edit page reloads with new yacht name.

**Data needed for impact preview** (fetched after yacht selection, before showing preview):
- Destination yacht crew count: `yacht_crew_count(to_yacht_id)`
- Source yacht crew count: already known from page context
- Endorsement count that would move: count endorsements on this yacht involving this user, cross-referenced with destination yacht attachments
- This can be a preview RPC or computed client-side from existing data

Props:
```typescript
interface TransferSheetProps {
  attachmentId: string
  currentYachtId: string
  currentYachtName: string
  roleLabel: string
  startDate: string
  endDate: string | null
  onTransferComplete: () => void  // triggers page reload
}
```

### 9.5 — Edge Cases Handled

| Edge case | Handling |
|-----------|----------|
| Transfer to same yacht | RPC rejects: `same_yacht` error |
| Attachment already deleted | RPC rejects: `attachment_not_found` |
| Target yacht doesn't exist | RPC rejects: `target_yacht_not_found` |
| Transfer limit reached (5) | RPC rejects: `transfer_limit_reached`. UI shows message. |
| Endorser has no attachment to destination | Endorsement stays on old yacht. Returned in `skipped_endorsement_ids`. Shown in UI as warning. |
| User has existing attachment on destination yacht (different dates) | Allowed — different time periods on the same yacht are valid. |
| User has overlapping dates on destination yacht | Allowed — date overlap validation is not enforced (same as regular attachment creation). |
| Pending endorsement requests on old yacht | Moved to new yacht when cascade is on (no coworker constraint — endorsement not yet written). |
| Yacht establishment status changes | Handled automatically — `check_yacht_established` is computed on access, not stored. `is_established = true` is a one-way ratchet (OR clause). |

---

## Part 10: Reporting Foundation (Database Only)

The `reports` table and `submit_report()` RPC ship in the Sprint 12 migration. No UI is built. This is foundation work so reporting can be added in a future sprint without a migration.

**Architecture note for Sprint 12 crew cards:** The `CrewCard` component (Part 2.3) should accept an optional `menuItems` or `actions` prop for future extensibility. When reporting ships, an overflow menu (three-dot) can be added to crew cards without restructuring the component. Same applies to `YachtEndorsements` cards (Part 2.5).

---

## Files to Create / Modify

### New files
```
supabase/migrations/YYYYMMDD000001_sprint12_yacht_graph.sql
supabase/migrations/20260322000010_attachment_transfers_reports.sql  (already created)
lib/sea-time.ts
components/yacht/CrewCard.tsx
components/yacht/YachtEndorsements.tsx
components/network/ColleagueExplorer.tsx
components/profile/SeaTimeSummary.tsx
components/profile/SeaTimeBreakdown.tsx
components/profile/MutualColleagues.tsx
components/attachment/TransferSheet.tsx
app/(protected)/app/network/colleagues/page.tsx
app/(protected)/app/profile/sea-time/page.tsx
app/api/attachment/transfer/route.ts
```

### Modified files
```
app/(protected)/app/yacht/[id]/page.tsx         — enhanced queries, crew split, stats, endorsements
app/(protected)/app/network/page.tsx            — "Explore your network" link in colleagues tab
app/(protected)/app/profile/page.tsx            — sea time summary card
app/u/[handle]/page.tsx (or equivalent)         — sea time stat line on public profile
components/yacht/YachtPicker.tsx                 — fuzzy match UX improvements, duplicate detection
components/audience/AudienceTabs.tsx             — "Explore" link in colleagues section
app/(protected)/app/endorsement/request/page.tsx — add query param handling for pre-fill (if not already supported)
app/(protected)/app/attachment/[id]/edit/page.tsx — "Wrong yacht?" section with transfer trigger
CHANGELOG.md                                    — update before commit
docs/modules/*.md                               — update affected modules
```

---

## Build Order

0. **Pre-flight** — verify Sprint 11 file paths, confirm endorsement request pre-fill support, confirm SaltyEmptyState availability
1. **Migration** — new RPCs (`get_sea_time_detailed`, `get_yacht_endorsement_count`, `get_yacht_avg_tenure_days`, `get_mutual_colleagues`), fix existing `get_sea_time()`, handle index → apply to dev Supabase via `supabase db push` or dashboard → **smoke test all 4 RPCs in SQL editor before proceeding**
2. **Shared utilities** — `lib/sea-time.ts` formatter
3. **Yacht detail page** — enhanced queries, crew split, CrewCard component, stats row, YachtEndorsements component, loading/error states
4. **Sea time** — SeaTimeSummary on profile, SeaTimeBreakdown page, public profile stat line
5. **Colleague explorer** — ColleagueExplorer component, new page, entry points from AudienceTabs + profile, empty state
6. **Endorsement request pre-fill** — add query param handling to `/app/endorsement/request` if not already supported
7. **Yacht search** — YachtPicker improvements, duplicate detection UX, established badge (deferrable)
8. **Attachment transfer** — migration tables + RPC, API route, transfer UI on attachment edit page (BottomSheet + YachtPicker + impact preview)
9. **Polish** — cross-page navigation consistency, responsive checks at 375px, accessibility audit
10. **CHANGELOG + module docs** — update before commit

---

## Decision Log

| ID | Decision | Rationale |
|----|----------|-----------|
| D-S12-01 | No merge tool — natural deduplication via crew count | The yacht with more crew is naturally canonical. Showing crew count in YachtPicker steers users to the right entry. Prevention > correction. Merge tooling not needed at current scale. |
| D-S12-02 | Server-component queries, not API routes for reads | Matches codebase pattern. All existing pages (yacht, network, profile) fetch data server-side via `createClient()`. API routes are for mutations only. |
| D-S12-03 | Mutual colleagues as social proof on profiles, not a discovery page | "3 of your colleagues have worked with Sam" — expand to see who, tap to explore the graph. The graph is the navigation: profile → yacht → crew → profile. No separate graph visualization needed. |
| D-S12-04 | Colleague explorer as sub-page, not tab replacement | `/app/network/colleagues` is a richer view than what fits in a tab. Keeps existing AudienceTabs clean. Link connects them. |
| D-S12-05 | Sea time as summary card + breakdown page, not inline table | Keeps profile page clean. Detailed breakdown gets its own page for users who want it. |
| D-S12-06 | Show endorsement cross-references on yacht page | Makes the yacht graph tangible — you see not just who worked here, but what they said about each other. Unique to YachtieLink. |
| D-S12-07 | "Endorse" quick-action in colleague explorer links to existing request flow | Reuses `/app/endorsement/request` rather than building inline endorsement writing. Keeps scope tight. |
| D-S12-08 | Light mode only in exit criteria | Dark mode was sidelined in Sprint 10.3 (force light mode). Sprint 12 should not add dark mode work. |
| D-S12-09 | Sea time is public information | Sea time is derived from attachments which are already visible on yacht detail pages. No additional privacy gating needed — any user can see crew lists on any yacht. RPC uses `security definer` for codebase consistency. |
| D-S12-10 | Endorsement cross-refs respect D-011 | Endorsement section on yacht page uses neutral framing ("Endorsements between crew on this yacht"). Section is hidden if 0 endorsements — no "no endorsements yet" messaging that could imply absence is negative. |
| D-S12-11 | All RPCs use `security definer` | Matches codebase convention. All existing RPCs (`get_colleagues`, `get_sea_time`, `search_yachts`, `are_coworkers_on_yacht`) use `security definer`. Sprint 12 follows suit. |
| D-S12-12 | Attachment transfer: endorsements move, not soft-delete | Endorsements follow the attachment to the new yacht IF the other party also has an attachment there. Otherwise they stay on the old yacht (historically accurate, not orphaned). Soft-deleting destroys value — the endorsement was about the work, not the database row. |
| D-S12-13 | Skipped endorsements stay alive on old yacht | If endorser has no attachment to destination yacht, their endorsement stays on the original yacht. More useful than silent deletion. UI shows which endorsements couldn't move. |
| D-S12-14 | Transfer limit: 5 per attachment, no cooldown | Prevents abuse without being restrictive. Users correcting mistakes shouldn't wait 7 days. Lifetime limit of 5 is sufficient at current scale. |
| D-S12-15 | Transfer is invisible to other users | No notifications to crew on either yacht. The transfer is a correction, not a departure/arrival. Endorser notifications for skipped endorsements are a future enhancement. |
| D-S12-16 | "Wrong yacht?" on attachment edit page only | One entry point. Uses existing BottomSheet + YachtPicker. Not on yacht detail page (that's a community view, not a personal edit surface). Not a primary action — most users never need it. |
| D-S12-17 | Endorsement cascade is opt-in | The `transfer_attachment()` RPC takes `p_cascade_endorsements` flag. UI presents this as a checkbox so users understand what moves. Default: true (most users want endorsements to follow). |
| D-S12-18 | Reports table ships empty (no UI) | Foundation for future reporting/flagging. Tables + RPC + RLS ready. Crew cards in Sprint 12 should be built with extensible props so an overflow menu / report button can be added later without restructuring. |
| D-S12-19 | Yacht name timeline table (foundation, no UI) | Yachts change names frequently in the industry. `yacht_names` table tracks the full history so old names resolve to the same entity (kills a class of duplicates), attachments can show the name at time of service, and yacht pages can show "formerly M/Y Dilbar". Seeded from existing `yachts.name`. `yachts.name` remains the denormalized current display name. Name editing UI is a future sprint. |

---

## Deferred Review Findings (Sprint 12 Pre-Commit Review)

Review run: 2026-03-22. Phase 1 (Sonnet) + Phase 2 (Opus). 13 findings total, 10 fixed, 3 deferred below.

| ID | Finding | Why Deferred | Future Fix |
|----|---------|-------------|------------|
| DRF-01 | `transfer_attachment()` leaves completed `endorsement_requests` pointing at old yacht. Accepted/pending requests move correctly, but requests with `status = 'accepted'` (endorsement already written) keep the old `yacht_id`. | Not a data-loss bug — the endorsement itself transfers, and the completed request is historical record. Fixing could break the audit trail. | If we add a request history UI, consider migrating completed requests to match their endorsement's yacht_id. Low priority. |
| DRF-02 | `get_mutual_colleagues()` RPC exists in migration but is not called by any TypeScript code. The public profile page computes mutual colleagues client-side via multi-step attachment joins. | Created for future use and to establish the contract. The client-side logic works correctly today. | Wire up the RPC to replace the manual join in `/u/[handle]/page.tsx` when we refactor public profiles. Reduces client complexity and query count. |
| DRF-03 | YachtPicker fires N+1 RPC calls per search keystroke — up to 8 parallel `yacht_crew_count` RPCs after `search_yachts` returns. On slow mobile connections this adds 200-500ms latency. | Works correctly, just suboptimal. Debounce (300ms) limits blast radius. Fixing requires a new batch RPC or enriched search function. | Create `search_yachts_enriched()` RPC that returns crew count and `is_established` in one query. Or add `get_yacht_crew_counts(uuid[])` batch variant. |

---

## PostHog Events

| Event | Properties | When |
|-------|-----------|------|
| `yacht_page.viewed` | `{ yacht_id, crew_count, has_endorsements, viewer_is_crew }` | User views yacht detail page |
| `yacht_page.crew_card_tapped` | `{ yacht_id, target_user_id }` | User taps a crew card to view profile |
| `colleague_explorer.viewed` | `{ colleague_count, yacht_count }` | User opens colleague explorer page |
| `colleague_explorer.endorse_tapped` | `{ colleague_id, yacht_id }` | User taps "Endorse" quick-action |
| `colleague_explorer.searched` | `{ query_length }` | User searches within colleague explorer |
| `sea_time.viewed` | `{ total_days, yacht_count }` | User views sea time breakdown page |
| `attachment.transfer_started` | `{ attachment_id, from_yacht_id }` | User taps "Move to a different yacht" |
| `attachment.transfer_completed` | `{ attachment_id, from_yacht_id, to_yacht_id, endorsements_moved, endorsements_skipped }` | Transfer confirmed and executed |

---

## Success Criteria

- [ ] Migration applies cleanly to dev Supabase; `get_sea_time_detailed()`, `get_yacht_endorsement_count()`, `get_yacht_avg_tenure_days()` return correct results
- [ ] Yacht detail page shows current crew and alumni in separate sections
- [ ] Crew cards link to `/u/[handle]` for crew members with handles
- [ ] Crew cards show "Also worked with you on..." badge when viewer shares other yachts with that crew member
- [ ] Crew cards show endorsement relationship indicator (endorsed you / you endorsed / mutual)
- [ ] Yacht stats row shows crew count, avg tenure (months), endorsement count
- [ ] Endorsement cross-references section shows endorsements on the yacht with expand/collapse
- [ ] Colleague explorer page loads at `/app/network/colleagues`
- [ ] Colleagues grouped by yacht in accordion pattern, first group expanded
- [ ] Colleague search filters by name within the page
- [ ] "Endorse" quick-action navigates to endorsement request flow with correct pre-fill
- [ ] Mutual colleagues shows on public profiles: "X of your colleagues have worked with [name]"
- [ ] Mutual colleagues expands to show actual people with photos, tappable to their profiles
- [ ] `get_mutual_colleagues()` returns correct results and excludes the profile owner
- [ ] YachtPicker search results show crew count; duplicate detection dialog shows crew count prominently
- [ ] Every yacht name across all pages (profile, public profile, sea time, endorsements) links to `/app/yacht/[id]`
- [ ] Every crew member card links to `/u/[handle]` — no dead ends in the graph
- [ ] Sea time summary card shows on profile page (hidden if 0 attachments)
- [ ] Sea time breakdown page shows per-yacht details with correct date arithmetic
- [ ] Public profile shows total sea time stat line
- [ ] YachtPicker fuzzy matching shows broader results with match quality indicator
- [ ] Duplicate detection comparison shows crew count and established status
- [ ] All new pages work at 375px width (mobile-first) — stats row, crew cards, accordion headers all fit
- [ ] No performance regressions — `Promise.all()` on all independent queries
- [ ] GRANT EXECUTE applied to all new RPCs
- [ ] RPCs smoke-tested in SQL editor before app code (date arithmetic verified with known data)
- [ ] Endorsement request pre-fill works: navigating from colleague explorer correctly pre-fills yacht + colleague
- [ ] `are_coworkers_on_yacht()` enforced on endorsement submission (not just pre-fill)
- [ ] Empty states render correctly: colleague explorer with 0 colleagues, sea time breakdown with 0 attachments
- [ ] Non-critical query failures degrade gracefully (yacht page renders without endorsement section if that query fails)
- [ ] Accessibility: accordion has aria-expanded, endorsement status has text labels, stats use semantic HTML
- [ ] `formatSeaTime()` utility used in all 3 sea time display locations (no duplicated logic)
- [ ] `transfer_attachment()` RPC validates ownership, enforces 5-transfer limit, moves endorsements conditionally
- [ ] Transfer UI: "Wrong yacht?" section on attachment edit page with BottomSheet flow
- [ ] Transfer impact preview shows: what stays (role, dates), what changes (endorsements moved/skipped, crew counts)
- [ ] Skipped endorsements (endorser not on destination yacht) stay on old yacht, shown to user
- [ ] `reports` and `attachment_transfers` tables exist with RLS (reports: no UI yet, foundation only)
- [ ] `submit_report()` RPC validates target existence and prevents duplicate active reports
- [ ] Crew card component accepts extensible props for future overflow menu / report action
- [ ] CHANGELOG and module docs updated before commit

---
title: Save Yachts — Bookmark + Watch Yachts
status: ready
source: founder (2026-03-27, grilled 2026-04-03)
priority: P3 (after yacht pages are enriched)
modules: [network, notifications]
estimated_effort: 4-5 hours (Sonnet, high effort)
grill_me_date: 2026-04-03
depends_on: Sprint 12 (yacht graph foundation)
---

# Save Yachts — Bookmark + Watch Yachts

## Problem

Users can save crew profiles but not yachts. Crew tracking boats they want to work on, and recruiters tracking fleet movements, have no way to bookmark or get notified about yacht activity.

## Grill-me Decisions (2026-04-03)

| # | Question | Decision |
|---|----------|----------|
| 1 | Separate table or polymorphic? | **(a)** Separate `saved_yachts` table. Data shapes diverge from saved profiles (yacht metadata vs relationship context). Two focused tables > one polymorphic table with nullable columns. |
| 2 | Same page or separate? | **(a)** Same page, segmented. `/app/network/saved` gets "Crew \| Yachts" toggle. Users in research mode want everything in one place. |
| 3 | What does watching mean? | Extensible notification types. Ships with crew movement triggers (Phase 1). Schema supports adding review/gallery/detail triggers as yacht pages gain features in Phase 2/3. |

## Watch Notification Roadmap

The `notifications` table (from `watch-profile-notifications.md`) uses a `type` column. Yacht watch types expand as features ship:

| Phase | Notification type | Trigger |
|-------|------------------|---------|
| **Phase 1 (now)** | `watched_yacht_crew_joined` | New attachment created on the yacht |
| **Phase 1 (now)** | `watched_yacht_crew_departed` | Attachment end date set on the yacht |
| **Phase 2** | `watched_yacht_review_posted` | New review published (from yacht-reviews-glassdoor) |
| **Phase 2** | `watched_yacht_review_response` | Management responded to a review |
| **Phase 2** | `watched_yacht_details_updated` | Yacht name, specs, refit info changed |
| **Phase 2** | `watched_yacht_photo_added` | New gallery photo uploaded |
| **Phase 3** | `watched_yacht_trending` | Yacht hit activity threshold |
| **Phase 3** | `watched_yacht_rating_changed` | Aggregate rating shifted significantly |

**Schema design:** The `notifications.type` column check constraint should use a pattern that's easy to extend (e.g., prefix-based `watched_yacht_%`) rather than a fixed enum. Or just alter the constraint when adding types — migrations are cheap.

## Current State

| What | Where |
|------|-------|
| Saved profiles table | `saved_profiles` — `user_id`, `target_user_id`, `is_watching`, `notes`, `created_at` |
| Saved profiles page | `app/(protected)/app/network/saved/page.tsx` |
| Saved profiles client | `components/network/SavedProfilesClient.tsx` |
| Yacht detail (network) | `components/network/YachtAccordion.tsx` — where save button would go |
| Notifications table | Planned in `watch-profile-notifications.md` — not yet built |

## Spec

### Task 1: Migration — saved_yachts table

**File:** new migration

```sql
CREATE TABLE public.saved_yachts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  yacht_id UUID NOT NULL REFERENCES public.yachts(id) ON DELETE CASCADE,
  is_watching BOOLEAN DEFAULT false,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, yacht_id)
);

ALTER TABLE public.saved_yachts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "saved_yachts: user crud own" ON public.saved_yachts
  FOR ALL USING (user_id = auth.uid());

CREATE INDEX idx_saved_yachts_user ON public.saved_yachts(user_id);
CREATE INDEX idx_saved_yachts_yacht ON public.saved_yachts(yacht_id);
```

### Task 2: API routes

**File:** `app/api/saved-yachts/route.ts` (new)

- `GET` — list saved yachts for current user, join yacht data (name, type, length, flag_state, cover photo)
- `POST` — save a yacht (yacht_id). Toggle: if already saved, unsave.
- `PATCH` — update is_watching, notes

### Task 3: Save button on yacht UI

**File:** `components/network/YachtAccordion.tsx` (modify) and/or yacht detail views

- Heart/bookmark icon on yacht cards and yacht detail pages
- Filled = saved, outline = not saved
- Tap toggles save state (optimistic UI)
- Long press or secondary action → opens notes/watch options

### Task 4: Saved yachts tab on saved page

**File:** `app/(protected)/app/network/saved/page.tsx` (modify), `components/network/SavedYachtsClient.tsx` (new)

- Add "Crew | Yachts" segment toggle at top of saved page
- Yachts tab shows saved yacht cards:
  - Yacht name, type, length, flag state
  - Cover photo (if exists)
  - Current crew count (if available)
  - Watch toggle
  - Notes (tap to expand/edit)
- Navy section color (network)
- Empty state: "No saved yachts yet — save yachts from the Network tab to track them here."

### Task 5: Watch notification triggers

**File:** `lib/notifications/yacht-watch-triggers.ts` (new)

```typescript
export async function notifyYachtWatchers(
  supabase: SupabaseClient,
  yachtId: string,
  eventType: 'crew_joined' | 'crew_departed',
  details: { crewName?: string; role?: string }
): Promise<void>
```

- Find all users watching this yacht: `saved_yachts WHERE yacht_id = $1 AND is_watching = true`
- Exclude the user who triggered the event (don't notify yourself)
- Batch within 15-minute window (same pattern as profile watch notifications)
- Create notification in `notifications` table with type `watched_yacht_crew_joined` or `watched_yacht_crew_departed`

Wire triggers into:
- Attachment creation (new crew joins yacht)
- Attachment end date update (crew departs yacht)

**Depends on:** `notifications` table from `watch-profile-notifications.md` must exist first. If building in same session, create the notifications table migration before this one.

### Task 6: Extend notification types

**File:** notifications migration (modify check constraint)

Add yacht watch types to the `notifications.type` constraint:

```sql
ALTER TABLE public.notifications DROP CONSTRAINT IF EXISTS notifications_type_check;
ALTER TABLE public.notifications ADD CONSTRAINT notifications_type_check CHECK (type IN (
  -- Profile watch types
  'watched_profile_experience',
  'watched_profile_certification', 
  'watched_profile_endorsement',
  'watched_profile_availability',
  -- Yacht watch types (Phase 1)
  'watched_yacht_crew_joined',
  'watched_yacht_crew_departed'
  -- Phase 2: watched_yacht_review_posted, watched_yacht_review_response,
  --          watched_yacht_details_updated, watched_yacht_photo_added
  -- Phase 3: watched_yacht_trending, watched_yacht_rating_changed
));
```

## Edge Cases

- **User saves a yacht they work on** — valid (track your own yacht's crew changes while you're away on rotation)
- **Yacht deleted/merged** — `ON DELETE CASCADE` handles cleanup. Phase 2 yacht merging should transfer saved_yacht records to the canonical entity.
- **Notification volume** — a yacht with 20 watchers and 5 crew changes in a week = 100 notifications. Batching by 15-minute window helps. At scale, may need a queue.
- **Yacht with no detail page yet** — saved yacht card shows basic info from the `yachts` table (name, type, length). No link to a detail page until yacht pages are built in Phase 2.
- **Watch without notifications table** — if this ships before `watch-profile-notifications.md`, the watch toggle exists but doesn't trigger notifications. Toggle still useful as a filter ("show only watched yachts"). Wire notifications when the table exists.

## Dependencies

- Sprint 12 (yacht graph foundation) — yacht detail pages should exist for meaningful save UX
- `watch-profile-notifications.md` — notifications table needed for watch triggers (can ship save/bookmark without it, add notifications later)

## Not in scope

- Folders for saved yachts (save profiles has this planned — defer for yachts too)
- Yacht comparison view (save two yachts, compare side-by-side)
- Shared saved lists (recruiter shares their yacht shortlist with a colleague)
- Phase 2/3 notification types (added via migration when those features ship)

---
title: Colleague Graph Explorer — Public Profile Page
status: ready
source: founder (multiple sessions)
priority: medium
modules: [public-profile, network]
estimated_effort: 4-5 hours (Sonnet, high effort)
grill_me_date: 2026-04-03
---

# Colleague Graph Explorer — Public Profile Page

## Problem

The public profile stats tile shows "worked with 35 colleagues" but it's not tappable. The yacht graph — YachtieLink's core social proof network — is unexplorable from the public profile. Captains and agents checking a crew member can't see who they've worked with or who endorses them.

## Current State

| What | Where |
|------|-------|
| Colleague count (public) | `app/(public)/u/[handle]/page.tsx:86-98` — counts distinct user_ids sharing yachts |
| Colleague RPC (private) | `get_colleagues(p_user_id)` in `supabase/migrations/20260313000004_functions.sql:169` |
| Network tab grouping | `components/network/NetworkUnifiedView.tsx` — yacht accordion with ColleagueRow |
| Colleague row renderer | `components/network/ColleagueRow.tsx` — avatar, name, role, endorsement badge |
| Yacht accordion | `components/network/YachtAccordion.tsx` — collapsible yacht group |
| Stats tile | `components/public/bento/tiles/StatsTile.tsx` — "worked with N colleagues" |

## Grill-me Decisions (2026-04-03)

| # | Question | Decision |
|---|----------|----------|
| 1 | Modal, dedicated page, or link to Network tab? | **(b)** Dedicated page at `/u/{handle}/colleagues`. Modals get crowded with 35+ colleagues. Page is linkable/shareable. Follows `/u/{handle}/experience` pattern. |
| 2 | Public or authenticated? | **Public.** Colleague list is social proof — captains/agents need this without logging in. Data is derivable from public employment history already. |
| 3 | Show endorsement status? | **Yes, and explorable.** Endorsement badges visible per colleague (★ endorsed). Tapping navigates to the endorsement or the colleague's profile. "12 colleagues, 8 endorsed" is powerful signal. |
| 4 | Data query approach | **(a)** New `SECURITY DEFINER` RPC: `get_public_colleagues(p_handle text)`. Returns colleagues grouped by yacht in one call. Respects visibility settings server-side. Avoids N+1 client queries. |
| 5 | Show all or paginate? | **(a)** Show all, yacht accordion pattern. Most recent yacht expanded, older ones collapsed. Reuses existing `YachtAccordion` component. Full history explorable. |
| 6 | Back navigation | Contextual back button "← Profile" using scroll-restoration pattern (see `scroll-restoration-back-nav.md`). |

## Spec

### Task 1: New RPC — `get_public_colleagues`

**File:** new migration

```sql
CREATE OR REPLACE FUNCTION get_public_colleagues(p_handle TEXT)
RETURNS TABLE (
  colleague_id UUID,
  colleague_name TEXT,
  colleague_handle TEXT,
  colleague_avatar_url TEXT,
  colleague_primary_role TEXT,
  yacht_id UUID,
  yacht_name TEXT,
  yacht_type TEXT,
  colleague_role_on_yacht TEXT,
  colleague_started_at DATE,
  colleague_ended_at DATE,
  has_endorsed BOOLEAN,
  endorsement_id UUID
) AS $$
BEGIN
  RETURN QUERY
  -- Find the profile user by handle
  WITH profile_user AS (
    SELECT id FROM public.users WHERE handle = p_handle LIMIT 1
  ),
  -- Get all yachts the profile user has attachments on
  profile_yachts AS (
    SELECT DISTINCT a.yacht_id
    FROM public.attachments a
    JOIN profile_user pu ON a.user_id = pu.id
    WHERE a.deleted_at IS NULL
  )
  SELECT
    u.id AS colleague_id,
    u.display_name AS colleague_name,
    u.handle AS colleague_handle,
    u.avatar_url AS colleague_avatar_url,
    u.primary_role AS colleague_primary_role,
    y.id AS yacht_id,
    y.name AS yacht_name,
    y.yacht_type,
    a.role_label AS colleague_role_on_yacht,
    a.started_at AS colleague_started_at,
    a.ended_at AS colleague_ended_at,
    EXISTS (
      SELECT 1 FROM public.endorsements e
      WHERE e.endorser_id = u.id
        AND e.endorsee_id = (SELECT id FROM profile_user)
        AND (e.is_dormant IS NULL OR e.is_dormant = false)
    ) AS has_endorsed,
    (
      SELECT e.id FROM public.endorsements e
      WHERE e.endorser_id = u.id
        AND e.endorsee_id = (SELECT id FROM profile_user)
        AND (e.is_dormant IS NULL OR e.is_dormant = false)
      LIMIT 1
    ) AS endorsement_id
  FROM public.attachments a
  JOIN profile_yachts py ON a.yacht_id = py.yacht_id
  JOIN public.users u ON a.user_id = u.id
  JOIN public.yachts y ON a.yacht_id = y.id
  WHERE a.user_id != (SELECT id FROM profile_user)
    AND a.deleted_at IS NULL
  ORDER BY a.started_at DESC NULLS LAST;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

**Notes:**
- `SECURITY DEFINER` bypasses RLS so it works for unauthenticated viewers
- Returns only public-safe fields (name, handle, avatar, role)
- Checks endorsement dormancy flag (from Session 6 Lane 3)
- Results ordered by start date descending (most recent first)
- Caller groups by `yacht_id` client-side for the accordion

### Task 2: Public colleague page

**File:** `app/(public)/u/[handle]/colleagues/page.tsx` (new)

- Fetch data via `get_public_colleagues(handle)` RPC
- Group results by `yacht_id` client-side into a Map
- Render using `YachtAccordion` pattern (reuse component or create public variant)
- Most recent yacht expanded, rest collapsed
- Each colleague row: avatar, name (links to `/u/{colleague_handle}`), role on yacht, endorsement badge
- Endorsement badge tappable → navigates to that endorsement on the profile
- Page header: "{Name}'s Colleagues · {count}" with navy section color (network)
- Back button: "← Profile" linking to `/u/{handle}`
- Empty state: "No colleagues yet — colleagues appear when crew share yacht experience."

**Files:** `app/(public)/u/[handle]/colleagues/page.tsx` (new), possibly a `PublicColleagueRow.tsx` if `ColleagueRow.tsx` is too coupled to the authenticated Network tab

### Task 3: Wire stats tile as link

**File:** `components/public/bento/tiles/StatsTile.tsx` (modify)

- Make the "worked with N colleagues" text tappable
- Links to `/u/{handle}/colleagues`
- Subtle link styling — underline on hover, not a button

### Task 4: Wire from public profile page

**File:** `app/(public)/u/[handle]/page.tsx` (modify)

- Add the colleague count link (may already be handled by StatsTile change)
- Ensure colleague count query is consistent with the RPC results

## Edge Cases

- **User with 0 colleagues** — empty state on the page, stats tile still shows count (0) but not tappable
- **Visibility settings** — if user has hidden their experience, the RPC should respect that (check `profile_visibility` settings). May need to filter in the RPC.
- **Ghost profiles** — colleagues who aren't on the platform yet. Show name + role but no link. "Not on YachtieLink" badge instead of endorsement status.
- **Dormant endorsements** — filtered by `is_dormant = false` in the RPC (from Session 6 Lane 3 work)
- **Large rosters** — yacht accordion handles this (collapsed by default). No pagination needed.
- **Subdomain profiles** — `/subdomain/[handle]` page also shows StatsTile. Colleague link should work from both URL patterns.

## Not in scope

- Mutual colleague highlighting (requires auth, future feature)
- Colleague search/filter
- "Request endorsement" from the public page (auth-gated action)
- Scroll restoration (separate backlog item: `scroll-restoration-back-nav.md`)

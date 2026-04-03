---
title: Trending Yachts — Discovery Below Yacht Search
status: ready
source: founder (QA session 2026-04-03, grilled 2026-04-03)
priority: medium
modules: [network, engagement, yacht-graph]
estimated_effort: 3-4 hours (Sonnet, high effort)
grill_me_date: 2026-04-03
---

# Trending Yachts — Discovery Below Yacht Search

## Problem

The yacht search bar at the bottom of the Network tab has empty space below it. Users browsing (not searching for a specific yacht) have no discovery content. New users with empty networks see nothing active on the platform.

## Grill-me Decisions (2026-04-03)

| # | Question | Decision |
|---|----------|----------|
| 1 | Where does trending live? | Below the yacht search bar on the Network tab. Users searching get the search box, users browsing get trending yachts below it. |
| 2 | Trending metric | **(b)** New crew attachments as primary signal — already in DB, no new tracking needed. Endorsements as secondary signal. |
| 3 | Time window | **(a)** Expanding window for freshness: 4h → 24h → 7d → all-time fallback. Section feels dynamic — morning users see different yachts than evening users. Never stale. |
| 4 | How many yachts | **(c)** 3 visible by default, "Show more" expands to 10. Keeps it tight, doesn't push search bar out of view. |
| 5 | Visible to whom | **(a)** All users including new/empty profiles. Social proof that the platform is alive. Entry point into the graph before they've built their own network. |

## Current State

| What | Where |
|------|-------|
| Yacht search bar | `components/network/NetworkUnifiedView.tsx` — bottom of Network tab |
| Attachments table | `attachments` — has `created_at`, `yacht_id`, `user_id` |
| Endorsements table | `endorsements` — has `created_at`, yacht context via attachments |
| Yacht data | `yachts` — name, type, length, flag_state, cover photo |

## Spec

### Task 1: Trending yachts RPC

**File:** new migration

```sql
CREATE OR REPLACE FUNCTION get_trending_yachts(lim INT DEFAULT 10)
RETURNS TABLE (
  yacht_id UUID,
  yacht_name TEXT,
  yacht_type TEXT,
  length_meters NUMERIC,
  flag_state TEXT,
  active_crew_count BIGINT,
  recent_activity_count BIGINT,
  activity_window TEXT
) AS $$
DECLARE
  result_count INT;
BEGIN
  -- Try 4-hour window first
  RETURN QUERY
  SELECT * FROM _trending_yachts_window('4 hours', lim);
  GET DIAGNOSTICS result_count = ROW_COUNT;
  IF result_count >= 3 THEN RETURN; END IF;

  -- Fall back to 24 hours
  RETURN QUERY
  SELECT * FROM _trending_yachts_window('24 hours', lim);
  GET DIAGNOSTICS result_count = ROW_COUNT;
  IF result_count >= 3 THEN RETURN; END IF;

  -- Fall back to 7 days
  RETURN QUERY
  SELECT * FROM _trending_yachts_window('7 days', lim);
  GET DIAGNOSTICS result_count = ROW_COUNT;
  IF result_count >= 3 THEN RETURN; END IF;

  -- All-time fallback: most crew
  RETURN QUERY
  SELECT
    y.id AS yacht_id,
    y.name AS yacht_name,
    y.yacht_type,
    y.length_meters,
    y.flag_state,
    COUNT(DISTINCT a.user_id) AS active_crew_count,
    0::BIGINT AS recent_activity_count,
    'all-time'::TEXT AS activity_window
  FROM public.yachts y
  JOIN public.attachments a ON a.yacht_id = y.id AND a.deleted_at IS NULL
  GROUP BY y.id, y.name, y.yacht_type, y.length_meters, y.flag_state
  ORDER BY active_crew_count DESC
  LIMIT lim;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Helper: trending within a time window
CREATE OR REPLACE FUNCTION _trending_yachts_window(window_interval INTERVAL, lim INT)
RETURNS TABLE (
  yacht_id UUID,
  yacht_name TEXT,
  yacht_type TEXT,
  length_meters NUMERIC,
  flag_state TEXT,
  active_crew_count BIGINT,
  recent_activity_count BIGINT,
  activity_window TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    y.id AS yacht_id,
    y.name AS yacht_name,
    y.yacht_type,
    y.length_meters,
    y.flag_state,
    COUNT(DISTINCT a_all.user_id) AS active_crew_count,
    (
      COUNT(DISTINCT a_recent.id) +
      COUNT(DISTINCT e_recent.id)
    ) AS recent_activity_count,
    window_interval::TEXT AS activity_window
  FROM public.yachts y
  JOIN public.attachments a_all ON a_all.yacht_id = y.id AND a_all.deleted_at IS NULL
  LEFT JOIN public.attachments a_recent ON a_recent.yacht_id = y.id
    AND a_recent.created_at > now() - window_interval
    AND a_recent.deleted_at IS NULL
  LEFT JOIN public.endorsements e_recent ON e_recent.created_at > now() - window_interval
    AND EXISTS (
      SELECT 1 FROM public.attachments ea
      WHERE ea.user_id = e_recent.endorsee_id AND ea.yacht_id = y.id AND ea.deleted_at IS NULL
    )
  GROUP BY y.id, y.name, y.yacht_type, y.length_meters, y.flag_state
  HAVING (COUNT(DISTINCT a_recent.id) + COUNT(DISTINCT e_recent.id)) > 0
  ORDER BY recent_activity_count DESC
  LIMIT lim;
END;
$$ LANGUAGE plpgsql;
```

**Note:** The RPC shape above is a starting point — the worker should verify the query logic and optimize. The key requirement is: expanding window (4h → 24h → 7d → all-time), ranked by activity count, always returns something.

### Task 2: Trending yachts component

**File:** `components/network/TrendingYachts.tsx` (new)

- Fetches data via `get_trending_yachts(10)` RPC
- Default view: 3 yacht cards
- "Show more" button expands to show all 10
- Each card shows:
  - Yacht name + type badge (M/Y or S/Y)
  - Length + flag state
  - Active crew count: "{N} crew"
  - Activity indicator: "🔥 {N} new this week" or similar — based on `recent_activity_count`
  - Tap → navigates to yacht page (or yacht accordion if no dedicated page yet)
- Section header: "Trending" (no "today" or time label — the expanding window handles freshness)
- Navy section color (network tab)
- Loading: skeleton cards matching the layout
- Empty state: shouldn't happen (all-time fallback guarantees content once any yachts exist in the DB)

### Task 3: Wire into Network tab

**File:** `components/network/NetworkUnifiedView.tsx` (modify)

- Add `TrendingYachts` component below the yacht search bar
- Visible to all users (including those with 0 yachts)
- For new users with empty networks, this becomes the primary content on the page alongside the search bar

## Edge Cases

- **Brand new platform (0 yachts)** — the RPC returns nothing, component renders nothing. No empty state needed — this only happens pre-launch.
- **User's own yacht appears in trending** — fine, it's discovery content, not "my yachts." No need to filter.
- **Activity burst then quiet** — the expanding window handles this gracefully. 4h shows the burst, then widens as activity fades.
- **Performance** — the RPC does aggregation across attachments + endorsements. Index on `attachments.created_at` and `endorsements.created_at` should keep it fast. Monitor query time after launch.
- **Privacy** — trending shows yacht names + crew counts, not individual crew identities. No privacy concern.

## Dependencies

- Yacht pages or yacht accordion must exist for the tap-through target (already built in Sprint 12 / Session 3)

## Not in scope

- Profile view tracking per yacht (requires Insights infrastructure)
- Trending crew/profiles (separate feature)
- Algorithmic ranking beyond simple activity count
- Caching/materialized views (optimize later if the query is slow)

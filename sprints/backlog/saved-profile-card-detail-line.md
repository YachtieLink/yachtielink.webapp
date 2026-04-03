---
title: Saved Profile Card — Wire Sea Time + Yacht Count
status: ready
source: founder (2026-03-27), Lane 2 worker (2026-04-02)
priority: P2 (bug — feature incomplete)
modules: [network]
estimated_effort: 1-2 hours (Sonnet, medium effort)
consolidates: saved-profile-card-detail-line.md, saved-profile-card-wiring.md
---

# Saved Profile Card — Wire Sea Time + Yacht Count

## Problem

`SavedProfileCard` accepts `seaTimeDays` and `yachtCount` props but they're never passed. The detail line always falls back to role + departments. The card should show "6y 7m at sea · 2 yachts" — what a captain cares about when scanning saved candidates, not individual cert names.

## Current State

| What | Where |
|------|-------|
| SavedProfileCard component | `components/network/SavedProfileCard.tsx` — has props, not wired |
| Saved profiles page | `app/(protected)/app/network/saved/page.tsx` — queries user data |
| SavedProfilesClient | `components/network/SavedProfilesClient.tsx` — renders cards |
| Sea time calculation | `lib/sea-time.ts` — `computeSeaTime()` |

## Spec

### Task 1: Extend the saved profiles query

**File:** `app/(protected)/app/network/saved/page.tsx`

The page already queries saved profiles with user data. Extend to also fetch each saved user's attachments (or use an RPC) to compute:
- `seaTimeDays` — total days from `computeSeaTime()` or sum of attachment date ranges
- `yachtCount` — count of distinct `yacht_id` values from attachments

If fetching all attachments per saved user is too expensive, consider a lightweight RPC that returns just the aggregates.

### Task 2: Pass props through client

**File:** `components/network/SavedProfilesClient.tsx`

Pass `seaTimeDays` and `yachtCount` to each `SavedProfileCard`.

### Task 3: Verify card rendering

**File:** `components/network/SavedProfileCard.tsx`

Confirm the component renders "6y 7m at sea · 2 yachts" when props are provided. The component likely already handles this — just needs the data.

## Edge Cases

- **No attachments** — user has no experience data. Fall back to role + departments (current behavior).
- **Performance** — saved profiles list could have 50+ entries. Aggregate query per user is N+1. Prefer a single query or RPC that returns aggregates for all saved user IDs in one call.

## Not in scope

- Redesigning the SavedProfileCard layout
- Adding more detail (certs, endorsements) to the card

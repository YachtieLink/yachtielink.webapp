---
title: Unsolicited Endorsements — Endorse Without a Request
status: ready
source: founder (QA session 2026-04-03, grilled 2026-04-03)
priority: medium
modules: [endorsement, network, public-profile]
estimated_effort: 4-5 hours (Opus, high effort — new flow + pending state)
grill_me_date: 2026-04-03
---

# Unsolicited Endorsements — Endorse Without a Request

## Problem

Endorsements can only be written in response to a request (via `/endorse/[token]`). There's no way for a colleague to proactively endorse someone. A captain browsing their yacht's crew list can't just write endorsements for everyone they've worked with — they have to wait for each person to send a request.

## Grill-me Decisions (2026-04-03)

| # | Question | Decision |
|---|----------|----------|
| 1 | Publish behavior | **(b)** Pending until accepted. Endorsee gets notified, must accept before it's visible on their profile. Respects endorsee control — bad or unwanted endorsements don't auto-publish. |
| 2 | Decline visibility to endorser | **(b)** Silent decline. Endorser never knows it was rejected. Avoids social friction. They assume the person hasn't logged in yet. |
| 3 | Entry points | All three: (1) Colleague row in yacht accordion (Network tab), (2) Public profile page, (3) Colleague explorer page. Same button component everywhere a colleague appears with shared yacht context. |
| 4 | Rate limit | **(a)** No limit. A captain endorsing 50 crew in a sitting is dream engagement. Graph constraint (shared yacht) already prevents spam. Pending/accept protects endorsees. Don't penalize generosity. |

## Current State

| What | Where |
|------|-------|
| Endorsement write form | `components/endorsement/WriteEndorsementForm.tsx` — existing form with writing assist |
| Endorsement request flow | `/endorse/[token]` — token-gated, requires request first |
| Endorsement creation API | `app/api/endorsements/` — existing endpoints |
| Writing assist | `app/api/endorsements/assist/route.ts` — gpt-4o-mini draft generation |
| Colleague row | `components/network/ColleagueRow.tsx` — has "Request" button |
| Shared yacht validation | `get_colleagues` RPC + attachment queries |

## Spec

### Task 1: Migration — pending endorsement state

**File:** new migration

```sql
-- Add pending state for unsolicited endorsements
-- Existing endorsements are all 'published' (came through request flow)
ALTER TABLE public.endorsements
  ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'published'
    CHECK (status IN ('pending', 'published', 'declined'));

-- Index for filtering pending endorsements per user
CREATE INDEX IF NOT EXISTS idx_endorsements_endorsee_status
  ON public.endorsements(endorsee_id, status);
```

**Note:** Existing endorsements default to 'published' so nothing changes for the request flow. Only unsolicited endorsements start as 'pending'.

### Task 2: Unsolicited endorsement API

**File:** `app/api/endorsements/unsolicited/route.ts` (new)

- `POST` — create an unsolicited endorsement
- Auth required (endorser must be logged in)
- Params: `endorsee_id`, `yacht_id` (shared yacht context), `content`, `relationship` (role on yacht)
- **Validation:** endorser and endorsee must both have attachments on the same `yacht_id` with overlapping date ranges. Reuse existing shared-yacht validation logic.
- **Cannot endorse yourself**
- **Duplicate check:** can't endorse the same person for the same yacht twice
- Sets `status = 'pending'`
- Writing assist available (same `/api/endorsements/assist` endpoint)
- Triggers notification to endorsee (see Task 5)
- Returns 201

### Task 3: Accept/decline API

**File:** `app/api/endorsements/[id]/respond/route.ts` (new)

- `PATCH` — accept or decline a pending endorsement
- Auth required (must be the endorsee)
- Params: `action` ('accept' | 'decline')
- Accept: sets `status = 'published'`, endorsement appears on profile
- Decline: sets `status = 'declined'`, endorsement hidden permanently. **No notification to endorser.**
- Returns 200

### Task 4: Endorse button component

**File:** `components/endorsement/EndorseButton.tsx` (new)

```typescript
interface EndorseButtonProps {
  endorseeId: string
  endorseeName: string
  sharedYachtId: string
  sharedYachtName: string
}
```

- Button that opens the endorsement write form (reuse `WriteEndorsementForm`)
- Pre-fills yacht context (which yacht they shared)
- Writing assist available
- Submit → calls unsolicited endorsement API
- Success: "Endorsement sent! {name} will see it when they log in."
- Already endorsed check: if user has already endorsed this person for this yacht, show "Endorsed ✓" instead of the button

### Task 5: Wire endorse button to entry points

**Colleague row (Network tab):**
**File:** `components/network/ColleagueRow.tsx` (modify)
- Add `EndorseButton` alongside existing "Request" button
- Show "Endorse" when: logged-in user shares a yacht with this colleague AND hasn't already endorsed them for this yacht
- Show "Endorsed ✓" when: already endorsed

**Public profile page:**
**File:** `app/(public)/u/[handle]/page.tsx` (modify)
- Add `EndorseButton` visible to logged-in users who share a yacht with the profile owner
- Position: near the endorsements section or in the hero actions area
- Hidden for: own profile, logged-out viewers, users with no shared yacht

**Colleague explorer page:**
**File:** `app/(public)/u/[handle]/colleagues/page.tsx` (when built — see colleague-graph-explorer.md)
- Same pattern as colleague row

### Task 6: Pending endorsements inbox

**File:** `components/endorsement/PendingEndorsements.tsx` (new)

Endorsee needs to see and act on pending endorsements. Options for placement:
- Notification bell (when notification system exists)
- Banner on profile page: "You have {N} pending endorsements — review them"
- Dedicated section in endorsements area of profile

For each pending endorsement show:
- Endorser name, role, shared yacht
- Endorsement content (full text)
- [Accept] [Decline] buttons
- Accept → endorsement appears on profile immediately
- Decline → endorsement disappears, no notification to endorser

### Task 7: Filter pending/declined from public display

**File:** endorsement query files (modify)

All endorsement display queries must filter to `status = 'published'` only:
- Public profile endorsement section
- Endorsement count in stats
- Colleague row endorsement badges
- Any other place endorsements are displayed

Pending and declined endorsements are invisible to everyone except the endorsee (in their inbox).

## Edge Cases

- **Endorser deletes their account** — pending endorsement should be deleted too (CASCADE)
- **Endorsee already has a request-based endorsement from this person for this yacht** — block the unsolicited one, show "Endorsed ✓"
- **Ghost profiles** — can't receive unsolicited endorsements (no auth to accept). The request/invite flow handles ghosts.
- **Endorsee never logs in** — pending endorsement sits forever. No timeout needed. If they eventually log in, they see it.
- **Endorsement content** — same validation as request-based endorsements (min/max length, sanitization via LLM defense layer from Session 5)

## Dependencies

- Notification system (`watch-profile-notifications.md`) — for notifying endorsee. Can ship without it (banner fallback), but notification bell is better UX.
- Icon system audit (`icon-system-audit.md`) — endorse button needs a clear icon that works alongside Request/Invite/Report buttons without crowding.

## Not in scope

- Endorsing ghost profiles (they use the invite/request flow)
- Endorser notification on accept (keep it simple — endorser doesn't need to know)
- Endorsement editing after submission
- Batch endorsement UI ("endorse all crew on this yacht at once")

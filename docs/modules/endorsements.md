---
module: endorsements
updated: 2026-03-21
status: shipped
phase: 1A
---

# Endorsements

One-line: Endorsement requests, endorsement creation with coworker gating and content moderation, deep link flow for non-users, shareable links, edit/delete, and email notifications.

## Current State

- Endorsement request creation: working — POST to `/api/endorsement-requests` creates a request row with auto-generated token; supports recipient by user_id, email, or phone lookup
- Daily request rate limit: working — 10/day for free users, 20/day for Pro; enforced via `endorsement_requests_today` RPC plus API-level rate limit (5 per 24h per user for the endpoint itself)
- Request email notification: working — HTML + plain-text email sent to recipient with deep link; non-fatal on failure (request token saved regardless)
- Shareable link: working — POST to `/api/endorsement-requests/share-link` creates one reusable `is_shareable` request per requester+yacht pair; link format `/r/{token}`
- Request management: working — PUT to `/api/endorsement-requests/[id]` supports cancel, resend, and decline actions
- Request expiry: working — 30-day TTL; expired links show informational UI at `/r/{token}`
- Cancelled request display: working — shows "Request cancelled" UI
- Deep link flow (`/r/{token}`): working — server-rendered page at `app/(public)/r/[token]` with multiple states:
  - Unauthenticated: shows request card + sign in / create account links with `returnTo` preservation
  - Authenticated, already endorsed: shows "Already endorsed" state
  - Authenticated, incomplete profile: mini-onboard flow (name + role + yacht attachment) inline before endorsement form
  - Authenticated, no attachment to yacht: add-yacht step (role + dates) before endorsement form
  - Authenticated, ready: renders `WriteEndorsementForm` directly
- Endorsement creation: working — POST to `/api/endorsements` with coworker verification via `are_coworkers_on_yacht` RPC
- Self-endorsement prevention: working — API returns 400 if endorser_id equals recipient_id
- Duplicate prevention: working — unique constraint on (endorser_id, recipient_id, yacht_id); returns 409 on duplicate
- Content moderation: working — `moderateText()` from `lib/ai/moderation.ts` runs before insert; flagged content returns 422
- One endorsement per engagement per yacht: enforced by unique constraint (D-010)
- Endorsement editing: working — PUT to `/api/endorsements/[id]` with content moderation on updated text; scoped to own endorsements only
- Endorsement deletion: working — soft delete via DELETE to `/api/endorsements/[id]` (sets `deleted_at`); tracked via analytics event
- Endorsement received notification: working — HTML email sent to recipient with excerpt; non-fatal
- Request-to-endorsement link: working — when endorsement is created via deep link with `request_token`, the request status is updated to `accepted`
- Endorsement request UI: working at `/app/endorsement/request` — yacht picker (auto-skips if only one yacht), then shows:
  - Share section (WhatsApp, copy link, native share) using shareable link
  - Colleague list from `get_colleagues` RPC filtered to shared yacht, with per-colleague request button and status pills (Pending, Endorsed, Expired, Cancelled)
  - Manual invite by email or phone with contact chip input
  - Rate limit counter
- Endorsement edit UI: working at `/app/endorsement/[id]/edit`
- Retraction visibility: per D-005, retractions (deletions) are never visible in UI; backend only
- Absence is neutral: per D-011, zero endorsements is not a negative signal
- No caps on endorsements received: per D-020
- RLS: endorsement reads filtered by `deleted_at IS NULL`; writes scoped to authenticated user via anon key
- Rate limiting: endorsement create (5/24h/user), endorsement edit (20/1h/user)

## Key Files

| What | Where |
|------|-------|
| Request endorsement page | `app/(protected)/app/endorsement/request/page.tsx` |
| Request endorsement client | `app/(protected)/app/endorsement/request/RequestEndorsementClient.tsx` |
| Edit endorsement page | `app/(protected)/app/endorsement/[id]/edit/page.tsx` |
| Edit endorsement client | `app/(protected)/app/endorsement/[id]/edit/EditEndorsementClient.tsx` |
| Deep link page | `app/(public)/r/[token]/page.tsx` |
| Deep link flow component | `components/endorsement/DeepLinkFlow.tsx` |
| Write endorsement form | `components/endorsement/WriteEndorsementForm.tsx` |
| Endorsement requests API | `app/api/endorsement-requests/route.ts` |
| Request by ID API | `app/api/endorsement-requests/[id]/route.ts` |
| Share link API | `app/api/endorsement-requests/share-link/route.ts` |
| Endorsements API | `app/api/endorsements/route.ts` |
| Endorsement by ID API | `app/api/endorsements/[id]/route.ts` |
| Validation schemas | `lib/validation/schemas.ts` |
| AI moderation | `lib/ai/moderation.ts` |
| Rate limit config | `lib/rate-limit/helpers.ts` |

## Decisions That Bind This Module

- **D-002** — No star ratings or open free-text reviews (endorsements are structured + free-text, not reviews)
- **D-005** — Retraction visibility: retractions never visible in UI; backend only
- **D-009** — Endorsement gating rule: endorsements require shared yacht attachment
- **D-010** — Endorsement structure: structured metadata + free-text; one per engagement per yacht; editing and deletion allowed but tracked
- **D-011** — Absence of endorsements is neutral: zero endorsements is not a negative signal
- **D-013** — No auto-summary language: forbidden to auto-summarise endorsement density
- **D-019** — Endorsement signals (thumbs up/down): display only in Phase 1, feeds trust weight in Phase 2+ (not yet implemented)
- **D-020** — No caps on endorsements received

## Next Steps

- [ ] Endorsement signals (agree/disagree) from users with overlapping attachment (D-019)
- [ ] In-app notification for endorsement received (currently email only)
- [ ] Endorsement request reminder/nudge flow
- [ ] Phone-based notification for endorsement requests (WhatsApp or SMS)

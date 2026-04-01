---
module: endorsements
updated: 2026-04-01
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

## Decisions

**2026-03-23** — Ghost Profiles: ghost endorsements bypass the `are_coworkers_on_yacht` gate. The endorsement request token is the trust mechanism — the real user vouched for the relationship by sending the request. Ghost endorsements get a subtle visual distinction (no profile link, softer presentation) and upgrade to full weight when ghost claims account with matching yacht attachment. — Ari

**2026-03-23** — Ghost Profiles: separate `ghost_profiles` table, not `users`. The `users.id` FK to `auth.users(id) ON DELETE CASCADE` makes ghost rows in `users` impossible without fake auth records. Dual nullable endorser columns on `endorsements` (`endorser_id` + `ghost_endorser_id`) with CHECK constraint ensuring exactly one is set. Endorsements migrate on claim. — Ari

**2026-03-23** — Endorsement Writing Assist: never persist AI-generated endorsement text. Always generate on demand. Storing drafts creates a library of generic recycled snippets — the value is fresh, context-specific generation each time. Exception: ghost pre-generated suggestions on `endorsement_requests` (approved as lower-signal quick interactions). — Ari

**2026-01-28** — D-020: No caps on endorsements received. Senior crew with long careers can plausibly receive many endorsements; only endorsements given may ever be constrained. — Ari

**2026-01-28** — D-019: Endorsement signals (thumbs up/down) available to users with overlapping attachment. Display-only in Phase 1; feeds trust weight in Phase 2+. Signals alone never remove an endorsement. — Ari

**2026-01-27** — D-013: Forbidden — any UI that auto-summarises endorsement density ("well endorsed", "lightly endorsed", etc.). Auto-summaries collapse nuance and violate the absence-is-neutral principle. — Ari

**2026-01-27** — D-011: Zero endorsements is not a negative signal. The system never labels absence as meaningful. Only contradicted endorsements create negative weight. — Ari

**2026-01-10** — D-010: One endorsement per engagement per yacht. Structure + free-text. Editing allowed, deletion tracked. Prevents inflation while enabling nuance. — Ari

**2026-01-05** — D-009: Endorsements require shared yacht attachment. Contacts alone do not permit endorsements. Endorsements must be grounded in verifiable shared experience. — Ari

**2025-12-10** — D-005: Endorsement retractions are never visible in UI. Backend only. Visible retractions create scarlet letter effects. Retraction frequency affects endorser weighting in backend. — Ari

**2025-11-15** — D-003: Never monetise influence over trust outcomes. If trust can be bought, trust is worthless. — Ari

**2025-11-15** — D-002: No star ratings or open free-text reviews. Star ratings create false precision; free-text reviews create coercion dynamics and legal exposure. — Ari

**2025-11-15** — D-001: Crew are privileged in trust conflicts. Crew are the mobile, vulnerable party — asymmetric protection prevents the system from becoming a tool for employer control. — Ari

## Recent Activity

**2026-04-01** — Lanes 2+3 (PRs #137, #138): Endorsement request page updated to show full colleague names with nickname pattern. EndorsementBanner gains stagger animation delays (100ms collapsed, 200ms expanded) for organic tier-fill progression.
**2026-04-01** — Ghost Profiles W1 Lane 3: Ghost endorsement flow — endorser_id nullable, ghost_endorser_id FK, `claim_ghost_profile()` SECURITY DEFINER RPC, non-auth guest endorsement route with IP rate limiting + content moderation, `/endorse/[token]` guest form, `/r/[token]` three-option layout for unauthed users. PR #133.

**2026-03-21** — Sprint 10.1 Wave 1 F: Added try/catch + handleApiError on endorsement-requests routes; Zod validation on DELETE `/api/saved-profiles`.

**2026-03-18** — Post-Phase1A fixes: Fixed mutual endorser count bug in `PublicProfileContent.tsx` — was returning all endorsements when any shared yacht existed; now correctly counts only endorsers whose user ID is in the mutual colleague set.

**2026-03-17** — Phase 1A Cleanup Spec 10: Network badge for pending endorsement requests — `getPendingRequestCount` (React.cache), BottomTabBar red dot indicator, app layout fetches count server-side.

**2026-03-17** — Phase 1A Cleanup Spec 11: Applied `sanitizeHtml()` on user-supplied values in email template API routes; content moderation applied to `POST /api/endorsements` and `PUT /api/endorsements/[id]`.

**2026-03-15** — Sprint 7: Endorsement virality — migration `20260315000019` with `is_shareable` column, phone index, extended `link_pending_requests_to_new_user()` trigger for phone/WhatsApp matching, UPDATE trigger on users, unique index for shareable links.

**2026-03-15** — Sprint 7: New POST `/api/endorsement-requests/share-link` — reusable shareable links (idempotent, one per requester+yacht).

**2026-03-15** — Sprint 7: `RequestEndorsementClient.tsx` full rewrite — share section (WhatsApp, Copy Link, native Share) at top, colleague cards with one-tap Request buttons, email/phone input with auto-detect, rate limit display.

**2026-03-15** — Sprint 7: `DeepLinkFlow.tsx` — added `mini-onboard` step for new/incomplete users (name, role, yacht dates), auto-prefill dates from requester's attachment, post-endorsement redirect to `/onboarding` for incomplete users.

**2026-03-15** — Sprint 7: `WriteEndorsementForm.tsx` — post-endorsement upsell CTA ("Want endorsements too? Request yours →").

**2026-03-15** — Sprint 8: Zod validation applied to `api/endorsements/route.ts`, `api/endorsements/[id]/route.ts`, `api/endorsement-requests/route.ts`; rate limiting applied to all endorsement routes.

**2026-03-15** — Sprint 8: PostHog events — `endorsement.created`, `endorsement.deleted`, `endorsement.requested` wired to endorsement API routes.

**2026-03-15** — Sprint 8: AI content moderation (OpenAI `omni-moderation-latest`) applied to POST/PUT endorsement routes; `moderation.flagged` PostHog event on block; non-blocking on API failure.

**2026-03-14** — Sprint 5 polish: Migration 016 — updated `get_endorsement_request_by_token` RPC to include `requesterAttachment` for prefill; partial unique index prevents duplicate pending requests.

**2026-03-14** — Sprint 5 polish: Added decline action on `app/api/endorsement-requests/[id]/route.ts` — checked against `recipient_user_id` not `requester_id`.

## Next Steps

- [ ] Endorsement signals (agree/disagree) from users with overlapping attachment (D-019)
- [ ] In-app notification for endorsement received (currently email only)
- [ ] Endorsement request reminder/nudge flow
- [ ] Phone-based notification for endorsement requests (WhatsApp or SMS)

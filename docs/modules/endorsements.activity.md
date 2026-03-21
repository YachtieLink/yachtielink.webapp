# Endorsements — Activity

Append-only. Never edit existing entries. Newest at top.

When you make changes to this module, append a one-line entry with date, agent name, and what changed.

---

**2026-03-21** — Claude Code (Opus 4.6, Sprint 10.1, Wave 1 F): Added try/catch + handleApiError on endorsement-requests routes; Zod validation on DELETE `/api/saved-profiles`.

**2026-03-18** — Claude Code (Sonnet 4.6, post-Phase1A fixes): Fixed mutual endorser count bug in `PublicProfileContent.tsx` — was returning all endorsements when any shared yacht existed; now correctly counts only endorsers whose user ID is in the mutual colleague set.

**2026-03-17** — Claude Code (Opus 4.6, Phase 1A Cleanup, Spec 10): Network badge for pending endorsement requests — `getPendingRequestCount` (React.cache), BottomTabBar red dot indicator, app layout fetches count server-side.

**2026-03-17** — Claude Code (Opus 4.6, Phase 1A Cleanup, Spec 11): Applied `sanitizeHtml()` on user-supplied values in email template API routes; content moderation applied to `POST /api/endorsements` and `PUT /api/endorsements/[id]`.

**2026-03-15** — Claude Code (Opus 4.6, Sprint 7): Endorsement virality — migration `20260315000019` with `is_shareable` column, phone index, extended `link_pending_requests_to_new_user()` trigger for phone/WhatsApp matching, UPDATE trigger on users, unique index for shareable links.

**2026-03-15** — Claude Code (Opus 4.6, Sprint 7): New POST `/api/endorsement-requests/share-link` — reusable shareable links (idempotent, one per requester+yacht).

**2026-03-15** — Claude Code (Opus 4.6, Sprint 7): `RequestEndorsementClient.tsx` full rewrite — share section (WhatsApp, Copy Link, native Share) at top, colleague cards with one-tap Request buttons, email/phone input with auto-detect, rate limit display.

**2026-03-15** — Claude Code (Opus 4.6, Sprint 7): `DeepLinkFlow.tsx` — added `mini-onboard` step for new/incomplete users (name, role, yacht dates), auto-prefill dates from requester's attachment, post-endorsement redirect to `/onboarding` for incomplete users.

**2026-03-15** — Claude Code (Opus 4.6, Sprint 7): `WriteEndorsementForm.tsx` — post-endorsement upsell CTA ("Want endorsements too? Request yours →").

**2026-03-15** — Claude Code (Sonnet 4.6, Sprint 8): Zod validation applied to `api/endorsements/route.ts`, `api/endorsements/[id]/route.ts`, `api/endorsement-requests/route.ts`; rate limiting applied to all endorsement routes.

**2026-03-15** — Claude Code (Sonnet 4.6, Sprint 8): PostHog events — `endorsement.created`, `endorsement.deleted`, `endorsement.requested` wired to endorsement API routes.

**2026-03-15** — Claude Code (Sonnet 4.6, Sprint 8): AI content moderation (OpenAI `omni-moderation-latest`) applied to POST/PUT endorsement routes; `moderation.flagged` PostHog event on block; non-blocking on API failure.

**2026-03-14** — Claude Code (Sonnet 4.6, Sprint 5 polish): Migration 016 — updated `get_endorsement_request_by_token` RPC to include `requesterAttachment` for prefill; partial unique index prevents duplicate pending requests.

**2026-03-14** — Claude Code (Sonnet 4.6, Sprint 5 polish): Added decline action on `app/api/endorsement-requests/[id]/route.ts` — checked against `recipient_user_id` not `requester_id`.

**2026-03-14** — Claude Code (Sonnet 4.6, Sprint 5 polish): `DeepLinkFlow.tsx` — added `already-endorsed` state (checks DB before showing form); passes `prefillRecipientRole` from requester attachment; seeds add-yacht date fields from requester attachment dates.

**2026-03-14** — Claude Code (Sonnet 4.6, Sprint 5 polish): `AudienceTabs.tsx` — extracted `ReceivedRequestCard` with Decline button (calls decline action, removes card optimistically); prefer `full_name` for requester name display.

**2026-03-14** — Claude Code (Sonnet 4.6, Sprint 5): Migration 012 — `cancelled_at` + `recipient_phone` on `endorsement_requests`; `endorsement_requests_today(uuid)` rate-limit RPC; 3 performance indexes.

**2026-03-14** — Claude Code (Sonnet 4.6, Sprint 5): Built `WriteEndorsementForm.tsx` — reusable create/edit form with char counter, collapsible optional details, success state, 409/403 error handling.

**2026-03-14** — Claude Code (Sonnet 4.6, Sprint 5): Built `DeepLinkFlow.tsx` — 3-step state machine: checks attachment → add-yacht step → WriteEndorsementForm. Correctly maps `requester_id` → `recipient_id`.

**2026-03-14** — Claude Code (Sonnet 4.6, Sprint 5): `app/(public)/r/[token]/page.tsx` rewritten — uses `SECURITY DEFINER` RPC `get_endorsement_request_by_token` (bypasses RLS, granted to anon); 404/expired/cancelled/unauthed/authed states.

**2026-03-14** — Claude Code (Sonnet 4.6, Sprint 5): `POST /api/endorsements` — create with coworker check (403/409/400 guards), request-token acceptance, notify email. `GET /api/endorsements` — list by user_id. `PUT/DELETE /api/endorsements/[id]` — edit own + soft-delete own.

**2026-03-14** — Claude Code (Sonnet 4.6, Sprint 5): `AudienceTabs.tsx` — Wheel B progress card (endorsements/5) with BottomSheet CTA, segment toggle, requests-received/sent lists with status pills.

**2026-03-14** — Claude Code (Sonnet 4.6, Sprint 5): Built edit endorsement page `/app/endorsement/[id]/edit` — ownership-checked, WriteEndorsementForm in edit mode, delete with BottomSheet confirmation.

**2026-03-14** — Claude Code (Sonnet 4.6, Sprint 5): Fixed wrong RPC parameter names on `are_coworkers_on_yacht` — was `p_user_a`/`p_user_b`/`p_yacht_id`, function expects `user_a`/`user_b`/`yacht`. Caused every endorsement submission to 403.

**2026-03-14** — Claude Code (Sonnet 4.6, Sprint 5): Migration 014 — RLS policy for `auth.email() = recipient_email`; trigger `on_user_created_link_endorsements`. Migration 015 — backfill `recipient_user_id` for all historical requests. `api/endorsement-requests` now looks up existing user by email at insert time to set `recipient_user_id` immediately.

**2026-03-13** — Claude Code (Sonnet 4.6, Sprint 2 close): Created `POST /api/endorsement-requests` — authenticates caller, inserts to DB, sends notification email via Resend (non-fatal if email fails), handles duplicate requests gracefully. Updated `StepEndorsements` in `Wizard.tsx` to call API route — recipients now actually receive emails.

**2026-03-13** — Claude Code (Sonnet 4.6, Sprint 1): `endorsement_requests` schema — token (30-day expiry), `endorsements` schema; DB functions `are_coworkers`, `are_coworkers_on_yacht`; RLS policies for endorsements and endorsement_requests (owner-scoped writes).

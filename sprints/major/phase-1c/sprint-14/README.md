# Sprint 14 — Availability Toggle + Endorsement Signals

> **RALPH LOOP DRAFT** — Written sequentially by automated planning loop. Each sprint reads and builds on the preceding sprint's output. This is a planning document, not a build spec. Once reviewed and approved by the founder, a separate session hardens this into a full `build_plan.md`.

**Phase:** 1C
**Status:** 📋 Draft
**Started:** —
**Completed:** —
**Builds on:** Sprint 12 (yacht graph browsable, colleague explorer, sea time, mutual colleagues) + Sprint 13 (production environment, marketing page, QA sign-off, soft launch)

## Goal

Give crew two new ways to participate in the network beyond building their profile: signalling availability for work, and expressing opinion on endorsements. Availability makes the graph actionable — crew who are ready to work become findable. Endorsement signals add community depth to the trust layer without introducing moderation. Together, these features transform YachtieLink from a static profile tool into a living professional network. Sprint 13's soft launch means real users are on the platform — these features give them reasons to come back.

## Scope

**In:**
- Availability toggle on profile (opt-in, default off, 7-day auto-expiry per D-027)
- Day-6 expiry reminder email via Resend (reuses existing email infrastructure from Sprint 5/8)
- Availability status display on profile card and public profile
- Contact method visibility controls tied to availability (crew choose what's visible when "available")
- Availability history tracking (for future analytics — store toggle events, don't expose yet)
- Endorsement agree/disagree signals on endorsement cards (D-019)
- Signal eligibility: only users with overlapping yacht attachment to the endorsement's yacht
- Signal counts displayed on endorsement cards (e.g., "3 agree · 1 disagree")
- Signal detail: tap count to see who signalled (name, role, shared yacht)

**Out:**
- Recruiter-facing availability search (Phase 2, Sprint 19 — requires recruiter accounts)
- Availability broadcast/push notifications (no push infrastructure yet — email only)
- Availability filtering in crew search (Sprint 15 — search doesn't exist yet)
- 2nd-degree availability reach for Pro (Sprint 15, bundled with search)
- Moderation actions triggered by signals (D-019: signals alone never remove endorsements)
- Trust weight calculations from signals (Phase 2+ — signals are display-only in Phase 1C)
- Signal analytics or dashboards (future — keep signals lightweight)

## Dependencies

- Sprint 12 complete: yacht detail pages, colleague explorer, mutual colleagues RPCs
- Sprint 13 complete: production environment operational, soft launch users present
- `endorsements` table with `endorser_id`, `recipient_id`, `yacht_id` — exists from Sprint 5
- `attachments` table with `user_id`, `yacht_id`, `started_at`, `ended_at` — exists from Sprint 2–4
- `are_coworkers_on_yacht()` RPC — exists from Sprint 12 (reuse for signal eligibility check)
- Resend email infrastructure — exists from Sprint 2 (auth emails), Sprint 5 (endorsement emails)
- Cron job infrastructure — exists from Sprint 8 (used for availability expiry checks)

## Key Deliverables

### Availability Toggle — Profile

- ⬜ `availability_status` column on `users` table: `available`, `not_available` (default)
- ⬜ `availability_expires_at` timestamptz column on `users` table (null when not available)
- ⬜ `availability_contact_methods` jsonb column: which contact fields to show when available (phone, email, WhatsApp — separate from existing profile contact visibility)
- ⬜ Toggle UI on profile page: prominent switch with "I'm available for work" label
- ⬜ On toggle ON: set `availability_status = 'available'`, `availability_expires_at = now() + 7 days`
- ⬜ Contact method selector: checkboxes for which methods to expose while available (defaults to existing visible methods)
- ⬜ Confirmation: "You'll be visible as available for 7 days. We'll remind you before it expires."
- ⬜ On toggle OFF: set `availability_status = 'not_available'`, clear `availability_expires_at`

### Availability Display

- ⬜ Green "Available" badge on profile card (internal app view)
- ⬜ Green "Available" badge on public profile page (only when crew has opted in)
- ⬜ Available crew show selected contact methods on public profile (when toggled on, regardless of normal contact visibility settings)
- ⬜ Availability badge on colleague explorer cards and yacht detail crew cards
- ⬜ Badge disappears automatically on expiry — no stale "available" badges

### Availability Expiry System

- ⬜ Cron job: runs daily, checks `availability_expires_at < now()`, sets expired users to `not_available`
- ⬜ Day-6 reminder: cron checks `availability_expires_at BETWEEN now() AND now() + interval '1 day'`, sends email
- ⬜ Reminder email via Resend: "Your availability expires tomorrow — toggle again to stay visible"
- ⬜ Deep link in email back to profile page with availability section focused
- ⬜ `availability_events` table: `user_id`, `event_type` (toggled_on, toggled_off, expired, reminded), `created_at` — for future analytics

### Endorsement Signals — agree/disagree

- ⬜ `endorsement_signals` table: `id`, `endorsement_id`, `user_id`, `signal` (agree/disagree), `created_at`, `updated_at`
- ⬜ Unique constraint: one signal per (endorsement_id, user_id) — can change signal, not duplicate
- ⬜ RLS policy: users can only insert/update their own signal; read access for all authenticated users
- ⬜ Eligibility check RPC: `can_signal_endorsement(p_user_id, p_endorsement_id)` — returns true if user has overlapping yacht attachment with the endorsement's yacht (reuse `are_coworkers_on_yacht()` logic)
- ⬜ Signal UI on endorsement cards: thumbs-up / thumbs-down icons below endorsement text
- ⬜ Only shown to eligible users (shared yacht attachment) — hidden for non-eligible viewers
- ⬜ Tap to signal, tap again to remove signal (toggle behaviour)
- ⬜ Aggregate display: "3 agree · 1 disagree" visible to all authenticated users viewing the endorsement
- ⬜ Tap aggregate to expand: list of signallers (name, role, shared yacht context)
- ⬜ Optimistic UI: signal registers immediately, syncs in background

### Database Migration

- ⬜ `ALTER TABLE users ADD COLUMN availability_status text DEFAULT 'not_available'`
- ⬜ `ALTER TABLE users ADD COLUMN availability_expires_at timestamptz`
- ⬜ `ALTER TABLE users ADD COLUMN availability_contact_methods jsonb DEFAULT '[]'`
- ⬜ `CREATE TABLE availability_events (id uuid PK, user_id uuid FK, event_type text, created_at timestamptz DEFAULT now())`
- ⬜ `CREATE TABLE endorsement_signals (id uuid PK, endorsement_id uuid FK, user_id uuid FK, signal text CHECK (signal IN ('agree', 'disagree')), created_at timestamptz DEFAULT now(), updated_at timestamptz DEFAULT now())`
- ⬜ Unique index on `endorsement_signals(endorsement_id, user_id)`
- ⬜ Index on `users(availability_status, availability_expires_at)` for cron queries
- ⬜ RLS policies on both new tables
- ⬜ `can_signal_endorsement(p_user_id uuid, p_endorsement_id uuid)` RPC
- ⬜ `get_endorsement_signals(p_endorsement_id uuid)` RPC — returns aggregate counts + signaller list
- ⬜ GRANT EXECUTE on all new functions

### PostHog Events

- ⬜ `availability_toggled_on` / `availability_toggled_off` with contact methods selected
- ⬜ `availability_expired` (from cron)
- ⬜ `availability_reminder_sent`
- ⬜ `endorsement_signal_added` / `endorsement_signal_removed` with signal type
- ⬜ `endorsement_signal_detail_viewed` (tapped to see who signalled)

## Exit Criteria

- Availability toggle works: on → green badge visible → expires after 7 days → badge disappears
- Day-6 reminder email sends correctly with deep link back to profile
- Contact methods shown on public profile only when availability is active and methods selected
- Endorsement signals: eligible users can agree/disagree, counts display on cards
- Non-eligible users (no shared yacht attachment) cannot signal and don't see signal UI
- Signal detail expandable to see signaller names and context
- All new pages/components work at 375px width (mobile-first)
- Cron jobs operational in production (expiry + reminder)
- PostHog events firing for all key interactions
- No stale availability badges — expiry system working reliably
- Graph navigation preserved: availability badges link to profiles, signal detail links to signaller profiles

## Estimated Effort

5–7 days

## Notes

**Two independent workstreams.** Availability and endorsement signals share no database dependencies — they can be built in parallel within the sprint. If time is tight, availability is the higher priority (it directly enables Sprint 15's search feature).

**Availability is opt-in by design (D-027).** The toggle defaults to OFF. Crew must actively choose to be visible. This protects crew from unwanted contact and keeps the available pool current. The 7-day expiry is critical — without it, the "available" pool fills with stale entries and becomes useless. The day-6 reminder is what makes the expiry tolerable rather than annoying.

**Endorsement signals are lightweight on purpose (D-019).** Agree/disagree is social proof, not moderation. Signals never trigger removal or visibility changes on endorsements. They're stored for Phase 2+ trust weight calculations, but in Phase 1C they're purely informational. If signal abuse emerges (coordinated disagreeing), the response is to cap signals per user, not to add moderation — that's a Phase 2+ concern.

**Reuse from prior sprints:** The `are_coworkers_on_yacht()` RPC from Sprint 12 is the foundation for signal eligibility checks. The Resend email infrastructure from Sprint 5/8 handles the reminder emails. The cron job framework from Sprint 8 handles expiry checks. This sprint adds new features on existing infrastructure — minimal new plumbing.

**Hardest technical challenge:** The endorsement signal eligibility check needs to verify overlapping yacht attachment without being slow. The `are_coworkers_on_yacht()` RPC exists but may need optimization for checking across all endorsements on a profile page (N endorsements × eligibility check). Consider a batch RPC: `get_signalable_endorsements(p_user_id, p_endorsement_ids[])` that returns which endorsements the viewer can signal, in a single query.

**Next sprint picks up:** Sprint 15 builds on availability to add crew search (Pro) — available crew become searchable by role, yacht, location. Sprint 15 also adds the expanded analytics tab that uses availability events and profile view data from PostHog.

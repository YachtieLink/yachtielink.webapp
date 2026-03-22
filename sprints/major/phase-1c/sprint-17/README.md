# Sprint 17 — Attachment Confirmation + Smart Yacht Autocomplete

> **RALPH LOOP DRAFT** — Written sequentially by automated planning loop. Each sprint reads and builds on the preceding sprint's output. This is a planning document, not a build spec. Once reviewed and approved by the founder, a separate session hardens this into a full `build_plan.md`.

**Phase:** 1C
**Status:** 📋 Draft
**Started:** —
**Completed:** —
**Builds on:** Sprint 16 (AI integration layer with OpenAI client, cost tracking, rate limiting; AI-04 endorsement writer, AI-02 cert OCR, AI-03 multilingual requests, AI-17 profile suggestions)

## Goal

Harden graph integrity before opening the platform to recruiter access in Phase 2. Two complementary features: attachment confirmation prevents false claims on established yachts (protecting the graph from late-stage infiltration), and smart yacht autocomplete using semantic embeddings prevents duplicate yacht entries (preserving graph connectivity). Together they address the two main threats to graph quality — fake attachments and fragmented yacht entities. Sprint 16's shared AI integration layer (`lib/ai/`) and OpenAI API infrastructure are reused for the embedding-based autocomplete. This is the final sprint of Phase 1C: after this, the crew-side product stands on its own and the platform is ready for recruiter demand.

## Scope

**In:**
- Attachment confirmation flow for established yachts (D-017)
- Yacht establishment detection: yachts auto-transition from "fresh" to "established" when both conditions met (60+ days old AND crew threshold reached)
- Crew threshold by yacht size: <30m → 3 crew, 30–50m → 5, 50–80m → 8, 80m+ → 12
- Confirmation request to eligible crew (verified users with overlapping dates or current attachment)
- Confirmation resolution: approved (confirms received), rejected (majority reject after 7 days), auto-approved (no response after 7 days)
- Rejection penalties: 3 rejections in 30 days → shadow-constrain, 5 in 60 days → freeze + escalate
- Smart yacht autocomplete via semantic embeddings (AI-11, Free)
- Yacht name + metadata embedding using text-embedding-3-small
- Nightly batch re-indexing of yacht embeddings + on-creation indexing
- Fallback to existing trigram search when vector search returns no results above threshold
- Yacht establishment status badge on yacht detail pages and search results

**Out:**
- Verified status system (Phase 4, Sprint 26 — for Phase 1C, use a simplified "eligible confirmer" check based on tenure + endorsement count, not a full verification chain)
- Yacht merge tooling (Phase 2+ — prevention via better autocomplete is the Phase 1C strategy, D-006)
- Admin moderation dashboard (future — rejection escalations logged for manual admin review via Supabase dashboard for now)
- Full community moderation voting system (Phase 4 — Sprint 17 only implements the attachment confirmation subset)
- Confirmed attachment badges on profiles (future consideration — keep attachments visually consistent for now)
- AI-powered attachment fraud detection (future — manual patterns only for Phase 1C)

## Dependencies

- Sprint 16 complete: `lib/ai/openai-client.ts`, `lib/ai/rate-limiter.ts`, `lib/ai/cost-tracker.ts`, `ai_usage_log` table — all reused for embedding API calls
- `yachts` table with `id`, `name`, `yacht_type`, `length_metres`, `flag_state`, `created_at` — exists from Sprint 4
- `attachments` table with `user_id`, `yacht_id`, `started_at`, `ended_at` — exists from Sprint 2–4
- `YachtPicker` component with existing fuzzy search and near-miss detection — exists from Sprint 4, enhanced in Sprint 12
- `search_yachts()` RPC with trigram matching — exists from Sprint 4 (fallback for vector search)
- Yacht detail page `/app/yacht/[id]` — exists from Sprint 12 (will show establishment badge)
- Notification email infrastructure via Resend — exists from Sprint 5/8
- OpenAI API key and `lib/ai/` infrastructure — exists from Sprint 16
- **Simplified verification check needed:** Since the full verified status system (D-016) is Phase 4, Sprint 17 needs a lightweight "eligible confirmer" heuristic. Proposed: user has ≥3 endorsements from ≥2 different yachts AND account age ≥90 days. This approximates trust without building the full verification chain.

## Key Deliverables

### Yacht Establishment System

- ⬜ `yacht_status` column on `yachts` table: `fresh` (default), `established`
- ⬜ `yacht_established_at` timestamptz column on `yachts` table
- ⬜ Establishment detection: computed on attachment changes (not stored as a trigger — recalculate when a new attachment is created or removed)
- ⬜ Establishment conditions (both must be met):
  - Yacht age ≥ 60 days (`created_at + interval '60 days' <= now()`)
  - Crew count meets size-based threshold:
    - `length_metres < 30` OR `length_metres IS NULL`: 3 attached users
    - `length_metres >= 30 AND length_metres < 50`: 5 attached users
    - `length_metres >= 50 AND length_metres < 80`: 8 attached users
    - `length_metres >= 80`: 12 attached users
- ⬜ `check_yacht_establishment(p_yacht_id uuid)` RPC — returns current status, recalculates if conditions changed
- ⬜ Yachts without length default to the lowest threshold (3 crew) — don't penalise missing metadata
- ⬜ "Established" badge on yacht detail page and yacht search results (Sprint 12 already shows crew count)
- ⬜ Establishment is one-way in Phase 1C: once established, a yacht stays established even if crew detach (prevents gaming by removing crew to reset status)

### Attachment Confirmation Flow

- ⬜ When a user creates an attachment to an established yacht, the attachment enters `pending_confirmation` state instead of `active`
- ⬜ `attachment_status` column on `attachments` table: `active` (default for fresh yachts), `pending_confirmation`, `confirmed`, `rejected`
- ⬜ `attachment_confirmations` table: `id`, `attachment_id`, `confirmer_id`, `decision` (confirm/reject), `created_at`
- ⬜ Eligible confirmers: users who are "trusted" (see simplified verification check in Dependencies) AND have overlapping dates on that yacht with the requester OR have a current (no `ended_at`) attachment
- ⬜ `get_eligible_confirmers(p_attachment_id uuid)` RPC — returns list of eligible crew
- ⬜ Confirmation request notification: email to eligible confirmers via Resend with deep link to confirmation page
- ⬜ Confirmation UI: dedicated page `/app/confirmations/[attachment_id]` showing:
  - Requester's profile summary (name, photo, role, claimed dates)
  - Yacht context (name, their own tenure on this yacht)
  - "Confirm" / "Reject" / "I don't recognise this person" buttons
  - Optional comment field for rejections
- ⬜ Pending attachments visible on the requester's profile with "Pending confirmation" label (not hidden — transparency)
- ⬜ Pending endorsements: if someone tries to endorse the requester based on this yacht while it's pending, show "Endorsement will be active once the attachment is confirmed"

### Confirmation Resolution

- ⬜ Resolution rules (from yl_moderation.md Section 4):
  - **Approved:** required number of confirms received (1 confirm sufficient for Phase 1C — keep friction low)
  - **Rejected:** majority of respondents reject after 7 days (minimum 2 respondents)
  - **Auto-approved:** no response after 7 days → attachment becomes active (prevent griefing via inaction)
- ⬜ Cron job: runs daily, checks pending confirmations older than 7 days, auto-approves unresolved ones
- ⬜ On approval: attachment status → `confirmed`, any pending endorsements for this yacht activate
- ⬜ On rejection: attachment status → `rejected`, requester notified via email with appeal information
- ⬜ Rejection tracking per user: `attachment_rejections` table (`user_id`, `created_at`) for penalty thresholds
- ⬜ Penalty enforcement:
  - 3 rejections in 30 days → `shadow_constrained` flag on user (new attachments silently reviewed, visible to admin only)
  - 5 rejections in 60 days → `attachment_frozen` flag on user + escalation logged for admin review
- ⬜ `check_rejection_penalties(p_user_id uuid)` RPC — called after each rejection, applies penalties if thresholds met

### Simplified Trust Check (Pre-Verification)

- ⬜ `is_trusted_user(p_user_id uuid)` RPC — lightweight verification proxy:
  - Account age ≥ 90 days
  - ≥ 3 endorsements received from ≥ 2 different yachts
  - Not shadow-constrained or frozen
- ⬜ Used exclusively for confirmer eligibility in Sprint 17 — does NOT grant "verified" badge or moderation power
- ⬜ Phase 4 (Sprint 26) replaces this with the full verified status chain of trust (D-016)

### Smart Yacht Autocomplete (AI-11)

- ⬜ `yacht_embeddings` table: `yacht_id` (FK, unique), `embedding` vector(1536), `metadata_text` text, `updated_at` timestamptz
- ⬜ Supabase `pgvector` extension enabled (`CREATE EXTENSION IF NOT EXISTS vector`)
- ⬜ Embedding generation: each yacht's `metadata_text` = `"[name] [yacht_type] [length]m [flag_state]"` (e.g., "Lady M Motor Yacht 62m Cayman Islands")
- ⬜ On yacht creation: generate embedding via text-embedding-3-small, insert into `yacht_embeddings`
- ⬜ Nightly batch re-index: cron job regenerates all embeddings using OpenAI Batch API (50% off) — handles metadata updates, new yachts missed by the on-creation hook
- ⬜ Cost: ~EUR 0.01 for 10K yachts (text-embedding-3-small at $0.02/1M tokens)
- ⬜ `search_yachts_semantic(p_query text, p_limit int DEFAULT 10)` RPC:
  - Generate embedding for user's query text
  - `SELECT y.*, 1 - (ye.embedding <=> query_embedding) AS similarity FROM yachts y JOIN yacht_embeddings ye ON y.id = ye.yacht_id ORDER BY similarity DESC LIMIT p_limit`
  - Filter results above similarity threshold (0.7 — tune based on testing)
- ⬜ Handles: MY/M.Y./M/Y variations, misspellings ("Lady M" vs "Lday M"), partial names ("Lady"), name + descriptor ("the 62m Benetti"), alternate naming conventions
- ⬜ Falls back to existing `search_yachts()` trigram search if vector search returns no results above threshold
- ⬜ Results display: ranked list with yacht name, type, length, flag state, crew count, established badge — same confirmation UX as existing duplicate prevention (D-037)

### YachtPicker Upgrade

- ⬜ Replace trigram-first search in `YachtPicker` component with semantic-first:
  1. User types yacht name → debounce 300ms
  2. Call `search_yachts_semantic()` → if results above threshold, display them
  3. If no semantic results, fall back to `search_yachts()` (trigram)
  4. If still no results, show "Create new yacht" option
- ⬜ Display crew count and established badge on each candidate (already partially in Sprint 12)
- ⬜ Confirmation dialog on near-miss: if top semantic result has similarity >0.85 but user chose "Create new", show enhanced duplicate warning with side-by-side comparison
- ⬜ Works in onboarding flow (Sprint 11) and add-attachment flow (profile page)
- ⬜ Latency target: <500ms for semantic search (embedding generation + vector query)

### Database Migration

- ⬜ `ALTER TABLE yachts ADD COLUMN yacht_status text DEFAULT 'fresh'`
- ⬜ `ALTER TABLE yachts ADD COLUMN yacht_established_at timestamptz`
- ⬜ `ALTER TABLE attachments ADD COLUMN attachment_status text DEFAULT 'active'`
- ⬜ `CREATE TABLE attachment_confirmations (id uuid PK, attachment_id uuid FK, confirmer_id uuid FK, decision text CHECK (decision IN ('confirm', 'reject')), comment text, created_at timestamptz DEFAULT now())`
- ⬜ Unique index: `attachment_confirmations(attachment_id, confirmer_id)`
- ⬜ `CREATE TABLE attachment_rejections (id uuid PK, user_id uuid FK, attachment_id uuid FK, created_at timestamptz DEFAULT now())`
- ⬜ Index: `attachment_rejections(user_id, created_at)` for penalty threshold queries
- ⬜ `CREATE EXTENSION IF NOT EXISTS vector`
- ⬜ `CREATE TABLE yacht_embeddings (yacht_id uuid PK REFERENCES yachts(id), embedding vector(1536), metadata_text text, updated_at timestamptz DEFAULT now())`
- ⬜ Index: `CREATE INDEX ON yacht_embeddings USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100)` (tune `lists` based on yacht count — 100 is fine up to 50K)
- ⬜ RLS policies on all new tables
- ⬜ `check_yacht_establishment(p_yacht_id uuid)` RPC
- ⬜ `get_eligible_confirmers(p_attachment_id uuid)` RPC
- ⬜ `is_trusted_user(p_user_id uuid)` RPC
- ⬜ `check_rejection_penalties(p_user_id uuid)` RPC
- ⬜ `search_yachts_semantic(p_query text, p_limit int)` RPC
- ⬜ GRANT EXECUTE on all new functions

### PostHog Events

- ⬜ `yacht_established` with yacht_id, crew_count, age_days
- ⬜ `attachment_confirmation_requested` with yacht_id, requester_id, eligible_confirmer_count
- ⬜ `attachment_confirmed` / `attachment_rejected` / `attachment_auto_approved` with yacht_id
- ⬜ `attachment_rejection_penalty_applied` with user_id, penalty_type
- ⬜ `yacht_search_semantic` with query, result_count, top_similarity_score
- ⬜ `yacht_search_fallback_trigram` (tracks how often semantic search misses)
- ⬜ `yacht_duplicate_warning_shown` / `yacht_duplicate_warning_overridden` (user created new yacht despite near-match)

## Exit Criteria

- Yachts auto-transition to "established" when age + crew threshold conditions met
- Established badge visible on yacht detail page and search results
- New attachments to established yachts enter pending confirmation state
- Eligible confirmers receive email notification with deep link to confirmation page
- Confirmers can confirm or reject with optional comment
- Resolution: approved on 1 confirm, rejected on majority reject after 7 days, auto-approved on no response after 7 days
- Rejection penalties enforced: 3 in 30 days → shadow-constrain, 5 in 60 days → freeze
- Pending attachments visible on profile with "Pending confirmation" label
- Smart yacht autocomplete: typing a yacht name returns semantically matched results (handles variations, misspellings, partial names)
- YachtPicker uses semantic search first, trigram fallback second
- Near-miss duplicate warning fires when user creates a yacht despite high-similarity match
- Vector search returns in <500ms
- Nightly embedding batch re-index cron job operational
- All components work at 375px width (mobile-first)
- PostHog events firing for establishment, confirmations, rejections, penalties, and semantic search
- Graph navigation preserved: confirmation page links to requester profile and yacht, established badge links to yacht detail

## Estimated Effort

8–10 days

## Notes

**Attachment confirmation is the most consequential feature in Phase 1C.** It introduces the first real friction into the graph formation process. Every design choice here trades off between integrity (preventing false claims) and growth (not scaring away legitimate crew). The decision to auto-approve after 7 days of silence is critical — without it, a crew member's attachment could be held hostage by inactive confirmers. Monitor the false dispute rate closely after launch.

**The simplified trust check is a deliberate shortcut.** The full verified status system (D-016) involves seed sets, endorsement chains from verified users, and earned moderation power — that's Sprint 26 scope. For Sprint 17, the `is_trusted_user()` heuristic (90-day account, 3+ endorsements from 2+ yachts) is a pragmatic proxy. It's imperfect: a new-but-legitimate user with a short account history can't confirm. But it prevents a just-created sock puppet from confirming a co-conspirator. The build plan should document this as a known limitation with a migration path to the full system.

**pgvector is a new infrastructure dependency.** Supabase supports pgvector natively, so enabling the extension is straightforward. But this is the first time the codebase uses vector operations. The build plan should include: (1) verify pgvector is available on the current Supabase plan, (2) test IVFFlat index performance with realistic data, (3) document the embedding dimension (1536 for text-embedding-3-small) as a constant that future features (AI-07 NLP search in Sprint 20) will also use.

**Semantic search dramatically improves duplicate prevention.** Current trigram matching catches "Lady M" vs "Lady N" but misses "MY Lady S" vs "M/Y Lady S" vs "Motor Yacht Lady S". Semantic matching handles naming convention variations, misspellings, and even descriptive queries. The side-by-side duplicate comparison (Sprint 12) combined with semantic matching should reduce yacht duplication to near-zero for common names. Track `yacht_duplicate_warning_overridden` events — if users frequently override high-similarity warnings, the warning UX or threshold needs tuning.

**Hardest technical challenge:** The confirmation flow's interaction with the endorsement system. If User A attaches to established yacht X (pending confirmation) and User B tries to endorse User A based on yacht X, the endorsement can't fully activate until the attachment is confirmed. The "pending endorsement" state needs careful handling: store the endorsement, display it with a caveat, and activate it when the attachment confirms. If the attachment is rejected, the pending endorsement must be voided. This is a state machine that touches both the attachment and endorsement tables — it needs thorough test coverage.

**This sprint closes Phase 1C.** After Sprint 17, the crew-side product has: profiles, CV onboarding, yacht graph, endorsements with signals, availability, crew search, AI convenience features, and graph integrity controls. The platform is ready for Phase 2's gate check: 10K+ crew, recruiter demand confirmed. Phase 2 opens with peer hiring (Sprint 18), then recruiter access (Sprint 19), then agency plans + NLP search (Sprint 20).

**Next sprint picks up:** Sprint 18 (Phase 2) introduces peer hiring — crew-to-crew job posting using the graph. It builds on everything in Phase 1C: the graph with integrity controls, availability signals, search infrastructure, and the AI layer. Sprint 18 is the first feature where the graph directly creates economic value for crew — captains posting positions, visible to graph-adjacent available crew.

# Sprint 26 — Verified Status + Community Moderation

> **RALPH LOOP DRAFT** — Written sequentially by automated planning loop. Each sprint reads and builds on the preceding sprint's output. This is a planning document, not a build spec. Once reviewed and approved by the founder, a separate session hardens this into a full `build_plan.md`.

**Phase:** 4
**Status:** 📋 Draft
**Started:** —
**Completed:** —
**Builds on:** Sprint 25 (voice onboarding, photo coach, cover letter, interview prep; advanced AI patterns established)

## Goal

Make the graph self-governing. Replace admin-dependent moderation with community-driven trust governance. Verified status — earned through tenure, endorsement density from verified users, or seed-set membership — grants expanded moderation power: confirming attachments on established yachts, voting on account flags, and participating in expanded moderation pools. This replaces Sprint 17's `is_trusted_user()` heuristic with the full verified status chain of trust (D-016). Alongside this, endorsement sentiment analysis (AI-21) gives recruiters a qualitative depth indicator — "detailed endorsements" vs no indicator — without introducing numeric scores (D-002). Sprint 26 closes Phase 4 and completes the planned roadmap: after this, YachtieLink is a self-sustaining platform where the graph moderates itself, AI guides careers, crew communicate directly, and revenue flows from both crew and recruiter channels.

## Scope

**In:**
- Verified status system: three paths to verification (seed set, endorsement from verified, tenure + density) per D-016
- Verified badge on profiles: visible to all users, earned not purchased
- Verified status replaces Sprint 17's `is_trusted_user()` heuristic for attachment confirmation eligibility
- Account flag voting: verified users can flag suspicious accounts, community votes on resolution (D-015, D-018)
- Voting rules: 67% supermajority for early resolution, simple majority after 7 days, minimum 3 votes, ossified accounts require 80% (D-018)
- Account ossification: accounts with 12+ months tenure and high endorsement density require elevated thresholds to flag
- Endorsement abuse handling via verified consensus: repeated dispute patterns trigger community review
- AI-21: Endorsement Sentiment Analysis — backend embedding + clustering, qualitative depth indicator for recruiter search results
- Admin escalation path: community moderation handles routine cases, admin reviews escalations and edge cases
- Moderation dashboard for admin: view flags, votes, resolutions, escalations (lightweight Supabase dashboard, not a full admin UI)

**Out:**
- Paid verified status (D-016: verified is earned through trust evidence, never purchased)
- Automated account suspension without community vote (the system mediates, it doesn't judge unilaterally)
- Verified status affecting search ranking or endorsement weight (verification grants moderation power, not visibility or trust advantage)
- Public moderation logs or vote transparency (votes are private — prevents retaliation)
- AI-powered fraud detection beyond endorsement sentiment (future — Sprint 26 is community moderation, not automated enforcement)
- Full admin moderation dashboard as a standalone app (lightweight Supabase dashboard is sufficient for V1)
- Endorsement sentiment scores visible to crew (D-013: no auto-summary language — crew never see sentiment analysis)

## Dependencies

- Sprint 25 complete: Phase 4 AI features operational, platform at maturity scale
- Sprint 17 complete: `is_trusted_user()` heuristic (replaced by full verified status), attachment confirmation flow, `yacht_status` and `attachment_status` columns
- Sprint 14 complete: `endorsement_signals` table (signals inform trust weight context but are separate from verification)
- Sprint 20 complete: pgvector + text-embedding-3-small infrastructure (reused for AI-21 endorsement embeddings)
- Sprint 16 complete: `lib/ai/` infrastructure, `ai_usage_log` table
- Sprint 22 complete: `createNotification()` service (notifications for flag votes, verification earned, moderation results)
- `endorsements` table with full text — exists from Sprint 5
- `attachments` table — exists from Sprint 2–4
- `users` table with account age, endorsement count — computable from existing data
- Moderation doc: `docs/yl_moderation.md` — canonical reference for all voting rules and thresholds

## Key Deliverables

### Verified Status System

- ⬜ `verified_status` column on `users` table: `unverified` (default), `verified`
- ⬜ `verified_at` timestamptz column on `users` table
- ⬜ `verified_via` text column on `users` table: `seed_set`, `endorsement_chain`, `tenure_density`
- ⬜ Verification check runs automatically on relevant events (new endorsement received, account age milestone)

### Path 1: Seed Set

- ⬜ `seed_set_members` table: `user_id` uuid PK, `added_by` text (founder), `created_at` timestamptz
- ⬜ Admin action: founder adds users to seed set via Supabase dashboard (or simple admin API route)
- ⬜ On addition: user's `verified_status` → `verified`, `verified_via` → `seed_set`
- ⬜ Seed set is the bootstrap — 10–20 trusted crew who the founder knows personally

### Path 2: Endorsement from Verified

- ⬜ Requirement: receive endorsements from 2+ verified users on 2+ different yachts
- ⬜ `check_verification_endorsement_path(p_user_id uuid)` RPC:
  - Count distinct verified endorsers
  - Count distinct yachts where verified endorsers endorsed this user
  - If verified_endorsers >= 2 AND distinct_yachts >= 2 → eligible
- ⬜ Trigger: runs on every new endorsement received (check if the new endorser is verified and if the threshold is now met)
- ⬜ On eligibility: set `verified_status` → `verified`, `verified_via` → `endorsement_chain`
- ⬜ Notification: "You've earned verified status — endorsed by trusted colleagues" via `createNotification()`

### Path 3: Tenure + Density

- ⬜ Requirement: 12+ months on platform AND 3+ endorsements from 3+ distinct users
- ⬜ `check_verification_tenure_path(p_user_id uuid)` RPC:
  - Account age >= 12 months (`created_at + interval '12 months' <= now()`)
  - Count distinct endorsers >= 3
  - Count endorsements received >= 3
  - If both met → eligible
- ⬜ Trigger: monthly cron checks all unverified users against tenure path (account age changes slowly — daily check is unnecessary)
- ⬜ On eligibility: set `verified_status` → `verified`, `verified_via` → `tenure_density`
- ⬜ Notification: "You've earned verified status through your tenure and endorsement history"

### Verified Badge

- ⬜ Checkmark badge displayed next to verified users' names on:
  - Profile page (app and public)
  - Colleague explorer cards
  - Yacht detail crew cards
  - Position cards and application cards
  - Endorsement cards (endorser badge)
  - Timeline entries
  - Search results
  - Contact list and conversation headers
- ⬜ Badge is cosmetic — it signals trust evidence, not paid status
- ⬜ Tooltip on tap: "Verified — earned through [tenure and endorsement history / endorsements from trusted colleagues / founder verification]"

### Attachment Confirmation Migration

- ⬜ Replace Sprint 17's `is_trusted_user()` heuristic with actual `verified_status = 'verified'` check
- ⬜ Update `get_eligible_confirmers()` RPC: eligible confirmers must have `verified_status = 'verified'` (instead of the tenure+endorsement heuristic)
- ⬜ All existing attachment confirmation logic (Sprint 17) remains — only the eligibility check changes
- ⬜ Drop or deprecate `is_trusted_user()` RPC (replaced by `verified_status` column check)

### Account Flag Voting

- ⬜ `account_flags` table:
  - `id` uuid PK
  - `flagged_user_id` uuid FK → users (the accused)
  - `flagged_by` uuid FK → users (must be verified)
  - `reason` text NOT NULL (free text explanation)
  - `status` text DEFAULT 'open' CHECK (status IN ('open', 'resolved_removed', 'resolved_cleared', 'escalated'))
  - `created_at` timestamptz DEFAULT now()
  - `resolved_at` timestamptz
- ⬜ `account_flag_votes` table:
  - `id` uuid PK
  - `flag_id` uuid FK → account_flags
  - `voter_id` uuid FK → users (must be verified)
  - `vote` text CHECK (vote IN ('remove', 'clear'))
  - `created_at` timestamptz DEFAULT now()
- ⬜ Unique constraint: `account_flag_votes(flag_id, voter_id)` — one vote per flag per user
- ⬜ Voting eligibility: only verified users can vote; accused cannot vote on their own flag
- ⬜ Voter pool: verified users who have a graph connection to the flagged user (shared yacht or IRL connection) — ensures voters have relevant context
- ⬜ Flag creation: verified user taps "Flag account" on a profile → reason input → flag created → eligible voters notified

### Vote Resolution (D-018)

- ⬜ Resolution rules:
  - **Early resolution (< 7 days):** 67% supermajority required, minimum 3 votes
  - **Standard resolution (>= 7 days):** simple majority, minimum 3 votes
  - **Ossified accounts:** 80% supermajority required (ossified = 12+ months + high endorsement density — same tenure path as verification)
- ⬜ Resolution outcomes:
  - **Remove:** account suspended, profile hidden from search, existing endorsements preserved but hidden. User notified with appeal information.
  - **Clear:** flag dismissed, no action. Flagged user not notified (no scarlet letter).
  - **Escalated:** insufficient votes after 14 days, or disputed edge case → flagged for admin review
- ⬜ Resolution cron: daily, checks open flags for resolution eligibility
- ⬜ Anti-abuse: if a verified user's flags are consistently cleared (>3 cleared flags with 0 removals), their flagging ability is temporarily suspended (prevents weaponised flagging)

### Account Ossification

- ⬜ `is_ossified(p_user_id uuid)` RPC: returns true if account age >= 12 months AND endorsement count >= 5 from >= 4 distinct users
- ⬜ Ossified accounts require 80% supermajority to remove (not simple majority or 67%)
- ⬜ Rationale: established legitimate users should be harder to remove than new accounts — protects against coordinated flagging campaigns

### AI-21 — Endorsement Sentiment Analysis

- ⬜ `endorsement_sentiment` table:
  - `endorsement_id` uuid PK FK → endorsements
  - `embedding` vector(1536)
  - `specificity_score` numeric(4,3) (0.000 to 1.000 — cosine similarity to "detailed" cluster)
  - `computed_at` timestamptz DEFAULT now()
- ⬜ Reference set: manually curated set of 50–100 "high-quality" endorsements (specific, detailed, role-relevant) embedded as the "detailed" cluster centroid
- ⬜ Batch processing: nightly cron embeds all new/updated endorsements via OpenAI Batch API (50% off)
- ⬜ Specificity score: cosine similarity between endorsement embedding and the quality cluster centroid
- ⬜ Profile-level indicator: `get_endorsement_depth(p_user_id uuid)` RPC:
  - Count endorsements with `specificity_score > 0.7` (threshold — tune based on reference set)
  - If >= 3 endorsements above threshold → return `'detailed'`
  - Otherwise → return `null` (no indicator — absence is neutral per D-011)
- ⬜ Display to recruiters: "Detailed endorsements" badge on recruiter search result cards (Sprint 19)
  - Only shown for profiles with the `detailed` indicator
  - No indicator for profiles below threshold (not "generic endorsements" — absence is neutral)
- ⬜ Recruiter filter: optional filter "Has detailed endorsements" in recruiter search (Sprint 19 UI extended)
- ⬜ Does NOT affect crew-facing display — crew never see specificity scores or the detailed badge
- ⬜ Does NOT affect search ranking — recruiters can filter by it, but it doesn't auto-boost
- ⬜ Does NOT constitute auto-summary language (D-013) — describes endorsement content quality, not the crew member's quality
- ⬜ Cost: ~EUR 0.0001/endorsement (text-embedding-3-small, batch)
- ⬜ Re-embedded on endorsement edit or retraction
- ⬜ Monitor for gaming: if "detailed" endorsements spike anomalously, investigate coaching patterns

### Database Migration

- ⬜ `ALTER TABLE users ADD COLUMN verified_status text DEFAULT 'unverified'`
- ⬜ `ALTER TABLE users ADD COLUMN verified_at timestamptz`
- ⬜ `ALTER TABLE users ADD COLUMN verified_via text`
- ⬜ Index: `users(verified_status)` for voter pool queries
- ⬜ `CREATE TABLE seed_set_members (user_id uuid PK FK, added_by text, created_at timestamptz DEFAULT now())`
- ⬜ `CREATE TABLE account_flags (id uuid PK, flagged_user_id uuid FK, flagged_by uuid FK, reason text NOT NULL, status text DEFAULT 'open', created_at timestamptz DEFAULT now(), resolved_at timestamptz)`
- ⬜ Index: `account_flags(flagged_user_id, status)`
- ⬜ `CREATE TABLE account_flag_votes (id uuid PK, flag_id uuid FK, voter_id uuid FK, vote text NOT NULL, created_at timestamptz DEFAULT now())`
- ⬜ Unique index: `account_flag_votes(flag_id, voter_id)`
- ⬜ `CREATE TABLE endorsement_sentiment (endorsement_id uuid PK FK, embedding vector(1536), specificity_score numeric(4,3), computed_at timestamptz DEFAULT now())`
- ⬜ `check_verification_endorsement_path(p_user_id uuid)` RPC
- ⬜ `check_verification_tenure_path(p_user_id uuid)` RPC
- ⬜ `is_ossified(p_user_id uuid)` RPC
- ⬜ `get_endorsement_depth(p_user_id uuid)` RPC
- ⬜ Update `get_eligible_confirmers()` to use `verified_status` instead of `is_trusted_user()` heuristic
- ⬜ RLS: verified users can read/vote on flags for graph-connected users; all users can read their own verification status
- ⬜ GRANT EXECUTE on all new functions

### PostHog Events

- ⬜ `verified_status_earned` with path (seed_set, endorsement_chain, tenure_density)
- ⬜ `account_flagged` with reason_length, flagger_verified (always true)
- ⬜ `account_flag_vote_cast` with vote type
- ⬜ `account_flag_resolved` with outcome (removed, cleared, escalated), vote_count, days_open
- ⬜ `account_flag_anti_abuse_triggered` (flagger suspended)
- ⬜ `endorsement_sentiment_computed` with batch_size (nightly cron)
- ⬜ `endorsement_depth_filter_used` (recruiter used the detailed endorsements filter)

## Exit Criteria

- Verified status: all three paths operational (seed set, endorsement chain, tenure + density)
- Verified badge visible on profiles and across all card types
- Attachment confirmation uses `verified_status` check (Sprint 17's `is_trusted_user()` replaced)
- Account flag voting: verified users can flag, vote, and resolve account disputes
- Voting rules enforced: 67%/simple/80% thresholds, minimum 3 votes, ossification protection
- Anti-abuse: repeat false-flaggers get flagging ability suspended
- Escalation to admin works for unresolved or edge-case flags
- AI-21: endorsement sentiment computed nightly, "detailed endorsements" indicator shown to recruiters
- Sentiment indicator respects D-011 (no indicator for profiles below threshold) and D-013 (not auto-summary language)
- Crew never see sentiment scores or the detailed badge on their own or others' profiles
- All components work at 375px width (mobile-first)
- PostHog events firing for verification, flagging, voting, and sentiment analysis
- Admin moderation workload measurably reduced vs pre-Sprint 26 baseline
- Payment never grants verified status, moderation power, or trust advantage (D-003, D-016)

## Estimated Effort

10–14 days

## Notes

**Verified status is the most consequential governance feature in the entire product.** It determines who can confirm yacht attachments, who can vote on account flags, and how resistant established users are to removal. Getting the thresholds right is critical: too easy and sock puppets game the system; too hard and legitimate crew can't participate in governance. The three-path approach provides redundancy — seed set bootstraps the chain, endorsement chain extends it organically, tenure + density catches long-term legitimate users who happen not to have been endorsed by verified users.

**Seed set is the bootstrap mechanism.** The founder manually verifies 10–20 crew members they know personally. These seed users can then endorse others, extending the verified chain. The seed set should be geographically and departmentally diverse — not just 20 captains in Antibes. Include deckhands, stews, engineers, chefs from different regions to ensure the chain reaches across the community.

**Ossification prevents coordinated takedowns (D-018).** An established user with 12 months on platform and dense endorsement history should be very hard to remove. The 80% supermajority threshold means a flagging campaign would need near-unanimous agreement from graph-connected verified users — which is very unlikely for a legitimate user. This protects against industry politics: a captain with enemies shouldn't be removable because 3 people don't like them.

**AI-21 is the most subtle feature in the sprint.** The "detailed endorsements" indicator walks a fine line: it gives recruiters useful signal (specific endorsements are more informative than generic ones) without creating a score or label that violates D-002 (no ratings) or D-013 (no auto-summary language). The absence of the indicator is not a negative — profiles without the badge simply don't have enough detailed endorsements yet. Monitor carefully: if crew start coaching each other to write "detailed" endorsements specifically to trigger the indicator, the feature may need adjustment.

**The reference set for AI-21 needs careful curation.** The quality cluster centroid is only as good as the reference endorsements. Curate 50–100 endorsements that are specific, detailed, and role-relevant — not just long. A 50-word endorsement that mentions a specific incident is more "detailed" than a 200-word generic one. The reference set should span departments and seniority levels.

**Hardest technical challenge:** The voter pool computation for account flag voting. Eligible voters are verified users with a graph connection to the flagged user (shared yacht or IRL connection). At scale, this requires joining `users(verified_status)` against `attachments` (shared yachts) and `irl_connections` (confirmed connections) for the flagged user. The query needs to be efficient — consider a materialised `user_graph_connections` view or caching the voter pool on flag creation.

**This sprint closes Phase 4 and the planned roadmap.** After Sprint 26, YachtieLink has: portable crew profiles, a trust graph anchored to real yacht history, peer hiring, recruiter access with credits, agency plans, NLP search, messaging, notifications, multilingual profiles, a chronological timeline, IRL connections, AI career tools, voice onboarding, and community-driven moderation. The platform is self-sustaining: the graph moderates itself, AI guides careers, revenue covers costs. Future work is iterative improvement, not foundational construction.

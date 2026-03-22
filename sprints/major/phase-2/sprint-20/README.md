# Sprint 20 — Agency Plans + NLP Search

> **RALPH LOOP DRAFT** — Written sequentially by automated planning loop. Each sprint reads and builds on the preceding sprint's output. This is a planning document, not a build spec. Once reviewed and approved by the founder, a separate session hardens this into a full `build_plan.md`.

**Phase:** 2
**Status:** 📋 Draft
**Started:** —
**Completed:** —
**Builds on:** Sprint 19 (recruiter accounts, EUR 29/month subscription, credit system, profile unlock, recruiter search with locked/unlocked profiles)

## Goal

Scale recruiter access from individual recruiters to agencies, and replace filter-based crew search with conversational natural language queries. Agency plans capture more revenue per customer by selling multi-seat accounts with shared credit pools, shortlists, and bulk operations. NLP search (AI-07) lets recruiters describe what they need in plain language — "Chief stew for a 60m charter yacht, silver service experience, French-speaking, available May" — and get ranked results with AI-generated match explanations. Both features build directly on Sprint 19's recruiter infrastructure (accounts, credits, unlocks) and Sprint 17's pgvector infrastructure (embeddings, IVFFlat index). This sprint closes Phase 2: after it, YachtieLink has a working two-sided marketplace with crew-side identity, graph-based hiring, and demand-side revenue.

## Scope

**In:**
- Agency accounts: multi-seat recruiter accounts under a single organisation
- Agency subscription: EUR 29/month per seat (same pricing as individual, volume is the upsell)
- Shared credit pool: all seats in an agency draw from and contribute to the same credit balance
- Shared shortlists: agency-level shortlist of unlocked profiles visible to all seats
- Bulk unlock: select multiple profiles from search results, unlock all at once (1 credit each)
- CSV export of unlocked profiles (name, role, contact, endorsement count, yacht history)
- Agency-level analytics: total unlocks, search activity, credit usage per seat, per month
- Agency admin role: manages seats (invite/remove), views analytics, purchases credits
- NLP crew search (AI-07): natural language query → semantic vector search → ranked results with match explanations
- Profile + endorsement text embeddings using text-embedding-3-small via pgvector (extends Sprint 17 yacht embedding infrastructure)
- Incremental embedding updates on profile changes
- AI-generated match explanations per result using GPT-5

**Out:**
- Agency job posting (agencies use Sprint 18 recruiter browse — or refer crew to post positions directly)
- Agency-to-crew messaging (Phase 3 — agencies use unlocked contact methods)
- Agency billing dashboard beyond basic credit/subscription overview (keep it simple for V1)
- Voice search or conversational search follow-ups (future — single-query-in, results-out for V1)
- AI-powered candidate recommendation (AI surfaces matches, humans decide — this is filtering, not recommending)
- Recruiter-side endorsement analysis or trust scoring (D-024: recruiters are read-only on trust data)
- White-label or co-branded agency portals
- API access for agencies (future — no programmatic access in V1)

## Dependencies

- Sprint 19 complete: `recruiters` table, `recruiter_credits`, `recruiter_unlocks`, `search_crew_recruiter()` RPC, Stripe recruiter subscription, `unlock_crew_profile()` RPC
- Sprint 17 complete: pgvector extension enabled, `yacht_embeddings` table, IVFFlat index, nightly batch re-index cron, `search_yachts_semantic()` RPC pattern (reuse for crew profile embeddings)
- Sprint 16 complete: `lib/ai/openai-client.ts`, `lib/ai/cost-tracker.ts`, `ai_usage_log` table (reuse for NLP search cost tracking)
- Sprint 15 complete: `search_crew()` RPC (filter-based search remains as fallback)
- `users` table with profile fields: role, department, location, bio, sea time — all exist
- `endorsements` table with free-text endorsement content — exists from Sprint 5 (endorsement text becomes searchable via embeddings)
- `certifications` table — exists from Sprint 3 (cert types become searchable)
- OpenAI API key — exists from Sprint 16

## Key Deliverables

### Agency Account Model

- ⬜ `agencies` table:
  - `id` uuid PK
  - `name` text NOT NULL (agency name)
  - `admin_recruiter_id` uuid FK → recruiters (the recruiter who created the agency)
  - `stripe_customer_id` text (agency-level Stripe customer for billing)
  - `created_at` timestamptz DEFAULT now()
  - `updated_at` timestamptz DEFAULT now()
- ⬜ `agency_id` nullable FK column on `recruiters` table — if set, recruiter is part of an agency
- ⬜ `agency_role` column on `recruiters`: `admin`, `member` (admin can manage seats, purchase credits, view analytics)
- ⬜ Agency creation: individual recruiter promotes their account to an agency admin via `/recruiter/agency/create`
- ⬜ Existing individual subscription converts to agency subscription on creation (no double billing)

### Agency Seat Management

- ⬜ Invite flow: admin enters email → invite email sent → recipient signs up as recruiter with auto-association to agency
- ⬜ `agency_invitations` table: `id`, `agency_id`, `email`, `invited_by`, `status` (pending/accepted/expired), `created_at`, `expires_at` (7 days)
- ⬜ Per-seat billing: each accepted invite creates a new EUR 29/month Stripe subscription item (metered billing on the agency's Stripe customer)
- ⬜ Remove seat: admin can deactivate a member (subscription item removed at end of billing period, access revoked immediately)
- ⬜ Seat management UI: `/recruiter/agency/seats` — list of members, invite button, remove action
- ⬜ Maximum seats: no hard limit in V1 (enterprise negotiation for 50+ seats is a future sales conversation)

### Shared Credit Pool

- ⬜ Agency credits: `recruiter_credits.agency_id` FK — credits purchased by any agency member are tagged to the agency
- ⬜ Credit deduction: agency members draw from the shared pool (same FIFO logic as Sprint 19, scoped to agency credits)
- ⬜ Individual recruiter credits (non-agency) continue to work as before
- ⬜ When a recruiter joins an agency, their existing individual credits remain personal (do not auto-merge into agency pool — keeps accounting clean)
- ⬜ Credit purchase: any agency member can purchase credits (charged to agency Stripe customer), admin can restrict this via a toggle if needed
- ⬜ Credit balance display: shows agency pool balance, not individual

### Shared Shortlists

- ⬜ `shortlists` table:
  - `id` uuid PK
  - `agency_id` uuid FK → agencies (or `recruiter_id` for individual recruiter shortlists)
  - `name` text NOT NULL (e.g., "Med Season Chief Stews")
  - `created_by` uuid FK → recruiters
  - `created_at` timestamptz DEFAULT now()
- ⬜ `shortlist_entries` table:
  - `id` uuid PK
  - `shortlist_id` uuid FK → shortlists
  - `crew_user_id` uuid FK → users
  - `added_by` uuid FK → recruiters
  - `notes` text (recruiter's private notes on this candidate)
  - `created_at` timestamptz DEFAULT now()
- ⬜ Shortlist UI: `/recruiter/shortlists` — list of shortlists, create new, add crew from search results or unlocked profiles
- ⬜ "Add to shortlist" action on search result cards and unlocked profile views
- ⬜ All agency members can view and edit agency shortlists
- ⬜ Individual (non-agency) recruiters get personal shortlists (same feature, scoped to self)

### Bulk Operations

- ⬜ Multi-select checkboxes on search result cards
- ⬜ Bulk unlock: "Unlock N profiles — N credits" action (atomic transaction, all-or-nothing)
- ⬜ Bulk add to shortlist: select profiles → choose/create shortlist → add all
- ⬜ CSV export: download unlocked profiles as CSV with columns: name, role, department, location, sea time, endorsement count, yacht history (yacht names), contact email, contact phone
- ⬜ CSV export only includes profiles the recruiter/agency has unlocked (never exports locked profiles)
- ⬜ Export logged in PostHog for compliance tracking

### Agency Analytics — `/recruiter/agency/analytics`

- ⬜ Admin only (agency_role = 'admin')
- ⬜ Dashboard sections:
  - Total unlocks this month / all time
  - Credit usage: purchased, used, remaining, expiring soon
  - Search activity: queries per seat per week
  - Top searched roles/departments
  - Unlock-to-search ratio (how efficient is the team at finding candidates)
- ⬜ Per-seat breakdown: which team member is searching/unlocking most
- ⬜ Data source: aggregate queries on `recruiter_unlocks`, `recruiter_credits`, PostHog search events

### NLP Crew Search (AI-07)

- ⬜ `crew_profile_embeddings` table:
  - `user_id` uuid PK FK → users
  - `embedding` vector(1536)
  - `profile_text` text (the concatenated text that was embedded)
  - `updated_at` timestamptz DEFAULT now()
- ⬜ Profile text composition: concatenate `[role] [department] [bio] [location] [yacht names + roles + dates] [cert types] [endorsement text excerpts (first 200 chars each)]` into a single document per user
- ⬜ Initial embedding: batch embed all profiles with `recruiter_visible = true` using OpenAI Batch API (50% off, ~EUR 0.10 for 10K profiles)
- ⬜ Incremental updates: on profile change (bio edit, new yacht, new endorsement, new cert), re-embed that user's profile via on-demand API call
- ⬜ Nightly batch re-embed: catch any missed incremental updates (same pattern as Sprint 17 yacht embeddings)
- ⬜ IVFFlat index on `crew_profile_embeddings(embedding vector_cosine_ops)` — same index type as yacht embeddings
- ⬜ `search_crew_nlp(p_query text, p_recruiter_id uuid, p_limit int DEFAULT 20)` RPC:
  1. Embed the query text via text-embedding-3-small
  2. Vector similarity search against `crew_profile_embeddings` (cosine distance)
  3. Filter: only `recruiter_visible = true` AND `availability_status = 'available'` (or configurable)
  4. Return top N results with similarity scores
- ⬜ NLP search UI: text input bar above the existing filter bar — "Describe the crew you're looking for..."
- ⬜ When NLP query is entered, results come from vector search; when filters are used, results come from `search_crew_recruiter()`; both can be combined (NLP narrows, filters refine)
- ⬜ Latency target: <3 seconds from query submission to results displayed

### AI Match Explanations

- ⬜ For each NLP search result, generate a match explanation via GPT-5:
  - Input: query text + crew profile summary (role, bio, yacht history, endorsement excerpts, certs)
  - Output: 1–2 sentence explanation of why this crew member matches the query
  - Example: "Matched: 8 years chief stew experience across 4 charter yachts, 3 endorsements mentioning silver service, WSET Level 2, French native speaker, available from April 15"
- ⬜ Generated on the fly per result (not pre-computed — queries are too varied)
- ⬜ Cost: ~EUR 0.02/query for 20 results (GPT-5 at ~EUR 0.001/explanation)
- ⬜ Cache: match explanations cached per (query_hash, user_id) for 24 hours to avoid re-generating on pagination/revisit
- ⬜ Fallback: if GPT-5 call fails, show results without explanations (vector search still works)
- ⬜ Log to `ai_usage_log` (Sprint 16 infrastructure)

### Database Migration

- ⬜ `CREATE TABLE agencies (id uuid PK, name text NOT NULL, admin_recruiter_id uuid FK, stripe_customer_id text, created_at timestamptz DEFAULT now(), updated_at timestamptz DEFAULT now())`
- ⬜ `ALTER TABLE recruiters ADD COLUMN agency_id uuid FK REFERENCES agencies(id)`
- ⬜ `ALTER TABLE recruiters ADD COLUMN agency_role text CHECK (agency_role IN ('admin', 'member'))`
- ⬜ `CREATE TABLE agency_invitations (id uuid PK, agency_id uuid FK, email text NOT NULL, invited_by uuid FK, status text DEFAULT 'pending', created_at timestamptz DEFAULT now(), expires_at timestamptz NOT NULL)`
- ⬜ `ALTER TABLE recruiter_credits ADD COLUMN agency_id uuid FK REFERENCES agencies(id)` (nullable — null for individual credits)
- ⬜ `CREATE TABLE shortlists (id uuid PK, agency_id uuid FK, recruiter_id uuid FK, name text NOT NULL, created_by uuid FK, created_at timestamptz DEFAULT now())`
- ⬜ `CREATE TABLE shortlist_entries (id uuid PK, shortlist_id uuid FK, crew_user_id uuid FK, added_by uuid FK, notes text, created_at timestamptz DEFAULT now())`
- ⬜ Unique index: `shortlist_entries(shortlist_id, crew_user_id)`
- ⬜ `CREATE TABLE crew_profile_embeddings (user_id uuid PK FK, embedding vector(1536), profile_text text, updated_at timestamptz DEFAULT now())`
- ⬜ `CREATE INDEX ON crew_profile_embeddings USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100)`
- ⬜ `search_crew_nlp(p_query text, p_recruiter_id uuid, p_limit int)` RPC
- ⬜ `get_agency_analytics(p_agency_id uuid, p_period text)` RPC
- ⬜ RLS: agency members can access agency-scoped tables; individual recruiters access own-scoped tables
- ⬜ GRANT EXECUTE on all new functions

### PostHog Events

- ⬜ `agency_created` with agency_name, seat_count
- ⬜ `agency_seat_invited` / `agency_seat_accepted` / `agency_seat_removed`
- ⬜ `agency_credits_purchased` with bundle_size, agency_id
- ⬜ `nlp_search_executed` with query text (anonymised), result_count, latency_ms
- ⬜ `nlp_match_explanation_generated` with query_hash, result_count
- ⬜ `bulk_unlock_executed` with count, agency_id
- ⬜ `csv_export_executed` with profile_count, agency_id
- ⬜ `shortlist_created` / `shortlist_entry_added` with agency_id

## Exit Criteria

- Agency creation flow: individual recruiter → create agency → invite seats → seats join
- Per-seat billing: each seat is EUR 29/month, billed to agency Stripe customer
- Shared credit pool: agency members draw from and contribute to the same balance
- Shortlists: create, add profiles, view across agency, individual recruiters get personal shortlists
- Bulk unlock: multi-select → unlock all (atomic, 1 credit each)
- CSV export: unlocked profiles downloadable with profile data columns
- Agency analytics: admin sees unlock totals, credit usage, search activity per seat
- NLP search: natural language query returns semantically ranked crew profiles with match explanations
- NLP search latency <3 seconds end-to-end
- Profile embeddings generated for all recruiter-visible crew; incremental updates on profile changes
- Filter-based search continues to work alongside NLP search (both available, not a replacement)
- Match explanations generated by GPT-5, cached per (query, user) for 24 hours
- AI cost tracked in `ai_usage_log`; NLP search cost <EUR 0.02/query at scale
- All components work at 375px width (mobile-first)
- RLS enforces agency-scoped access (members see agency data only)
- PostHog events firing for agency lifecycle, NLP search, bulk operations, exports

## Estimated Effort

10–14 days

## Notes

**Agency plans are the high-revenue channel.** A 10-seat agency pays EUR 290/month in subscriptions plus credit purchases. At an average of 20 unlocks/seat/month (200 total at EUR 4–6/credit), that's EUR 800–1,200/month in credits alone — over EUR 1,000/month per agency. Five agencies = more revenue than 500 individual Crew Pro subscribers. The agency upsell is the business model scaling mechanism.

**NLP search is the competitive moat against traditional agencies.** A crewing agent's core skill is knowing who's available, qualified, and trustworthy. NLP search does the first two instantly, and the trust graph (endorsements, shared-yacht connections) addresses the third. A recruiter who types "experienced bosun, 50m+ motor yachts, Med, available June" and gets ranked results with endorsement excerpts in 3 seconds is doing in seconds what takes a crewing agent days. This is the feature that justifies the EUR 29/month + credits model.

**Two search modes, not a replacement.** NLP search sits alongside filter-based search (Sprint 15/19). Some recruiters will prefer structured filters ("show me all Chief Stews in France who are available"); others will prefer natural language. The UI should make both accessible — NLP input bar above, filter bar below. When both are used, NLP narrows the semantic space and filters refine the structured attributes.

**Profile embedding includes endorsement text.** This is what makes NLP search powerful beyond keyword matching. A query for "good with guests" will match crew whose endorsements mention guest interaction, even if the crew member's bio doesn't say it. Endorsement text is the richest signal in the system — it's written by colleagues, not self-authored. Including it in the embedding makes every endorsement increase a crew member's searchability.

**Hardest technical challenge:** Keeping profile embeddings current at scale. Every bio edit, new endorsement, new cert, or yacht attachment should trigger a re-embed. At 10K+ profiles with active users, this could be hundreds of re-embeds per day. The on-demand approach (re-embed on change) is correct but needs a queue to avoid API rate limits. The nightly batch catches stragglers. The build plan should specify a background job queue (Vercel cron + Supabase Edge Functions, or a simple queue table) for incremental re-embedding.

**CSV export is a compliance consideration.** Exported crew data (name, contact, career history) is personal data under GDPR. The export should: (1) only include profiles the recruiter has legitimately unlocked, (2) log every export in PostHog for audit, (3) include a disclaimer in the CSV header that the data is for recruitment purposes only. This is not a blocker but should be documented in the build plan.

**This sprint closes Phase 2.** After Sprint 20, YachtieLink has: crew profiles, graph-based hiring, recruiter access with credits, agency plans, and intelligent search. Phase 3 opens with communication infrastructure (messaging, notifications) and social features (timeline, community). The platform shifts from "build the graph and monetise access to it" to "make the graph a living social and professional network."

**Next sprint picks up:** Sprint 21 (Phase 3) introduces messaging and contacts — DMs between users who have a contact relationship (D-029: contacts are non-graph, they exist for messaging only). Sprint 21 also builds the contact relationship model that keeps messaging separate from the trust graph.

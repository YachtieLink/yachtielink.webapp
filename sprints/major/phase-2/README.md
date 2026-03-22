# Phase 2 — Hiring & Revenue

> **RALPH LOOP DRAFT** — Written sequentially by automated planning loop. This is a planning document, not a build spec. Once reviewed and approved by the founder, individual sprints are hardened into full `build_plan.md` files.

**Status:** 📋 Draft
**Theme:** The graph creates economic value. Crew hire crew, recruiters pay to access the network, and agencies scale their sourcing. The trust graph becomes a revenue engine — without compromising the principles that make it trustworthy.

---

## Phase Gate

**Entry requires all of:**
- Phase 1C complete (all exit criteria met)
- 10,000+ crew profiles (the graph has enough density to make search and hiring genuinely useful)
- 3,000+ yachts (enough vessel coverage that crew find their real employment history represented)
- Recruiter demand confirmed (inbound interest from agencies or captains asking for search/hiring features — not assumptions)
- Graph integrity metrics healthy: duplicate yacht rate declining (Sprint 17 semantic search working), attachment confirmation flow operational, endorsement-to-profile ratio stable
- Crew Pro subscription revenue stabilised — crew pay first, yachts/recruiters pay later (D-004)

---

## Phase Thesis

Phase 1 built the graph and made it useful for crew. **Phase 2 turns the graph into a marketplace — one where both sides are nodes in the trust network.**

The key insight: when a captain posts a position and a deckhand applies, both are crew with visible profiles, yacht histories, and endorsements from real colleagues. Both can see graph proximity — mutual colleagues, shared yachts, endorsement overlap. This is fundamentally different from a job board where an employer posts anonymously and candidates submit CVs into a void. The graph makes hiring bilateral and trust-informed.

Revenue enters through two channels:
1. **Crew Pro** (EUR 12/month) — already launched in Phase 1A. Phase 2 makes it more valuable: job posting limits (1 free, 3 Pro), 2nd-degree availability reach (Sprint 14/15), database search (Sprint 15).
2. **Recruiter Access** (EUR 29/month + credits) — NEW in Phase 2. External recruiters who are not part of the crew graph pay to search and unlock profiles. This is the demand-side monetisation that validates the business model.

**Key tension:** Recruiter access is the first time someone outside the trust graph interacts with it. Every design choice must prevent recruiters from influencing the graph while giving them useful read-only access. D-024 is the constitutional guardrail: recruiters get search, they pay to unlock names/contacts, they can sort by endorsements — but they cannot endorse, create attachments, or affect trust signals. If recruiter features ever start to look like they cross that line, flag it.

---

## What Phase 1C Delivered (Starting State)

- **Availability toggle** with 7-day auto-expiry, day-6 reminder, contact method controls (Sprint 14)
- **Endorsement signals** — agree/disagree on endorsements from shared-yacht users (Sprint 14)
- **Crew search (Pro)** — filter by role, department, location, availability, cert, yacht (Sprint 15)
- **Expanded analytics** — profile views, PDF downloads, endorsement timeline, anonymised viewer breakdown (Sprint 15)
- **Endorsement pinning** and **notification preferences** (Sprint 15)
- **AI Pack 1** — endorsement writer (AI-04), cert OCR (AI-02), multilingual requests (AI-03), profile suggestions (AI-17), shared `lib/ai/` integration layer (Sprint 16)
- **Attachment confirmation** for established yachts with rejection penalties (Sprint 17)
- **Smart yacht autocomplete** — semantic embedding search via pgvector, reducing duplicate yachts (Sprint 17)
- **pgvector infrastructure** — text-embedding-3-small embeddings, IVFFlat index, nightly batch re-index (Sprint 17)
- `search_crew()` RPC with multi-filter pagination, `search_yachts_semantic()` RPC, `is_trusted_user()` heuristic, `ai_usage_log` table

---

## Sprints in This Phase

| Sprint | Status | Focus |
|--------|--------|-------|
| [Sprint 18 — Peer Hiring](./sprint-18/README.md) | 📋 Draft | Crew-to-crew job posting, graph-adjacent visibility, apply-with-profile (D-022, D-023) |
| [Sprint 19 — Recruiter Access](./sprint-19/README.md) | 📋 Draft | Recruiter accounts, EUR 29/mo subscription, credit system, profile unlock (D-024, D-025, D-026) |
| [Sprint 20 — Agency Plans + NLP Search](./sprint-20/README.md) | 📋 Draft | Multi-seat agency accounts, shared shortlists, AI-07 semantic crew search |

---

## Key Decisions Governing This Phase

- **D-004:** Crew pay first, yachts/recruiters pay later — crew subscription revenue must stabilise before recruiter revenue launches. This is a sequencing principle, not a prohibition.
- **D-022:** Free peer hiring (crew find crew) — no paid listings, no placement fees, poster must have a full profile. Jobs are a use case for the graph, not a separate product.
- **D-023:** Pro tier with search and hiring — Free: 1 job post/month, network-only availability. Pro: 3 posts/month, 2nd-degree reach, full analytics, database search.
- **D-024:** Recruiter access model — EUR 29/month + credits (EUR 75–1200 bundles). Credits unlock name and contact from search results. Direct links and graph browsing show full profiles to everyone.
- **D-025:** Contextual profile visibility — direct link/QR shows full profile. Search results show locked profiles. Graph browsing shows full profiles (slow, not scalable for harvesting).
- **D-026:** Recruiter sorting by endorsements allowed — ordering, not trust weighting. Endorsements can't be gamed because they require shared yacht attachment (D-009).
- **D-035:** Phase 1 hiring constraints are not permanent — future phases may deepen graph-based hiring once trust and abuse controls mature.

---

## Revenue Architecture

| Channel | Price | Gate | Sprint |
|---------|-------|------|--------|
| **Crew Pro** | EUR 12/month (EUR 9/month annual) | Existing users | Launched Sprint 7, enhanced Sprint 15 |
| **Recruiter Subscription** | EUR 29/month | External recruiters | Sprint 19 |
| **Recruiter Credits** | EUR 75 (10 credits) → EUR 1,200 (200 credits) | Per profile unlock | Sprint 19 |
| **Agency Plan** | EUR 29/month/seat + shared credit pool | Crewing agencies | Sprint 20 |

**Projected revenue milestones:**
- 10K crew, 5% Pro conversion → ~500 Pro subs × EUR 12 = EUR 6K/month crew revenue
- 50 recruiters × EUR 29 + credit purchases → EUR 5–15K/month recruiter revenue
- These are planning estimates, not forecasts. Actual numbers depend on conversion rates that will only be known after launch.

---

## Phase Exit Criteria

- Peer hiring live: crew can post positions, graph-adjacent crew can apply with their profile
- Job posting limits enforced: 1/month free, 3/month Pro
- Recruiter accounts operational: separate signup flow, EUR 29/month subscription via Stripe
- Credit system working: purchase bundles, unlock profiles, permanent per pair, 1-year expiry
- Recruiter search functional: all Sprint 15 search filters + endorsement count sorting + locked name/contact in results
- Crew opt-in for recruiter visibility respected (default: not visible)
- Agency plans live: multi-seat accounts, shared shortlists, CSV export, agency analytics
- NLP search (AI-07) operational: natural language queries return ranked candidate shortlists
- No recruiter feature affects the trust graph (D-024) — recruiters are read-only
- Revenue flowing through both crew Pro and recruiter channels
- Platform ready for Phase 3's communication features (messaging, notifications, timeline)

# YachtieLink Feature Registry

**Version:** 1.0
**Date:** 2026-03-09
**Status:** Active — working document, refined iteratively with founder

## About this doc

This is the source of truth for what features exist, why they exist, and which phase they belong to.

- **This doc** defines the "what" and "why" of each feature, and owns phase assignment.
- **`yl_build_plan.md`** owns the "how" and "when within a sprint."
- If they conflict: this doc wins on scope and rationale; build plan wins on execution sequencing.

## Status values

`proposed` | `specced` | `building` | `shipped` | `deferred` | `rejected`

---

## Phase 1A — Portable Profile + Yacht Graph + Endorsements

Goal: prove the wedge. A crew member can build a real portable identity anchored to yacht history, generate a colleague graph from that history, and collect trusted endorsements from real coworkers.

---

### Profile

**What:** A crew member's professional identity page — photo, display name, handle, department, role, bio, and a link they own.
**Why:** The portable identity layer every other feature builds on. A crew member should be able to hand someone a URL and have it represent them professionally, permanently, and for free.
**Sprint:** 3
**Status:** specced
**Constitutional notes:** Identity is free infrastructure. Never monetised.

---

### CV Import

**What:** Upload an existing CV (PDF or DOCX) to auto-populate profile fields via LLM extraction, with a review step before saving.
**Why:** Crew already have CVs. Making them re-type employment history creates unnecessary friction that delays graph formation. The goal is time-to-first-endorsement under 30 days (D-021).
**Sprint:** 6
**Status:** specced
**Key constraints:** Extracted data is still self-reported — this is not verification. Cost target <€0.05/parse. Fallback to manual entry on parse failure. Rate-limited to 3 parses/user/day.
**Constitutional notes:** Part of free identity layer.

---

### Employment History

**What:** A structured record of a crew member's past and current roles — yacht name, role, department, start and end dates.
**Why:** Employment history is the raw material for the yacht graph. Without it, colleague discovery and endorsement gating are impossible.
**Sprint:** 2–3
**Status:** specced
**Key constraints:** Role and date range required on every attachment. Soft-deletes preserve endorsement links (D-006).

---

### Yacht Entities

**What:** Yachts as real database objects with a UUID, display name, type, size, and flag state — not free-text strings.
**Why:** Making yachts entities (not just text fields) is what allows the graph to form. Two crew who both attach "Lady M" are connected because they referenced the same object.
**Sprint:** 4
**Status:** specced
**Key constraints:** Duplicate names tolerated. Renamed yachts are separate entities — no merging in Phase 1 (D-006). No ratings, reviews, or interactions on yacht entities.

---

### Employment Attachments

**What:** The link between a crew member and a yacht — role, dates, and yacht reference — forming the basic unit of the graph.
**Why:** Attachments are the edges that make the graph. Every other graph feature (colleagues, endorsement gating) derives from overlapping attachments.
**Sprint:** 2–4
**Status:** specced
**Key constraints:** Fresh yachts are open to attach. Established yachts (60 days + crew threshold) require confirmation (deferred to 1B). Soft delete preserves existing endorsements.

---

### Colleague Graph

**What:** An automatically derived view of who you've worked with — computed from users who share ≥1 yacht attachment, not stored as explicit relationships.
**Why:** This is the wedge. The colleague graph is the moat — it compounds as more crew claim their history. It makes the platform useful the moment you add a second yacht.
**Sprint:** 4
**Status:** specced
**Key constraints:** Graph edges are reality-bound (D-028). Computed on access — not a stored relationship table. Display: name, shared yacht(s), relationship label.

---

### Endorsement Requests

**What:** A tool for crew to request endorsements from colleagues identified via shared yacht history, sent via deep link (email or phone).
**Why:** Increases the response rate on the endorsement loop — the growth mechanic that compounds the graph. The request tooling increases response rate; it does not change who is eligible to endorse (D-009).
**Sprint:** 5
**Status:** specced
**Key constraints:** Rate-limited (10/day free, 20/day Pro). Suggestions drawn from colleague graph only. Manual add (phone/email) also allowed. Requests expire.

---

### Endorsements

**What:** A written endorsement from one crew member to another, requiring shared yacht attachment, containing free-text and structured metadata (role, dates, yacht).
**Why:** Endorsements are the trust signal. They are the thing that makes the profile more than a self-authored CV — they are attestation from real coworkers with verifiable shared history.
**Sprint:** 5
**Status:** specced
**Key constraints:** Requires shared yacht attachment — no exceptions (D-009). One endorsement per (endorser, recipient, yacht). No star ratings or scores (D-002). Editing allowed. Deletion allowed but retractions tracked in backend only (D-005). Absence of endorsements is neutral — never labelled as a negative (D-011). No auto-summary language ("well endorsed", etc.) ever (D-013).

---

### Endorsement Signals

**What:** A lightweight agree/disagree signal on an endorsement, available to users with overlapping attachment to the same yacht.
**Why:** Allows the community to express opinion on an endorsement without triggering moderation. Signals are social proof — they never remove an endorsement, but feed trust weighting in Phase 2+.
**Sprint:** TBD (display in Phase 1, trust weight in Phase 2+)
**Status:** specced (D-019)
**Key constraints:** Only users with shared yacht attachment can signal. Signals alone never remove an endorsement.

---

### Public Profile Page

**What:** A server-rendered public page at `/u/:handle` showing a crew member's identity, employment history, certifications, and endorsements — shareable and SEO-indexed.
**Why:** The portable profile is useless if it can't be shared. This is the linktr.ee use case — crew hand someone this URL on a dock, in a port, or via a QR code.
**Sprint:** 6
**Status:** specced
**Key constraints:** No discovery rails, no "browse similar profiles," no search from this page. Open Graph meta tags for link sharing. QR code generation included. Direct link shows full profile including contact details (D-025).

---

### PDF Snapshot

**What:** A downloadable PDF of the crew member's profile — clean, professional layout, generated on demand.
**Why:** Crew need a physical/email-ready CV for situations where a URL isn't enough. PDF export is core portable identity — it must be free forever (D-014).
**Sprint:** 6
**Status:** specced
**Constitutional notes:** Free infrastructure. Never monetised. Paid scope is limited to premium templates and watermark removal only.

---

### Crew Pro — Paid Presentation Upgrades

**What:** A €12/month subscription that unlocks presentation polish and workflow convenience — premium PDF templates, watermark removal, custom subdomain, profile analytics, and higher endorsement request allowance.
**Why:** Funds operations without corrupting trust. Paid features improve how a profile looks and how efficiently it can be worked — they never affect trust creation, endorsement eligibility, or graph weight (D-003, D-007).
**Sprint:** 7
**Status:** specced
**Includes:**
- Premium PDF templates (2 additional: Classic Navy, Modern Minimal)
- Watermark removal
- Custom subdomain (`username.yachtie.link`)
- Profile analytics (view count, PDF downloads, link shares)
- Higher endorsement request allowance (20/day vs 10/day free)

**Constitutional notes:** Payment never affects trust outcomes. Verified status, moderation power, endorsement eligibility, and attachment confirmation power are permanently excluded from paid scope.

---

## Phase 1B — Discovery + Convenience

Gate: Phase 1A graph loop is healthy (endorsement-to-profile ratio >0.3 at 500 profiles, organic share rate >10%).

---

### Availability Toggle

**What:** A crew member can signal they are available for work, with an expiry date (auto-expires after 7 days, re-confirm to stay visible).
**Why:** The toggle is how crew opt into being findable. Without active opt-in, crew get spammed with stale contact attempts. Weekly expiry keeps the pool fresh and keeps crew in control (D-027).
**Sprint:** 9
**Status:** specced
**Key constraints:** Active opt-in only — never on by default. 7-day auto-expiry. Day-6 reminder. Crew can hide from recruiters entirely while remaining visible to other crew.

---

### Limited Crew Search

**What:** Pro users can search the crew database by role, yacht name, location, and availability status.
**Why:** Search is recruiter behaviour — if you're searching to find candidates, you're recruiting, so pay for it (D-023). Makes Pro valuable for captains and HODs who hire, while free tier remains useful for junior crew.
**Sprint:** 9
**Status:** specced
**Key constraints:** Search results show locked profiles (name and contact hidden). Full profile unlocked via Pro access or recruiter credits. Graph browsing (yacht → crew) remains open but intentionally doesn't support filtering — it doesn't scale for harvesting (D-025).

---

### Attachment Confirmation (Established Yachts)

**What:** When a yacht is established (60+ days, crew threshold met), new attachment requests require confirmation from existing verified crew on that yacht.
**Why:** Protects against late-stage graph infiltration. Fresh yachts are open to encourage graph formation; established yachts get lightweight integrity controls (D-017).
**Sprint:** 11
**Status:** specced
**Key constraints:** Confirmation by simple majority. Dispute flow: flag attachment as incorrect → escalates to abuse protocol. False dispute rate tripwire at 5%.

---

### Expanded Analytics & Convenience

**What:** Enhanced Insights tab for Pro users — who viewed your profile (anonymised by role/location), trend lines, endorsement pinning, notification preferences.
**Why:** Gives Pro users more signal about how their profile is performing and more control over how it's presented.
**Sprint:** 10
**Status:** specced
**Key constraints:** Viewer identity is always anonymised in aggregate. Endorsement pinning is presentation order only — never alters trust weight.

---

## Phase 1C — Commercial Adjacency

Gate: 10,000+ crew, 3,000+ yachts, recruiter demand signal (inbound inquiries or waitlist).

---

### Peer Hiring

**What:** Crew with full profiles can post open positions on yachts they're attached to. Other crew can apply with their profile. Graph proximity is visible to both parties.
**Why:** Hiring is a use case for the graph, not a separate product. When both parties are nodes in the trust graph with visible profiles, incentives align — both want accurate signals. Captains are crew too (D-022).
**Sprint:** 12
**Status:** specced
**Key constraints:** Free for all crew — no paid listings, no placement fees. Poster must have a full profile. Positions visible to graph-adjacent crew. 30-day expiry, renewable. Free: 1 post/month. Pro: 3 posts/month (D-023). Express interest only in Phase 1C — no platform intermediation.
**Constitutional notes:** This is peer-to-peer hiring, not employer-pays. The distinction is fundamental.

---

### Recruiter Access

**What:** External recruiters (not crew) pay €29/month + credits to search and unlock crew profiles. Credits (€75–1200 bundles) reveal name and contact details from search results. Crew must opt in.
**Why:** Monetises the demand side without corrupting crew-side trust. Recruiters get read-only access — they cannot affect the graph (D-024).
**Sprints:** 13–14
**Status:** specced
**Key constraints:** Crew opt-in required ("Visible to recruiters" — default off). Direct link/QR always shows full profile regardless of recruiter paywall (D-025). Recruiters can sort by endorsement count (D-026) — this is presentation order, not trust weight. 1 credit = 1 profile unlock (permanent per recruiter-crew pair). Credits expire 1 year from purchase.
**Constitutional notes:** Recruiter access is read-only. Recruiters cannot create graph edges, affect endorsements, or influence trust.

---

### Agency Plans

**What:** Multi-seat recruiter accounts for crewing agencies — shared shortlists, bulk search, CSV export of unlocked profiles, agency-level analytics.
**Why:** Agencies are the high-volume demand-side user. Multi-seat plans capture significantly more revenue per customer than individual recruiter subscriptions.
**Sprint:** 15
**Status:** specced
**Key constraints:** All recruiter access rules apply equally per seat. No agency gets moderation power or trust influence.

---

## Phase 2+ — Deferred Social Layer

These features are real and intended. They are deferred until the crew-side product stands on its own and the graph has integrity. No Phase 1 constraint is a permanent prohibition — they are sequencing decisions (D-035, D-036).

---

### Timeline / Posts

**What:** A chronological feed of posts, career milestones, and interactions — visible only within a user's network.
**Why:** Crew have real career memory worth capturing — season completions, certifications, notable voyages. A graph-bounded timeline surfaces this without creating a public engagement loop.
**Status:** deferred
**Key constraints:** Strictly chronological — no algorithmic surfacing, no trending, no engagement weighting ever (D-031). Visibility bounded to network only (D-030). Posts are not public. No boost or promote mechanics.

---

### Messaging / Direct Messages

**What:** Direct messaging between users who have a contact relationship.
**Why:** Communication between crew who know each other. Contacts exist for messaging convenience — they never create graph edges or endorsement eligibility (D-029).
**Status:** deferred
**Key constraints:** Contacts relationship is non-graph. Messaging does not imply professional proximity. No spam vector — contact relationship required first.

---

### IRL Connections

**What:** In-person encounters as first-class objects — verified by mutual confirmation. Creates a graph edge without shared yacht history.
**Why:** Crew meet in marinas, bars, industry events. An IRL connection verified by both parties is a reality-bound edge (D-028). Extends the graph beyond shared employment without breaking graph integrity.
**Status:** deferred
**Key constraints:** Mutual confirmation required — one party cannot unilaterally create an IRL edge. Public or private visibility (D-032). Absolute right of exit — any participant can remove themselves from an interaction at any time, everywhere (D-033).

---

### Yacht Merging

**What:** Admin-mediated or community-proposed merge of duplicate or renamed yacht entities into a single canonical entity.
**Why:** Over time, the same physical yacht will accumulate multiple entries (renamed yachts, typos, regional name variants). Merging restores graph integrity at scale.
**Status:** deferred
**Key constraints:** Merging is irreversible — wrong merges corrupt trust. Requires quorum approval. Not in Phase 1 because premature merging is worse than fragmentation (D-006).

---

### Verified Status & Community Moderation

**What:** An earned status level that grants expanded moderation power — earned through tenure, endorsement density from verified users, or seed-set membership. Not purchasable.
**Why:** As the graph scales, community-based moderation scales better than admin intervention. Verified status creates a trusted inner ring that can confirm attachments and vote on abuse cases (D-015, D-016).
**Status:** deferred
**Constitutional notes:** Verified status is never purchasable. Not in paid scope, not in Pro, not in any tier ever. Earned through trust evidence only (D-016 updated 2026-03-08).

---

## Rejected / Never-Build

These are features that have been considered and permanently excluded. They are not deferred — they are off the table.

---

### Star ratings or numeric scores

**Decision:** D-002 — irreversible.
**Why rejected:** False precision. Creates coercion dynamics, legal exposure, and gaming incentives.

### Auto-summary language

**Decision:** D-013 — irreversible.
**Why rejected:** "Well endorsed" / "lightly endorsed" collapses nuance into judgment and quietly kills the "absence is neutral" principle.

### Algorithmic timeline surfacing

**Decision:** D-031 — irreversible.
**Why rejected:** Trending, boosting, and engagement weighting corrupt truth-seeking and encourage performative behavior.

### Payment affecting trust outcomes

**Decision:** D-003 — irreversible.
**Why rejected:** If trust can be bought, trust is worthless. The entire value proposition collapses.

### Labelling absence of endorsements as negative

**Decision:** D-011 — irreversible.
**Why rejected:** Early users and private crew should not be penalised for having fewer endorsements. Only contradicted endorsements create negative weight.

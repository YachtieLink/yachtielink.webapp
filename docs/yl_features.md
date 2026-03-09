# YachtieLink Feature Registry

**Version:** 1.1
**Date:** 2026-03-09
**Status:** Active — working document, refined iteratively with founder

## About this doc

This is the source of truth for what features exist, why they exist, and which phase they belong to.

- **This doc** defines the "what" and "why" of each feature, and owns phase assignment.
- **`yl_build_plan.md`** owns the "how" and "when within a sprint."
- If they conflict: this doc wins on scope and rationale; build plan wins on execution sequencing.

## Status values

`proposed` | `specced` | `building` | `shipped` | `deferred` | `not planned`

---

## Phase 1A — Portable Profile + Yacht Graph + Endorsements

Goal: prove the wedge. A crew member can build a real portable identity anchored to yacht history, generate a colleague graph from that history, and collect trusted endorsements from real coworkers.

---

### Profile

**What:** A crew member's professional identity page — photo, display name, handle, department, role, bio, and a link they own.
**Why:** The portable identity layer every other feature builds on. A crew member should be able to hand someone a URL and have it represent them professionally, permanently, and for free.
**Sprint:** 3
**Status:** specced
**Crew-first note:** Core identity stays free. Paying improves presentation of the profile, not access to it.

---

### CV Import

**What:** Upload an existing CV (PDF or DOCX) to auto-populate profile fields via LLM extraction, with a review step before saving.
**Why:** Crew already have CVs. Making them re-type employment history creates unnecessary friction that delays graph formation. The goal is time-to-first-endorsement under 30 days (D-021).
**Sprint:** 6
**Status:** specced
**Key notes:** Extracted data is still self-reported — this is not verification. Cost target <€0.05/parse. Fallback to manual entry on parse failure. Rate-limited to 3 parses/user/day. Part of the free identity layer.

---

### Employment History

**What:** A structured record of a crew member's past and current roles — yacht name, role, department, start and end dates.
**Why:** Employment history is the raw material for the yacht graph. Without it, colleague discovery and endorsement gating have nothing to work from.
**Sprint:** 2–3
**Status:** specced
**Key notes:** Role and date range required on every attachment. Soft-deletes preserve endorsement links (D-006).

---

### Yacht Entities

**What:** Yachts as real database objects with a UUID, display name, type, size, and flag state — not free-text strings.
**Why:** Making yachts entities (not just text fields) is what allows the graph to form. Two crew who both attach "Lady M" are connected because they referenced the same object.
**Sprint:** 4
**Status:** specced
**Key notes:** Duplicate names tolerated. Renamed yachts are separate entities — merging deferred to Phase 2 (D-006). Ratings, reviews, or interactions on yacht entities aren't planned — yachts are graph infrastructure, not review targets.

---

### Employment Attachments

**What:** The link between a crew member and a yacht — role, dates, and yacht reference — forming the basic unit of the graph.
**Why:** Attachments are the edges that make the graph. Every other graph feature (colleagues, endorsement gating) derives from overlapping attachments.
**Sprint:** 2–4
**Status:** specced
**Key notes:** Fresh yachts are open to attach. Established yachts (60 days + crew threshold) move to confirmation flow in Phase 1B. Soft delete preserves existing endorsements.

---

### Colleague Graph

**What:** An automatically derived view of who you've worked with — computed from users who share ≥1 yacht attachment, not stored as explicit relationships.
**Why:** This is the wedge. The colleague graph compounds as more crew claim their history. It makes the platform useful the moment you add a second yacht.
**Sprint:** 4
**Status:** specced
**Key notes:** Graph edges come from shared real employment — not from follows, contacts, or payments (D-028). Computed on access, not stored as a relationship table. Display: name, shared yacht(s), relationship label.

---

### Endorsement Requests

**What:** A tool for crew to request endorsements from colleagues identified via shared yacht history, sent via deep link (email or phone).
**Why:** Increases the response rate on the endorsement loop. The tooling improves response rate — it doesn't change who is eligible to endorse (D-009).
**Sprint:** 5
**Status:** specced
**Key notes:** Rate-limited (10/day free, 20/day Pro). Suggestions drawn from colleague graph. Manual add (phone/email) also allowed. Requests expire.

---

### Endorsements

**What:** A written endorsement from one crew member to another, requiring shared yacht attachment, containing free-text and structured metadata (role, dates, yacht).
**Why:** Endorsements are the trust signal — attestation from real coworkers with verifiable shared history. They're what makes the profile more than a self-authored CV.
**Sprint:** 5
**Status:** specced
**Key notes:**
- Shared yacht attachment required to endorse (D-009) — this keeps endorsements grounded in real experience
- One endorsement per (endorser, recipient, yacht)
- Star ratings and numeric scores aren't planned — they create false precision and gaming incentives (D-002)
- Editing allowed. Deletion allowed — retractions tracked in backend only, not shown in UI (D-005)
- Absence of endorsements is neutral — the platform shouldn't label it as a negative (D-011)
- Auto-summary language ("well endorsed", "lightly endorsed") isn't planned — it collapses nuance into judgment (D-013)

---

### Endorsement Signals

**What:** A lightweight agree/disagree signal on an endorsement, available to users with overlapping attachment to the same yacht.
**Why:** Allows the community to express opinion on an endorsement without triggering moderation. Signals are social proof — they feed trust weighting in Phase 2+ but don't act on endorsements directly.
**Sprint:** TBD (display in Phase 1, trust weight in Phase 2+)
**Status:** specced (D-019)
**Key notes:** Only users with shared yacht attachment can signal. Signals alone don't remove an endorsement — they inform future trust calculations.

---

### Public Profile Page

**What:** A server-rendered public page at `/u/:handle` showing a crew member's identity, employment history, certifications, and endorsements — shareable and SEO-indexed.
**Why:** The portable profile is useless if it can't be shared. This is the linktr.ee use case — crew hand someone this URL on a dock, in a port, or via a QR code.
**Sprint:** 6
**Status:** specced
**Key notes:** No discovery rails or browse-similar on this page — it's a direct profile, not a feed. Open Graph tags for link sharing. QR code generation included. Direct link shows full profile (D-025).

---

### PDF Snapshot

**What:** A downloadable PDF of the crew member's profile — clean, professional layout, generated on demand.
**Why:** Crew need a physical/email-ready CV for situations where a URL isn't enough. PDF export is core portable identity and should stay free (D-014).
**Sprint:** 6
**Status:** specced
**Crew-first note:** The ability to export your profile as a PDF stays free. Paid scope covers premium templates and watermark removal only — not the export itself.

---

### Crew Pro — Paid Presentation Upgrades

**What:** A €12/month subscription that unlocks presentation polish and workflow convenience — premium PDF templates, watermark removal, custom subdomain, profile analytics, and higher endorsement request allowance.
**Why:** Funds operations without affecting trust. Paid features improve how a profile looks and how efficiently it can be worked — not how trustworthy it appears.
**Sprint:** 7
**Status:** specced
**Includes:**
- Premium PDF templates (2 additional: Classic Navy, Modern Minimal)
- Watermark removal
- Custom subdomain (`username.yachtie.link`)
- Profile analytics (view count, PDF downloads, link shares)
- Higher endorsement request allowance (20/day vs 10/day free)

**Crew-first note:** If a Pro feature starts to look like it affects trust weight, endorsement visibility, or graph behaviour — flag it before building. Verified status, moderation power, and endorsement eligibility sit outside paid scope.

---

## Phase 1B — Discovery + Convenience

Gate: Phase 1A graph loop is healthy (endorsement-to-profile ratio >0.3 at 500 profiles, organic share rate >10%).

---

### Availability Toggle

**What:** A crew member can signal they are available for work, with an expiry (auto-expires after 7 days, re-confirm to stay visible).
**Why:** The toggle is how crew opt into being findable. Without active opt-in, crew get contacted based on stale availability. Weekly expiry keeps the pool current and crew in control (D-027).
**Sprint:** 9
**Status:** specced
**Key notes:** Active opt-in only — off by default. 7-day auto-expiry with day-6 reminder. Crew can hide from recruiters while remaining visible to other crew.

---

### Limited Crew Search

**What:** Pro users can search the crew database by role, yacht name, location, and availability status.
**Why:** Search is recruiter behaviour — if you're searching to find candidates, you're recruiting, so pay for it (D-023). Makes Pro valuable for captains and HODs who hire, while the free tier stays useful for junior crew.
**Sprint:** 9
**Status:** specced
**Key notes:** Search results show profile summaries — name and contact require Pro access or recruiter credits. Graph browsing (yacht → crew) stays open but isn't filterable, so it doesn't support harvesting at scale (D-025).

---

### Attachment Confirmation (Established Yachts)

**What:** When a yacht is established (60+ days, crew threshold met), new attachment requests move through a lightweight confirmation step from existing crew.
**Why:** Balances open graph formation (fresh yachts) with integrity protection as yachts grow (D-017).
**Sprint:** 11
**Status:** specced
**Key notes:** Simple majority confirmation. Dispute flow escalates to moderation if flagged. Worth monitoring false dispute rate — if it spikes, the friction may need tuning.

---

### Expanded Analytics & Convenience

**What:** Enhanced Insights tab for Pro users — who viewed your profile (anonymised by role/location), trend lines, endorsement pinning, notification preferences.
**Why:** Gives Pro users more signal on how their profile is performing and more control over presentation.
**Sprint:** 10
**Status:** specced
**Key notes:** Viewer identity is always anonymised in aggregate. Endorsement pinning is display order only — it doesn't affect trust weight.

---

## Phase 1C — Commercial Adjacency

Gate: 10,000+ crew, 3,000+ yachts, recruiter demand signal confirmed.

---

### Peer Hiring

**What:** Crew with full profiles can post open positions on yachts they're attached to. Other crew can apply with their profile. Graph proximity is visible to both parties.
**Why:** Hiring is a use case for the graph, not a separate product. When both parties are nodes in the trust graph with visible profiles, incentives align. Captains are crew too (D-022).
**Sprint:** 12
**Status:** specced
**Key notes:** Free for all crew — no paid listings or placement fees. Poster must have a full profile. Positions visible to graph-adjacent crew. 30-day expiry, renewable. Free: 1 post/month. Pro: 3 posts/month (D-023). This is peer-to-peer hiring — the moment it starts looking like employer-pays, flag it.

---

### Recruiter Access

**What:** External recruiters pay €29/month + credits to search and unlock crew profiles. Credits (€75–1200 bundles) reveal name and contact from search results. Crew must opt in.
**Why:** Monetises the demand side without touching crew-side trust. Recruiters get read-only access — they can't affect the graph (D-024).
**Sprints:** 13–14
**Status:** specced
**Key notes:** Crew opt-in required, default off. Direct link/QR always shows full profile regardless of recruiter paywall (D-025). Recruiters can sort by endorsement count — this is ordering, not trust weighting (D-026). 1 credit = 1 profile unlock, permanent per pair. Credits expire after 1 year.

---

### Agency Plans

**What:** Multi-seat recruiter accounts for crewing agencies — shared shortlists, bulk search, CSV export of unlocked profiles, agency-level analytics.
**Why:** Agencies are the high-volume demand-side user. Multi-seat plans capture more revenue per customer than individual subscriptions.
**Sprint:** 15
**Status:** specced
**Key notes:** Same access rules as individual recruiters, per seat. No moderation power or trust influence at any tier.

---

## Phase 2+ — Deferred

These are real features with real value. They're deferred until the crew-side product and graph have integrity. Nothing here is permanently off the table — they're sequencing decisions (D-035, D-036).

---

### Timeline / Posts

**What:** A chronological feed of posts, career milestones, and interactions — visible only within a user's network.
**Why:** Crew have real career memory worth capturing. A graph-bounded timeline surfaces it without creating a public engagement loop.
**Status:** deferred
**Key notes:** Chronological ordering is the right default — algorithmic surfacing creates incentives that tend to corrupt truthful behaviour (D-031). Visibility bounded to network (D-030). Worth revisiting the ordering question when the time comes.

---

### Messaging / Direct Messages

**What:** Direct messaging between users who have a contact relationship.
**Why:** Communication convenience for crew who know each other. Contacts exist for messaging — they don't create graph edges or endorsement eligibility (D-029).
**Status:** deferred

---

### IRL Connections

**What:** In-person encounters as first-class objects — verified by mutual confirmation. Creates a graph edge without shared yacht history.
**Why:** Crew meet in marinas, ports, industry events. A verified IRL connection is a reality-bound graph edge (D-028) that extends the network beyond employment.
**Status:** deferred
**Key notes:** Mutual confirmation required — one party can't unilaterally create an IRL edge. Users can always remove themselves from an interaction, removing their association everywhere (D-033).

---

### Yacht Merging

**What:** Admin-mediated or community-proposed merge of duplicate or renamed yacht entities into a single canonical entity.
**Why:** Over time the same physical yacht accumulates multiple entries. Merging restores graph integrity at scale.
**Status:** deferred
**Key notes:** Wrong merges are hard to reverse and corrupt trust — worth being careful when this gets built. Quorum approval is the right model (D-006).

---

### Verified Status & Community Moderation

**What:** An earned status level that grants expanded moderation power — earned through tenure, endorsement density from verified users, or seed-set membership.
**Why:** Community-based moderation scales better than admin intervention as the graph grows (D-015, D-016).
**Status:** deferred
**Crew-first note:** Verified status should stay earned through trust evidence — not purchasable. If there's ever pressure to make it a paid feature, flag it.

---

## Not planned

These have been considered and aren't on the roadmap based on current product direction. Worth revisiting if the product evolves significantly — but flag before building any of them.

---

### Star ratings or numeric scores

**Why not:** Creates false precision, coercion dynamics, legal exposure, and gaming incentives (D-002). Endorsements as free text are more nuanced and harder to game.

### Auto-summary language

**Why not:** "Well endorsed" / "lightly endorsed" turns a nuanced signal into a judgment, and quietly undermines the principle that absence of endorsements is neutral (D-013).

### Algorithmic timeline surfacing

**Why not:** Trending, boosting, and engagement weighting create incentives for performative rather than truthful behaviour (D-031).

### Payment affecting trust outcomes

**Why not:** If trust can be bought, the signal is worthless. The value proposition depends on this staying clean (D-003). Any feature that looks like it crosses this line should be flagged.

### Labelling absence of endorsements as negative

**Why not:** Penalises early users and private crew for having fewer endorsements. Only contradicted endorsements create negative signal (D-011).

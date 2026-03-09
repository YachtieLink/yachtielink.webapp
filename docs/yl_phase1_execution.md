# Yachtielink - Phase 1 Execution Spec (v2.2)

This file defines the current build target without guesswork.

**Build plan:** See `yl_build_plan.md` for sprint-by-sprint execution sequence.

---

## Guiding Principles

- Phase 1A proves the yacht graph wedge.
- Identity is free infrastructure — the graph needs to be accessible to everyone to compound.
- Paying improves presentation quality, workflow convenience, and later discovery efficiency.
- Trust outcomes stay outside of paid scope — if something looks like it might cross that line, flag it.
- Phase 1 schemas should be designed to persist into later phases.

---

## Product Thesis

The first product is not just a profile tool. It is a portable profile anchored to real yacht history.

The growth loop is:
1. Crew imports or builds profile
2. Crew attaches yachts and roles
3. System identifies real colleagues through shared attachments
4. Crew requests endorsements
5. Colleagues join to respond
6. The graph compounds as more shared history is claimed

This is the current wedge.

---

## Identity vs Presentation

### Identity Layer (Free)
- Profile
- Employment history
- Certifications
- Yacht entities
- Employment attachments
- Endorsements
- Public profile page
- PDF snapshot
- CV import

This layer stays free. It's the infrastructure the graph runs on.

### Presentation Layer (Paid)
- Premium templates
- Custom subdomain
- Watermark removal
- Basic analytics
- Higher endorsement request allowance

Paid features improve presentation quality, workflow convenience, and later discovery efficiency. They shouldn't touch trust creation, endorsement eligibility, moderation power, or credibility outcomes. If a proposed paid feature starts to look like it does, flag it before building.

---

## Phase Structure

### Phase 1A - Build Now
- Profile
- CV import
- Employment history
- Yacht entities
- Employment attachments
- Colleague graph from shared attachments
- Endorsement requests
- Endorsements
- Public profile page
- PDF snapshot
- Paid presentation upgrades

### Phase 1B - After Graph Loop Is Healthy
- Availability toggle
- Limited crew search
- Expanded analytics and convenience

### Phase 1C - After Crew-Side Product Stands On Its Own
- Peer hiring
- Recruiter access
- Broader discovery tooling

### Later Phases
- Timeline / posts / interactions
- Messaging / contacts
- IRL connection system

---

## Onboarding

**Goal:** Minimise time-to-first-endorsement. Every friction point delays graph formation.

### CV Import

Users can upload an existing CV (PDF or DOCX) to auto-populate their profile.

| Aspect | Spec |
|--------|------|
| **Accepted formats** | PDF, DOCX |
| **Fields extracted** | Name, employment history, certifications, languages, location |
| **Implementation** | LLM extraction (Claude API) |
| **Cost target** | <€0.05 per parse |
| **User flow** | Upload → Review extracted data → Correct if needed → Save |
| **Fallback** | If parsing fails, fall through to manual entry (no error shown) |

**Reference:** See `yl_decisions.json` → D-021

---

## Yacht Graph (Phase 1A)

- Yacht is a database entity with immutable internal UUID
- Human-readable names are display labels, not identity
- Users attach yachts via employment records
- Yacht displays number of attached crew
- Duplicate names are tolerated (multiple "Lady M" entries acceptable)
- Renamed yachts are separate entities
- Merging deferred to Phase 2
- Ratings, reviews, or interactions on yacht entities aren't planned

**Why it matters:**
The yacht graph is the lowest-friction way to turn self-authored profiles into a reality-bound network. It is both the growth loop and the moat.

**Core mechanic:**
Endorsements are gated by shared yacht attachment. This keeps them grounded in real experience.

---

## Endorsements V1

### Gating
- Shared yacht attachment required
- One endorsement per engagement per yacht

### Requests
- Users may request endorsements from likely colleagues derived from shared attachments
- Requests are rate-limited
- Request tooling increases response rate — it doesn't change endorsement eligibility

### Structure
- Free-text content
- Structured metadata: role, yacht, dates worked together
- No numeric ratings or star scores

### Editing & Deletion
- Editing allowed
- Deletion allowed
- Retractions tracked in backend — not shown in UI (D-005)
- Retraction frequency informs endorser's future signal weight

### Interpretation
- Absence of endorsements is neutral
- Only contradicted endorsements create negative weight
- Auto-summary language ("well endorsed", "lightly endorsed") isn't planned

**Reference:** See `yl_decisions.json` → D-009, D-010, D-011, D-013

---

## Integrity Controls For Launch

- Yacht entity, not free text
- Required role and date range on attachment
- Disambiguation metadata on yacht creation
- Fresh yachts are easy to attach to
- Established yachts move to lightweight confirmation (Phase 1B)
- Endorsement requests are rate-limited
- No ratings, no negative public labels, no trust summaries
- Growth can be slowed quickly if graph quality degrades

---

## Paid Scope In Current Build

Current paid scope is limited to presentation upgrades and workflow convenience:
- Premium templates
- Watermark removal
- Custom subdomain
- Basic analytics
- Higher endorsement request allowance

Outside current paid scope:
- Verified status
- Attachment confirmation power
- Endorsement eligibility changes
- Recruiter unlocks
- Hiring advantages

---

## Instrumentation (Launch Metrics)

Implement these events during Phase 1A:

- `profile.created`
- `cv.parsed`
- `cv.parse_failed`
- `attachment.created`
- `attachment.disputed`
- `endorsement.requested`
- `endorsement.created`
- `endorsement.deleted`
- `profile.shared`

These map to metrics and tripwires in `yl_phase1_actionables.json`.

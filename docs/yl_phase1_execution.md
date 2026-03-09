# Yachtielink - Phase 1 Execution Spec (v2.1)

This file defines the current build target without guesswork.

**Build plan:** See `yl_build_plan.md` for sprint-by-sprint execution sequence.

---

## Hard Constraints

- Phase 1A must prove the yacht graph wedge.
- Identity is free infrastructure.
- Payment may improve presentation quality, workflow convenience, and later discovery efficiency.
- Trust outcomes are never monetised.
- Payment never grants moderation power or trust weight.
- Phase 1 schemas persist into later phases.
- Non-goals remain non-goals.

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

This layer is never monetised.

### Presentation Layer (Paid)
- Premium templates
- Custom subdomain
- Watermark removal
- Basic analytics
- Higher endorsement request allowance

Paid features may improve presentation quality, workflow convenience, and later discovery efficiency. They never alter trust creation, endorsement eligibility, moderation power, or credibility outcomes.

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

### Phase 1C - Deferred Until Crew-Side Product Stands On Its Own
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
| **User flow** | Upload -> Review extracted data -> Correct if needed -> Save |
| **Fallback** | If parsing fails, skip silently to manual entry (no error shown) |

**Reference:** See `yl_decisions.json` -> D-021

---

## Yacht Graph (Phase 1A)

- Yacht is a database entity with immutable internal UUID
- Human-readable names are display labels, not identity
- Users attach yachts via employment records
- Yacht displays number of attached crew
- Duplicate names are tolerated (multiple "Lady M" entries acceptable)
- Renamed yachts are separate entities
- No merging in Phase 1A
- No ratings, reviews, or interaction on yacht entities

**Why it matters:**  
The yacht graph is the lowest-friction way to turn self-authored profiles into a reality-bound network. It is both the growth loop and the moat.

**Critical rule:**  
Endorsements are only possible between users who share a yacht attachment.

---

## Endorsements V1

### Gating
- Requires shared yacht attachment
- One endorsement per engagement per yacht

### Requests
- Users may request endorsements from likely colleagues derived from shared attachments
- Requests are rate-limited
- Request tooling increases response rate; it does not alter endorsement eligibility

### Structure
- Free-text content
- Structured metadata: role, yacht, dates worked together
- No numeric ratings or star scores

### Editing & Deletion
- Editing allowed
- Deletion allowed
- System tracks retractions in backend (never visible in UI)
- Retraction frequency affects endorser's future signal weight

### Interpretation
- Absence of endorsements is neutral
- Only contradicted endorsements create negative weight
- No auto-summary language permitted ("well endorsed", "lightly endorsed", etc.)

**Reference:** See `yl_decisions.json` -> D-009, D-010, D-011, D-013

---

## Minimal Integrity Controls For Launch

- Yacht entity, not free text
- Required role and date range on attachment
- Disambiguation metadata on yacht creation
- Fresh yachts are easy to attach to
- Established yachts can require lightweight confirmation
- Endorsement requests are rate-limited
- No ratings, no negative public labels, no trust summaries
- Growth can be paused quickly if graph quality degrades

---

## Paid Scope In Current Build

Current paid scope is limited to presentation upgrades and workflow convenience:
- Premium templates
- Watermark removal
- Custom subdomain
- Basic analytics
- Higher endorsement request allowance

Current paid scope does **not** include:
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

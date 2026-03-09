# Yachtielink - Phase 1 Execution Spec (v2.0)

This file makes Phase 1 executable without guesswork.

---

## Hard Constraints

- Phase 1 must fund itself.
- Identity is free infrastructure.
- Presentation is paid and cosmetic.
- Trust outcomes are never monetised.
- Recruiters have read-only access — they cannot influence the graph.
- Phase 1 schemas persist into Phases 2 and 3.
- Non-goals remain non-goals (updated for vNext timeline rules).

---

## Revenue Streams

Phase 1 has three revenue streams:

| Stream | Price | Target |
|--------|-------|--------|
| **Crew Pro** | €12/month | Active crew, especially those who hire |
| **Recruiter Subscription** | €29/month | Recruitment agencies |
| **Recruiter Credits** | €75-1,200/bundle | Recruitment agencies |

**Sequencing rule:** Crew pay first. Yachts pay later, never for influence.

---

## Identity vs Presentation (Explicit System Law)

### Identity Layer (Free)
- Profile
- Employment history
- Certifications
- Endorsements
- Public profile page
- PDF snapshot
- CV import (auto-populate profile)
- 1 job post/month
- Apply to jobs

This layer is never monetised.

### Presentation Layer (Paid — Crew Pro €12/month)
- Database search access
- 3 job posts/month
- Extended availability reach (2nd degree)
- Full profile analytics (who viewed)
- Recruiter unlock visibility
- Cert expiry alerts
- 20 endorsement requests/month
- Premium templates
- Custom subdomain
- Watermark removal

This layer is cosmetic and convenience only. Never alters trust outcomes.

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
| **Fallback** | If parsing fails, skip silently to manual entry (no error shown) |

**Reference:** See `yl_decisions.vNext.json` → D-021

---

## Yacht Graph (Phase 1)

- Yacht is a database entity with immutable internal UUID
- Human-readable names are display labels, not identity
- Users attach yachts via employment records
- Yacht displays number of attached crew
- Duplicate names are tolerated (multiple "Lady M" entries acceptable)
- Renamed yachts are separate entities
- No merging in Phase 1
- No ratings, reviews, or interaction on yacht entities

**Critical rule:**  
Endorsements are only possible between users who share a yacht attachment.

---

## Endorsements V1

### Gating
- Requires shared yacht attachment
- Contacts alone do not permit endorsements
- One endorsement per engagement per yacht

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

**Reference:** See `yl_decisions.vNext.json` → D-009, D-010, D-011, D-013

---

## Timeline + Posts + Interactions + Milestones (Phase 1)

### Relationship Types (Locked)
- **Colleague / Coworker (graph edge):** Created by overlapping yacht or company employment
- **IRL Connection (graph edge):** Created by verified in-person interaction (Phase 1: QR mutual confirmation within 5 minutes)
- **Contact (non-graph):** Messaging + timeline post visibility only; never creates trust or endorsements

**Graph invariant:** Graph edges = Colleagues + IRL Connections only. Contacts never affect the graph.

### Timeline Contents
The timeline is a chronological stream containing:
1. Posts (text + photos)
2. Interactions (IRL encounters)
3. Milestones (major certifications, joining/leaving a yacht or company)

No other content types.

### Feed Rules
- Strict chronological order (newest first)
- No algorithmic ranking
- No trending
- No resharing
- No global discovery feed

### Visibility Rules

**Network definition:** Colleagues + IRL Connections + Contacts.

**Posts**
- Visibility options: `only_me`, `network` (default)
- Posts are visible to network, even if viewer is only a Contact
- Posts do not create graph edges

**Interactions**
- Interaction visibility: `public` or `private`
- Private interactions appear only to confirmed participants (and self)
- Public interactions are visible only to Colleagues + IRL Connections (not Contacts)

**Milestones**
- Default visibility: `network`
- Can be hidden per item (`only_me`)
- Phase 1 milestones are derived from major certifications and employment events (joining/leaving a yacht or company)
- No standalone milestones table in Phase 1 (career milestones deferred)

**Self view**
- Your own timeline is always fully visible to you

### Tagging (Phase 1)
- Tags are accepted by default
- User setting: `require_tag_approval` (default `false`) turns tags into `pending`
- Tag states: `accepted`, `pending`, `removed`
- You can only tag users in your network

### Comments (Phase 1)
- Posts: commenters = network
- Interactions: commenters = participants only

### Reactions
- None in Phase 1

### Absolute Right of Exit (Non-Negotiable)
Any user may remove themselves from:
- An interaction
- A tagged post

Effects:
- Their name and face disappear from the content
- Their comments and media are hidden from non-participants
- Their association is removed everywhere for other viewers

---

## Contacts & Messaging

- Users can add Contacts without shared employment
- Contacts require acceptance
- Messaging allowed between Contacts and known colleagues/IRL connections
- No public graph, no discovery, no ranking, no trust impact

### Excluded Features
- Group chats
- Broadcast to non-contacts
- Read receipts, typing indicators, presence

---

## Availability Toggle

Crew opt into being discoverable via search.

| Aspect | Spec |
|--------|------|
| **Opt-in** | Manual toggle, not automatic |
| **Expiry** | 7 days, must re-toggle |
| **Reminder** | Push/email at day 6 |
| **Contact preferences** | Platform message only / show email / show phone / show WhatsApp |
| **Recruiter visibility** | Can hide from recruiters while visible to other crew |

**Reference:** See `yl_decisions.vNext.json` → D-027

---

## Peer Hiring (Crew Find Crew)

Job postings where crew hire crew. The trust graph is the differentiator.

### How It Works

- Users with full profile can post jobs
- Applicants apply with their profile (not a separate CV)
- Both parties see graph proximity: mutual colleagues/IRL connections, shared yachts, endorsement paths

### Job Post Limits

| Tier | Limit |
|------|-------|
| Free | 1/month |
| Pro | 3/month |
| Bundle request | Manual approval for >3 (e.g., new yacht build) |

### Poster Requirements

- Must have complete profile
- Must have at least one yacht attachment
- No employer-only accounts — captains and HODs are crew too

### Constraints (Non-Negotiable)

- No paid listings or promotion
- No placement fees
- No algorithmic matching
- Jobs are a use case for the graph, not a separate product

Phase 1 hiring surfaces are constrained by design. Future phases may leverage the graph for hiring workflows. No Phase 1 constraint should be interpreted as a permanent prohibition.

**Reference:** See `yl_decisions.vNext.json` → D-022

---

## Recruiter Access

Recruitment agencies pay for read-only access to search the crew pool.

### Pricing

| Component | Price |
|-----------|-------|
| **Subscription** | €29/month (required) |
| **Starter** | 10 credits / €75 |
| **Standard** | 30 credits / €180 |
| **Pro** | 100 credits / €500 |
| **Agency** | 300 credits / €1,200 |

Credits expire 1 year from purchase.

### What Credits Unlock

1 credit = 1 profile unlock from search results.

| Before Unlock | After Unlock |
|---------------|--------------|
| Photo, headline, role | Name |
| Yacht history summary | Contact details |
| Endorsement count | Full endorsement text |
| Availability window | Messaging access |

Unlock is permanent for that recruiter-crew pair.

### Recruiter Capabilities

**Can do:**
- Search available crew pool
- Filter by role, certs, experience, availability
- Sort by endorsement count, experience, recency
- Unlock profiles with credits
- Message unlocked crew
- View full profiles via direct link

**Cannot do:**
- Post jobs
- Give or receive endorsements
- Influence graph in any way
- See crew who opted out of recruiter visibility

### Why Sorting by Endorsements Is Allowed

Endorsements require shared yacht attachment (D-009), so they cannot be gamed. More endorsements = more real colleagues vouching = exactly what recruiters should want to see. This rewards active crew.

**Reference:** See `yl_decisions.vNext.json` → D-024, D-026

---

## Profile Visibility Rules

Visibility varies by access method:

| Access Method | What You See |
|---------------|--------------|
| **Direct link / QR** | Full profile including contact details |
| **Graph browsing** (click yacht → crew) | Full profile |
| **Search (Pro crew)** | Full profile |
| **Search (Recruiter)** | Locked — 1 credit to unlock |

This preserves crew's ability to use their profile as a linktr.ee while monetising efficient discovery.

**Reference:** See `yl_decisions.vNext.json` → D-025

---

## Metrics & Tripwires

Phase 1 health is measured by:

| Metric | Tripwire | Response |
|--------|----------|----------|
| Endorsement-to-profile ratio | < 0.3 at 500 profiles | Pause growth, diagnose |
| Organic share rate | < 10% monthly | Pause growth, investigate value prop |
| Repeat flag rate | > 5% of endorsements | Investigate coercion/gaming |
| Time-to-first-endorsement | > 30 days median | Review onboarding |

**Reference:** See `yl_phase1_actionables.vNext.json` → `metrics_and_tripwires`

### Timeline & Interaction Metrics (Tracked, Not Enforced)
- `interaction_exit_rate`
- `reports_per_1k_posts`
- `median_time_to_first_irl_encounter`
- `irl_encounters_per_active_user`

### Timeline Analytics Events (Phase 1)
- `timeline.viewed`
- `post.created`
- `post.viewed`
- `interaction.created`
- `interaction.participant.confirmed`
- `interaction.participant.exited`
- `interaction.media.uploaded`

---

## Growth Controls

- Single config flag switches public signup to invite-only
- PM can pause first, explain after if founder unavailable
- Execution time: same day

**Reference:** See `yl_phase1_actionables.vNext.json` → `growth_controls`

---

## Abuse Escalation Protocol

| Level | Name | Trigger | Action |
|-------|------|---------|--------|
| 1 | Monitor | Single suspicion | Flag internally, no intervention |
| 2 | Shadow-constrain | Second independent signal | Rate-limit endorsement requests |
| 3 | Freeze | Three+ reports or evidence | Freeze endorsement activity, escalate |

**Reference:** See `yl_phase1_actionables.vNext.json` → `abuse_escalation_protocol`

---

## Revenue Projections

### Crew Pro

| Scenario | Users | Conversion | Pro Users | MRR |
|----------|-------|------------|-----------|-----|
| Modest | 5,000 | 5% | 250 | €3,000 |
| Good | 10,000 | 8% | 800 | €9,600 |
| Strong | 25,000 | 10% | 2,500 | €30,000 |

### Recruiter Access

| Scenario | Agencies | Sub MRR | Avg Credit Spend | Credit MRR | Total MRR |
|----------|----------|---------|------------------|------------|-----------|
| Early | 20 | €580 | €100 | €2,000 | €2,580 |
| Growth | 50 | €1,450 | €200 | €10,000 | €11,450 |
| Mature | 100 | €2,900 | €400 | €40,000 | €42,900 |

### Combined Phase 1 Revenue Potential

| Scenario | Crew Pro | Recruiter | Total MRR |
|----------|----------|-----------|-----------|
| Early | €3,000 | €2,580 | €5,580 |
| Good | €9,600 | €11,450 | €21,050 |
| Strong | €30,000 | €42,900 | €72,900 |

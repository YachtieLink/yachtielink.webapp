# Yachtielink Moderation & Consensus Mechanics

**Version:** 1.0  
**Date:** 2026-01-28  
**Status:** Pre-build  
**Scope:** Attachment confirmation, account flagging, endorsement signals, verified status

---

## Overview

Yachtielink uses consensus-based moderation grounded in shared employment, not admin arbitration. The system is designed to:

1. Allow organic graph growth without friction
2. Prevent fake accounts and sock puppet networks
3. Resist hostile takeover of yacht nodes
4. Scale moderation with the community, not admin headcount

**Core principle:** Only people with direct, verifiable shared experience have standing to make moderation decisions.

---

## 1. Verified Status

### Why verification exists

Sock puppet networks can endorse each other and build fake standing. Verified status creates a chain of trust from known-good users, preventing fake accounts from gaining moderation power.

### How to become verified

| Path | Requirement | Rationale |
|------|-------------|-----------|
| **Seed set** | Founder manually verifies initial cohort | Bootstraps the chain |
| **Endorsement from verified** | Receive endorsement from 2+ verified users on 2+ different yachts | Chain of trust extends organically |
| **Tenure + density** | 12+ months on platform AND 3+ endorsements received from 3+ distinct users | Time + organic activity is hard to fake at scale |
| **Crew Pro subscriber** | Paid subscription active | Economic friction deters sock puppets |

Any single path grants verified status.

### What verified status grants

| Capability | Unverified | Verified |
|------------|------------|----------|
| Attach to yacht | ✓ | ✓ |
| Give endorsement | ✓ | ✓ |
| Receive endorsement | ✓ | ✓ |
| Flag account | ✓ (with standing) | ✓ (with standing) |
| Vote on flags (direct yacht overlap) | ✓ | ✓ |
| Vote on flags (expanded pool) | ✗ | ✓ |
| Confirm new attachments | ✗ | ✓ |

### Verification revocation

Verified status can be revoked if:
- Account is flagged and removed
- Pattern of endorsing accounts later removed as fake (3+ in 12 months)
- Manual admin action (rare, documented)

Revocation is logged. User can re-earn verified status through normal paths.

### Bootstrapping

**Phase 1 launch:**
- Founder manually verifies 20–50 known real yachties from personal network
- These become the seed set
- They endorse real colleagues → chain extends
- Target: 200+ verified users within 3 months of launch

---

## 2. Yacht Lifecycle

### Yacht states

| State | Conditions | Attachment rules |
|-------|------------|------------------|
| **Fresh** | < 60 days old OR below crew threshold | Anyone can attach, no confirmation needed |
| **Established** | ≥ 60 days old AND at or above crew threshold | New attachments require confirmation |

### Crew threshold (based on yacht size)

Creator specifies yacht size at creation. This sets the threshold:

| Yacht size | Typical crew | Threshold to establish |
|------------|--------------|------------------------|
| < 30m | 3–5 | 3 attached users |
| 30–50m | 6–12 | 5 attached users |
| 50–80m | 12–20 | 8 attached users |
| 80m+ | 20–40 | 12 attached users |

**Both conditions must be met** (60 days AND threshold) for yacht to become established.

### Yacht metadata (set at creation)

| Field | Required | Purpose |
|-------|----------|---------|
| Name | Yes | Display, search |
| Size (length) | Yes | Determines crew threshold |
| Type (Motor/Sail/Explorer) | Yes | Disambiguation |
| Flag state | No | Disambiguation |
| Year built | No | Disambiguation |

This metadata helps distinguish yachts with the same name (e.g., multiple "Lady M" vessels).

---

## 3. Attachment Confirmation

### When confirmation is required

Only for attachments to **established** yachts. Fresh yachts allow free attachment.

### Who can confirm (verified users only)

Eligible confirmers must be verified AND either:
- Have overlapping dates on that yacht with the requester, OR
- Have current attachment to that yacht (ongoing, no end date)

### Confirmation options

| Option | Meaning |
|--------|---------|
| ✓ Confirm | "I worked with this person during those dates" |
| ✗ Reject | "This person was not onboard during those dates" |
| — Abstain | "Not sure" (or no response) |

### How many confirmations needed

Based on total eligible confirmers:

| Eligible confirmers | Required confirms |
|---------------------|-------------------|
| 1–10 | 1 |
| 11–20 | 2 |
| 21–30 | 3 |
| 31+ | 4 |

### Resolution

| Outcome | Condition | Result |
|---------|-----------|--------|
| **Approved** | Required confirms received | Attachment active |
| **Rejected** | Majority of respondents reject (after 7 days) | Attachment denied |
| **Auto-approved** | No response after 7 days | Attachment active (benefit of doubt) |

### Rejection penalties

| Trigger | Action |
|---------|--------|
| 3 rejections in 30 days | Shadow-constrain (attempts go to void, no error shown) |
| 5 rejections in 60 days | Freeze attachment capability, escalate to review |

---

## 4. Account Flagging

### When to flag

Account flagging is for suspected fake or fraudulent accounts — not for disputes about endorsement content.

### Who can flag

Must have overlapping attachment on the same yacht as the accused. No exceptions.

### Rate limits

| Limit | Value |
|-------|-------|
| Flags per user per week | 10 |

This allows legitimate cluster-flagging while preventing spam.

### What triggers a vote

**1 flag = vote triggered.** The flag is shown to voters (who flagged is visible).

---

## 5. Account Flag Voting

### Voter eligibility

**Base pool (all users, verified or not):**
- Users with overlapping attachment on the flagged yacht (same time period as accused)

**Expanded pool (verified users only):**
- Users with current attachment on the flagged yacht (ongoing, no end date)
- Users who have given or received endorsement from the accused (any yacht)

**Excluded from voting:**
- The accused
- Accounts less than 7 days old
- Accounts with no attachments

### Voting rules

| Rule | Value |
|------|-------|
| Voting window | 7 days |
| Early resolution | 67%+ of eligible voters vote same way |
| Final resolution | Majority of votes cast after 7 days |
| Tie | Accused stays, no action |
| Minimum votes | 3 votes cast required, otherwise no resolution |

### Voting options

| Option | Meaning |
|--------|---------|
| ✓ Legitimate | "I believe this is a real person" |
| ✗ Fake | "I believe this account is fraudulent" |
| — Abstain | No vote cast |

### Outcomes

| Result | Actions |
|--------|---------|
| **Fake (removed)** | Account hidden; endorsements given hidden; endorsements received orphaned (endorsers not penalized) |
| **Legitimate (stays)** | Accuser flagged internally; repeated bad-faith flags reduce accuser's credibility (backend only) |
| **No resolution** | Insufficient votes; flag expires; can be re-flagged after 30 days |

---

## 6. Ossification (Historical Protection)

### Purpose

Prevent new users from "rewriting history" by voting out established, legitimate accounts.

### Ossification criteria

Account is ossified if ALL of:
- Account age > 2 years
- Has received 5+ endorsements from 5+ distinct users
- No prior successful flags against them

### Ossification effect

Ossified accounts can still be flagged, but require **80% supermajority** (instead of 67%) to remove.

---

## 7. Endorsement Signals

### Purpose

Allow users to express agreement or disagreement with endorsements without triggering removal.

### Who can signal

Must have overlapping attachment on the same yacht as the endorsement.

### Signal options

| Signal | Display |
|--------|---------|
| 👍 Agree | "X people who worked on [yacht] agree" |
| 👎 Disagree | "X people who worked on [yacht] disagree" |

### Effect

| Phase | Effect |
|-------|--------|
| Phase 1 | Display only — no impact on endorsement visibility or weight |
| Phase 2+ | Signals feed into trust weighting algorithms |

### Endorsement removal

Endorsements are only hidden if:
1. Endorser's account is removed via flagging (System 4), OR
2. Endorser retracts it themselves

Signals alone never remove an endorsement.

---

## 8. Hostile Takeover Resistance

### Why the system resists takeover

| Attack vector | Defense |
|---------------|---------|
| Sock puppets endorse each other | Endorsements from unverified users don't grant expanded voting power |
| Sock puppets confirm each other | Only verified users can confirm attachments |
| Sock puppets vote out real users | Unverified users can only vote on direct overlaps; expanded pool requires verification |
| Bad actors capture established yacht | Real crew spin up new yacht node; fake yacht has hollow graph with no value |
| Patient attackers wait for tenure | Tenure path requires endorsements from distinct users (hard to fake without verified cooperation) |

### Extreme case: Yacht fully compromised

If a yacht node is fully compromised by bad actors:

1. Real crew create new yacht with same name (duplicates allowed)
2. Real yacht accumulates real endorsements from verified users
3. Fake yacht has hollow, unverified graph — obviously worthless to viewers
4. **Admin intervention** (rare): Founder can hide/archive compromised yacht node

Admin intervention is "once in a blue moon" — the system should self-correct in nearly all cases.

---

## 9. Date Precision

### Storage

Exact dates (day precision) stored in database.

### UI input

Month/year picker. System stores as:
- Start date → 1st of selected month
- End date → last day of selected month

### Overlap calculation

Any day overlap = standing. If Alice's attachment (Jan–Jun 2024) overlaps Bob's (Jun–Dec 2024) by even one day in June, they have standing for flagging/voting/confirming.

---

## 10. Integration with Existing Systems

### Abuse escalation protocol (yl_phase1_actionables.vNext.json)

Account flagging feeds into existing escalation:

| Trigger | Escalation level |
|---------|------------------|
| Single flag (vote pending) | Level 1 (Monitor) |
| Multiple flags from independent users | Level 2 (Shadow-constrain) |
| Successful removal vote | Level 3 (Freeze) + removal |

### Security (yl_security.vNext.md)

Rate limits in security doc apply:
- Flagging: 10/week (new)
- All other limits unchanged

### Schema (yl_schema.vNext.md)

New tables/fields required:
- `users.is_verified` (boolean)
- `users.verified_at` (timestamp)
- `users.verified_via` (enum: seed, endorsement, tenure, subscription)
- `users.require_tag_approval` (boolean)
- `yachts.size_category` (enum: small, medium, large, superyacht)
- `yachts.yacht_type` (enum: motor, sail, explorer)
- `contacts` (messaging-only)
- `attachment_confirmations` (new table)
- `account_flags` (new table)
- `account_flag_votes` (new table)
- `endorsement_signals` (new table)
- `posts`
- `post_media`
- `post_tags`
- `post_comments`
- `interactions`
- `interaction_participants`
- `interaction_media`
- `interaction_comments`

---

## 11. Timeline Content Moderation (Phase 1)

### Scope
Content objects covered:
- Posts
- Post comments
- Interactions
- Interaction comments
- Post/interaction media
- Tags

### Reporting & Escalation
Any user can report content visible to them. Reports route into the existing escalation protocol:
- **Level 1 (Monitor):** Single report, no corroboration
- **Level 2 (Shadow-constrain):** Multiple independent reports or repeated issues from same account
- **Level 3 (Freeze):** Confirmed abuse, non-consensual imagery, or coercion pattern

### Non-Consensual Imagery (Zero Tolerance)
- Immediate hide for non-participants upon report
- Content removed after verification or if participant exits
- Repeat offender escalated to Level 3
- Audit log required for every takedown

### Coercion or Harassment in Encounters
- Reports from participants trigger investigation
- Pattern of coerced participation or repeated exits elevates severity
- Users can be shadow-constrained from creating interactions

### Tag Abuse
- Tags are accepted by default but can be set to approval mode
- Any user can remove themselves at any time
- Repeated unwanted tagging triggers review

### Absolute Right of Exit (Enforced)
When a user exits an interaction or removes a tag:
- Their association disappears everywhere for other viewers
- Their comments and media are hidden from non-participants
- Their name and face are removed from the interaction or post

This is non-negotiable and treated as a consent right, not a preference.

---

## Cross-References

| Topic | Document |
|-------|----------|
| Existing abuse escalation | `yl_phase1_actionables.vNext.json` → `abuse_escalation_protocol` |
| Rate limiting infrastructure | `yl_tech_stack.vNext.md` → Vercel KV |
| RLS enforcement | `yl_security.vNext.md` → Section 1.2 |
| Endorsement gating rule | `yl_decisions.vNext.json` → D-009 |
| Retraction visibility (backend only) | `yl_decisions.vNext.json` → D-005 |
| Database schema | `yl_schema.vNext.md` |

---

## Open Items for Phase 2+

| Item | Notes |
|------|-------|
| Endorsement signal weighting | Signals affect trust calculations |
| Pattern detection | Automated flagging of suspicious clusters |
| Paid yacht dashboards | Yacht owners can verify crew, adds trust layer |
| Management company verification | Additional trust anchor |
| Credential verification | ENG1, STCW, etc. verified against issuing bodies |

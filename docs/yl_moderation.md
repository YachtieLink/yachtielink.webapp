# Yachtielink Moderation & Integrity Mechanics

**Version:** 1.1  
**Date:** 2026-03-08  
**Status:** Pre-build  
**Scope:** Minimal launch integrity controls plus later consensus moderation

---

## Overview

The current build does not need the full future moderation system to ship. It does need enough integrity control to keep the yacht graph useful.

The purpose of moderation in the current build is:
1. Keep yacht attachments reality-bound
2. Prevent obvious graph pollution
3. Limit endorsement abuse early
4. Preserve the option to expand into stronger consensus moderation later

**Core principle:** Only people with direct, verifiable shared experience should have standing to affect trust-related moderation.

---

## 1. Verified Status

### Why verification exists

Sock puppet networks can endorse each other and build fake standing. Verified status exists to prevent fake accounts from gaining moderation power.

### How to become verified

| Path | Requirement | Rationale |
|------|-------------|-----------|
| **Seed set** | Founder manually verifies initial cohort | Bootstraps the chain |
| **Endorsement from verified** | Receive endorsement from 2+ verified users on 2+ different yachts | Chain extends organically |
| **Tenure + density** | 12+ months on platform AND 3+ endorsements received from 3+ distinct users | Time + organic activity is harder to fake |

**Forbidden:** payment may not grant verified status or any other moderation power.

### What verified status grants

| Capability | Unverified | Verified |
|------------|------------|----------|
| Attach to yacht | Yes | Yes |
| Give endorsement | Yes | Yes |
| Receive endorsement | Yes | Yes |
| Vote in expanded moderation pools | No | Yes |
| Confirm new attachments on established yachts | No | Yes |

---

## 2. Launch Integrity Controls

These controls are required for the first build:

- Yacht entity, not free text
- Disambiguation metadata when creating a yacht
- Required role and date range on attachments
- Fresh yachts remain easy to attach to
- Attachment dispute and rejection handling
- Rate limits on endorsement requests
- Manual founder review path for obvious abuse

This is the minimum viable integrity layer.

---

## 3. Yacht Lifecycle

### Yacht states

| State | Conditions | Attachment rules |
|-------|------------|------------------|
| **Fresh** | < 60 days old OR below crew threshold | Anyone can attach |
| **Established** | >= 60 days old AND at or above crew threshold | New attachments may require confirmation |

### Crew threshold (based on yacht size)

| Yacht size | Typical crew | Threshold to establish |
|------------|--------------|------------------------|
| < 30m | 3-5 | 3 attached users |
| 30-50m | 6-12 | 5 attached users |
| 50-80m | 12-20 | 8 attached users |
| 80m+ | 20-40 | 12 attached users |

Both conditions must be met for a yacht to become established.

---

## 4. Attachment Confirmation

### When confirmation is required

Only for attachments to established yachts. Fresh yachts allow free attachment.

### Who can confirm

Eligible confirmers must be verified and either:
- have overlapping dates on that yacht with the requester, or
- have current attachment to that yacht

### Resolution

| Outcome | Condition | Result |
|---------|-----------|--------|
| **Approved** | Required confirms received | Attachment active |
| **Rejected** | Majority of respondents reject after 7 days | Attachment denied |
| **Auto-approved** | No response after 7 days | Attachment active |

### Rejection penalties

| Trigger | Action |
|---------|--------|
| 3 rejections in 30 days | Shadow-constrain |
| 5 rejections in 60 days | Freeze attachment capability and escalate |

---

## 5. Endorsement Abuse Handling

- Endorsement eligibility remains gated by shared yacht attachment
- Requests are rate-limited
- Retractions stay backend-only
- Repeated dispute patterns can trigger review

No public negative labels or trust summaries are permitted.

---

## 6. Later Consensus Layer

The broader community moderation design remains valid as a future layer:
- account flag voting
- expanded verified pools
- ossification rules
- endorsement signals

It should not expand launch scope unless graph quality forces it.

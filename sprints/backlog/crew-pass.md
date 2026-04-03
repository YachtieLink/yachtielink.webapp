---
title: Crew Pass — Background Check / Verification Badge
status: idea (needs research)
source: founder (2026-03-28, discussed 2026-04-03)
priority: P2 (post-launch, revenue opportunity)
modules: [profile, public-profile, payments]
---

# Crew Pass — Background Check / Verification Badge

## Summary

A verified credential on crew profiles showing background checks and certificate verification have been completed. Trusted signal for captains and agencies when hiring.

## Founder Direction (2026-04-03)

Two open strategic questions before this can be specced:

### 1. Build vs partner vs display-only

| Option | Pros | Cons |
|--------|------|------|
| **Build our own** verification service | Revenue opportunity, full control, brand value | Regulatory complexity, liability, operational cost |
| **Partner** with existing provider (Sterling, Certn, etc.) | Offload compliance + liability, faster to ship | Margin pressure, dependent on partner |
| **Display-only** — crew uploads proof of an industry-standard check (e.g., MLC flag state checks), YachtieLink just shows the badge | Zero liability, zero operational cost, ships fast | No revenue from the check itself, trust depends on the issuer |

**Founder leaning:** if there's an industry-wide accepted company/standard that does these checks, just display the badge and let employers/crew handle the actual verification. YachtieLink doesn't need to validate — liability sits with the employer and the crew member. Keep it simple.

**However:** if YachtieLink builds this as a service, it's a direct revenue stream (charge per check or bundle into Pro). Needs more research on whether the margin justifies the complexity.

### 2. What "verified" means in yachting

Research needed:
- Is there an industry-standard background check provider yachties already use?
- What do MCA / AMSA / USCG flag states require for crew verification?
- Do agencies (e.g., Wilsonhalligan, YachtCrewLink) run their own checks?
- What does PYA recommend?
- Is there a yachting-specific equivalent of a DBS check (UK) or FBI check (US)?

### 3. What yachts want to showcase

Yachts (not just crew) may want to display that all their crew have been background-checked. This is a yacht-level badge, not just individual. Could tie into yacht profile pages.

## Parking for now

This needs business research before technical spec. Key questions:
1. What existing checks do yachties already get?
2. Is there a provider we should integrate vs compete with?
3. What's the revenue model — per-check fee, Pro bundle, or free display?
4. Liability: do we validate, or just display?

## Not ready for

- Technical spec
- File paths / implementation
- Grill-me (need research answers first)

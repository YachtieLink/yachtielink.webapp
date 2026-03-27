# Pro Upsell Consistency — Design System Standard

**Source:** Founder direction during public profile rewrite grill-me (2026-03-27)
**Priority:** P2
**Category:** UI/UX, Design System

---

## Problem

Pro upsells currently look different across the app — different copy, different visual treatment, different placement patterns. There's no consistent design language for "this is a Pro feature, here's how to unlock it."

## Scope

Audit every Pro upsell touchpoint across the app and standardise:

- **Visual treatment** — consistent badge/lock/glow style for gated features
- **Copy pattern** — consistent tone and wording
- **Placement pattern** — where upsells appear relative to the gated feature
- **Interaction** — what happens on tap (inline expand, modal, redirect to billing?)
- **Owner-only rule** — upsells are only visible to the profile owner, never to viewers

## Surfaces to audit

- Profile display mode selector (Profile / Portfolio / Rich Portfolio)
- Photo upload limits (1 hero + 3 gallery free, more for Pro)
- Gallery slots
- Endorsement pinning
- Analytics dashboard
- QR customisation
- CV template selection
- Any other Pro-gated feature

## Deliverable

A design system entry (`docs/design-system/patterns/pro-upsell.md`) defining the standard pattern, plus a sweep to retrofit existing upsells to match.

## Notes

- Must align with "Trust Is Not For Sale" — Pro upsells are always about presentation, never about trustworthiness
- Monetisation colour rule: teal for trust features, sand for Pro presentation features

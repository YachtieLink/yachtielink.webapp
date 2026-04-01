# Backlog — Ideas & Proposals

The idea inbox. Feature ideas, bug fix proposals, and improvement thoughts live here until they are planned into a sprint.

**Flow:** Capture here → flesh out in place → promote to a sprint folder during sprint planning → archive when shipped or rejected.

An item stays in this folder even after promotion — the file becomes a historical record. Shipped items are marked below so they can be cleaned up in a future pass.

---

## File Template

```markdown
# [Feature Name]

**Status:** idea | fleshed-out | ready-for-sprint | promoted | rejected
**Priority guess:** P1 (critical) | P2 (important) | P3 (nice-to-have)
**Date captured:** YYYY-MM-DD

## Summary
One or two sentences on what this is and why it matters.

## Scope
- What needs to be built (bullet points)
- What doesn't need to be built yet

## Files Likely Affected
- `path/to/file.tsx` — what changes

## Notes
Any context, constraints, or open questions.
```

---

## 1. Already Shipped

These items are done. Files remain for reference but are candidates for removal in a future cleanup pass.

| ID | File | Shipped in | Summary |
|----|------|-----------|---------|
| — | `attachment-transfer.md` | Sprint 12 | Attachment transfer between profile versions |
| — | `endorsement-context-display.md` | Sprint 11 | Show role/yacht context inside endorsement cards |
| — | `endorsement-invite-token-qa.md` | Launch QA | QA of invite-token flow for endorsement requests |
| — | `endorsement-share-button-empty.md` | Rally 006 | Fix empty state on endorsement share button |
| — | `profile-photo-reposition.md` | Sprint 11 | Repositioned avatar framing on profile cards |
| — | `public-profile-rewrite.md` | Sprint 11 | Full public profile page rewrite |
| — | `safari-public-profile-links-broken.md` | Pre-launch | Safari: public profile links not clickable |
| — | `subdomain-cookie-auth-audit.md` | PR #101 | Subdomain cookie and auth edge-case audit |
| — | `ux-audit-mobile-2026-03-29.md` | Rally 006 | Mobile UX/UI audit |
| — | `cv-upload-modes.md` | Sprint CV-Parse | CV upload mode selection (Step 0 of import wizard) |

---

## 2. Bug Fixes

Small, targeted fixes. All have a clear owner and a contained scope.

| ID | File | Effort | Summary |
|----|------|--------|---------|
| BUG-01 | `onboarding-name-from-email.md` | S | Name field not pre-filled from email during onboarding trigger |
| BUG-02 | `overlapping-yacht-dates.md` | M | Overlapping yacht date ranges cause sea-time double-counting |
| BUG-03 | `colleague-display-names.md` | S | Colleague dedup — same person appearing under multiple name variants |
| BUG-04 | `non-yachting-experience.md` | M | Non-yachting experience blocks onboarding completion; folded into SP-02 |

---

## 3. Quick Wins

Self-contained, ship-in-a-session improvements. Good candidates for a polish rally or low-load sprint slots.

| File | Effort | Summary |
|------|--------|---------|
| `custom-404-page.md` | S | Branded 404 page instead of the framework default |
| `endorsement-request-collapsed-yachts.md` | S | Endorsement request page — collapse yacht list, surface external contacts higher |
| `saved-profile-card-detail-line.md` | S | Show sea time + yachts on saved-profile cards instead of certs |
| `yacht-profile-sharing.md` | S | Share button on yacht profile page (link copy / QR) |
| `nationality-flag-public-profile.md` | S | Show nationality flag next to avatar on public profile |
| `cv-parse-pro-upsell.md` | S | Upsell to Pro when free user hits CV parse rate limit |
| `settings-preview-ux.md` | S | Settings cosmetics — show live preview of visibility toggles |
| `visibility-toggle-clarity.md` | S | Clarify what each visibility toggle controls (label copy + tooltip) |

---

## 4. Major Sprint Proposals

Larger bodies of work that need their own sprint or sub-sprint. Each file contains a detailed spec or design notes.

| ID | File | Effort | Status | Summary |
|----|------|--------|--------|---------|
| SP-01 | `ghost-profiles-claimable-accounts.md` | L | Design complete, ready | Ghost profiles created from endorsement/colleague data; claimable by the real person — primary viral growth loop |
| SP-02 | `cv-review-existing-yacht-badge.md` + `cv-review-cert-matching.md` + `cv-review-socials-step.md` + `cv-review-education-autocomplete.md` | L | Fleshed out | CV wizard completion — yacht matching UX, cert registry + fuzzy match, social links step, education autocomplete |
| SP-03 | `skill-autocomplete-normalization.md` + `avatar-thumbnail-framing.md` + `inner-page-header-component.md` | L | Ideas | Profile enrichment — skill/hobby normalization, avatar framing fix, consistent inner-page header component |
| SP-04 | `ai-bio-writing-assist.md` + `endorsement-writing-assist.md` | M | Design complete | AI writing assist — bio generation and endorsement writing scaffolding |
| SP-05 | `pro-multiple-cvs.md` + `cv-staleness-nudge.md` + `pro-upsell-consistency.md` + `cv-actions-card-redesign.md` + `cv-sharing-page-rework.md` | L | Ideas | Pro feature suite — multiple CVs, staleness nudge, upsell consistency, CV actions card + sharing page redesign |

---

## 5. Rally Candidates

Cross-cutting concerns that don't fit a single feature sprint. Better suited to a focused audit or design rally.

| File | Summary |
|------|---------|
| `desktop-responsiveness-audit.md` | Systematic audit of breakpoints and desktop layout across all pages |
| `secondary-role-logic.md` | Design work needed: dual-role crew patterns before any code is written |
| `reserved-subdomain-page-uxui.md` | UX/UI polish for reserved subdomain holding pages |
| `reporting-flagging.md` | Reporting and flagging architecture — needs product design before build |
| `profile-display-settings-rework.md` | Rethink settings IA: which toggles live where, progressive disclosure |

---

## 6. Deferred to Phase 2+

Not on the roadmap for Phase 1. Captured so the idea isn't lost.

| File | Summary |
|------|---------|
| `crew-pass.md` | Crew Pass — portable credential / identity document for crew |
| `camera-cv-capture.md` | Mobile camera capture flow to scan a physical CV |
| `watch-profile-notifications.md` | Push notifications when a watched profile is updated |
| `subdomain-route-upgrade.md` | Upgrade subdomain routing to first-class Next.js subdomain support |
| `subdomain-full-experience.md` | Full subdomain experience (per-user subdomain with custom content) |
| `save-yachts.md` | Bookmark yachts (depends on yacht detail pages from Sprint 12+) |
| `saved-yachts.md` | **DUPLICATE of `save-yachts.md`** — review and remove one |
| `share-button-qr-code.md` | QR code on share button / share sheet |
| `stock-gallery-placeholders.md` | Stock gallery images as placeholders before real yacht photos exist |
| `social-links-add-prompt.md` | Prompt to add social links during onboarding or from empty state |
| `skill-hobby-notes.md` | Freetext notes on individual skills and hobbies |
| `colleague-graph-explorer.md` | Visual colleague graph explorer (network graph UI) |
| `phone-whatsapp-split.md` | Separate phone and WhatsApp fields instead of a single contact field |
| `bug-reporter.md` | In-app bug reporter for crew (P2, post-launch polish) |
| `yacht-name-timeline.md` | Yacht name history timeline (DB foundation landed in Sprint 12) |

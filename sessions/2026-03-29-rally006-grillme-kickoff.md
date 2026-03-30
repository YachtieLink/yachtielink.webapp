---
date: 2026-03-29
agent: Claude Code (Opus 4.6)
sprint: Rally 006
modules_touched: []
---

## Summary

Grill-me design session for Rally 006 (22 questions resolved with founder), followed by sprint-start-yl codebase validation. No code written. Build spec produced, 2 backlog items created, execution plan approved.

---

## Session Log

**Session start** — Founder initiated Rally 006 kickoff pointing at `sprints/rallies/rally-006-prelaunch/README.md` and `sprints/PHASE1-CLOSEOUT.md`. Directed to start with grill-me to resolve all design questions before building.

**Grill-me phase (22 questions):**

1. Subdomain cookie auth — CLOSED, verified working in production. No code change. Backlog item for future route upgrade.
2. Safari public profile links — CLOSED, verified working by founder on iPhone.
3. Onboarding wizard skip — Fix Wizard skip logic (Option B). Don't touch DB trigger. Always start at step 0 unless `onboarding_complete` is true.
4. Avatar framing — `object-top` default (Option B). One CSS change. Focal points deferred.
5. CV yacht matching — FULL SPEC (Option C). Founder: "Onboarding has to be a stunning experience." Multi-signal search upgrade (builder + length), smart search / dumb storage principle (never normalize stored names), three match states (green/amber/blue), reusable YachtPicker modal, yacht cards with photo + builder + length + crew counts.
6. PDF tracking — `pdf_download` on download routes, `profile_view` on generate route.
7. Link share tracking — Wire on ShareButton, ShareModal, ProfileHeroCard. Skip endorsement request link.
8. Billing stub → Plan management page — Delete `/app/billing`, build `/app/settings/plan` with Free/Pro active/Pro cancelled states. Pull prices from Stripe.
9. Endorsement banner → Full engagement system — Collapsible with progress counter (Phase 1: 0-5), gamification tiers (Phase 2: Good/Great/Outstanding, private only), staleness nudge (Phase 3: 12-month freshness clock from later of endorsement date or end of shared tenure).
10. Analytics wiring — Covered by #6 + #7.
11. Network IA — Move Saved tab out of Network → More menu. Network drops to 3 tabs (fits at 375px). Saved Yachts backlogged as new feature.
12. "Unknown" fix — Show email/phone from invite record.
13. Inner page header + back button audit (merged) — Create shared `PageHeader` component, refactor ~12 sub-pages.
14. Share button fallback — Clipboard copy when Web Share API unavailable.
15. Editable field affordance — One consistent pattern across all profile fields. No more per-component invention.
16. Colleague display names — Full names in colleague lists. Investigate duplicate entries.
17. Pro upsell links — All point to `/app/settings/plan`.
18. Sprint 13 items — Confirmed separate scope, not Rally 006.
19. Network tab labels — Not just a label problem. Founder decided to move Saved to More, dropping to 3 tabs.
20. Back button → merged into inner page header audit (item 13).
21. Backlog cross-reference — Found 4 unassigned launch-relevant items (settings-preview-ux, inner-page-header, pro-upsell-consistency, colleague-display-names). 2 folded into Rally 006, 2 deferred to founder's UX run.
22. `pb-tab-bar` regression — P1 not in rally spec, surfaced during validation. Added to Wave 0.

**Key founder pushbacks:**
- Yacht name normalization: Founder rejected stripping prefixes (M/Y, S/Y). Different prefixes = different yachts. "Smart search, dumb storage."
- CV yacht matching scope: Rejected minimal option. "Are you kidding? This is the whole point."
- Endorsement staleness: Clock starts from later of endorsement date OR end of shared tenure, not just overlap period. Even if still working together, old endorsement goes stale.
- Consistency: "I'm sick of inventing a new way to do the same thing for every component" — drove the editable field affordance audit.
- Saved profiles IA: Saved is recruitment/hiring intent, not networking. Belongs in More, not Network.

**Backlog cross-reference** — Found 4 unassigned items that matter for launch:
1. settings-preview-ux (P1) — Deferred to founder's UX run-through
2. inner-page-header-component (P2) — Folded into Rally 006
3. pro-upsell-consistency (P2) — Partially solved by plan page; visual audit deferred
4. colleague-display-names (P2) — Folded into Rally 006

**Sprint-start-yl validation:**
- Launched Sonnet subagent for full codebase validation against build spec
- Key findings: no `getStartingStep()` exists (simpler than expected), multiple components roll their own avatars (wider than expected), Stripe fully wired (4 price IDs), `search_yachts()` doesn't return builder (needs migration), no YachtCard/YachtPicker component exists
- P1 surfaced: `pb-tab-bar` regression not in build spec — added
- Colleague display names (#16) may already be working — code shows `display_name ?? full_name` logic

**Execution plan:** 4-wave strategy approved. Wave 0 (foundations/Opus), Wave 1 (4 parallel Sonnet agents), Wave 2 (3 parallel Sonnet agents), Wave 3 (integration/Opus).

**Session end** — Build spec finalized, execution plan approved, ready to build.

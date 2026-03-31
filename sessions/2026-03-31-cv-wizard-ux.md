---
date: 2026-03-31
agent: Claude Code (Opus 4.6)
sprint: Rally 006 (CV import wizard UX walkthrough)
modules_touched: [cv-import, design-system, onboarding]
---

## Summary
Founder-led screen-by-screen walkthrough of the CV import wizard. Reworked Step 1 "Your Details" review and edit states — field grouping, flag-outside-input pattern, DatePicker reorder, amber color scheme for wizard chrome, contextual help text, WCAG contrast fix. Two backlog items captured (AI bio assist, secondary role logic).

---

## Session Log

**Session start** — Continued from prior session (builder autocomplete). Founder initiated CV import wizard walkthrough starting at `/app/cv/upload`.

**Early** — Upload confirmation page tweaks: button auto-width centered, teal-700 primary (500 too light per founder), "Other options" sentence case with tap targets, spacing.

**Mid-session** — Parse loading screen: amber spinner, progress bar, step text. Completed steps get teal checkmarks.

**Mid-session** — Step 1 review state: amber labels failed WCAG AA contrast (2.4:1 on white). Founder said "this does not look good." Ran frontend specialist analysis — confirmed section colors must not be used on body text. Changed to `--color-text-secondary`. Bio display uncapped (was truncated at 80 chars). Smoke pref capitalization fixed via label lookup.

**Mid-session** — Step 1 edit form complete rework: field grouping with border-t dividers (Identity, Personal, Location & Contact, Preferences, Languages). Sticky Done button. Cancel in header. Created `lib/constants/roles.ts` for Primary Role datalist. Contextual help text for preferences and location.

**Mid-session** — Flags outside input boxes for nationality, country, phone. Founder wanted flags outside, not inside, to avoid double display. Pattern: `<span>flag</span>` left of input, SearchableSelect options still show flags for scanning.

**Late** — DatePicker selector reorder from Month-Year-Day to Day-Month-Year to match DD MMM YYYY display. Confirmed consistent site-wide (shared component).

**Late** — "Display name" → "Preferred name" in onboarding wizard and profile settings.

**Late** — Backlog captures: AI bio writing assist, secondary role logic (founder emphasized needs real design work for the dual-role vs open-to-either logic).

**Late** — Design decision logged: no left border accent stripes on cards.

### Key Decisions
- Primary buttons are teal-700 universally — not section-colored
- Section color (amber for CV) is for accents only, never body text labels
- Flags appear outside input boxes, not inside selected values
- DatePicker order is Day-Month-Year everywhere
- "Preferred name" not "Display name" — renamed in onboarding wizard + profile settings
- WhatsApp defaults to phone number, overridable (captured to backlog)

---

## 2026-04-01 — Session 2 (Steps 4-5 + Code Review)

**Session start** — Continued wizard walkthrough from previous session. Picked up at Step 4 (Extras).

**Early** — Step 4 chip hierarchy audit. Founder said "chips are bigger than section heading by far — one of your auditors needs to be fired." Ran fresh-eyes subagent audit that identified 5 fixes: heading size, chip size, chip color weight, sub-labels, social heading. All applied.

**Mid-session** — Step 5 (Review) full walkthrough. Founder flagged: yachts missing M/Y/S/Y prefixes, title wrong font, not enough amber, skills/interests need summary display and color distinction. Ran subagent review, applied 7 fixes. Added deduplication of hobbies against skills. Moved interests summary outside conditional hobbies block so it shows even when all hobbies overlap skills.

**Mid-session** — Celebration screen. Founder: "needs to be a bit lower for mobile first" → "centred on the top third line." Applied `pt-[25vh]` positioning.

**Late** — "View my profile" button on celebration screen led to CV upload loop. Root cause: `router.refresh()` race condition with `router.push('/app/profile')`. Fixed by removing `router.refresh()`.

**Late** — Two-phase code review (Sonnet + Opus). Found and fixed: stale closure in YachtMatchCard DatePicker, rate limit bucket collision (downloads sharing pdfGenerate), inline Pro gate bypassing `isProFromRecord()`. Deferred: previewTemplate replacing live CV, StepPersonal overwrite tracking gaps.

**Late** — YachtieLink drift review. WARNING verdict. Fixed inline Pro gate. Noted `getCvSections` read-model duplication for backlog.

### Key Decisions (Session 2)
- Chips must be visually subordinate to section headings (text-xs vs text-base)
- CV chips use tinted style (bg-interactive/10), not solid teal
- Hobby chips use amber tint (bg-amber-50 text-amber-700) for distinction from skill chips
- Celebration screen positioned at top-third of viewport, not centered
- Download endpoints get their own rate limit bucket (cvDownload) separate from PDF generation

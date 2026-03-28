---
date: 2026-03-28
agent: Claude Code (Opus 4.6)
sprint: Sprint 11b — Portfolio Mode
modules_touched: [public-profile, profile, endorsements]
---

## Summary

Overnight autonomous build of Sprint 11b — Portfolio Mode. Built dual-layout public profile with view mode toggle, card-based portfolio layout, mini bento gallery with lightbox, endorsement pinning (full stack), and scrim/accent rendering system. Two-phase review caught CRITICAL RLS gap and 4 other issues, all fixed. 14/14 test items passed.

---

## Session Log

**Session start** — Created branch `sprint-11b/portfolio-mode` from Sprint 11a commit (`30f89ca`). Sprint-start validation already completed in prior session — both build plans validated against codebase.

**Wave 0 (prerequisites)** — Added `profile_view_mode`, `scrim_preset`, `accent_color` to `getUserByHandle` select in `lib/queries/profile.ts`. Added `focal_x`, `focal_y` to photo queries. Updated `ProfilePhoto` type in `lib/queries/types.ts`.

**Wave 1 (core layout)** — Converted `PublicProfileContent` from server to client component (does no data fetching, all children already client). Added `useState` for view mode switching, accent CSS variable injection, scrim resolution. Created `ViewModeToggle` (two-segment pill), `PortfolioLayout` (card-based sections with SectionCard wrapper), `lib/scrim-presets.ts` (4 presets), `lib/accent-colors.ts` (5 palettes). Updated `HeroSection` with scrim preset rendering, toggle slot, focal point props. Created `/u/[handle]/education/page.tsx`.

**Wave 2 (skipped)** — Scrim + accent rendering already completed in Wave 1.

**Wave 3 (gallery + lightbox)** — Created `MiniBentoGallery` (3 layout variants with asymmetric grid, focal point rendering, lazy-loaded lightbox). Created `PhotoLightbox` (full-screen viewer with keyboard nav, touch swipe, scroll lock).

**Wave 4 (endorsement pinning)** — Created `/api/endorsements/[id]/pin/route.ts` (PATCH, auth, max 3 check). Updated `EndorsementCard` with pin UI (accent border, pin indicator, toggle button). Created `EndorsementsPageClient` with optimistic updates. Updated endorsements `page.tsx` for owner detection.

**Review (Phase 1)** — Sonnet caught: CRITICAL RLS gap (existing policy only checks `endorser_id`, recipients can't pin), HIGH pin count off-by-one, HIGH light scrim opacity compounding, MEDIUM accentColor prop dropped, MEDIUM expand heuristic mismatch.

**Fixes applied** — Created RLS migration `20260328000002_endorsement_recipient_pin_policy.sql`. Added `.neq('id', id)` to pin count. Wrapped opacity in `scrim.variant === 'dark'` conditional. Added `accentColor` to destructure. Changed expand condition to `>= 3`.

**Test-yl** — 14/14 passed via code-path analysis. No preview browser tools available overnight. Visual QA flagged for morning.

**Shipslog** — Updated CHANGELOG, STATUS, session log, module state/activity files.

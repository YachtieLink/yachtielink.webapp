---
date: 2026-03-28
agent: Claude Code (Opus 4.6)
sprint: Sprint 11a — Public Profile Rewrite (Profile mode + foundation)
modules_touched: [profile, cv, public-profile, middleware, validation]
---

## Summary

Overnight build session for Sprint 11a. Built the full public profile rewrite foundation: editorial single-column layout, schema migration (display settings + focal points), CV on-demand pattern, display settings UI, validation hardening. Passed two-phase code review + YachtieLink drift review + test-yl. Ready to commit.

---

## Session Log

**Session start** — Sprint-start validation run. Confirmed 11a build plan against codebase. Branch created: `sprint-11a/profile-rewrite-foundation`.

**Build phase** — 24 files modified:
- Schema migration: `accent_color`, `scrim_preset`, `profile_view_mode` on users table; `focal_x`, `focal_y` on `user_photos` with CHECK constraints
- `PublicProfileContent` refactored from 40/60 split to single-column editorial (max-width 680px)
- `ProfileAccordion` gains `icon` prop for section icons
- Section components gain `sectionColor` tokens
- `EndorsementsSection` gates "See all" on count > 3
- `CvActions` removes regenerate pattern, adds `hasGeneratedPdf` tracking
- `useProfileSettings` hook typed with union types for display settings
- Settings page gains View Mode, Hero Scrim, Accent Colour selectors
- `lib/validation/schemas.ts` gains `displaySettingsSchema` with Zod enum
- Middleware subdomain logic simplified

**Phase 1 review (Sonnet)** — Found: dead `true` short-circuit in CvActions, missing accent_color enum, weak typing in hook. All fixed.

**Phase 2 review (Opus)** — Found: rich_portfolio Pro gate bypass (hook writes directly), focal_x/y missing range CHECK. All fixed.

**YachtieLink drift review** — CG1: Generated PDF radio showed even without PDF (added `hasGeneratedPdf` prop + state tracking). CG2: weak typing in settings hook (changed to union types). Architecture checks clean.

**Test-yl** — 17 items verified via code-path analysis (preview browser unavailable). All passed. Visual QA recommended for morning.

**Sprint-start for 11b/11c** — Both validated. Key decisions: PublicProfileShell IS needed, use `sand` not `slate`, redirect pattern for subdomain sub-pages. Founder approved defaults before going to bed.

**Decisions made:**
- `rich_portfolio` coerced to `portfolio` on save in hook (Pro gate in API backs this up)
- Single-column editorial layout (680px max-width) chosen over maintaining 40/60 split
- CV "Regenerate" button removed — on-demand download generates fresh each time
- `hasGeneratedPdf` tracked client-side to gate radio between generated/uploaded CV

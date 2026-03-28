---
date: 2026-03-28
agent: Claude Code (Opus 4.6)
sprint: Sprint 11c — Rich Portfolio Mode (Pro)
modules_touched: [public-profile, profile, bento]
---

## Summary

Overnight autonomous build of Sprint 11c — Rich Portfolio Mode (Pro). Built bento grid engine with CSS Grid and grid-template-areas, 2 templates (Classic/Bold) with 3 density variants each, 12 tile components, layout assembly with density auto-detection, template selection settings, focal point picker, photo limit bump 9→15, and Pro gating. Phase 1 review caught CRITICAL Pro gate regression + HIGH orphaned grid areas — both fixed.

---

## Session Log

**Session start** — Created branch `sprint-11c/rich-portfolio` from Sprint 11b commit (`f116427`).

**Wave 1 (bento engine + templates + tiles)** — Created `lib/bento/types.ts` (BentoTemplate, BentoTemplateSlot, BentoTile, BentoDensity interfaces), `lib/bento/density.ts` (auto-detection: full/medium/minimal based on photo count, section data), `lib/bento/templates/classic.ts` and `bold.ts` (full grid-template-areas for desktop 4-col and mobile 2-col), `lib/bento/templates/index.ts` (getTemplate, getTemplateVariant). Created `BentoGrid.tsx` (CSS Grid with scoped `<style>` + useId for unique class, responsive media query). Created 12 tile components: PhotoTile, AboutTile, ExperienceTile, EndorsementsTile, CertsTile, ContactTile, CvTile, StatsTile, EducationTile, SkillsTile, MorePhotosTile.

**Wave 2 (layout assembly + Pro gating)** — Created `RichPortfolioLayout.tsx` (orchestrator: detect density → get template variant → build tiles → render BentoGrid). Updated `PublicProfileContent.tsx` with three-way layout branching and Pro fallback via `isProFromRecord()`. Added `profile_template` to getUserByHandle query and UserProfile interface. Created migration `20260328000003_sprint11c_profile_template.sql`.

**Wave 3 (template settings + photo management)** — Added `profile_template` to `displaySettingsSchema`, display-settings API (GET select + PATCH), and `useProfileSettings` hook. Added template picker UI to settings page (visible when rich_portfolio selected). Rich Portfolio radio enabled for Pro users. Bumped `MAX_PHOTOS_PRO` 9→15 in both photos page and API route. Added PATCH endpoint to `/api/user-photos/[id]` for focal_x/focal_y. Added `focal_x, focal_y` to photos GET response. Created `FocalPointPicker` with pointer-capture drag and hero crop preview. Integrated into photos page as modal with save.

**Wave 4 (mobile + polish)** — Mobile responsive already built into BentoGrid via media query. Drift-check caught inline Pro check in useProfileSettings — fixed to use `isProFromRecord()`.

**Review (Phase 1 Sonnet)** — CRITICAL: Pro gate removed from settings save (free users could persist rich_portfolio). HIGH: orphaned grid areas when tiles null (CSS holes). HIGH: stats tile always renders even with zero data. MEDIUM: `more` area check only on desktop string. LOW: pointercancel handler missing. LOW: magic number duplication.

**Fixes applied** — Restored Pro gate coercion in save. Added spacer divs in BentoGrid for unused grid areas. Added stats tile null guard. Added mobile check for `more` area. Added pointercancel handler.

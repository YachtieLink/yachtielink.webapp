# Sprint 10

**Phase:** 1A
**Status:** 🔨 In Progress
**Started:** ~2026-03-17

## Goal

Build out the Phase 1A profile robustness spec — photo-forward UI, multi-photo gallery, save/bookmark, collapsible sections, profile strength meter, AI summary, progressive enhancement post-CV-parse.

## Key Files

- [build_plan.md](./build_plan.md) — full implementation spec

## Scope

In: everything in the Phase 1A context doc.
Out: growth features, search/discovery, messaging, anything Phase 1B+.

## What's Been Built

> Update this as work ships. Helps incoming LLMs know what exists vs what's still TODO.

### Database & Backend
- ✅ Migration `20260317000021_profile_robustness.sql` — 7 new tables, 4 new columns, RLS, `get_sea_time()` helper
- ✅ 12 Zod schemas in `lib/validation/schemas.ts`
- ✅ Extended profile queries (`getExtendedProfileSections`, `getSavedStatus`, etc.)
- ✅ `lib/profile-summaries.ts` — summary line helpers
- ✅ 14 new API routes (photos, gallery, saved profiles, folders, hobbies, education, skills, social links, section visibility, AI summary)
- ✅ Error handling hardened: rollback pattern on hobbies/skills, fetch error handling on all client components
- ✅ Date validation on education schema, 404 on DELETE for non-existent records

### Components
- ✅ ProfileAccordion (collapsible, AnimatePresence)
- ✅ PhotoGallery (swipeable hero, 65vh, touch events, desktop arrows, dots)
- ✅ SocialLinksRow (platform icons, hover colours)
- ✅ ProfileStrength (donut SVG, 4 strength labels)
- ✅ SaveProfileButton (optimistic toggle + rollback)
- ✅ SectionManager (visibility toggles, optimistic)

### Pages
- ✅ `/app/profile` — full rewrite (photo gallery, accordion sections, strength meter)
- ✅ `/u/[handle]` — full rewrite (Bumble-style split layout, save button, section visibility)
- ✅ `/app/profile/photos` — upload/delete, 3-col grid
- ✅ `/app/profile/gallery` — upload/delete
- ✅ `/app/hobbies/edit` — pill input, emoji, max 10
- ✅ `/app/skills/edit` — pill input, category selector, max 20
- ✅ `/app/education/new` — form with dates
- ✅ `/app/social-links/edit` — one field per platform, 7 platforms

### Not Yet Built
- ⬜ `/app/education/[id]/edit` — edit existing education entries
- ⬜ Saved profiles page (`/app/network/saved`) + folder UI
- ⬜ Animation pass — all new components should use `lib/motion.ts` presets
- ⬜ Salty empty state illustrations
- ⬜ Dark mode QA on all new components
- ⬜ Mobile responsiveness check at 375px / 768px / 1280px

## Exit Criteria

- All Phase 1A features shipped and tested on mobile
- QA checklist signed off
- No regressions on existing profile flows

## Notes

—

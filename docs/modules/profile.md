---
module: profile
updated: 2026-04-01
status: shipped
phase: 1B
---

# Profile

One-line: Private profile hub with photo upload, identity card, strength meter, section grid, AI summary, contact settings, social links, section visibility controls, and saved profiles with folders.

## Current State

- Profile page: working — server-rendered dashboard at `/app/profile` showing hero card, photo strip, personal details card (age/nationality/smoking/tattoos/license/travel docs), strength meter, section grid with chip previews for skills/hobbies, and empty-state prompts
- Profile photo: working — upload with client-side crop (react-image-crop), 800px square output, JPEG/PNG/WebP, 5 MB max
- Multi-photo gallery: working — `user_photos` table, ordered strip with "Main" badge on first, up to 9 photos (reorder via API)
- Work gallery: working — `user_gallery` table with optional caption and yacht association, up to 30 items
- Display name / handle / full name: set during onboarding, editable later
- Handle: validated via regex (`^[a-z0-9][a-z0-9-]*[a-z0-9]$`), 3-30 chars, uniqueness checked via `handle_available` RPC
- Bio: free-text, editable at `/app/about/edit`
- Primary role + departments: set during onboarding, editable
- Contact info (phone, WhatsApp, contact_email, location): working at `/app/profile/settings` with per-field inline show/hide toggles. `contact_email` is separate from auth email — falls back to `email` if null.
- Profile settings page: rewritten with 4 sections — Identity (name/handle/role/departments), Contact (phone/whatsapp/contact_email/location with inline toggles), Personal (DOB/home country with toggles + `show_nationality_flag` SVG flag toggle), Layout (view mode selector). Scrim/accent/template settings removed from UI (backlog item for rebuild with live preview).
- Display settings: View Mode (profile/portfolio/rich_portfolio with Pro lock) on settings page. Hero Scrim presets and Accent Colour swatches removed from UI — values preserved in DB but no editing UI. `rich_portfolio` coerced to `portfolio` on save for non-Pro users.
- Section visibility: working — PATCH endpoint toggles individual sections (about, experience, endorsements, certifications, hobbies, education, skills, photos, gallery) via `section_visibility` JSONB column
- Social links: working — up to 7 links (Instagram, LinkedIn, TikTok, YouTube, X, Facebook, website) via PATCH API
- AI summary: working — generated via OpenAI `gpt-4o-mini` from bio + attachments + endorsements; editable after generation; `ai_summary_edited` flag prevents accidental overwrite; rate-limited to 10/hour
- Profile strength meter: working — computed from 9 signals (photo, role, bio, yacht, cert, endorsement, hobby, education, social link); shows score, label, and smart CTA pointing to the most impactful next action
- Saved profiles + folders: working — save/unsave other users' profiles, organize into custom folders with emoji
- Hobbies: working — bulk upsert up to 10 items with name + optional emoji
- Education: working — CRUD with institution, qualification, field of study, date range
- Extra skills: working — bulk upsert up to 20 items with name + optional category
- Onboarding guard: profile page redirects to `/onboarding` if `onboarding_complete` is false
- RLS: user queries use anon key scoped to own row; profile photo uploads go through `uploadProfilePhoto` helper
- Rate limiting: profile edit (30/min/user), AI summary (10/hr/user), file upload (20/hr/user)

## Key Files

| What | Where |
|------|-------|
| Profile page | `app/(protected)/app/profile/page.tsx` |
| Profile loading skeleton | `app/(protected)/app/profile/loading.tsx` |
| Profile photo upload + crop | `app/(protected)/app/profile/photo/page.tsx` |
| Multi-photo manager | `app/(protected)/app/profile/photos/page.tsx` |
| Work gallery manager | `app/(protected)/app/profile/gallery/page.tsx` |
| Profile settings (identity, contact, personal, layout) | `app/(protected)/app/profile/settings/page.tsx` |
| CV-only details card | `components/cv/CvDetailsCard.tsx` |
| Hero card component | `components/profile/ProfileHeroCard.tsx` |
| Strength meter | `components/profile/ProfileStrength.tsx` |
| Section grid | `components/profile/ProfileSectionGrid.tsx` |
| Social links row | `components/profile/SocialLinksRow.tsx` |
| Section manager (visibility) | `components/profile/SectionManager.tsx` |
| Save profile button | `components/profile/SaveProfileButton.tsx` |
| Profile queries | `lib/queries/profile.ts` |
| Shared profile types | `lib/queries/types.ts` |
| AI summary API | `app/api/profile/ai-summary/route.ts` |
| Section visibility API | `app/api/profile/section-visibility/route.ts` |
| Social links API | `app/api/profile/social-links/route.ts` |
| User photos API | `app/api/user-photos/route.ts` |
| User gallery API | `app/api/user-gallery/route.ts` |
| Hobbies API | `app/api/user-hobbies/route.ts` |
| Education API | `app/api/user-education/route.ts` |
| Skills API | `app/api/user-skills/route.ts` |
| Saved profiles API | `app/api/saved-profiles/route.ts` |
| Profile folders API | `app/api/profile-folders/route.ts` |
| Validation schemas | `lib/validation/schemas.ts` |
| Display settings API (zero callers — pending cleanup) | `app/api/profile/display-settings/route.ts` |
| Profile summaries | `lib/profile-summaries.ts` |

## Decisions

**2026-03-29** — D-038: Auth email and contact email are separate. `contact_email` column on users table for CV/profile display; auth `email` used only for login. All public-facing read paths use `contact_email ?? email` fallback. Scrim/accent/template settings removed from UI — existing DB values preserved, to be rebuilt with live preview in a future sprint. CV-only fields (smoking, tattoos, license, travel docs) live on the CV tab, not profile settings. — Ari + Claude Code

**2026-03-08** — D-036: Current build target is Phase 1A — profile, CV import, yacht entities, employment attachments, colleague graph, endorsements, public profile, PDF snapshot, paid presentation upgrades. Recruiter access and later features deferred. — Ari

**2025-11-20** — D-007: Identity is free infrastructure; presentation is paid and cosmetic only. Paid scope is cosmetic presentation only — templates, polish, watermark removal. — Ari

## Next Steps

- [ ] Crew availability toggle with 7-day expiry (D-027)
- [x] Separate contact email from auth email (`contact_email` column)
- [ ] Rebuild scrim/accent/template settings with live preview
- [ ] Profile analytics (basic: view count) — gated to Pro tier
- [ ] Cert expiry alerts (cron job exists at `app/api/cron/cert-expiry/`)
- [x] Bump MAX_PHOTOS_PRO 9 → 15 (Sprint 11c — shipped PR #107)

## Recent Activity

**2026-04-02** — Quick wins (PR #142): `show_nationality_flag` boolean column added to `users` (migration `20260401000005`, DEFAULT false). Toggle added to settings page Personal section with context-aware sublabel (hints when no home country set; "Replaces home country flag" when country is set). `show_nationality_flag` added to `getUserById` SELECT for read model parity.

**2026-04-01** — Lane 4 (PR #135): Country ISO resolution — new `lib/constants/country-normalize.ts` normalizer converts ISO alpha-2/alpha-3 + common abbreviations to canonical country name. Wired into CV parse save path and settings load path. CV prompt clarified. Added Gibraltar/Cayman/BVI to ALL_COUNTRIES. Fixed 5 retired ISO codes (Russia SU→RU, Serbia YU→RS, Benin DY→BJ, Burkina Faso HV→BF, Timor-Leste TP→TL).
**2026-03-29** — Settings IA: Rewrote profile settings page (4 sections). Added `contact_email` column + migration. Created `CvDetailsCard` for CV-only fields. Stripped account page to auth-only. Fixed PDF generator + CV preview to use `contact_email ?? email`. Deleted dead `useProfileSettings` hook. Fixed WheelACard milestone link. Fixed PDF Pro gate to use `isProFromRecord()`.
**2026-03-28** — Sprint 11c: Added `profile_template` to `getUserByHandle`. Template picker UI (Pro only). `FocalPointPicker` with pointer-capture drag. Focal point PATCH endpoint on `/api/user-photos/[id]`. `MAX_PHOTOS_PRO` bumped 9→15. `isProFromRecord()` extracted to `lib/stripe/pro.ts`. Pro gate restored in settings save for `rich_portfolio`.
**2026-03-28** — Sprint 11b: Added `focal_x`/`focal_y` to `ProfilePhoto` type. Added `profile_view_mode`, `scrim_preset`, `accent_color` to `getUserByHandle` select. These query changes feed the public profile dual-layout system.
**2026-03-28** — Sprint 11a: `PublicProfileContent` refactored to single-column 680px layout. `ProfileAccordion` gains `icon` prop. Section components gain `sectionColor` tokens. Display settings foundation with View Mode/Scrim/Accent selectors. Schema migration adds `accent_color`, `scrim_preset`, `profile_view_mode`, `focal_x`/`focal_y`. `CvActions` adds `hasGeneratedPdf` tracking.
**2026-03-27** — CV-Parse-Bugfix: Country flag in public profile hero via `countryToFlag()`. Visibility settings link on PersonalDetailsCard. ParseProgress `initial={false}` fix. CV view share/download buttons, overflow-x-hidden, cv_public guard. Cert/education inline editing in StepQualifications with stale-index decrement fix.
**2026-03-27** — Sprint 10.1: Typography pass — `font-serif` on ProfileAccordion titles and page h1s. Added `itemLinks` prop to ProfileSectionGrid for education edit links. Added `popIn` animation to nav notification badges. Added `cardHover` to SavedProfileCard.
**2026-03-26** — Wave 5 QA: Wired `isPro` to ProfileHeroCard via `getProStatus`. Fixed `isProFromRecord` extraction into `lib/stripe/pro.ts`. Fixed non-Pro copy toast UX. Created `/app/billing` placeholder. Corrected Pro benefits list.
**2026-03-26** — Phase 1 Wave 4: Added `PersonalDetailsCard` to profile page. Added chip preview in `ProfileSectionGrid` for skills/hobbies. Extracted `useProfileSettings` hook (445 → 185 LOC page + 115 LOC hook).
**2026-03-25** — Phase 1 Wave 2: Extended `lib/queries/profile.ts` with shared query helpers; added `lib/queries/types.ts` with 12 typed interfaces; updated `lib/profile-summaries.ts` with `resolveYachtId` helper for null/array FK yacht references.
**2026-03-24** — QA Rally: Fixed StrictMode double-fire in CvImportWizard (hasFiredRef guard). Added 429 rate limit banner. Documented 37 bugs from founder QA walkthrough.
**2026-03-23** — CV Parse Sprint: Profile settings — 8 new fields (DOB, home country, smoke pref, appearance, travel docs, license, show_dob, show_home_country). Languages edit page (CRUD, max 10). Profile page: flag emoji + sea time in hero, languages row, CV completeness prompt.
**2026-03-21** — Sprint 10.3: Profile page redesign — hero card, strength card, 2-col section grid, empty states with icons, teal-50 full-bleed background. Custom month/year DatePicker. Hobbies emoji auto-suggest. Photo drag-to-reorder with @dnd-kit. Section color system.
**2026-03-18** — Phase 1A Profile Robustness: DB migration with 7 new tables. 6 new core components (ProfileAccordion, PhotoGallery, SocialLinksRow, ProfileStrength, SaveProfileButton, SectionManager). 14 new API routes. 6 new edit pages. Full profile page rewrite. `lib/profile-summaries.ts` server-side helpers.
**2026-03-17** — Phase 1A Cleanup: OG images use `/api/og?handle=`. Founding member badge + available-for-work status on public profile. Framer-motion animations (stagger-in, BottomSheet spring, IdentityCard QR panel). Parallel query performance with React.cache() and Promise.all. Floating profile CTA tiered logic.
**2026-03-14** — Sprint 3: Built profile page with IdentityCard, WheelACard, AboutSection, YachtsSection, CertsSection, EndorsementsSection. Photo upload with react-image-crop. Storage buckets for profile-photos and cert-documents with full RLS.

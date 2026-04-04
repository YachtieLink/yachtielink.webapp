---
module: public-profile
updated: 2026-04-04
status: shipped
phase: 1B
---

# Public Profile

One-line: Server-rendered public profile page at `/u/{handle}` with SEO metadata, OG image generation, PDF CV export, viewer relationship context, section visibility, and subdomain routing.

## Current State

- Public profile page: working — server-rendered at `app/(public)/u/[handle]/page.tsx`; uses `getUserByHandle` (React.cache) + shared helpers (`getPublicProfileSections`, `getExtendedProfileSections`, `getViewerRelationship`)
- SEO metadata: working — dynamic `<title>`, `<meta description>`, OpenGraph tags, Twitter card tags
- OG image generation: working — edge API route at `/api/og?handle=...`
- Profile view tracking: working — fire-and-forget call to `record_profile_event` RPC
- Photo gallery hero: working — uses `getExtendedProfileSections().photos` (eliminated redundant separate query). Uses `object-cover object-top` for sensible default framing (faces at top of frame).
- Hero name overlay: uses explicit `textShadow` (60%/40% opacity black) for readability against light photos, plus gradient overlay
- Hero stats: age (server-computed, respects dob REVOKE from anon — only shown to logged-in viewers) + sea time
- Section visibility: working — respects `section_visibility` JSONB; hidden sections not rendered
- Data fetched in parallel via shared helpers: `getPublicProfileSections()` (att/cert/end — includes raw `yacht_id` for sea time calculation), `getExtendedProfileSections()` (hobbies/edu/skills/photos/gallery), auth, sea time RPC
- Viewer relationship: extracted to `getViewerRelationship()` in `lib/queries/profile.ts`:
  - Shared yachts, mutual colleagues, saved status — all computed via shared helper
- Contact info visibility: PII stripped server-side (`phone`, `whatsapp`, `email`, `dob`)
- Availability badge: `available_for_work` now included in `getUserByHandle` (was previously missing)
- Dual-layout system: `PublicProfileContent` (now client component) branches between Profile mode (editorial layout) and Portfolio mode (card-based `PortfolioLayout`). View mode toggle rendered in hero identity block. Default mode stored in `profile_view_mode` column.
- Scrim preset system: 4 presets (dark/light/teal/warm) from `lib/scrim-presets.ts` control hero gradients, text colors, text shadows, badge backgrounds. Applied in `HeroSection`.
- Accent color system: 5 palettes (teal/coral/navy/amber/sand) from `lib/accent-colors.ts`. CSS custom properties (`--accent-500`, `--accent-600`, `--accent-100`) injected on wrapper div.
- Photo focal points: `focal_x`/`focal_y` from `user_photos` applied via `objectPosition` in hero. Per-context focal points (`hero_focal_x/y`, `avatar_focal_x/y`, `cv_focal_x/y`) and zoom (`hero_zoom`, `avatar_zoom`, `cv_zoom`) stored in DB and exposed via PATCH `/api/user-photos/[id]` (Pro-gated).
- Hero zoom: `HeroSection` accepts `heroZoom` prop (default 1), applies `transform: scale(heroZoom)` to the hero image. `PublicProfileContent` resolves `heroPhoto?.hero_zoom ?? 1` and passes it. Avatar and CV zoom/focal not yet consumed by their display components.
- `getExtendedProfileSections` selects all 17 user_photos fields: id, photo_url, sort_order, focal_x/y, is_avatar/hero/cv, avatar/hero/cv focal_x/y, avatar/hero/cv zoom.
- Mini bento gallery: `MiniBentoGallery` — 3 layout variants (1/2/3+ photos) with asymmetric grid and lazy-loaded `PhotoLightbox` (full-screen viewer with keyboard/touch navigation).
- Endorsement pinning: recipients can pin up to 3 endorsements. Pin API at `/api/endorsements/[id]/pin`, RLS policy for recipient updates, `EndorsementsPageClient` with optimistic updates and rollback.
- Public profile components: `PublicProfileContent` (dual-layout, ~500 LOC), `HeroSection`, `ViewModeToggle`, `PortfolioLayout`, `MiniBentoGallery`, `PhotoLightbox`, section components (`ExperienceSection`, `EndorsementsSection`, `CertificationsSection`, `SkillsSection`, `GallerySection`), `EndorsementCard` (with pin support), `ShareButton`, `ShowMoreButton`
- CV visibility: `cv_public` null treated as public (matching CvActions default) — consistent across profile card, CV page, and download route
- PDF export: working — POST to `/api/cv/generate-pdf` renders PDF via `@react-pdf/renderer` with profile data, attachments, certifications, endorsements (top 3), and QR code; uploads to `pdf-exports` storage bucket; returns signed URL (1-hour TTL); standard template free, premium templates gated to Pro
- PDF download: working — GET at `/api/cv/download-pdf` (retrieves latest generated PDF)
- PDF document component: `components/pdf/ProfilePdfDocument.tsx`
- Watermark: controlled by `show_watermark` column (Pro can remove)
- Template system: 3 templates (`standard`, `classic-navy`, `modern-minimal`); non-standard requires Pro subscription
- Subdomain routing: working — `handle.yachtie.link` rewrites to `/u/handle` via proxy middleware; routing works for all users, but displaying the subdomain URL is gated on Pro status
- Invite-only page: working — `/invite-only` shown when `SIGNUP_MODE=invite` and no invite param
- RLS: public profile reads use anon key; endorsement/attachment reads filtered by `deleted_at IS NULL`
- Rate limiting: PDF generation (10/hr/user), profile view (100/min/IP)

## Key Files

| What | Where |
|------|-------|
| Public profile page | `app/(public)/u/[handle]/page.tsx` |
| Public profile content | `components/public/PublicProfileContent.tsx` |
| Section components | `components/public/sections/{Experience,Endorsements,Certifications,Skills,Gallery}Section.tsx` |
| Hero section | `components/public/HeroSection.tsx` |
| Endorsement card | `components/public/EndorsementCard.tsx` |
| View mode toggle | `components/public/ViewModeToggle.tsx` |
| Portfolio layout | `components/public/layouts/PortfolioLayout.tsx` |
| Mini bento gallery | `components/public/MiniBentoGallery.tsx` |
| Photo lightbox | `components/public/PhotoLightbox.tsx` |
| Scrim presets | `lib/scrim-presets.ts` |
| Accent colors | `lib/accent-colors.ts` |
| Endorsement pin API | `app/api/endorsements/[id]/pin/route.ts` |
| Endorsements client page | `app/(public)/u/[handle]/endorsements/EndorsementsPageClient.tsx` |
| Education sub-page | `app/(public)/u/[handle]/education/page.tsx` |
| Endorsement pin RLS | `supabase/migrations/20260328000002_endorsement_recipient_pin_policy.sql` |
| Share button | `components/public/ShareButton.tsx` |
| QR code | `components/public/PublicQRCode.tsx` |
| Shared types | `lib/queries/types.ts` |
| Public CV page | `app/(public)/u/[handle]/cv/page.tsx` |
| CV download API | `app/api/cv/public-download/[handle]/route.ts` |
| OG image API | `app/api/og/route.tsx` |
| PDF generation API | `app/api/cv/generate-pdf/route.ts` |
| PDF download API | `app/api/cv/download-pdf/route.ts` |
| PDF document component | `components/pdf/ProfilePdfDocument.tsx` |
| Profile queries | `lib/queries/profile.ts` |
| Proxy / subdomain routing | `proxy.ts` |
| Validation schemas | `lib/validation/schemas.ts` |

## Decisions

**2026-03-08** — D-036: Public profile is part of Phase 1A build target. Included in current launch slice alongside profile, CV import, yacht graph, and PDF snapshot. — Ari

**2026-01-31** — D-025: Profile visibility varies by access method. Direct link/QR shows full profile including contact details. Search results show locked profiles requiring payment. Graph browsing shows full profiles (intentionally slow, doesn't scale for harvesting). — Ari

**2026-01-28** — D-014: PDF snapshot/export is free identity infrastructure. Never monetised. Paid scope limited to templates, layout polish, and watermark removal. — Ari

**2025-11-20** — D-007: Identity is free infrastructure; presentation is paid and cosmetic only. Free identity removes barriers to graph formation. — Ari

## Recent Activity

**2026-04-04** — feat/per-context-focal-zoom: `HeroSection.tsx` gains `heroZoom?: number` prop — `transform: scale(heroZoom)` applied to `<Image>`. `PublicProfileContent.tsx` reads `heroPhoto?.hero_zoom ?? 1` and passes `heroZoom` to `<HeroSection>`. `lib/queries/profile.ts` `getExtendedProfileSections` now selects all 17 `user_photos` fields (was missing zoom + per-context focal columns).

**2026-04-03** — Rally 009 QA: Added `landExperience` prop through `PortfolioLayout` → `RichPortfolioLayout` → `ExperienceTile` → `PublicProfileContent`. "See all N positions" count now includes land experience entries. Land entries render with Briefcase icon in ExperienceTile.

**2026-04-02** — Worktree lanes 2+3 (pending push): Yacht type prefix (M/Y, S/Y) applied via `prefixedYachtName` helper across `ExperienceSection.tsx`, `ExperienceTile.tsx`. Interests chip responsive bug fixed in `HobbiesTile.tsx` (`content-start` prevents chip rows from stretching at wide viewports). Ghost endorser path in `EndorsementCard.tsx` still uses old layout format — follow-up needed.
**2026-04-02** — Quick wins (PR #142): `CountryFlag` component added — on-demand SVG from flagcdn.com, `onError` hides on CDN failure. Nationality flag rendered in `HeroSection` next to user name when `show_nationality_flag = true` and `home_country` is set. SVG flag takes precedence over emoji flag when both toggles enabled. `show_nationality_flag` added to `getUserByHandle` SELECT.

**2026-04-02** — Ghost Profiles verify (PR #143): Ghost endorser display wired into `PortfolioLayout` and `RichPortfolioLayout` SectionModal — both were silently showing "Anonymous" for ghost endorsements. Ghost endorser name/avatar/claim link now shown in all public profile views.

**2026-03-28** — Sprint 11c: Rich Portfolio mode (Pro) — `RichPortfolioLayout` orchestrator with density auto-detection and template variant selection. `BentoGrid` CSS Grid engine with `grid-template-areas`. 2 templates (Classic/Bold) each with full/medium/minimal density variants. 12 tile components. `PublicProfileContent` three-way layout branching with Pro fallback. Template selection in settings (Pro only). Migration adds `profile_template` column. Photo limit bumped 9→15 Pro. `FocalPointPicker` with pointer-capture drag + hero crop preview. PATCH endpoint for focal_x/focal_y on user_photos.

**2026-03-28** — Sprint 11b: Portfolio mode — `PublicProfileContent` converted to client component with dual-layout branching (profile/portfolio). Created `ViewModeToggle`, `PortfolioLayout`, `MiniBentoGallery` (asymmetric grid), `PhotoLightbox` (full-screen viewer). `HeroSection` updated with scrim preset system (4 presets), accent color CSS variables (5 palettes). Endorsement pinning: API route, RLS migration, `EndorsementCard` pin UI, `EndorsementsPageClient` with optimistic updates. Education sub-page at `/u/[handle]/education`.

**2026-03-26** — QA session: Fixed profile photo framing (`object-top` in PhotoGallery.tsx), experience summary bug (missing `yacht_id` in profile.ts select), name text-shadow strengthened for light photos (HeroSection + PublicProfileContent).

**2026-03-25** — Phase 1 Wave 2: Major refactor — extracted shared query helpers (getPublicProfileSections, getCvSections, getViewerRelationship), split PublicProfileContent into 5 section components, replaced all any[] with typed interfaces, added hero age+sea time, fixed CV 404 (cv_public null semantics), fixed available_for_work missing from getUserByHandle.

**2026-03-24** — QA Rally: Documented 8 bugs on public profile — missing age/sea time/flag in hero, CV view 404/blank/horizontal scroll, yacht names not clickable, no ensign flags. Bugfix sprint Wave 2 covers all.

**2026-03-23** — CV Parse Sprint: Public CV viewer at /u/[handle]/cv (generated HTML via CvPreview or uploaded PDF iframe, gated by cv_public). PublicProfileContent "View CV" + download icon split replacing single download link. getUserByHandle extended with new personal fields. show_home_country + show_dob privacy respected in CvPreview viewer mode.

**2026-03-21** — Sprint 10.3: Public profile hero identity — larger name (text-4xl), unified "Role · Dept" line; top bar with icon-only circular buttons (back/edit/share) replacing labelled pills.

**2026-03-21** — Sprint 10.1: `PublicProfileContent` "N more" text made functional expand buttons.

**2026-03-18** — Post-Phase1A fixes: Fixed mutual endorser count bug — `PublicProfileContent.tsx` was returning all endorsements when any shared yacht existed; now correctly counts only endorsers in the mutual colleague set.

**2026-03-18** — Phase 1A Profile Robustness: Public profile `/u/[handle]` full rewrite — Bumble-style split layout (photo left 40% sticky on desktop, content right), accordion sections with smart summaries, save button for logged-in viewers, sectionVisibility respected, social links row, extended data sections (hobbies, education, skills, gallery).

**2026-03-17** — Pre-merge audit: Fixed `app/api/cv/generate-pdf/route.ts` — `isPro: false` → `isPro: profile?.subscription_status === 'pro'`; was hardcoded false since Sprint 8, all users got free PDF tier regardless of plan.

**2026-03-17** — Phase 1A Cleanup Spec 08: Created `app/api/og/route.tsx` — dynamic OG image generation (edge runtime, teal gradient, photo + name + role); public profile signup CTA section for non-logged-in viewers; branding footer linking to /welcome.

**2026-03-17** — Phase 1A Cleanup Spec 10: Public profile — added founding member badge (amber), available-for-work status (green pulse), sea time stats.

**2026-03-15** — Sprint 6: Public profile page full rewrite — server-rendered, parallel data fetch, all sections (hero, about, contact with visibility, employment history, certs with expiry status, endorsements, QR code); `generateMetadata` with OG + Twitter card tags.

**2026-03-15** — Sprint 7: CV tab rewrite — profile preview + actions via `CvActions.tsx` (share link, PDF generate/download/regenerate, CV upload link, QR code toggle/download, template selector with Pro lock).

**2026-03-15** — Sprint 7: Custom subdomain routing — middleware detects `*.yachtie.link` (excluding apex + www), rewrites to `/u/{subdomain}`; only the UI badge is gated to Pro.

## Next Steps

- [x] Sprint 11c: Rich Portfolio mode — bento grid engine, templates, tiles, Pro gating (built, pending merge)
- [ ] Custom domain support for Pro users (display `handle.yachtie.link` prominently)
- [ ] PDF template polish (additional templates, layout improvements)
- [ ] Profile analytics dashboard (view count, referrer breakdown) — Pro feature
- [ ] Endorsement count / colleague count display on public profile (without auto-summary language per D-013)
- [ ] Terms and Privacy pages content (pages exist at `/terms` and `/privacy` but may need content updates)

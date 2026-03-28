---
module: public-profile
updated: 2026-03-28
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
- Photo focal points: `focal_x`/`focal_y` from `user_photos` applied via `objectPosition` in hero and gallery components.
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

## Decisions That Bind This Module

- **D-007** — Identity is free infrastructure; presentation is paid and cosmetic only
- **D-014** — PDF snapshot is free; never monetised; paid scope limited to templates, layout polish, and watermark removal
- **D-025** — Contextual profile visibility: direct link/QR shows full profile including contact details
- **D-036** — Phase 1A includes public profile and PDF snapshot

## Next Steps

- [ ] Sprint 11c: Rich Portfolio mode — bento grid engine, templates, tiles, Pro gating
- [ ] Custom domain support for Pro users (display `handle.yachtie.link` prominently)
- [ ] PDF template polish (additional templates, layout improvements)
- [ ] Profile analytics dashboard (view count, referrer breakdown) — Pro feature
- [ ] Endorsement count / colleague count display on public profile (without auto-summary language per D-013)
- [ ] Terms and Privacy pages content (pages exist at `/terms` and `/privacy` but may need content updates)

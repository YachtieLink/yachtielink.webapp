---
module: public-profile
updated: 2026-03-21
status: shipped
phase: 1A
---

# Public Profile

One-line: Server-rendered public profile page at `/u/{handle}` with SEO metadata, OG image generation, PDF CV export, viewer relationship context, section visibility, and subdomain routing.

## Current State

- Public profile page: working — server-rendered at `app/(public)/u/[handle]/page.tsx`; uses `getUserByHandle` (React.cache for shared fetch between `generateMetadata` and page)
- SEO metadata: working — dynamic `<title>`, `<meta description>`, OpenGraph tags (title, description, image, type=profile, URL), Twitter card tags
- OG image generation: working — edge API route at `/api/og?handle=...` using `next/og` `ImageResponse`; fetches user data directly from Supabase REST API (no cached query in edge runtime); renders gradient background with profile photo, name, role, and handle
- Profile view tracking: working — fire-and-forget call to `record_profile_event` RPC on page load
- Photo gallery hero: working — fetches `user_photos` ordered by sort_order and passes to `PublicProfileContent`
- Section visibility: working — respects `section_visibility` JSONB from user record; hidden sections are not rendered
- Data fetched in parallel: attachments, certifications, endorsements, extended sections (hobbies, education, skills, gallery), and current viewer auth — all via `Promise.all`
- Viewer relationship context: working — when viewer is authenticated and not viewing own profile:
  - Shared yachts: computed from overlapping attachment yacht_ids
  - Mutual colleagues: computed via 3-step query (profile's coworkers -> filter by viewer's yachts -> fetch user details)
  - Saved status: checks `saved_profiles` for viewer+profile pair
- Own profile indicator: working — `isOwnProfile` flag passed to component
- Contact info visibility: respects per-field `show_phone`, `show_whatsapp`, `show_email`, `show_location` toggles
- Founding member badge: passed as `isFoundingMember` prop
- Public profile components: `PublicProfileContent` (main layout), `HeroSection`, `EndorsementCard`, `ShareButton`, `PublicQRCode`, `ShowMoreButton`
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
| Hero section | `components/public/HeroSection.tsx` |
| Endorsement card | `components/public/EndorsementCard.tsx` |
| Share button | `components/public/ShareButton.tsx` |
| QR code | `components/public/PublicQRCode.tsx` |
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

- [ ] Custom domain support for Pro users (display `handle.yachtie.link` prominently)
- [ ] PDF template polish (additional templates, layout improvements)
- [ ] Profile analytics dashboard (view count, referrer breakdown) — Pro feature
- [ ] Endorsement count / colleague count display on public profile (without auto-summary language per D-013)
- [ ] Terms and Privacy pages content (pages exist at `/terms` and `/privacy` but may need content updates)

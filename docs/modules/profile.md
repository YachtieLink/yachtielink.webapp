---
module: profile
updated: 2026-03-25
status: shipped
phase: 1A
---

# Profile

One-line: Private profile hub with photo upload, identity card, strength meter, section grid, AI summary, contact settings, social links, section visibility controls, and saved profiles with folders.

## Current State

- Profile page: working — server-rendered dashboard at `/app/profile` showing hero card, photo strip, strength meter, section grid, and empty-state prompts
- Profile photo: working — upload with client-side crop (react-image-crop), 800px square output, JPEG/PNG/WebP, 5 MB max
- Multi-photo gallery: working — `user_photos` table, ordered strip with "Main" badge on first, up to 9 photos (reorder via API)
- Work gallery: working — `user_gallery` table with optional caption and yacht association, up to 30 items
- Display name / handle / full name: set during onboarding, editable later
- Handle: validated via regex (`^[a-z0-9][a-z0-9-]*[a-z0-9]$`), 3-30 chars, uniqueness checked via `handle_available` RPC
- Bio: free-text, editable at `/app/about/edit`
- Primary role + departments: set during onboarding, editable
- Contact info (phone, WhatsApp, email, location): working at `/app/profile/settings` with per-field show/hide toggles
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
| Contact settings | `app/(protected)/app/profile/settings/page.tsx` |
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
| Profile summaries | `lib/profile-summaries.ts` |

## Decisions That Bind This Module

- **D-007** — Identity is free infrastructure; presentation is paid and cosmetic only
- **D-013** — No auto-summary language: UI must never auto-summarise endorsement density
- **D-025** — Contextual profile visibility: direct link shows full profile including contact details
- **D-027** — Crew availability toggle with expiry (planned, not yet implemented)
- **D-036** — Phase 1A build target includes profile

## Next Steps

- [ ] Crew availability toggle with 7-day expiry (D-027)
- [ ] Allow changing account email from settings
- [ ] Profile analytics (basic: view count) — gated to Pro tier
- [ ] Cert expiry alerts (cron job exists at `app/api/cron/cert-expiry/`)

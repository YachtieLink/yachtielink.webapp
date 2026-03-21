# Sprint 11 — Crew Landing Pages + Public Polish

> **DRAFT** — This sprint plan is a draft outline. Scope, deliverables, and build plan are subject to change before work begins.

**Phase:** 1B
**Status:** 📋 Draft
**Started:** —
**Completed:** —

## Goal

Make crew profiles beautiful enough that people want to share them. This is the "wow factor" sprint — section colours, Salty mascot, scroll animations, dynamic OG images, and polished QR sharing.

## Scope

In:
- Public profile visual upgrade (section colours, scroll reveals, typography polish)
- Salty mascot Phase 1 (empty states + onboarding hints only)
- Dynamic OG image generation for `/u/[handle]`
- QR code card with branding
- Profile templates (2-3 visual variants for Pro users)
- Section colour system (coral → endorsements, navy → experience, amber → certs)

Out:
- Yacht graph (Sprint 12)
- Marketing landing page (Sprint 13)
- Salty Phase 2 (contextual hints, AI integration — post-launch)
- Admin dashboard
- New data models or API routes (unless OG images need one)

## Dependencies

- Sprint 10.1 complete (Phase 1A closed, branch on `main`)
- Salty mascot spec at `docs/design-system/reference/salty_mascot_spec.md`
- Section colours defined in `globals.css` (teal, coral, navy, amber already tokenised)
- Framer Motion presets in `lib/motion.ts`

## Key Deliverables

### Salty Mascot — Phase 1
- ⬜ `components/salty/Salty.tsx` — base illustration component (SVG, 5 sizes, 8 moods)
- ⬜ `components/salty/SaltyEmptyState.tsx` — empty state wrapper (illustration + message + optional CTA)
- ⬜ Replace all existing empty states with Salty variants:
  - Photos: "Looking a bit bare up here" → add photos CTA
  - Education: "Every course counts" → add education CTA
  - Endorsements: "Your shipmates haven't chimed in yet" → request endorsement CTA
  - Hobbies: "All work and no play?" → add hobbies CTA
  - Skills: "What are you good at?" → add skills CTA
  - Gallery: "Show off your work" → add gallery CTA
  - Saved profiles: "Start building your network" → browse CTA
- ⬜ Onboarding wizard Salty hints (welcome step, first yacht step, endorsement step)

### Section Colours
- ⬜ Apply section-specific accent colours to public profile:
  - Endorsements section → coral (#E8634A) accent (border, icon tint, badge)
  - Experience/yachts section → navy (#2B4C7E) accent
  - Certifications section → amber (#E5A832) accent
  - Education → teal (primary, default)
  - Skills/hobbies → neutral with subtle tint
- ⬜ Update `ProfileAccordion` to accept `accentColor` prop
- ⬜ Apply to both own-profile and public profile views

### Public Profile Polish
- ⬜ Scroll-reveal animations on public profile sections (using `scrollReveal` from `lib/motion.ts`)
- ⬜ Staggered card entrance on endorsement cards
- ⬜ Typography polish — DM Serif Display on profile name (public view hero), DM Sans body
- ⬜ Card hover effects on interactive elements (endorsement cards, yacht cards)
- ⬜ Bento-style layout experiment on profile sections (mixed card widths where appropriate)

### OG Image Generation
- ⬜ Dynamic OG image at `/api/og/profile/[handle]` using `@vercel/og` (Satori)
- ⬜ Template: profile photo + full name + role + "View my profile on YachtieLink"
- ⬜ 1200x630px, branded with YachtieLink colours
- ⬜ Add `<meta property="og:image">` to `/u/[handle]` page
- ⬜ Twitter card meta tags

### QR Code Polish
- ⬜ Branded QR card component (logo in centre, teal border, name underneath)
- ⬜ Download as PNG option
- ⬜ Print-friendly layout (business card size)

### Profile Templates (Pro Feature)
- ⬜ 2-3 public profile visual variants:
  - Classic (current layout, refined)
  - Bold (larger photos, more colour)
  - Minimal (text-focused, clean)
- ⬜ Template picker in profile settings (Pro-gated with UpgradeCTA for free)
- ⬜ `template_id` already exists on users table

## Exit Criteria

- Public profiles use section colours consistently
- Salty appears in all empty states with appropriate mood + message
- OG image generates correctly for any profile handle
- QR code card looks professional enough to hand out at a marina
- At least 2 profile templates selectable by Pro users
- All new elements work in dark mode
- Mobile-first: no regressions at 375px

## Estimated Effort

5–7 days

## Notes

> **Supersedes the old Sprint 11 (Feature Roadmap).** The feature roadmap is deprioritised in favour of crew-facing polish. Roadmap moves to Sprint 13 as a lighter deliverable.

The Salty mascot spec is comprehensive (327 lines). Phase 1 implements only empty states and onboarding hints — no contextual tips, no AI integration, no animation yet. Keep it simple: static SVG illustrations with mood variants.

OG images are critical for growth — when crew share their `/u/handle` link on WhatsApp or Instagram, the preview card is the first impression. This is worth getting right.

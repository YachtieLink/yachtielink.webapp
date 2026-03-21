# Sprint 11 — CV Onboarding + Public Profile Polish

**Phase:** 1B
**Status:** 📋 Ready for execution
**Estimated effort:** 5–7 days (core) · 7–9 days (with stretch)
**Started:** —
**Completed:** —

## Goal

One file drop, one loading screen, you're in. New users upload their CV, the AI populates their entire profile (name, handle, role, yachts, certs, bio), and they land on a populated profile page in under 10 seconds of waiting. No forms, no multi-step wizard. The profile page is where they review and edit.

## The Flow

```
                    ┌─ CV UPLOAD ─→ "Setting up your profile…" ─→ /app/profile (populated)
ONBOARDING START ──→│
                    └─ SKIP ─→ NAME ─→ HANDLE ─→ /app/profile (empty)
```

**CV path:** One interaction (drop file) → loading screen (~5-8s) → populated profile.
**Manual path:** Two inputs (name + handle) → empty profile. User fills in details later.

## Scope

**In:**
- Onboarding rebuild: 6 steps → fork (CV path: 1 step, manual: 2 steps)
- CV upload → parse → auto-generate handle → save everything → redirect to profile
- Manual fallback: name → handle → empty profile
- Shared save utility (`lib/cv/save-parsed-cv-data.ts`)
- Refactor `CvReviewClient` to use shared save
- Remove role/yacht/endorsement steps from onboarding
- Section colour accents on public profile
- Public profile motion polish
- OG image enhancement
- QR code branding + PNG download (free-tier)

**Stretch:** Profile templates (2 variants, Pro-gated)

**Out:** Salty (Phase 2/3), yacht graph (Sprint 12), marketing page (Sprint 13), in-app endorsement prompts (future), CV vision parsing, native contact access, own-profile section colours

## Key Deliverables

### Onboarding Rebuild (centrepiece)
- ⬜ STEPS: `["cv-upload", "name", "handle", "done"]` — CV path skips name+handle
- ⬜ `StepCvUpload` — drag-drop, loading screen, parallel: upload + parse + auto-handle + save
- ⬜ Handle auto-generation via `suggest_handles` + `handle_available` RPCs
- ⬜ `lib/cv/save-parsed-cv-data.ts` — shared save (profile, yachts, certs)
- ⬜ Refactor `CvReviewClient` to use shared save
- ⬜ Remove role/yacht/endorsement steps from wizard
- ⬜ Error handling: parse fail / rate limit → fallback to manual path
- ⬜ Standalone `/app/cv/upload` + `/app/cv/review` unchanged

### Section Colours
- ⬜ `accentColor` on ProfileAccordion, threaded through 6 of 8 public profile sections
- ⬜ EmptyState accentColor rendering
- ⬜ Dark mode 700-level overrides

### Polish
- ⬜ Staggered endorsement cards + hover effects
- ⬜ OG image: DM Serif Display, photo layout, branding
- ⬜ QR code: branded card, PNG download

## Exit Criteria

### Required
- CV path: drop file → loading → populated profile (~5-8s)
- Manual path: skip → name → handle → empty profile
- All CV data saved: name, handle, role, yachts, certs, bio, location
- Errors gracefully fall back to manual path
- Standalone CV flow still works
- Section colours on public profile
- OG image + QR code polished
- Mobile-first, `npm run build` zero errors

### Stretch
- Profile templates (2 variants, Pro-gated)

## Notes

> **The profile page is the review.** No confirmation screen, no inline editing during onboarding. Land on the profile, see everything populated, edit anything that's wrong.

> **Handle auto-generation makes this possible.** `suggest_handles` RPC already exists. Called with the CV-extracted name instead of requiring user input.

> **Endorsements move to contextual prompts.** Cold ask during signup → warm ask after adding a yacht. Future sprint.

> See `build_plan.md` for detailed implementation spec.

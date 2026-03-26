---
module: onboarding
updated: 2026-03-25
status: shipped
phase: 1A
---

# Onboarding

One-line: Five-step wizard (name, handle, role, yacht, endorsement invites) that transforms a new signup into a profile-complete user with their first yacht attachment and endorsement requests sent.

## Current State

- Wizard: working — client component at `components/onboarding/Wizard.tsx` with 6 steps (5 visible + "done" screen)
- Step 1 (Name): working — full name (required) + optional display name (defaults to first name)
- Step 2 (Handle): working — live availability check via `handle_available` RPC with 450ms debounce; auto-normalises input (lowercase, spaces to hyphens); shows format validation errors; suggests alternatives via `suggest_handles` RPC when taken
- Step 3 (Role): working — loads departments and roles from DB; department chip selector (single select) filters role list; role search across all departments; custom role fallback when no matches (logged to `other_role_entries` table)
- Step 4 (Yacht): working — search existing yachts or create new; search uses `ilike` with 300ms debounce; create form has name, type (Motor/Sailing), size category (4 options), optional length; auto-creates attachment with current date and selected role; skippable
- Step 5 (Endorsements): working — email-based invite flow; up to 5 email fields; sends to `/api/endorsement-requests`; skippable; auto-skips if no yacht was added in Step 4
- Done screen: working — shows welcome message, public link, and auto-redirects to `/app/profile` after 2.2 seconds
- Progress bar: working — shows step N of 5 (excludes done screen); segmented bar with current/completed/pending states
- Resume from last completed step: working — `getStartingStep()` inspects existing profile data and jumps ahead
- Each step persists to DB immediately: working — `saveToDb()` calls `supabase.from('users').update()` after each step
- `onboarding_complete` flag: set to `true` in `handleDone()`; onboarding layout checks this and redirects to `/app/profile` if already complete
- CV import wizard: 5-step review flow (personal, experience, qualifications, extras, review) with phone formatting via `libphonenumber-js/min`, bio editing, date display via `formatDateDisplay()`, inline add-language, editable review cards with edit-from-review navigation. Single `buildImportData()` factory for save data construction. Available at `/app/cv/upload` and `/app/cv/review`; uses OpenAI `gpt-4o-mini` for extraction from PDF/DOCX; 3 parses/day limit
- Onboarding `Wizard.tsx` routes through canonical `saveConfirmedImport()` via `parsedToConfirmedImport()` — does not duplicate save logic
- CV extraction prompt: defined in `lib/cv/prompt.ts`
- Mini-onboard in deep link flow: working — when a user arrives via endorsement request deep link with incomplete profile, `DeepLinkFlow` component collects name + role + yacht details inline before showing the endorsement form (does not go through main wizard)
- RLS: onboarding writes scoped to own user row via anon key
- Rate limiting: CV parse uses file upload limit (20/hr/user) plus DB-level `check_cv_parse_limit` RPC (3/day)

## Key Files

| What | Where |
|------|-------|
| Onboarding page | `app/(protected)/onboarding/page.tsx` |
| Onboarding layout (redirect guard) | `app/(protected)/onboarding/layout.tsx` |
| Wizard component | `components/onboarding/Wizard.tsx` |
| CV upload page | `app/(protected)/app/cv/upload/page.tsx` |
| CV review page | `app/(protected)/app/cv/review/page.tsx` |
| CV parse API | `app/api/cv/parse/route.ts` |
| CV extraction prompt | `lib/cv/prompt.ts` |
| Deep link mini-onboard | `components/endorsement/DeepLinkFlow.tsx` |
| Validation schemas | `lib/validation/schemas.ts` |

## Decisions That Bind This Module

- **D-021** — CV import for onboarding: upload PDF/DOCX to auto-populate via LLM extraction; not verification; cost target <0.05 EUR/parse; fallback to manual entry
- **D-036** — Phase 1A includes profile, CV import, yacht entities, employment attachments

## Next Steps

- [ ] Integrate CV import as an optional pre-step in the onboarding wizard (currently separate flow)
- [ ] Profile photo upload step in onboarding (currently only available post-onboarding)
- [ ] Bio writing step or prompt in onboarding
- [ ] Analytics: track onboarding completion rate and drop-off per step

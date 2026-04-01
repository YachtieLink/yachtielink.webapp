---
module: onboarding
updated: 2026-04-01
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

## Decisions

**2026-03-08** — D-036: CV import included in Phase 1A build target. Part of the core launch slice. — Ari

**2026-01-31** — D-021: Users can upload existing CV (PDF/DOCX) to auto-populate profile fields via LLM extraction. Part of free identity layer. Extracted data is still self-reported, not verification. Implementation: Claude API, cost target <€0.05/parse. — Ari

## Next Steps

- [ ] Integrate CV import as an optional pre-step in the onboarding wizard (currently separate flow)
- [ ] Profile photo upload step in onboarding (currently only available post-onboarding)
- [ ] Bio writing step or prompt in onboarding
- [ ] Analytics: track onboarding completion rate and drop-off per step

## Recent Activity

**2026-04-01** — Lane 1 (PR #136): Auth trigger fix — `handle_new_user()` no longer sets `full_name` from email prefix; new signups get NULL full_name so name step starts clean. Migration `20260401000004_fix_auth_trigger_name.sql`. OAuth/Google signups (metadata `full_name`/`name`) unaffected.
**2026-03-25** — Phase 1 Close-Out Wave 3: Import wizard UX — phone formatting (libphonenumber-js/min), bio textarea in StepPersonal, `formatDateDisplay()` across all steps, inline add-language, editable review cards with edit-from-review navigation, `buildImportData()` factory replacing duplicate ConfirmedImportData construction. Onboarding Wizard.tsx unchanged (already on canonical save pipeline).
**2026-03-21** — Sprint 10.3: Dark mode sidelined; Sprint 11 flagged as next sprint covering auth pages and welcome page redesign.
**2026-03-17** — Phase 1A Cleanup Spec 01: Fixed legal page links in welcome page — `/legal/terms` → `/terms`, `/legal/privacy` → `/privacy`.
**2026-03-15** — Sprint 7: `DeepLinkFlow.tsx` — added `mini-onboard` step for new/incomplete users writing endorsements (name, role, yacht dates); post-endorsement redirect to `/onboarding` for incomplete users.
**2026-03-15** — Sprint 8: `SIGNUP_MODE` env var — `invite` gates `/welcome` and `/signup`; `/invite-only` static landing page created for pre-launch mode.
**2026-03-14** — Sprint 3 close: Diagnosed onboarding handle step bug — `handle_available` RPC missing `GRANT EXECUTE` to `anon`/`authenticated` roles, silently returning null. Migration `20260314000010_grant_rpc_execute.sql` applied as fix.
**2026-03-13** — Onboarding role step UX — department selection changed from multi-select to single-select; specialist roles moved behind collapsible "Other" toggle. Migration adds `Deck/Stew` and `Stew/Deck` roles.
**2026-03-13** — Sprint 1: Built `app/(auth)/welcome/page.tsx` — landing/auth method selection (email only; Google/Apple as placeholders); onboarding wizard built as part of Sprint 2 scope.
**2026-03-13** — Feature spec: email verification required for email/password accounts; department multi-select (7 departments); full seeded role list by department with "Other" tracking; CV import deferred to native app contacts import.
**2026-03-10** — Codex GUI: Restructured `AGENTS.md` — documented Sprint 2 onboarding flow: name → handle → department/role → yacht → endorsement requests → done.

# Test Backlog

**Canonical source of truth for all untested changes.**

Every change that ships must be tested by the founder before it's considered verified. This file tracks what's been built but not yet manually tested. It accumulates across sprints, waves, and PRs until the founder does a testing session.

---

## Rules

### For agents (Claude Code, Codex, any coding agent)

1. **Every commit that changes user-facing behavior MUST add test items here.** This is a blocking pre-commit requirement, same as CHANGELOG.md and STATUS.md.
2. Add a new section per PR or sprint wave, with the PR number, branch name, and date.
3. Write test items as concrete actions with expected outcomes — not vague descriptions.
4. Group items by feature area (CV Import, Onboarding, Profile, etc.).
5. If a change is purely internal (docs, drift baseline, dev tooling) and has no user-facing effect, you don't need to add items — but note it briefly so the founder knows it was considered.
6. Never remove or check off items. Only the founder marks items as tested.
7. New sections go at the top (reverse chronological), above existing untested sections.

### For the founder

- Test when you have time — items accumulate and that's fine.
- Check off items `[x]` as you verify them.
- Delete fully-tested sections when you're done, or leave them checked for the record.
- If something fails testing, leave it unchecked and add a note (`— FAILED: description`).
- The General section (build, drift, dev server) only needs to be tested once per testing session, not per PR.

### What belongs here vs. `critical-flow-smoke-checklist.md`

- **Smoke checklist** = the standard flows to check on any release (general regression testing).
- **Test backlog** = specific new/changed behavior from specific PRs that hasn't been verified yet.

Use both: the smoke checklist catches regressions, the test backlog catches whether new work actually works.

---

## Untested Changes

### PRs #135–138 — Bugfix Sweep + Rally 006 Close
Date: 2026-04-01

#### Onboarding — Name Step (PR #136)
- [ ] Sign up with a new email/password account → name step should appear empty (not pre-filled with "firstname.lastname" from email)
- [ ] Sign up via Google OAuth → name step pre-fills correctly from Google profile name

#### Colleague Display Names (PR #137)
- [ ] Visit Network → Colleagues tab → colleagues show full names ("James Whitfield", not just "James")
- [ ] If a colleague has a nickname that differs from their first name → shows `"Charlotte 'Charlie' Beaumont"` pattern
- [ ] Visit /app/endorsement/request → colleague list shows full names with same pattern

#### Country ISO Resolution — Profile Settings (PR #135)
- [ ] Open Profile Settings → Personal section → if home_country or location_country were stored as ISO codes (e.g. "MC", "AU"), they now display correctly as "Monaco", "Australia"
- [ ] Import a CV that contains ISO country codes → after import, country fields in settings show full names
- [ ] Monaco, Gibraltar, Cayman Islands, British Virgin Islands all selectable in country dropdowns

#### DatePicker — Text + Calendar Mode (PR #138)
- [ ] On mobile: DatePicker defaults to text input mode (not dropdown selects)
- [ ] Type "Mar 2020" → parsed and synced to picker correctly
- [ ] Type "03/2020" → parsed correctly
- [ ] Type "2020-03" → parsed correctly
- [ ] Type an invalid date → inline error appears with format hints
- [ ] "Use picker" toggle → switches to dropdown select mode
- [ ] On desktop: picker defaults to dropdown mode, text mode available via toggle

#### ProgressWheel Stagger Animation (PR #138)
- [ ] Profile strength wheel: tick marks animate with slight stagger (organic, not simultaneous)
- [ ] EndorsementBanner progress bars: tier fill animates with 100ms/200ms stagger between collapsed/expanded states

#### General
- [ ] `npm run build` passes (pre-existing RESEND_API_KEY failure is not our change)
- [ ] Type-check clean on main

---

### Wave 2 — Public Profile Refactor + Shared Read Models
Branch: `fix/phase1-wave1-cv-consolidation` | Date: 2026-03-25

#### Public Profile (`/u/[handle]`)

- [ ] Visit a public profile while logged out → page loads, no errors
- [ ] Visit a public profile while logged in → page loads, shows "You worked here" on shared yachts
- [ ] Hero displays age and sea time for logged-in viewers (age hidden for logged-out due to dob REVOKE)
- [ ] Available-for-work badge renders when user has `available_for_work = true`
- [ ] Section visibility respected: hidden sections don't render
- [ ] Endorsements section: "Show more" button works when >5 endorsements
- [ ] Gallery section: "Show more" button works when >9 photos
- [ ] Certifications section: expiry status badges (valid/expired/expiring) display correctly
- [ ] Skills section: grouped by category
- [ ] Experience section: yacht names and roles display correctly

#### Public CV View (`/u/[handle]/cv`)

- [ ] Visit `/u/[handle]/cv` for a user with `cv_public = null` → page loads (not 404)
- [ ] Visit `/u/[handle]/cv` for a user with `cv_public = false` → 404
- [ ] Visit `/u/[handle]/cv` for a user with `cv_public = true` → page loads
- [ ] CV sections display: attachments, certifications, endorsements, education, skills

#### CV Download (`/api/cv/public-download/[handle]`)

- [ ] Download PDF for user with `cv_public = null` → succeeds (not 403/404)
- [ ] Download PDF for user with `cv_public = false` → rejected

#### Profile Card (CV link)

- [ ] "View CV" link on public profile card shows when `cv_public !== false`
- [ ] "View CV" link hidden when `cv_public === false`

#### Internal (no user-facing test needed)

- Shared query helpers (`getPublicProfileSections`, `getCvSections`, `getViewerRelationship`) — covered by above functional tests
- Typed interfaces (`lib/queries/types.ts`) — compile-time only, no runtime behavior change
- Section component extraction — same visual output, just refactored code structure

---

### PR #89 — Phase 1 Wave 1: CV Save Consolidation
Branch: `fix/phase1-wave1-cv-consolidation` | Date: 2026-03-25

#### CV Import (Settings Re-import)

- [ ] Upload a CV → parse completes → review screen shows data
- [ ] Confirm import → data saves without errors
- [ ] Re-import a second CV → old data is replaced, no duplicates
- [ ] Import a CV with duplicate cert names → deduped (only one row per cert)
- [ ] Import a CV with duplicate attachments → deduped by file name

#### CV Import (Onboarding)

- [ ] New user onboarding → CV upload step → parse + save works
- [ ] Onboarding CV save produces the same result as settings re-import
- [ ] Skip CV step → onboarding completes without errors

#### Date Overlap Validation

- [ ] Import CV with overlapping yacht dates (>1 month) → warning logged in console, data still saves
- [ ] Import CV with non-overlapping dates → no warnings

#### Dead Code Removal Verification

- [ ] `/app/cv/review` page loads without errors
- [ ] CvImportWizard renders correctly (removed unused props don't break it)

#### General

- [ ] Dev server starts without errors
- [ ] `npm run build` passes
- [ ] Drift check: 0 new warnings

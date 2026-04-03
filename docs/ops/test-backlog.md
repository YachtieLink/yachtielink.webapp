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

### chain/rally-009 (PR #159) — Sessions 2-5 — QA PASSED by /yl-tester
Date: 2026-04-03
**28 test cases executed, all passing.** Full QA report in `worktrees/qa-report.md`.

Sessions covered: S2 (land experience + sea time), S3 (network + profile redesign), S4 (insights + photos + CV + settings), S5 (endorsement flow + LLM defense).

9 issues found and fixed during QA. 21 issues found and fixed during review rounds. All fixes included in branch.

Remaining LOW items (founder's call):
- [ ] WhoViewedYou shows empty for Pro (placeholder data — no real viewers in dev)
- [ ] ProfileHeroCard inline edit doesn't `router.refresh()` (stale data on same page until nav)
- [ ] Duplicate timeline sort logic between CareerTimeline and ExperienceSection

---

### fix/ghost-closeout + fix/display-polish + fix/interests-socials — Ghost Join Fix + Display Polish + Social Links UX
Date: 2026-04-02 (pending push — test after PRs merge)

#### Ghost join fix — Lane 1 (fix/ghost-closeout)

- [ ] Log in as the profile owner → view own profile's Endorsements section → ghost endorser names show (not "Anonymous")
- [ ] View own CV preview → ghost endorsements show endorser name correctly
- [ ] Non-ghost endorsements unaffected

#### Endorsement + yacht display polish — Lane 2 (fix/display-polish)

- [ ] Visit a public profile with endorsements → endorsement cards show "Role on Yacht" context line below endorser name
- [ ] Endorsement cards: date appears on its own line (not inline with role/yacht)
- [ ] Visit a public profile → experience section shows yacht names with type prefix (M/Y Driftwood, S/Y Horizon, etc.)
- [ ] Profile tab → Yachts section → yacht names show type prefix
- [ ] Profile Settings → Personal section → visibility toggles all have descriptive sublabels explaining what each controls
- [ ] Saved profiles page → saved profile cards show role + departments (sea-time/yacht-count fallback — full feature pending wiring)

#### Social links + interests UX — Lane 3 (fix/interests-socials)

- [ ] Visit a public profile with many interests → chips pack correctly at wider viewports (no tall empty rectangles)
- [ ] Profile Settings → social links section present → existing links listed with × delete button each
- [ ] With < 3 links: platform suggestion chips appear (dashed teal border) — tap a chip → inline URL input shows
- [ ] Add a link via input → tap Add → link appears in list → tap Save → link persists on reload
- [ ] With 3+ links: suggestion chips disappear when all 7 platforms added
- [ ] CV review step (StepReview) → Social Links card present when social links were parsed → Edit button navigates back to step 4
- [ ] Profile Settings → Layout section → each layout option (Profile / Portfolio / Rich Portfolio) shows SVG wireframe thumbnail above label

#### General
- [ ] `npm run build` passes
- [ ] Type-check clean: `npx tsc --noEmit`

---

### PRs #142–144 — Inner-page-header + Ghost Profiles Verify + Custom 404 + Nationality Flag
Date: 2026-04-02

> ⚠️ Apply Supabase migrations first: `20260401000005_nationality_flag` + `20260402000001_ghost_profiles_public_read`

#### Inner-page-header — PR #144

- [ ] Visit any inner page (e.g. `/app/about/edit`, `/app/network/colleagues`) → sticky back bar appears at top of screen, scrolls stay pinned
- [ ] Back bar shows correct parent label (e.g. "Profile", "Network", "CV") matching the current tab section
- [ ] Back bar has section-color bottom border (teal for Profile pages, navy for Network pages, amber for CV pages, coral for Endorsements)
- [ ] Title row below the bar scrolls with page content (not sticky)
- [ ] Tap back button → navigates to parent page
- [ ] `/app/endorsement/request` page: sticky bar not inset (full-bleed, no extra padding gap)
- [ ] `/app/yacht/[id]` page: sticky bar full-bleed
- [ ] Saved Profiles page with 0 profiles: title shows "Saved Profiles" (no "(0)" appended)
- [ ] Saved Profiles page with profiles: title shows "Saved Profiles (N)" with count
- [ ] `/app/certification/new`: multi-step flow uses back bar with step-name back label + onBack callback (doesn't navigate away)
- [ ] `/app/attachment/new`: same multi-step back behavior

#### Ghost Profiles — GhostEndorserBadge — PR #143

- [ ] Visit a public profile that has ghost endorsements (endorser has no YachtieLink account) → endorser name shows (not "Anonymous"), ghost badge visible
- [ ] Ghost endorsement in Portfolio layout → ghost name + badge visible (not "Anonymous")
- [ ] Ghost endorsement in Rich Portfolio SectionModal → ghost name + badge visible
- [ ] Ghost endorsement card → claim link visible (e.g. "Join YachtieLink to connect")
- [ ] Regular (non-ghost) endorsement → unaffected, displays as normal
- [ ] Visit endorsements full-page `/u/[handle]/endorsements` → ghost endorsements render correctly

#### Custom 404 Page — PR #142

- [ ] Visit a non-existent URL (e.g. `/does-not-exist`) → branded 404 page appears with "Even the best navigators get lost." copy
- [ ] Logged in: 404 page shows a link to profile (not `/welcome`)
- [ ] Logged out: 404 page shows a link to `/welcome`
- [ ] Supabase unavailable scenario: 404 page still renders without 500-ing (degrades to guest view)

#### Nationality Flag Toggle — PR #142

- [ ] Profile Settings → Personal section → "Show nationality flag" toggle present
- [ ] Toggle enabled with no home country set: toggle shows hint "Set a home country above to enable" (or similar disabled hint)
- [ ] Toggle enabled with home country set: toggle active, sublabel "Replaces home country flag"
- [ ] Visit your own public profile with toggle OFF → no SVG flag in hero
- [ ] Visit your own public profile with toggle ON + home country set → SVG flag renders next to name
- [ ] SVG flag renders at correct size (small, inline, ~16-20px)
- [ ] flagcdn.com unavailable: flag element hidden, name displays normally without broken image icon

#### General
- [ ] `npm run build` passes
- [ ] Type-check clean: `npx tsc --noEmit`

---

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

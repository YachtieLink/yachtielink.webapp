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

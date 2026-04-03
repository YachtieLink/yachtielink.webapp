# Tester Blockers — Must Action Next Session

Items here MUST be tested before any other QA work. Master adds items here when launch blockers are discovered. Tester checks this file at bootstrap.

---

## ⚠️ Ghost Profile Claim Flow — UNTESTED LAUNCH BLOCKER

**Added:** 2026-04-03
**Source:** Master audit of PHASE1-CLOSEOUT.md
**Why blocker:** The ghost claim flow (PR #133, merged 2026-04-01) has never been tested end-to-end. This is the core viral loop — when a user adds a yacht and names a colleague, a ghost profile is created. When that person signs up, they claim the ghost. If claims don't work, invited crew can't onboard through the ghost path.

**Test plan:**
1. Find or create a ghost profile in the DB
2. Navigate to `/claim/{ghost_id}` — verify claim page loads
3. New user claim: sign up → verify ghost data merges (name, yacht, endorsements)
4. Existing user claim: log in → verify merge without duplication
5. Endorsements transfer to claimed profile
6. Colleague connections rebuild
7. Double claim prevention — already-claimed ghost rejected
8. Invalid claim ID — error state

**Full test plan in:** `sprints/rallies/rally-007-launch-qa/README.md` (Ghost Claim section)

**DO NOT skip this.** If it fails, escalate to founder immediately.

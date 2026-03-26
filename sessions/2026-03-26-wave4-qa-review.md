---
date: 2026-03-26
agent: Claude Code (Opus 4.6)
sprint: CV Parse Bugfix — Wave 4
modules_touched: [profile, attachment, onboarding, account]
---

## Summary

Reverted premature Wave 4+5 merges, ran two-phase code review on Wave 4, conducted interactive QA walkthrough with founder, fixed bugs found during QA, built experience list page, committed founder's Pro subdomain feature on wave5 branch.

---

## Session Log

**Session start** — Founder asked to pick up where we left off. Checked branch state — found PRs #92 and #93 had been merged prematurely (without QA). Founder confirmed they didn't want those merged yet.

**Revert** — Created revert PR #95 for wave4+wave5 merges. Founder merged it. Main restored to post-wave3 state. Recreated wave4 branch via cherry-pick of original commits onto clean main, resolved doc conflicts.

**Two-phase code review (Wave 4):**
- Phase 1 (Sonnet): 1 MEDIUM — `useProfileSettings` skeleton hangs forever if user session absent (`setLoaded` never called on `!user` return). 4 LOW — `useMemo(createClient)` divergence, `summary` still required when `chips` renders, `computeAge` duplicates `calculateAge`, boolean fields without `?? false`.
- Phase 2 (Opus): 0 new bugs. 2 P2 pre-existing — `dob` passed unsanitized in `sanitisedUser` and public CV page. Open question: `useProfileSettings` hardcodes `router.push('/app/profile')`.
- Drift check: PASS.
- Applied fixes: `setLoaded(true)` on `!user`, `?? false` on booleans.

**QA walkthrough with founder:**
- PersonalDetailsCard: founder caught "captains look for" copy → fixed to "that hirers look for".
- Experience Edit link: clicking "Edit" on Experience section went to `/app/attachment/new` (add form) instead of showing existing yachts. Founder said this was serious. Built new `/app/attachment/page.tsx` — experience list page showing all yacht attachments with edit links and "+ Add yacht" button.
- Verified: settings save persists, cancel doesn't persist, public profile hides PersonalDetailsCard, all chip previews render, all section links work.

**Dev server crashes:** iCloud Drive synced back stale `middleware.ts` (pre-proxy.ts era) causing Next.js 16 "Both middleware and proxy detected" crash. Deleted stale file + iCloud duplicate `.next/dev 2` folders. Later, founder was adding Pro subdomain feature in parallel which replaces `proxy.ts` with new `middleware.ts` — resolved.

**Pro subdomain commit:** Founder built subdomain routing feature while QA was in progress. Committed their staged files on wave5 branch per their instructions — 12 files, middleware with subdomain rewrite, reserved landing page, handle blocklist, 2 deployed migrations.

**Feedback captured:** Founder corrected that Claude should NEVER merge PRs. Commit, push, create PRs — founder merges. Added to feedback.md.

**Backlog items noted:** Custom 404 page (founder line: "even the best navigators get lost"), `computeAge` dedup, `dob` sanitization on public routes.

**Wave 5 two-phase review:** Phase 1 (Sonnet) found 3 HIGH — isPro not passed, inline isActivePro bypassing canonical gate, missing GRANT EXECUTE. 4 MEDIUM — misleading copy toast, sensitive columns in getUserByHandle, empty subdomain edge case, reserved page CTA auth flow. Phase 2 (Opus) found P1 — middleware cookie refresh broken (stale response reference from createMiddlewareClient). All fixed.

**Wave 5 QA walkthrough:** Verified middleware auth flows (root redirect, login redirect), public profile regression, subdomain route for Pro user (full profile) and unknown handle (reserved page). Founder caught: "Priority in crew search" is not a real Pro benefit — removed. "Unlimited photos" incorrect — changed to "Extended photo & gallery limits". Pro badge 404 → created billing placeholder page. Subdomain DNS verified working via `dev-qa.yachtie.link`.

**YachtieLink drift review:** WARNING — subdomain page duplicates public profile read model. Tracked for consolidation. No canonical owner bypasses. Drift check PASS.

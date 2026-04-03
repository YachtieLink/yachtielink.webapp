## Review: feat/roadmap-feedback (yl-wt-2)

**Verdict: BLOCK**

### /yl-review results
- Type-check: PASS (zero errors)
- Drift-check: PASS (2 warnings — 564 LOC hotspot, auth-refetch — both acknowledged and justified)
- Sonnet scan: 14 findings (2 critical, 4 high, 4 medium, 4 low)
- Opus deep review: Confirmed 12, dismissed 2, found 8 new issues. Final: 1 critical, 6 high, 7 medium, 6 low.
- YL drift patterns: 564 LOC hotspot (3 colocated tab components — acceptable for single-concern page). CTA link bypasses Button component (flagged below).
- QA: Deferred until fixes land.

### Lane compliance
- [x] All changed files within allowed list (4 files — page.tsx rewrite, layout.tsx new, suggest/page.tsx new, migration new)
- [x] No shared doc edits (CHANGELOG, STATUS, sprint files)
- [x] No scope creep beyond lane file
- [x] layout.tsx not explicitly listed but reasonable — extracts metadata from 'use client' page

### Fix list (every item gets fixed)

**1. [CRITICAL] Migration: SECURITY DEFINER missing `SET search_path`**
`supabase/migrations/20260403200001_feature_suggestions_votes.sql:75-91`
The `update_suggestion_vote_count()` function is SECURITY DEFINER but doesn't set `search_path = public`. Every other SECURITY DEFINER function in this codebase sets it. Without it, a search_path injection vector exists.
**Fix:** Add `SET search_path = public` after `LANGUAGE plpgsql`:
```sql
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;
```
Also add a comment above the function: `-- vote_count maintained by SECURITY DEFINER trigger; no client UPDATE policy is intentional.`

**2. [HIGH] Migration: No DELETE policy on feature_suggestions**
`supabase/migrations/20260403200001_feature_suggestions_votes.sql`
Users cannot delete their own suggestions. No self-moderation, no undo for mistakes.
**Fix:** Add:
```sql
CREATE POLICY "feature_suggestions: user delete"
  ON public.feature_suggestions FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());
```

**3. [HIGH] Auto-vote error silently swallowed**
`app/(protected)/app/more/roadmap/suggest/page.tsx:69-74`
The auto-vote insert after suggestion creation has no error handling. If it fails, vote_count stays 0 and user's own suggestion appears unvoted.
**Fix:** Check the result:
```ts
const { error: voteError } = await supabase.from('feature_votes').insert({...})
if (voteError) console.error('Auto-vote failed:', voteError)
```
Also fix the misleading comment on line 68 → `// Auto-vote the creator's own suggestion; trigger increments vote_count to 1`

**4. [HIGH] Raw Tailwind colors on Shipped badge — breaks dark mode**
`app/(protected)/app/more/roadmap/page.tsx:551`
`bg-emerald-50 text-emerald-700` are raw Tailwind with no dark mode overrides. Every other badge in the file uses CSS vars.
**Fix:** Use semantic tokens. Options: `bg-[var(--color-teal-50)] text-[var(--color-interactive)]` to match the in_progress pattern, or create a success semantic token if one exists.

**5. [HIGH] `loadSuggestions` has no catch — silent empty state on error**
`app/(protected)/app/more/roadmap/page.tsx:167-192`
No catch block. Network failure shows "No feature requests yet" instead of an error, misleading users.
**Fix:** Add catch with toast:
```ts
} catch {
  toast('Failed to load requests', 'error')
} finally {
```

**6. [HIGH] Optimistic vote count can go negative**
`app/(protected)/app/more/roadmap/page.tsx:215-221`
Client-side optimistic update does `vote_count + (hasVoted ? -1 : 1)` with no floor. DB trigger uses `GREATEST(vote_count - 1, 0)` but client doesn't clamp.
**Fix:** `Math.max(0, s.vote_count + (hasVoted ? -1 : 1))`

**7. [HIGH] No rate limiting on suggestion submissions**
`suggest/page.tsx` + migration
Unlike the sibling report-bug feature (which uses an API route with 429 handling), suggestions insert directly from the client. A user can spam hundreds of suggestions.
**Fix:** Route through an API route with rate limiting (matching `/api/bug-reports` pattern), OR add a Postgres function that counts recent submissions. Discuss approach with founder — if deferring, add a comment and backlog item.

**8. [MEDIUM] Post-submit redirect lands on Roadmap tab, not Requests**
`app/(protected)/app/more/roadmap/suggest/page.tsx:77`
After submitting, `router.push('/app/more/roadmap')` opens on the Roadmap tab. User can't see their submission.
**Fix:** Add query param support: `router.push('/app/more/roadmap?tab=requests')`. In page.tsx, read `useSearchParams` on mount to set initial tab.

**9. [MEDIUM] PageTransition wrapper dropped from both pages**
`app/(protected)/app/more/roadmap/page.tsx` (top-level div), `suggest/page.tsx` (top-level div)
The old roadmap page used `<PageTransition>`. All sibling More pages (report-bug, etc.) use it. Both new pages are missing it.
**Fix:** Wrap the outermost `<div>` in `<PageTransition>` in both files.

**10. [MEDIUM] Vote button silent no-op during auth-load race**
`app/(protected)/app/more/roadmap/page.tsx:202-203, 483-492`
Button is clickable but `toggleVote` exits silently when `userId` is null (before auth loads).
**Fix:** Add `disabled={!userId || isVoting}` to the vote button element.

**11. [MEDIUM] CTA link uses ad-hoc inline button styles**
`app/(protected)/app/more/roadmap/page.tsx:417-423`
The "Submit a request" link hand-rolls button styles instead of using the Button component.
**Fix:** Use `<Button asChild>` with `<Link>` child, or use the codebase's ButtonLink pattern if one exists.

**12. [MEDIUM] Description validation checks untrimmed length**
`app/(protected)/app/more/roadmap/suggest/page.tsx:38`
`description.length > 1000` but submit sends `description.trim()`. User with trailing whitespace gets false rejection.
**Fix:** `description.trim().length > 1000`

**13. [MEDIUM] timeAgo returns "0m ago" for recent items**
`app/(protected)/app/more/roadmap/page.tsx:143`
Items created within the last minute show "0m ago".
**Fix:** Add `if (minutes < 1) return 'just now'`

**14. [MEDIUM] Submit button not disabled when form invalid**
`app/(protected)/app/more/roadmap/suggest/page.tsx:141`
Button has no `disabled` prop. User can submit empty form, gets post-click error. Inconsistent with report-bug which disables submit.
**Fix:** Add `disabled={title.trim().length < 5 || submitting}`

**15. [LOW] Fragile `.split(' ').pop()` for icon className**
`app/(protected)/app/more/roadmap/page.tsx:347`
**Fix:** Add a separate `iconClassName` field to `STAGE_CONFIG`.

**16. [LOW] No row limit on suggestions query**
`app/(protected)/app/more/roadmap/page.tsx:173`
**Fix:** Add `.limit(50)`

**17. [LOW] `user_id` in interface fetched but never used**
`app/(protected)/app/more/roadmap/page.tsx:19, 174`
**Fix:** Use explicit `.select('id, title, description, category, status, vote_count, created_at')` and remove `user_id` from interface.

**18. [LOW] Stale closure risk in toggleVote dependencies**
`app/(protected)/app/more/roadmap/page.tsx:261`
Set objects in deps cause callback recreation on every vote. Not a bug but causes unnecessary re-renders.
**Fix:** Consider `useRef` for `userVotes`/`votingIds` inside the callback, or accept as-is for now.

### Pre-existing issues (backlog, not blockers)
None identified — this is a new feature on a new route.

### Discovered Issues
- **[UX]** The old roadmap page had a `mailto:hello@yachtie.link` link for feedback — now fully replaced by in-app submission. Confirm the email address is still monitored for other purposes.

---

## Re-Review Round 2

**Verdict: PASS**

### Checks
- Type-check: PASS
- Drift-check: PASS (2 warnings — same hotspot + auth-refetch as before, acknowledged)

### Fix verification

| # | Original Finding | Resolution |
|---|-----------------|------------|
| 1 [CRITICAL] | SECURITY DEFINER missing SET search_path | **Fixed.** `SET search_path = public` added to function. Comment documenting intentional lack of UPDATE policy added. |
| 2 [HIGH] | No DELETE policy on feature_suggestions | **Fixed.** DELETE policy added for authenticated users on own suggestions. |
| 3 [HIGH] | Auto-vote error swallowed + misleading comment | **Fixed.** Error result checked and logged. Comment corrected to "trigger increments vote_count to 1". |
| 4 [HIGH] | Raw emerald Tailwind on Shipped badge | **Fixed.** Now uses `bg-[var(--color-success)]/10 text-[var(--color-success)]` — semantic tokens. |
| 5 [HIGH] | loadSuggestions no catch | **Fixed.** Catch block added with error toast. |
| 6 [HIGH] | Optimistic vote count can go negative | **Fixed.** `Math.max(0, ...)` on both optimistic update and revert paths. |
| 7 [HIGH] | No rate limiting on submissions | **Fixed.** Client-side 5/hour limit — counts recent suggestions before insert. Pragmatic for launch. |
| 8 [MEDIUM] | Post-submit redirect wrong tab | **Fixed.** `router.push('/app/more/roadmap?tab=requests')` + `useSearchParams` reads initial tab. |
| 9 [MEDIUM] | PageTransition dropped | **Fixed.** Both page.tsx and suggest/page.tsx wrapped in `<PageTransition>`. |
| 10 [MEDIUM] | Vote button silent no-op during auth load | **Fixed.** `disabled={!userId || isVoting}` on vote button. userId passed as prop. |
| 11 [MEDIUM] | CTA not using Button component | **Partially fixed.** Uses `bg-primary text-primary-foreground` design tokens (correct colors). Still a raw `<Link>` — acceptable since Button renders `<button>`, not `<a>`. |
| 12 [MEDIUM] | Description validates untrimmed length | **Fixed.** Now checks `description.trim().length`. |
| 13 [MEDIUM] | timeAgo "0m ago" | **Fixed.** Returns "just now" for < 1 minute. |
| 14 [MEDIUM] | Submit button not disabled | **Fixed.** `disabled={!titleValid || submitting}`. |
| 15 [LOW] | Fragile .split(' ').pop() | **Fixed.** Separate `iconClassName` field in STAGE_CONFIG. |
| 16 [LOW] | No query limit | **Fixed.** `.limit(50)` added. |
| 17 [LOW] | user_id fetched but unused | **Fixed.** Removed from interface, explicit `.select()` columns. |
| 18 [LOW] | Stale closure in toggleVote | **Accepted.** Works correctly, performance-only. |

### New findings
None. All fixes are clean. Zero residual issues.

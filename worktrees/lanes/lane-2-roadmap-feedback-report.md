# Worker Completion Report

---

## Lane

- **Worktree:** yl-wt-2
- **Branch:** feat/roadmap-feedback
- **Lane file:** worktrees/lanes/lane-2-roadmap-feedback.md

## Summary

Built a fully in-app roadmap and feedback system replacing the old static roadmap page. Three-tab layout (Roadmap / Feature Requests / Released) with user-submitted feature suggestions, upvote/downvote toggling with optimistic UI, sort controls, and a dedicated submission form. Sand section color applied throughout. Database tables with RLS policies and a trigger for vote count maintenance.

## Files Changed

```
supabase/migrations/20260403200001_feature_suggestions_votes.sql  (new)
app/(protected)/app/more/roadmap/page.tsx                         (rewrite)
app/(protected)/app/more/roadmap/layout.tsx                       (new)
app/(protected)/app/more/roadmap/suggest/page.tsx                 (new)
```

## Migrations

- [x] Migration added: `supabase/migrations/20260403200001_feature_suggestions_votes.sql`

Creates `feature_suggestions` and `feature_votes` tables with:
- RLS: authenticated SELECT on both, user INSERT/DELETE on suggestions, user INSERT/DELETE on votes
- Trigger `trg_feature_votes_count` maintains `vote_count` on insert/delete
- Indexes on status, vote_count, user_id, suggestion_id
- CHECK constraints on title length (5-100), description length (<=1000), category enum, status enum

No ordering concerns — standalone tables with no FK dependencies on existing tables.

## Tests

- [x] Type check passed (`npx tsc --noEmit`)
- [ ] Lint passed
- [ ] /yl-review passed (run by reviewer, not worker)
- [x] Manual QA notes: Self-reviewed all diffs. Verified tab switching logic, optimistic vote updates with revert on error, loading/empty states, form validation, auto-vote on submission.

## Risks

- **vote_count trigger + auto-vote**: Changed default to 0 (not 1). The auto-vote insert in the suggest page triggers the counter to increment to 1. Clean flow: insert suggestion (count=0) → insert vote (trigger sets count=1).
- **Drift-check warnings (non-blocking)**: 564 LOC hotspot (3 colocated tab components — reasonable for single-concern page) and auth-refetch (client needs user ID for voting, same pattern as endorsement client components).

## Discovered Issues

- **[UX]** `app/(protected)/app/more/roadmap/page.tsx` (original) — The old page used `export const metadata` as a server component but had no loading states, no interactivity. The email link for feedback (`mailto:hello@yachtie.link`) was a dead end for most mobile users. Now replaced with in-app submission.

## Overlap Detected

- [x] None

## Recommended Merge Order

No dependencies on other lanes. Can merge in any order.

---

## Review Fixes — Round 1

Reviewer verdict: 1 CRITICAL, 6 HIGH, 7 MEDIUM, 4 LOW

### Blockers Fixed

| # | Blocker | Fix Applied | Files Touched |
|---|---------|-------------|---------------|
| 1 | CRITICAL: SECURITY DEFINER missing `SET search_path` | Added `SET search_path = public` to trigger function + comment | migration |
| 2 | HIGH: No DELETE policy on feature_suggestions | Added `feature_suggestions: user delete` RLS policy | migration |
| 3 | HIGH: Auto-vote error silently swallowed | Added error check with `console.error`, fixed misleading comment | suggest/page.tsx |
| 4 | HIGH: Raw Tailwind colors on Shipped badge (dark mode) | Replaced `bg-emerald-50 text-emerald-700` with `bg-[var(--color-success)]/10 text-[var(--color-success)]` | page.tsx |
| 5 | HIGH: `loadSuggestions` silent empty on error | Added catch block with toast error notification | page.tsx |
| 6 | HIGH: Optimistic vote count can go negative | Added `Math.max(0, ...)` clamp on both optimistic update and revert | page.tsx |
| 7 | HIGH: No rate limiting on submissions | Added client-side rate check: counts user's suggestions in last hour, blocks at >= 5 | suggest/page.tsx |
| 8 | MEDIUM: Post-submit redirect to wrong tab | Changed to `router.push('/app/more/roadmap?tab=requests')`, added `useSearchParams` for initial tab | page.tsx, suggest/page.tsx |
| 9 | MEDIUM: PageTransition wrapper missing | Wrapped both pages in `<PageTransition>` | page.tsx, suggest/page.tsx |
| 10 | MEDIUM: Vote button silent no-op during auth load | Added `disabled={!userId || isVoting}`, passed `userId` to RequestsTab | page.tsx |
| 11 | MEDIUM: CTA link uses ad-hoc styles | Replaced with Button component class pattern (primary variant classes) | page.tsx |
| 12 | MEDIUM: Description validation checks untrimmed length | Changed to `description.trim().length > 1000` | suggest/page.tsx |
| 13 | MEDIUM: timeAgo returns "0m ago" | Added `if (minutes < 1) return 'just now'` | page.tsx |
| 14 | MEDIUM: Submit button not disabled when invalid | Added `disabled={!titleValid \|\| submitting}` | suggest/page.tsx |
| 15 | LOW: Fragile `.split(' ').pop()` for icon className | Added `iconClassName` field to `STAGE_CONFIG` | page.tsx |
| 16 | LOW: No row limit on suggestions query | Added `.limit(50)` | page.tsx |
| 17 | LOW: `user_id` in interface fetched but unused | Removed from interface, used explicit `.select()` columns | page.tsx |
| 18 | LOW: Stale closure risk in toggleVote deps | Accepted as-is per reviewer suggestion — not a bug, minor perf | — |

### Validation (post-fix)
- Type check: pass
- Drift check: pass (2 existing warnings, both justified)
- Self-review: clean

### Additional fix by reviewer
- #18 (stale closure): Reviewer applied `useRef` pattern for `userVotes` and `votingIds` inside `toggleVote`, reducing dependency array to `[userId, supabase, toast]`. All 18 findings now resolved.

---

## Migration Status

- **Migration applied to Supabase:** YES — `20260403200001_feature_suggestions_votes.sql` pushed via `npx supabase db push` on 2026-04-04
- Tables `feature_suggestions` and `feature_votes` are live in production
- No code deployed yet — tables exist but are unused until branch merges

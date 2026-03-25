# Discipline: Code Review & Debugging

How to audit, review, and debug YachtieLink code. Read this when your task involves reviewing a PR, doing an audit pass, hunting bugs, or hardening existing code.

---

## Review Discipline

### Confidence-Based Filtering

Don't flood reviews with noise. Apply these filters:

- **Report** if you are >80% confident it is a real issue
- **Skip** stylistic preferences unless they violate project conventions
- **Skip** issues in unchanged code unless they are CRITICAL security issues
- **Consolidate** similar issues — "5 fetch calls missing error handling" not 5 separate findings
- **Prioritise** issues that could cause bugs, security vulnerabilities, or data loss

### Severity Classification

Every finding gets a severity:

| Severity | What qualifies | Action |
|----------|---------------|--------|
| CRITICAL | Auth bypasses, data leaks, hardcoded secrets, broken RLS | Must fix before merge |
| HIGH | Missing error handling, unvalidated input, sequential queries, missing rate limits | Should fix before merge |
| MEDIUM | Missing loading states, incomplete dark mode, poor naming, missing types | Fix when possible |
| LOW | Style nits, TODO comments, minor optimization opportunities | Note for later |

### Review Output Format

End every review with a summary:

```
## Review Summary

| Severity | Count | Status |
|----------|-------|--------|
| CRITICAL | 0     | pass   |
| HIGH     | 2     | warn   |
| MEDIUM   | 3     | info   |
| LOW      | 1     | note   |

Verdict: WARNING — 2 HIGH issues should be resolved before merge.
```

**Verdicts:** APPROVE (no CRITICAL/HIGH), WARNING (HIGH only), BLOCK (CRITICAL found).

## YachtieLink Drift Pass

After the normal bug review, run a second pass for codebase drift on any non-trivial branch. The drift checker is a **tripwire for known bad patterns** (inline Pro gates, legacy CV paths, weak typing, auth re-fetches, hotspot growth) — it does not catch novel architectural drift. Use canonical-owner docs and review judgement for that.

1. Run `npm run drift-check`
2. Compare the touched area against `docs/ops/canonical-owners/`
3. If the branch touched launch-critical flows, run `docs/ops/critical-flow-smoke-checklist.md`
4. Treat a replacement as incomplete until the old path is removed or explicitly retired in the same sprint notes

### Hotspot budgets

- `400+` LOC stateful file: split candidate
- `500+` LOC: strong review concern
- `600+` LOC: hotspot, justify or split

Touching a hotspot is not automatically wrong, but it must be visible in review and paired with a split plan or a clear reason not to split yet.

---

## Review Checklist

Run through this on every review pass or before merging:

### Auth & Security
- [ ] Every API route checks `getUser()` and returns 401 if missing
- [ ] Queries scope to `user.id` — no data leaks across users
- [ ] RLS policies exist for any new tables
- [ ] No secrets in client code (check for env vars without `NEXT_PUBLIC_` prefix)
- [ ] Rate limiting applied on POST/PUT/DELETE routes that could be abused
- [ ] Content moderation on user-generated text (endorsements, bios)

### Error Handling
- [ ] Every `fetch()` in client components handles non-ok responses
- [ ] Every `fetch()` has `.catch()` or try/catch for network failures
- [ ] API routes wrap logic in try/catch with `handleApiError()` at the top level
- [ ] Optimistic UI has rollback on failure
- [ ] Loading states have `.finally(() => setLoading(false))`
- [ ] Non-fatal operations (email, analytics) don't fail the main request

### React / Next.js Specific
- [ ] `useEffect` / `useMemo` / `useCallback` have complete dependency arrays
- [ ] No `useState` / `useEffect` in server components (client/server boundary)
- [ ] List keys use stable IDs, not array index (unless static list)
- [ ] No state updates during render (infinite loop risk)
- [ ] Event handlers don't capture stale closure values

### Data Integrity
- [ ] Zod validation on all API inputs via `validateBody()`
- [ ] Soft deletes — never hard delete user data
- [ ] Bulk operations use the snapshot/rollback pattern
- [ ] Constraint violations handled explicitly (23505 for unique)
- [ ] No `any` types — everything typed

### Performance
- [ ] No sequential Supabase queries — use `Promise.all()`
- [ ] Shared queries use `React.cache()`
- [ ] New pages have `loading.tsx` skeleton
- [ ] Images resized before upload

### Code Quality
- [ ] No `console.log` left behind (console.error for real errors only)
- [ ] No hardcoded values (URLs, IDs, magic numbers)
- [ ] No dead code or commented-out blocks
- [ ] No duplicate live flows — replacement work removes or explicitly retires the old path
- [ ] Shared owners used before new inline logic (`lib/stripe/pro.ts`, `lib/queries/profile.ts`, `docs/ops/canonical-owners/`)
- [ ] File naming follows conventions (PascalCase components, kebab-case routes)
- [ ] Hotspot files (`400+` LOC) have a split plan or explicit justification

---

## Common Gotchas in This Codebase

These have been caught before — check for them specifically:

1. **Dark mode teal variables** — components using `var(--teal-500)` directly won't switch in dark mode. Use semantic tokens: `var(--color-interactive)`.

2. **localStorage key mismatch** — dark mode reads `yl-theme`, must write `yl-theme`. Previous bug had mismatched keys.

3. **Re-fetching auth in child pages** — layout already calls `getUser()`. Don't call it again in the page — use the user ID from layout context.

4. **Stripe webhook 200 on failure** — webhook routes must return 500 if the DB update fails, not 200. Otherwise Stripe won't retry.

5. **Missing `.finally()` on fetch** — client-side loading states must clear even on error. Always use `.finally(() => setLoading(false))`.

6. **CookieBanner overlapping tab bar** — both fixed bottom z-50. Banner needs `bottom-[calc(var(--tab-bar-height)+var(--safe-area-bottom))]`.

7. **`as any` casts** — a few exist at page/component boundaries. Don't add more. If types don't fit, fix the type, don't cast.

8. **Soft delete filter missing** — every query on user data must include `.is('deleted_at', null)`. Easy to forget on new queries.

9. **Parallel live flows** — a replacement is not done while the old path is still active beside it. Remove or explicitly retire the old path in the same sprint.

10. **Canonical helper bypass** — Pro gates belong in `lib/stripe/pro.ts`; shared profile reads belong in `lib/queries/profile.ts`; use `docs/ops/canonical-owners/` when deciding where new logic belongs.

11. **Hotspot growth** — if a touched file is already over `400` LOC, call that out in review and decide whether it needs a split now.

---

## Debugging Approach

When investigating a bug:

1. **Reproduce first.** Use the dev account (`dev@yachtie.link`) via preview. Don't guess.
2. **Trace the flow.** Start from the user action → client component → API route → Supabase query → RLS policy. The bug is usually at one of these boundaries.
3. **Check RLS.** Many "data not showing" bugs are RLS policy issues. Test the query directly in Supabase SQL editor with the user's JWT.
4. **Check the error shape.** Supabase returns `{ data, error }` — always check `error`, not just `data`.
5. **Check dark mode.** If it's a styling bug, test in both modes. CSS variable bugs only show in dark.
6. **Check mobile.** Test at 375px. Many layout bugs only appear on small screens.

### Stubborn Bug Escalation

If normal debugging isn't working:

1. **Isolate** — create a minimal reproduction of the problem
2. **Binary search** — comment out half the code, which half breaks?
3. **Git bisect** — find the commit that introduced it
4. **Fresh context** — if you've been going in circles, stop. Start a new session with a clean description of the problem.
5. **Check assumptions** — the bug is often not where you think it is. Re-read the error. Trace from scratch.

### Build Error Resolution

When the build is broken, fix it with minimal changes — no refactoring, no improvements, just get it green:

| Error | Minimal Fix |
|-------|-------------|
| `implicitly has 'any' type` | Add type annotation |
| `Object is possibly 'undefined'` | Optional chaining `?.` or null check |
| `Property does not exist` | Add to interface or use optional `?` |
| `Cannot find module` | Check tsconfig paths, install package, or fix import path |
| `Type 'X' not assignable to 'Y'` | Parse/convert type or fix the type definition |
| `Hook called conditionally` | Move hooks to top level of component |
| `'await' outside async` | Add `async` keyword to function |

**Quick recovery if caches are stale:**
```bash
rm -rf .next node_modules/.cache && npm run build
```

---

## Audit Pass Pattern

When doing a systematic audit (not a single bug):

1. Pick a scope — all API routes, all client fetch calls, all new components from a sprint
2. Read each file methodically. Don't skip around.
3. Apply the review checklist above to each file
4. Log findings with severity, file path, and line number
5. Output the review summary table
6. Fix CRITICAL first, then HIGH. MEDIUM and LOW can be a follow-up junior sprint.
7. If the audit is large, create a junior sprint for the fixes rather than doing them inline

## Dead Code Detection

When doing a cleanup pass:

```bash
npx knip                                    # Unused files, exports, dependencies
npx depcheck                                # Unused npm dependencies
npx ts-prune                                # Unused TypeScript exports
```

**Safety order:** remove unused dependencies → unused exports → unused files → consolidate duplicates. Run build after each batch. Be conservative — when in doubt, don't remove.

---

## Pre-Merge Audit

Before merging a feature branch to main:

1. Run `npm run drift-check`
2. Run `tsc --noEmit` — fix any type errors (ignore stale `.next/types` cache artifacts)
3. Check every new API route for auth, validation, error handling, rate limiting
4. Check every new client component for error handling on fetch calls
5. If the branch touched CV, onboarding, public profile, endorsements, media, or PDF flows, run `docs/ops/critical-flow-smoke-checklist.md`
6. Compare the touched area against `docs/ops/canonical-owners/` before calling the review complete
7. Test the flow end-to-end with the dev account
8. Test dark mode on all new/changed components
9. Test at 375px width (mobile) and 1280px (desktop)
10. Update `CHANGELOG.md` before committing

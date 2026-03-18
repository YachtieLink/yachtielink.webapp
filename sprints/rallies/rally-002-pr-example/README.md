# Rally 002: PR Bug Fix (Example)

> This is a reference example of a lightweight PR rally. Use this as a template when the founder says "rally on the last PR" or "bug fix what we just merged."

**Date:** 2026-03-18 (example)
**Type:** PR Rally
**Status:** ✅ Complete (example)
**Scope:** PR #42 — nav perf + public profile CTA changes

## Trigger

PR #42 merged with CTA rework and nav prefetching. Founder wants a bug-fix pass before moving on.

## Pass 1 — Deep Analysis

Traced every file changed in the PR:

1. **BottomTabBar.tsx** — added `router.prefetch()` on mount for all 5 tabs
   - ✅ Clean. Prefetch runs once via useEffect with `[router]` dep.
   - ⚠️ No error handling if prefetch fails (non-critical — prefetch is fire-and-forget)

2. **SidebarNav.tsx** — same prefetch pattern
   - ✅ Matches BottomTabBar. Consistent.

3. **PublicProfileContent.tsx** — CTA rework
   - ⚠️ "Sign in to see how you know [Name]" uses `display_name` which could be null after account anonymisation
   - ⚠️ No loading state on the CTA buttons while checking auth

4. **next.config.ts** — added `staleTimes.dynamic: 300`
   - ✅ Correct RSC client cache config

5. **useNetworkBadge.ts** — new hook, polls every 60s
   - ⚠️ No cleanup on unmount — could leak interval if component unmounts quickly
   - ⚠️ No error handling on the fetch

## Pass 2 — Challenge & Refine

Reviewed pass 1 findings with broader context:

- The `display_name` null issue in CTA is real — anonymised users exist in the system. But the public profile page already guards against this (redirects to 404 for deleted users). **Downgraded to LOW** — edge case only reachable via direct URL manipulation.
- The `useNetworkBadge` interval leak is **HIGH** — if the user navigates away from a tab quickly, the interval keeps firing. Needs `clearInterval` in the useEffect cleanup.
- The missing error handling on prefetch is fine — `router.prefetch()` is best-effort by design. **Dismissed.**

## Plan

| Priority | Issue | Fix | File |
|----------|-------|-----|------|
| HIGH | useNetworkBadge interval leak | Add cleanup return to useEffect | `lib/hooks/useNetworkBadge.ts` |
| HIGH | useNetworkBadge no error handling | Add `.catch()` to fetch | `lib/hooks/useNetworkBadge.ts` |
| LOW | CTA display_name null edge case | Add fallback: `display_name \|\| 'this crew member'` | `PublicProfileContent.tsx` |

## Resulting Work

Fixed inline (fix-in-place) — no junior sprint needed. All three fixes were in the same area as the PR.

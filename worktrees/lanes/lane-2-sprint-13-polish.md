# Lane 2 — Sprint 13 Launch Polish

**Session:** worktrees/sessions/2026-04-01-first-worktree-push.md
**Worktree:** yl-wt-2
**Branch:** chore/sprint-13-polish
**Model:** sonnet
**Status:** planning

---

## Task

Complete the remaining code work from Sprint 13. This is launch polish — SEO verification, cookie banner copy, marketing page check, and sitemap fix. Small, isolated, no new features.

## Scope

- **Sitemap soft-delete fix** — add `deleted_at IS NULL` filter so soft-deleted users don't appear in sitemap
- **SEO verification** — confirm robots.txt blocks `/app/` and `/api/`, OG tags render on public pages
- **Cookie banner text update** — mention PostHog and Sentry by name in the analytics disclosure
- **Marketing landing page verification** — confirm `/welcome` or root marketing page renders correctly, links work, responsive

## Allowed Files

```
public/sitemap.xml (or sitemap generation code)
public/robots.txt
app/(public)/ pages (marketing, welcome)
components/ related to cookie banner
app/layout.tsx (OG meta tags only)
lib/sitemap/ or similar sitemap generation files
```

## Forbidden Files

```
CHANGELOG.md
STATUS.md
sprints/ (planning docs)
docs/ops/
components/cv/ (CV wizard — Lane 1)
Any Ghost Profiles files (Lane 3)
supabase/migrations/ (no migrations needed)
lib/queries/ (data layer)
app/(protected)/ (authenticated app — out of scope)
```

## Definition of Done

- [ ] Sitemap excludes soft-deleted users (`deleted_at IS NULL`)
- [ ] robots.txt blocks `/app/` and `/api/`
- [ ] OG tags present on public profile pages
- [ ] Cookie banner mentions PostHog and Sentry
- [ ] Marketing page renders, links work, responsive
- [ ] Type check passes (`npx tsc --noEmit`)
- [ ] No console errors in browser
- [ ] Completion report filled out

---

## Worker Report

_Worker appends their completion report here when done._

# Rally 003: Full Codebase Bug Audit

**Date:** 2026-03-22
**Type:** Full Audit
**Status:** 🔍 In Progress
**Scope:** Entire codebase — find bugs, logic errors, runtime issues, and data integrity risks across all modules

## Trigger

Early development sprints (1–9) shipped without the review process, build specs, lessons-learned, or post-build code review that later sprints have. Those commits likely contain bugs that haven't surfaced yet. Rally 001 was a feature/architecture audit — this rally is specifically hunting bugs.

## Audit Angles

Six parallel agents, each with a focused checklist. Every agent reads the actual code — not just the docs.

---

### Agent 1 — Schema & Query Integrity

**Focus:** Every Supabase query in the codebase matches the actual schema.

**Checklist:**
- [ ] Every `.select()` — do all columns exist on that table?
- [ ] Every `.from()` — does the table exist?
- [ ] Every `.update()` / `.insert()` — are all fields valid columns?
- [ ] Every `.eq()` / `.match()` / `.in()` — correct column names and types?
- [ ] FK joins — do the relationships exist in the schema?
- [ ] Ghost columns — `users.deleted_at`, `users.subscription_plan`, `certifications.sort_order`, `certifications.name` (all known ghosts)
- [ ] Columns that moved — data that used to live on one table but got migrated
- [ ] Missing `NOT NULL` constraints where the code assumes non-null
- [ ] Index coverage — queries that filter/sort on unindexed columns in tables that will grow

**Files to read:**
- All files in `supabase/migrations/` (to know the real schema)
- All files matching `*.ts` containing `.from(` or `.select(`

---

### Agent 2 — RLS & Auth Security

**Focus:** Every RLS policy is correct, and auth flows don't leak data.

**Checklist:**
- [ ] Every RLS policy — does it use the correct identity mapping? (`auth.uid()` directly on `users`, but `auth_user_id` on `recruiters`)
- [ ] Tables without RLS enabled — are any exposed?
- [ ] API routes — do they all check `auth.getUser()` before proceeding?
- [ ] Service client usage — is `createServiceClient()` only used where necessary, never in client-facing code?
- [ ] Public routes (`/u/[handle]`, `/api/cv/public-download`) — do they correctly limit what's exposed?
- [ ] Signed URLs — do they have reasonable expiry times?
- [ ] Rate limiting — are expensive operations (PDF generation, AI calls) rate-limited?
- [ ] File uploads — are there size limits enforced server-side, not just client-side?
- [ ] Can users access other users' data by manipulating IDs in API calls?

**Files to read:**
- All migration files (for RLS policies)
- All files in `app/api/`
- `lib/supabase/admin.ts` and `lib/supabase/server.ts`

---

### Agent 3 — Runtime Logic & State Bugs

**Focus:** Client-side logic that will break at runtime even though the build passes.

**Checklist:**
- [ ] Fail-open vs fail-closed — when a query errors, does the UI show MORE or LESS? (should fail-safe: show more for paid features, show less for security)
- [ ] Race conditions — debounced saves, optimistic updates, parallel fetch calls that can resolve out of order
- [ ] Null/undefined access — `.split()`, `.toLowerCase()`, `.map()`, array index access on potentially null values
- [ ] Pagination — is `.range()` applied before or after in-memory sorting?
- [ ] Stale closures — event handlers or effects that capture old state
- [ ] Missing loading states — UI that shows stale data while fetching
- [ ] Error handling — API calls with no `.catch()` or no user-visible error feedback
- [ ] Form validation — client-side validation that doesn't match server-side constraints
- [ ] Date handling — timezone issues, `toISOString()` vs local date display

**Files to read:**
- All files in `components/` and `app/(protected)/`
- All files in `app/api/`

---

### Agent 4 — UX & Accessibility

**Focus:** Broken user flows, missing states, accessibility gaps.

**Checklist:**
- [ ] Empty states — what does each page show when there's no data?
- [ ] Loading states — skeleton/spinner vs blank page vs flash of wrong content
- [ ] Error states — what happens when an API call fails? Does the user see anything?
- [ ] Mobile layout — components that overflow, touch targets too small, horizontal scroll
- [ ] Keyboard navigation — can all interactive elements be reached via Tab?
- [ ] Aria labels — are buttons, toggles, and custom controls properly labelled?
- [ ] Colour contrast — are text colours readable against their backgrounds?
- [ ] Pro gates — are Pro features consistently gated? Can free users access Pro features via direct URL?
- [ ] Navigation — are there dead ends? Pages with no back button?
- [ ] Toast messages — are success/error messages consistent and helpful?
- [ ] Public profile — does it degrade gracefully when sections are hidden?

**Files to read:**
- All files in `components/` and `app/`
- `docs/disciplines/design-system.md` for expected patterns

---

### Agent 5 — API & Data Integrity

**Focus:** API routes that could corrupt data or return wrong results.

**Checklist:**
- [ ] PATCH/PUT routes — do they validate input before writing?
- [ ] Delete operations — are they cascading correctly? Orphaned records?
- [ ] Duplicate handling — can a user create duplicate entries? (duplicate endorsements, duplicate saved profiles, duplicate photos)
- [ ] Ordering — are sort_order fields maintained correctly during reorder operations?
- [ ] File cleanup — when a record is deleted, is the associated storage file also deleted?
- [ ] Response shape — do API routes return consistent shapes? (some might return `{ data }`, others `{ error }`, others raw)
- [ ] HTTP methods — are routes using the correct method? (GET for reads, POST for creates, PATCH for updates, DELETE for deletes)
- [ ] Concurrent edits — what happens if two tabs edit the same profile?
- [ ] Edge cases — empty strings vs null, zero vs undefined, arrays vs single values

**Files to read:**
- All files in `app/api/`
- All migration files (for constraints, defaults, cascades)

---

### Agent 6 — Performance & Build Health

**Focus:** Things that are slow, wasteful, or will break at scale.

**Checklist:**
- [ ] N+1 queries — loops that make one query per item instead of batching
- [ ] Unindexed filters — queries filtering on columns without indexes
- [ ] Large payloads — `select('*')` or queries that fetch more columns than needed
- [ ] Missing caching — repeated identical queries on the same page
- [ ] Image optimization — are images using Next.js `<Image>` with proper sizing?
- [ ] Bundle size — are heavy libraries imported on pages that don't need them?
- [ ] Server vs client — are components marked `'use client'` that could be server components?
- [ ] Unused imports — dead code that increases bundle size
- [ ] Memory leaks — event listeners or subscriptions without cleanup in useEffect
- [ ] Environment variables — are any hardcoded values that should be env vars?

**Files to read:**
- All files in `app/` and `components/`
- `next.config.ts`
- `package.json` (dependencies)

---

## Pass 1 — Execution Plan

1. Spawn 6 parallel Sonnet agents, one per angle above
2. Each agent reads the relevant files and runs through their checklist
3. Each agent produces a findings report: `pass1/agent-{N}-{angle}.md`
4. Findings classified as CRITICAL / HIGH / MEDIUM / LOW

## Pass 2 — Challenge

1. Spawn challenger agents that review pass 1 findings
2. Challengers verify each finding is real (not a false positive)
3. Challengers look for issues pass 1 missed
4. Challengers upgrade/downgrade severity where appropriate

## Synthesize

Merge all findings into `final_proposal.md` with:
- Prioritized bug list grouped by severity
- Proposed fix sprints (junior or major)
- Dependencies between fixes
- Estimated effort per fix

## Resulting Work

| Sprint | Status | Scope |
|--------|--------|-------|
| — | — | Pending rally completion |

# Rally Specs — Overview & Execution Order

**Date:** 2026-03-17
**Purpose:** Implementation-ready specs for parallel agent execution. Each spec is self-contained — an agent can pick it up and code it without reading other specs.

---

## Folder Structure

```
notes/specs/
├── 00-overview.md              ← You are here
├── 01-critical-bugs.md         ← 7 bugs, exact file:line, exact diffs
├── 02-performance-queries.md   ← Query parallelization, React.cache, getFullProfile
├── 03-loading-architecture.md  ← loading.tsx skeletons for all 5 tabs
├── 04-middleware-auth.md       ← Root middleware.ts for session refresh
├── 05-pwa-offline.md           ← Manifest, icons, service worker, viewport-fit
├── 06-responsive-layout.md     ← App layout max-width, sidebar nav, public profile desktop
├── 07-animation-system.md      ← framer-motion install, bottom sheet, stagger, wizard
├── 08-public-profile-enhancements.md ← OG image, CTAs, endorser role, share text
├── 09-bundle-optimization.md   ← Dead fonts, lazy imports, image optimization
├── 10-growth-features.md       ← Founding badge, sea time, endorse-back, notifications
├── 11-code-quality.md          ← CSS vars, dead code, email sanitize, error boundaries
```

---

## Execution Order & Dependencies

### Wave 1 — No dependencies, can all run in parallel
- **01-critical-bugs** — pure bugfixes, touches many files but each fix is isolated
- **04-middleware-auth** — creates 1 new file, no conflicts
- **09-bundle-optimization** — touches root layout + a few component imports

### Wave 2 — Depends on Wave 1 completing
- **02-performance-queries** — depends on 01 (teal variable fix affects same files)
- **03-loading-architecture** — no hard deps but benefits from 02's restructured queries
- **11-code-quality** — some overlap with 01's CSS variable work

### Wave 3 — Depends on Wave 2
- **06-responsive-layout** — depends on 02 (app layout changes) and 03 (loading files exist)
- **07-animation-system** — install framer-motion first, then touch components

### Wave 4 — Can run after Wave 2
- **05-pwa-offline** — independent but benefits from bundle optimization being done
- **08-public-profile-enhancements** — depends on 02 (public profile query restructure)
- **10-growth-features** — mostly new files/components, low conflict risk

---

## Spec Format Convention

Each spec follows this structure:
1. **Goal** — one sentence
2. **Files to modify** — exact paths
3. **Files to create** — exact paths with full content
4. **Dependencies to install** — exact package names
5. **Implementation steps** — numbered, with exact old→new code diffs
6. **Verification** — how to confirm it works

---

## Agent Instructions

When picking up a spec:
1. Read `AGENTS.md` first (project conventions)
2. Read the spec file
3. Read every file listed in "Files to modify" before changing anything
4. Follow the implementation steps in order
5. Run `npm run build` after changes to verify no type errors
6. Update `CHANGELOG.md` with what you did

**Do NOT:**
- Change files not listed in the spec
- Add features beyond what the spec describes
- Skip reading existing code before editing

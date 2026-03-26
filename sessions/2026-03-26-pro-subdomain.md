---
date: 2026-03-26
agent: Claude Code (Opus 4.6)
sprint: junior/feature-pro-subdomain-link
modules_touched: [profile, onboarding]
---

## Summary
Built the full Pro subdomain feature: wildcard subdomain routing, reserved landing page, handle blocklist (3-layer defense), ProfileHeroCard Pro link row, and abuse suspension flag. Two-phase review caught and fixed middleware auth bypass and client-only handle enforcement. DNS setup is founder-blocked.

---

## Session Log

**Session start** — Reviewed junior sprint readiness. Pro Subdomain ready to build, CV Sharing needs some work, Saved Profiles needs significant planning. Founder chose to start Pro Subdomain.

**DNS deep-dive** — Walked founder through wildcard DNS setup (Vercel + registrar). Analyzed downstream effects at scale (SEO duplicate content, handle squatting, crawl budget, analytics, email deliverability, abuse surface). Updated sprint README with Parts 5-10 covering all these concerns.

**Reserved handle blocklist** — Created `lib/constants/reserved-handles.ts` (~60 handles). Wired into account page and onboarding wizard. Expanded `handle_available()` DB function via migration. Verified zero existing users have conflicts (REST API query against prod). Deployed migration.

**Middleware** — Created root `middleware.ts` integrating subdomain detection with auth routing. Discovered `proxy.ts` was dead code (never imported, old middleware.ts was deleted in a prior commit). Incorporated all proxy.ts logic into new middleware.

**Subdomain route + reserved page** — Built `app/(public)/subdomain/[handle]/page.tsx` with Pro/reserved gating, canonical tags, noindex. Built `reserved.tsx` with Pro benefits and upgrade CTA.

**ProfileHeroCard** — Added Pro subdomain link row with aligned layout (fixed-width spacer column). Pro badge links to billing. Copy works for both Pro and non-Pro.

**Abuse flag** — Added `subdomain_suspended` boolean column to users table. Subdomain route checks it. Deployed migration.

**Phase 1 review (Sonnet)** — Found 5 issues: Pro gate missing expiry check (HIGH), client blocklist diverges from DB (HIGH), show_location default mismatch (MEDIUM), reserved page CTA sends unauthed to /app/billing (MEDIUM), non-Pro can copy Pro URL (LOW). All fixed except last (by design).

**Phase 2 review (Opus)** — Found 2 P1s: middleware subdomain rewrite bypasses auth cookie refresh (fixed: auth runs first, cookies carried through rewrite), reserved handle enforcement is client-only (fixed: added `trg_check_handle_reserved` DB trigger). Deployed trigger migration.

**Drift review** — `npm run drift-check` caught inline Pro gate in profile page. Fixed to use `getProStatus()`. PASS after fix.

**Cleanup** — Deleted dead `proxy.ts`. Synced client blocklist with DB. Removed invalid underscore entries from sprint README.

**Session end** — Feature code-complete. 3 migrations deployed to prod. DNS setup instructions provided to founder.

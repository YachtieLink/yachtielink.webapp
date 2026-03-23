---
date: 2026-03-24
agent: Claude Code (Opus 4.6)
sprint: CV Parse Bugfix Rally (planning) + ad-hoc fixes
modules_touched: [cv-parse, profile, public-profile, network]
---

## Summary

Two-part session: (1) Fixed StrictMode double-fire and rate limit UX, (2) Full founder QA walkthrough documenting 37 bugs across CV parse, profile, public profile, and network. Wrote and reviewed bugfix sprint plan.

---

## Session Log

**Session start** — Pulled repo after CV parse sprint merge (Waves 1-7, 59 files, +5719 lines). Confirmed all on main.

**PDF parse testing** — User reported CV upload not working on Vercel. Diagnosed: not the Hobby 10s timeout (fails faster than 10s). Tested pdf-parse v2 API — exports are correct, multi-page extraction works. Added debug logging to parse-personal route.

**Localhost testing** — Started dev server. User uploaded 3-page CV. Logs confirmed: extraction gets all 3 pages (8261 chars), parse-personal returns 200 in 8.5s, full parse returns 200 in 19.1s. Parsing works — the earlier Vercel failure was the timeout.

**StrictMode double-fire discovered** — Logs showed both routes firing twice. React StrictMode double-mounts in dev, causing 4 API calls instead of 2. Also burns 2x rate limits in Supabase. Fixed with `hasFiredRef` guard on the mount effect.

**Rate limit UX** — User hit 429 on full parse after burning limits from double-fire. Error showed as cryptic failure screen. Added: detect 429 specifically, show amber banner explaining the daily limit, keep personal data from fast parse so user isn't stranded.

**ParseProgress animation** — User noted the progress steps resume correctly when ParseProgress remounts on Step 2 (using `startedAt` prop), but the progress bar does an animated jump from 0% to current position. Needs fix: set initial width without animation on mount.

**Backlog items** — Created `cv-actions-card-redesign.md`: unified card layout, relative timestamps, multi-page uploaded CV viewer, better copy.

**Turbopack crash** — Hit Turbopack cache corruption mid-session. Fixed with `rm -rf .next`.

**Founder QA walkthrough** — Systematic screenshot-by-screenshot review of every screen. 37 bugs documented across:
- Import wizard (Steps 1-5): missing language input, no bio edit, inconsistent dates, unclear yacht matching, non-editable certs/education, broken skills chip UX
- Profile page: sections only allow adding new (not editing existing), new CV parse fields not surfaced, languages not editable
- Public profile: hero missing age/sea time/flag, CV view 404/blank, horizontal scroll, no share/download, yacht names not clickable
- Settings: personal details buried, no individual visibility toggles
- Network: missing yacht graph tab, endorsements/colleagues not grouped by yacht

**Key founder corrections:**
- Yacht flags must be ensigns (Red Ensign variants), not country flag emoji
- Don't classify things as "backlog" when founder says they're bugs to fix
- Nationality label needs work (demonym vs country name)

**Bugfix sprint plan** — Wrote `sprint-cv-parse-bugfix/README.md` with 5 waves, 8 decisions. Subagent review found: missing attachment dedup (Bug 38), duplicate bug (33 removed), recharacterized Bug 3 (route exists, data state issue), Bug 1 merged into 12.

## Bugs Documented

37 bugs in 7 groups — see `sprints/major/phase-1b/sprint-cv-parse-bugfix/README.md` for full inventory.

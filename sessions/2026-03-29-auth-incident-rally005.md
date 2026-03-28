---
date: 2026-03-29
agent: Claude Code (Opus 4.6)
sprint: Rally 005 — Auth Resilience
modules_touched: [middleware, supabase-clients, rate-limit, auth-layouts, polling]
---

## Summary
Production incident: dev server login loop exhausted Supabase rate limit, locking all users out. Diagnosed root cause, shipped 4 hotfix PRs (#108-#111), then ran full 6-agent auth audit (/codebase-rally) and executed Rally 005 with 12 fixes across 11 files (PR #112, merged).

---

## Session Log

**Session start** — Continued from Sprint 11 QA session. Founder testing production login on phone, hit Supabase rate limit error.

**Incident discovery** — Dev server running on localhost with hot-reload was hammering Supabase auth endpoint (1,500+ requests). Same Supabase instance as production. Rate limit exhausted, blocking all production logins.

**Hotfix iteration** — 4 PRs (#108-#111):
1. Added SKIP_AUTH_PREFIXES to middleware → fixed rate limit but broke login redirect
2. Changed login to window.location.href → didn't work (cookies not ready for server)
3. Skipped auth on login/signup routes → broke logged-in user redirect
4. Restored original login + kept public route skip → login working again

**Root cause analysis** — Middleware called getUser() on EVERY request with no error handling. 3-4x calls per page (middleware + layout + page + API). No try-catch meant 429/timeout = 500 crash → redirect loop.

**Auth codebase rally** — Launched 6 parallel agents:
- R1: Auth call site mapping (99+ getUser calls found)
- R1: Cookie & session lifecycle (httpOnly=false, silent Server Component catch)
- R1: Rate limit & cascade risks (initially missed the actual vulnerability)
- R2: Challenged call sites (found missing try-catch, needsAuth logic flaw)
- R2: Challenged cookies (escalated Server Component catch to HIGH, found secure flag missing)
- R2: Challenged rate limits (called out R1's wrong "no critical vulnerabilities" conclusion)

**Rally 005 execution** — 12 fixes in 3 waves:
- Wave 1 (CRITICAL): Middleware try-catch, needsAuth simplification, /api/ excluded from matcher, secure cookies, www redirect
- Wave 2 (HIGH): Layout try-catch, polling jitter (60s→5min), server component logging
- Wave 3 (MEDIUM): AuthStateListener, env guard, Redis error logging

**Build + type-check clean. PR #112 merged.**

**Key learnings:**
- Dev/prod sharing Supabase is a ticking bomb
- Middleware must never crash — always try-catch external calls
- getUser() deduplication is the biggest performance win (60-75% reduction)
- httpOnly cookies impossible with @supabase/ssr (accepted risk)

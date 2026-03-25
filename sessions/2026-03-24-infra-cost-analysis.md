---
date: 2026-03-24
agent: Claude Code (Opus 4.6)
sprint: ad-hoc
modules_touched: []
---

## Summary

Strategy session: full infrastructure cost analysis at 100k users, self-hosting feasibility, and break-even modeling. No code touched. Founder confirmed Vercel Pro is worthwhile and the managed stack is the right call.

---

## Session Log

**Session start** — Founder asked "what's up next?" — ran full status review via Explore subagent. Surfaced active sprint (CV Parse Bugfix, planning stage), 37 bugs across 5 waves, 8 pending design decisions, 4 active junior sprints, Vercel blocker.

**Mid-session — Self-hosting question** — Founder asked whether Vercel Pro ($20/mo) is worth it or if we should build our own deployment. Assessment: self-hosting is doable (weekend of setup) but not worth it pre-launch. No platform lock-in — Next.js runs anywhere, Supabase is standard Postgres, no Vercel-proprietary services in use.

**Mid-session — 100k user cost extrapolation** — Mapped every service with projected costs:
- Current stack at 100k users: ~$620–1,540/mo infrastructure
- Self-hosted alternative (Hetzner + Backblaze B2 + AWS SES + self-hosted analytics): ~$350–600/mo
- Savings: $300–900/mo — not worth the ops overhead against ~€105k/mo revenue (98.5% gross margin)
- Recommendation: keep managed services, self-host commodity stuff (PostHog, Sentry, Redis) on Hetzner when scale justifies it

**Late session — Break-even analysis** — Founder asked when they stop going backward at €200/mo costs. Pricing: €4.99 founding (first 100), €8.99 standard. At 10% Pro conversion and blended avg ~€6.50/mo:
- ~300–400 registered users to break even
- That's one marina, one Facebook group, or one crew agency partnership
- Key insight from founder: Claude subscription (€100/mo) is the biggest cost — more than entire production infra (~€6/mo)

**Decision** — Stick with current stack. Vercel Pro upgrade confirmed worthwhile. No self-hosting for now.

**Session end** — No further work. All findings written to CHANGELOG and STATUS.

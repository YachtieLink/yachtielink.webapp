# YachtieLink

Trust-based professional identity platform for the superyacht crew industry. Crew own their profile, employment history, certifications, and endorsements. The trust graph is the product.

## For Coding Agents

**Read these before doing anything:**

1. `CLAUDE.md` — Operating manual: principles, tech stack, terminology, anti-patterns
2. `CHANGELOG.md` — Cross-agent handover log: what was done, what's next, what to watch out for
3. Relevant docs from `docs/` based on your task

**Update `CHANGELOG.md` at the end of every session.**

## Current Focus

**Phase 1A: portable profile + yacht graph + endorsements** — crew build a profile, attach real yacht history, find colleagues, and collect trusted references. Paid presentation upgrades fund the product, but the yacht-backed graph is the primary long-term asset.

## Tech Stack

Next.js (App Router) / Supabase (Postgres, Auth, Storage, Realtime) / Stripe / Resend / Claude API / PostHog / Cloudflare

## Repository Structure

```
├── app/                 # Next.js App Router pages and API routes
├── lib/                 # Shared utilities (Supabase clients, etc.)
├── public/              # Static assets
├── docs/                # Planning docs — decisions, schemas, specs
├── ops/                 # Operational docs
├── CLAUDE.md            # Agent operating manual
├── CHANGELOG.md         # Cross-agent handover log
└── package.json
```

## Docs

All planning and architectural docs live in `docs/`. See `CLAUDE.md` for the full file map.

## Setup

```bash
npm install
npm run dev
```

Requires `.env.local` with Supabase credentials. See `docs/yl_tech_stack.md` for full stack details.

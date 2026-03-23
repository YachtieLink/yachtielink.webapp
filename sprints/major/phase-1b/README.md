# Phase 1B — Public Polish, Yacht Graph & Launch

> **DRAFT** — This phase plan is a draft outline. Sprint scope and sequencing are subject to change.

**Status:** 📋 Draft
**Theme:** Making YachtieLink beautiful, browsable, and launchable — crew landing pages that make people want to share, the yacht graph that makes the product click, and a public face that gets signups.

---

## Phase Goal

Phase 1A built the engine. Phase 1B makes it shine and ships it.

Three pillars:
1. **Beautiful crew profiles** — Section colours, Salty mascot, scroll animations, OG images, QR polish. Profiles that crew are proud to share on WhatsApp and Instagram.
2. **The yacht graph experience** — Yachts as first-class browsable entities, "who else worked here", network visualisation, sea time calculator. The thing that makes YachtieLink different from a LinkedIn profile.
3. **Launch readiness** — Marketing landing page, production environment, manual QA sign-off, domain config.

Design philosophy: 75% professional, 25% personality. Notion-level energy. AI invisible. Crew first.

---

## Sprints in This Phase

| Sprint | Status | Focus |
|--------|--------|-------|
| [Sprint 11 — Crew Landing Pages + Public Polish](./sprint-11/README.md) | ✅ Shipped | Beautiful public profiles, Salty, section colours, OG images |
| [Sprint 12 — Yacht Graph](./sprint-12/README.md) | 📋 Draft | Yacht pages, crew network, colleague graph, sea time |
| [Sprint 13 — Launch Polish + Marketing](./sprint-13/README.md) | 📋 Draft | Landing page, production env, QA, domain, feature roadmap |
| [Sprint CV-Parse — CV Parse & Populate](./sprint-cv-parse/README.md) | ✅ Shipped | 7-wave build spec co-authored with founder over 2 sessions. 14 new schema fields, 5-step batch-confirm wizard, yacht matching pipeline, pre-flight validation, CV preview/viewer. Specs reviewed and UX-refined. |
| [Sprint CV-Parse Bugfix — Post-Build QA Rally](./sprint-cv-parse-bugfix/README.md) | 📋 Planning | 37 bugs from founder QA walkthrough. 5 waves: data integrity, public profile, wizard UX, profile page, network tab. Plan reviewed. |

---

## Exit Criteria for Phase 1B

- Public profiles look polished enough that crew share them unprompted
- Yacht pages show crew history and mutual connections
- Colleague graph is browsable (even as a list — no D3 required)
- Marketing landing page converts visitors to signups
- Production environment fully configured (Vercel, KV, Sentry, PostHog)
- Manual QA checklist signed off (OAuth, Stripe, emails, mobile Safari)
- CV parse-and-populate audited, fixed, and tested with real CVs
- Ready for Med season soft launch (target: June 2026)

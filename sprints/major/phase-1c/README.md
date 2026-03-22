# Phase 1C — Post-Launch Crew Features

> **RALPH LOOP DRAFT** — Written sequentially by automated planning loop. This is a planning document, not a build spec. Once reviewed and approved by the founder, individual sprints are hardened into full `build_plan.md` files.

**Status:** 📋 Draft
**Theme:** Availability, endorsement depth, crew search, AI-powered convenience, and graph integrity — the features that make YachtieLink indispensable before opening the door to recruiters.

---

## Phase Gate

**Entry requires all of:**
- Phase 1B complete (graph loop healthy, profiles polished, marketing page live, soft launch done)
- 500+ crew profiles (graph has enough density for meaningful search and availability)
- Endorsement-to-profile ratio >0.3 (graph loop is compounding, not stalling)
- Organic share rate >10% (crew are sharing profiles unprompted — the product has pull)
- Soft launch feedback incorporated via junior sprints

---

## Phase Thesis

Phase 1A built the graph engine. Phase 1B made it beautiful and shipped it. **Phase 1C makes the graph useful beyond identity.**

Crew can now signal availability, search for colleagues, get AI assistance writing endorsements and managing certs, and confirm attachments on established yachts. The graph deepens — endorsement signals add community opinion, AI features accelerate profile completion and endorsement quality, and smart yacht matching reduces duplicates that fragment the graph.

This phase is the bridge between "crew build profiles" and "the industry pays to access the network." Every feature here either (a) increases graph density and quality, or (b) makes the crew-side product so useful that crew stay and invite colleagues. By the end of Phase 1C, YachtieLink should be a tool crew check weekly, not just a profile they set and forget.

**Key tension:** Phase 1C introduces crew search (Pro) and endorsement signals — features that brush up against the trust/presentation boundary. Every implementation must be evaluated against D-003 (never monetise trust influence), D-007 (identity free, presentation paid), and D-011 (absence is neutral).

---

## What Phase 1B Delivered (Starting State)

- Polished public profiles with section colours, Salty mascot, scroll animations, OG images
- CV-first onboarding (one file drop → populated profile)
- Yacht graph browsable: yacht detail pages with current/alumni crew, colleague explorer, mutual colleagues, sea time
- Yacht search with duplicate prevention and crew count signals
- Marketing landing page, SEO, static roadmap
- Production environment configured (PostHog, Sentry, Stripe, crons)
- Manual QA signed off, legal pages approved
- Soft launch to 20–50 crew via invite mode

---

## Sprints in This Phase

| Sprint | Status | Focus |
|--------|--------|-------|
| [Sprint 14 — Availability Toggle + Endorsement Signals](./sprint-14/README.md) | 📋 Draft | Crew signal availability (7-day expiry), agree/disagree on endorsements |
| [Sprint 15 — Crew Search (Pro) + Expanded Analytics](./sprint-15/README.md) | 📋 Draft | Pro search by role/yacht/location/availability, enhanced insights tab |
| [Sprint 16 — AI Pack 1](./sprint-16/README.md) | 📋 Draft | Endorsement writer (AI-04), cert OCR (AI-02), multilingual requests (AI-03), profile suggestions (AI-17) |
| [Sprint 17 — Attachment Confirmation + Smart Yacht Autocomplete](./sprint-17/README.md) | 📋 Draft | Established yacht confirmation flow, semantic yacht matching (AI-11) |

---

## Key Decisions Governing This Phase

- **D-003:** Never monetise influence over trust outcomes — endorsement signals, search ranking, and availability must stay outside paid scope
- **D-007:** Identity is free infrastructure; presentation is paid — search is paid because it's recruiter behaviour (D-023), not because it gates identity
- **D-011:** Absence of endorsements is neutral — endorsement signals must not create negative labelling
- **D-019:** Endorsement signals are social proof only — they inform future trust calculations but never remove endorsements
- **D-023:** Search is recruiter behaviour — crew Pro at EUR 12/month, includes database search
- **D-027:** Availability toggle: active opt-in, 7-day expiry, crew control contact method visibility

---

## Phase Exit Criteria

- Availability toggle live with 7-day auto-expiry and day-6 reminder
- Endorsement signals (agree/disagree) functional on endorsements from shared-yacht users
- Pro crew search operational: filter by role, yacht, location, availability
- Expanded analytics tab live for Pro users (anonymised viewer data, trend lines)
- AI Pack 1 shipped: endorsement writer, cert OCR, multilingual requests, profile suggestions
- Established yacht attachment confirmation flow live
- Smart yacht autocomplete (semantic matching) reducing duplicate yacht creation
- All AI features respect cost targets (free <EUR 0.01/user/month, Pro <EUR 0.10/user/month)
- No feature crosses the trust/presentation boundary (D-003, D-007)
- Graph quality metrics stable or improving (duplicate rate, endorsement density, colleague connectivity)
- Platform ready for recruiter access (Phase 2 gate: 10K+ crew, recruiter demand confirmed)

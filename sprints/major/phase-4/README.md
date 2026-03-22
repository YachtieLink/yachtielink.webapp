# Phase 4 — Intelligence & Scale

> **RALPH LOOP DRAFT** — Written sequentially by automated planning loop. This is a planning document, not a build spec. Once reviewed and approved by the founder, individual sprints are hardened into full `build_plan.md` files.

**Status:** 📋 Draft
**Theme:** The platform becomes intelligent. AI career tools give crew personalised guidance that no human agent can match at scale. Advanced AI features (voice onboarding, photo coaching, cover letters, interview prep) deepen the Pro value proposition. And the verified status system replaces admin-dependent moderation with community-driven trust governance — the graph moderates itself.

---

## Phase Gate

**Entry requires all of:**
- Phase 3 complete (messaging, notifications, multilingual, timeline, IRL connections all operational)
- Platform engagement healthy: daily active users growing, timeline activity meaningful (not just milestones), messaging adopted
- AI infrastructure stable: Sprint 16's `lib/ai/` layer and Sprint 20's embedding pipeline handling production load within cost targets
- Graph density mature: median crew member has 8+ colleagues, 3+ endorsements, at least 1 contact
- Moderation need demonstrated: enough scale that admin-only moderation is becoming a bottleneck (attachment confirmations, reports, flags accumulating faster than one person can review)
- Revenue stable: Crew Pro + Recruiter + Agency revenue covering operating costs

---

## Phase Thesis

Phase 1 built the graph. Phase 2 monetised it. Phase 3 made it social. **Phase 4 makes it intelligent and self-governing.**

Two parallel tracks:

**Intelligence:** AI stops being a convenience layer and becomes a career advisor. Cert intelligence tells you which qualification to renew before season. Season readiness scores tell you if your profile is competitive. The endorsement portfolio advisor tells you which colleague to ask for the most impactful endorsement. Gap analysis tells you how a recruiter will read your timeline. Voice onboarding lets crew build a profile by talking. These features make Crew Pro feel like having a personal crewing agent — for EUR 12/month.

**Self-governance:** The platform replaces admin-dependent moderation with community-driven trust. Verified status is earned — through tenure, endorsement density from other verified users, or seed-set membership (D-016). Verified users can confirm attachments on established yachts (already scaffolded in Sprint 17 with `is_trusted_user()`), vote on account flags, and participate in expanded moderation. This is the transition from "the founder reviews every escalation" to "the graph moderates itself."

**Key tension:** AI features must stay on the presentation/convenience side of the trust boundary. Cert intelligence improves how a crew member manages their career — it doesn't affect how trustworthy they appear. Season readiness is a private score — never shown to recruiters. Endorsement portfolio advisor suggests who to request endorsements from — it doesn't write fake ones. Every AI feature must be evaluated against D-003 (never monetise trust influence) before shipping.

---

## What Phase 3 Delivered (Starting State)

- **Messaging & contacts** — contact relationships (non-graph per D-029), 1:1 DMs via Supabase Realtime (Sprint 21)
- **In-app notifications** — bell icon, real-time delivery, central `createNotification()` service, dual email+in-app channels (Sprint 22)
- **Multilingual profiles** — AI-10 auto-translation of bio and endorsement text, cached per content hash + language (Sprint 22)
- **Timeline** — chronological network-bounded feed, auto-generated milestones, user posts, wave reactions (Sprint 23)
- **IRL connections** — mutual confirmation, graph edges, public/private visibility, right of exit (Sprint 23)
- **`get_network()` RPC** — union of colleagues + IRL connections (Sprint 23)
- Full communication stack: contacts, messaging, notifications, multilingual — crew have reasons to return daily

---

## Sprints in This Phase

| Sprint | Status | Focus |
|--------|--------|-------|
| [Sprint 24 — AI Career Tools](./sprint-24/README.md) | 📋 Draft | AI-05 cert intelligence, AI-06 season readiness, AI-09 portfolio advisor, AI-12 gap analyzer |
| [Sprint 25 — Advanced AI](./sprint-25/README.md) | 📋 Draft | AI-14 voice onboarding, AI-18 photo coach, AI-19 cover letter, AI-20 interview prep |
| [Sprint 26 — Verified Status + Community Moderation](./sprint-26/README.md) | 📋 Draft | Earned verification, moderation delegation, AI-21 sentiment analysis |

---

## Key Decisions Governing This Phase

- **D-003:** Never monetise influence over trust outcomes — AI career tools improve presentation and career management, never trust signals
- **D-007:** Identity is free infrastructure; presentation is paid — AI career tools are Pro features because they improve how a crew member manages their career, not because they gate identity
- **D-015:** Consensus-based moderation — moderation decisions resolved by community vote, not admin judgment
- **D-016:** Verified status chain of trust — earned via seed set, endorsements from verified users, or tenure+density. Not purchasable.
- **D-011:** Absence of endorsements is neutral — AI features that analyse endorsement portfolios must frame gaps as opportunities, never as deficits

---

## AI Feature Architecture

All Phase 4 AI features build on the shared infrastructure established across earlier sprints:

| Infrastructure | Source Sprint | Reused In Phase 4 |
|---------------|-------------|-------------------|
| `lib/ai/openai-client.ts` | Sprint 16 | All AI features |
| `lib/ai/cost-tracker.ts` + `ai_usage_log` | Sprint 16 | Cost monitoring for all new features |
| `lib/ai/rate-limiter.ts` | Sprint 16 | Rate limits per feature |
| `POST /api/ai/translate` | Sprint 16 | Voice onboarding multilingual support |
| pgvector + embeddings | Sprint 17/20 | Endorsement analysis, portfolio advisor |
| `profile_translations` cache | Sprint 22 | Voice-extracted profile data |
| `createNotification()` | Sprint 22 | AI-generated alerts and recommendations |

**Cost targets:**
- Pro AI features: <EUR 0.10/user/month (unchanged from Phase 1C)
- Voice onboarding (AI-14): EUR 0.30/conversation (one-time, justified by activation value)
- Endorsement sentiment analysis (AI-21): EUR 0.0001/endorsement (batch, negligible)

---

## Phase Exit Criteria

- AI career tools live: cert intelligence, season readiness, portfolio advisor, gap analyzer (all Pro)
- Advanced AI features live: voice onboarding (free one-time + Pro re-run), photo coach (Pro), cover letter generator (Pro), interview prep (Pro)
- Verified status system operational: earned through tenure + endorsement density, not purchased
- Verified users can confirm attachments (replaces Sprint 17's `is_trusted_user()` heuristic)
- Community moderation: account flag voting (D-018), endorsement abuse handling via verified user consensus
- AI-21 endorsement sentiment analysis providing recruiter-tier depth indicators
- Admin moderation workload reduced: community handles routine cases, admin intervenes only on escalations
- All AI features respect cost targets and the trust/presentation boundary (D-003)
- Platform self-sustaining: graph moderates itself, AI guides careers, revenue covers costs

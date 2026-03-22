# Phase 3 — Communication & Social

> **RALPH LOOP DRAFT** — Written sequentially by automated planning loop. This is a planning document, not a build spec. Once reviewed and approved by the founder, individual sprints are hardened into full `build_plan.md` files.

**Status:** 📋 Draft
**Theme:** The graph becomes a living network. Crew communicate directly, receive real-time notifications, read profiles in their own language, share career milestones, and connect with colleagues they meet in person. The platform evolves from a professional identity tool with hiring features into an active social-professional network — without becoming a social media feed.

---

## Phase Gate

**Entry requires all of:**
- Phase 2 complete (peer hiring, recruiter access, agency plans, NLP search all operational)
- Revenue flowing through both crew Pro and recruiter/agency channels (validates the business model works)
- User engagement metrics healthy: weekly return rate >30%, endorsement requests flowing, positions being posted and filled
- Graph density sufficient for meaningful network-bounded content: median crew member has 5+ colleagues across 2+ yachts
- No outstanding graph integrity issues: attachment confirmation working, duplicate rate stable, endorsement signal abuse low

---

## Phase Thesis

Phase 1 built the graph. Phase 2 monetised it. **Phase 3 makes the graph feel alive.**

Until now, YachtieLink is something crew use when they need something: build a profile, request an endorsement, search for a position, toggle availability. Phase 3 introduces reasons to come back daily: messages from colleagues, notifications about endorsement activity, a timeline of career events in your network, and the ability to connect with people you meet at industry events.

The constitutional guardrails are critical here. Messaging uses contacts, which are explicitly non-graph (D-029) — they don't create trust, endorsements, or colleague edges. The timeline is strictly chronological (D-031) — no algorithmic surfacing, no trending, no engagement-weighted ranking. IRL connections create graph edges (D-028) but require mutual confirmation (D-032) and anyone can remove themselves at any time (D-033). These aren't constraints — they're what makes YachtieLink different from LinkedIn or Instagram. The network is bounded by reality, not by engagement optimisation.

**Key tension:** Adding social features risks transforming a trust network into a social media platform. Every feature in Phase 3 must be evaluated against: "Does this encourage truthful professional behaviour, or performative social behaviour?" If a feature would be at home on Instagram, it doesn't belong here.

---

## What Phase 2 Delivered (Starting State)

- **Peer hiring** — crew post positions, others apply with their profile, graph proximity on every card (Sprint 18)
- **Recruiter access** — separate accounts, EUR 29/month subscription, credit system, profile unlock, recruiter-specific search (Sprint 19)
- **Agency plans** — multi-seat accounts, shared credit pools, shortlists, bulk unlock, CSV export (Sprint 20)
- **NLP crew search** — natural language queries, semantic vector search, AI-generated match explanations (Sprint 20)
- **Profile embeddings** — crew profiles + endorsement text embedded in pgvector for semantic search (Sprint 20)
- **Graph proximity RPC** — `get_graph_proximity()` reusable utility showing mutual colleagues, shared yachts, endorsement overlap (Sprint 18)
- Revenue flowing through Crew Pro (EUR 12/month), Recruiter Subscription (EUR 29/month), and Credits

---

## Sprints in This Phase

| Sprint | Status | Focus |
|--------|--------|-------|
| [Sprint 21 — Messaging & Contacts](./sprint-21/README.md) | 📋 Draft | Contact relationships (non-graph), DMs between contacts, message infrastructure |
| [Sprint 22 — Notifications + Multilingual](./sprint-22/README.md) | 📋 Draft | In-app notification system, push notifications, AI-10 profile translation |
| [Sprint 23 — Timeline & Community](./sprint-23/README.md) | 📋 Draft | Chronological network-bounded timeline, career milestones, IRL connections |

---

## Key Decisions Governing This Phase

- **D-028:** Graph edges are reality-bound — created only by shared employment (colleagues) or verified in-person encounters (IRL connections). Messaging alone is not evidence of professional proximity.
- **D-029:** Contacts are non-graph — they exist for messaging and limited timeline visibility only. Contacts never create trust, endorsements, or graph edges.
- **D-030:** Graph-bounded timeline permitted — chronological, visibility bounded to user's network. No public engagement loop.
- **D-031:** No algorithmic surfacing in timeline — strictly chronological ordering. Trending, boosting, virality, and engagement-weighted ranking are prohibited.
- **D-032:** Interactions as first-class objects — in-person encounters require mutual confirmation. May be public or private.
- **D-033:** Absolute right of exit — any participant may remove themselves from an interaction or post at any time, removing their association everywhere.
- **D-034:** Non-crew professionals allowed — yachting professionals beyond crew participate under identical rules.

---

## Design Principles for Phase 3

These supplement the project's core decision principles for the specific risks introduced by social features:

1. **Communication, not engagement.** Messaging and notifications exist to facilitate real professional conversations, not to maximise time-on-platform. No read receipts. No "online" indicators. No typing indicators. These create social pressure that doesn't serve crew.

2. **Network-bounded, not public.** Timeline visibility is bounded to your graph (colleagues + contacts). There is no public feed, no discover tab, no trending section. Content stays within the network that produced it.

3. **Chronological, always.** The timeline shows what happened, in the order it happened. No re-ordering for engagement. If a post from 3 days ago is "more interesting" than one from 1 hour ago, the user scrolls to it. The feed respects time, not attention.

4. **Revocable participation.** Every social feature has an exit: uncontact, leave a conversation, remove yourself from a post, delete an IRL connection. Consent is continuous, not one-time.

---

## Phase Exit Criteria

- Messaging: crew can add contacts and exchange DMs; contacts are non-graph (D-029)
- Notifications: in-app bell icon with notification list; push notifications for key events (if native app available, otherwise email remains)
- Multilingual profiles: profile content auto-translated for viewers in different languages (AI-10)
- Timeline: chronological feed of career milestones and posts, bounded to user's network (D-030, D-031)
- IRL connections: mutual confirmation creates graph edges from in-person encounters (D-028, D-032)
- Right of exit honoured everywhere: users can remove themselves from any interaction or post (D-033)
- No algorithmic surfacing, trending, or engagement optimisation anywhere in the product
- Platform ready for Phase 4's intelligence and scale features (AI career tools, advanced AI, verified status)

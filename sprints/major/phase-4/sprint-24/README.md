# Sprint 24 — AI Career Tools

> **RALPH LOOP DRAFT** — Written sequentially by automated planning loop. Each sprint reads and builds on the preceding sprint's output. This is a planning document, not a build spec. Once reviewed and approved by the founder, a separate session hardens this into a full `build_plan.md`.

**Phase:** 4
**Status:** 📋 Draft
**Started:** —
**Completed:** —
**Builds on:** Sprint 23 (timeline, IRL connections, `get_network()` RPC) — crossing Phase 3 → Phase 4 boundary. Also builds on Phase 4 README (AI infrastructure reuse table, cost targets).

## Goal

Transform YachtieLink from a tool crew use reactively into one that proactively guides their career. Four AI-powered Pro features ship together: cert expiry intelligence that connects qualification management to career progression (AI-05), a season readiness score that tells crew exactly what to do before Med or Caribbean season (AI-06), an endorsement portfolio advisor that identifies which colleagues to request endorsements from (AI-09), and a yacht history gap analyzer that helps crew present clean timelines (AI-12). All four use GPT-5 Nano, reuse Sprint 16's `lib/ai/` infrastructure, deliver insights via Sprint 22's notification system, and respect the canonical rule: AI improves career management, never trust signals. These features make Crew Pro feel like having a personal crewing agent — for EUR 12/month.

## Scope

**In:**
- AI-05: Cert Expiry Intelligence — monthly analysis + on-demand, cross-references role/yacht size/cert portfolio (Pro, GPT-5 Nano)
- AI-06: Season Readiness Score — percentage score + prioritised checklist, triggered 6–8 weeks before season (Pro, GPT-5 Nano)
- AI-09: Endorsement Portfolio Advisor — identifies strategic gaps, suggests specific colleagues to request from (Pro, GPT-5 Nano + text-embedding-3-small)
- AI-12: Yacht History Gap Analyzer — flags gaps and short stints, suggests how to address them (Pro, GPT-5 Nano)
- Shared cert knowledge base: structured reference file of cert requirements by role and flag state (updatable without model changes)
- Career goals field: optional "Target role" and "Target yacht size" fields on user profile (feeds into AI-05 and AI-06)
- Delivery via Sprint 22's `createNotification()` for proactive alerts + in-app cards for on-demand results

**Out:**
- AI-13 Smart Endorsement Requests (complements AI-09 but is a separate feature — deferred)
- AI-15 AI Profile Insights (narrative analytics — overlaps with Sprint 15 analytics, defer to avoid redundancy)
- AI-16 Weekly Job Market Pulse (requires web search API — higher cost, separate sprint)
- Career goal tracking over time (future — store goals but don't track progress for V1)
- Cert renewal booking or scheduling (the platform advises, it doesn't transact)
- Recruiter-visible career scores or readiness indicators (all outputs are private to the crew member — D-003)
- AI-generated endorsement text based on portfolio analysis (AI-09 suggests who to ask, not what they should write — that's AI-04)

## Dependencies

- Sprint 23 complete: Phase 3 delivered, platform has active user base with rich profile data
- Sprint 16 complete: `lib/ai/openai-client.ts`, `lib/ai/cost-tracker.ts`, `lib/ai/rate-limiter.ts`, `ai_usage_log` table
- Sprint 22 complete: `createNotification()` service for proactive alerts, notification delivery infrastructure
- Sprint 20 complete: pgvector + text-embedding-3-small infrastructure (reused by AI-09 for endorsement analysis)
- `certifications` table with cert type, issue date, expiry date — exists from Sprint 3
- `endorsements` table with endorser, recipient, yacht, text — exists from Sprint 5
- `attachments` table with yacht, role, dates — exists from Sprint 2–4
- `get_colleagues()` RPC — exists from Sprint 4/12 (for AI-09 colleague suggestions)
- `get_sea_time_detailed()` RPC — exists from Sprint 12 (for AI-12 timeline analysis)
- Cron infrastructure from Sprint 8 (monthly AI-05 analysis, seasonal AI-06 triggers)
- Stripe Pro check from Sprint 7 (all four features are Pro-gated)

## Key Deliverables

### Career Goals Fields

- ⬜ `target_role` text column on `users` table (optional — e.g., "Chief Officer", "Head Chef")
- ⬜ `target_yacht_size` text column on `users` table (optional — e.g., "50m+", "30-50m")
- ⬜ Settings UI: "Career Goals" section in profile settings with target role typeahead (from seeded role list) and yacht size dropdown
- ⬜ These fields feed into AI-05 and AI-06 — if not set, the AI uses current role and yacht size history as proxy

### Cert Knowledge Base

- ⬜ `lib/ai/knowledge/cert-requirements.json` — structured file mapping:
  - Role → required certs (e.g., "Chief Officer 3000GT" → ["Master 3000GT or Chief Mate 3000GT", "GMDSS/GOC", "ECDIS", "Radar/ARPA", "STCW Advanced Fire Fighting", "Medical Care", "ENG1"])
  - Flag state → additional requirements (e.g., "Cayman Islands" → "MCA Oral Exam")
  - Yacht size bracket → typical cert expectations
- ⬜ Maintained as a JSON file, not baked into prompts — updatable by editing the file without changing model calls
- ⬜ Seeded with major roles across Deck, Engineering, Interior, and Galley departments
- ⬜ Loaded into AI-05 and AI-06 system prompts as structured context

### AI-05 — Cert Expiry Intelligence

- ⬜ Trigger: monthly cron for all Pro users + on-demand "Check my certs" button in cert manager
- ⬜ Inputs: user's certs (type, expiry), target role (or current role), target yacht size (or history), cert knowledge base
- ⬜ API call: GPT-5 Nano with system prompt + user cert data + knowledge base context
- ⬜ System prompt: analyse cert portfolio against role requirements, identify (1) expiring certs with career impact, (2) missing certs for target role, (3) renewal priorities ranked by urgency
- ⬜ Output: structured JSON parsed into in-app card:
  - 1–3 priority alerts (e.g., "GMDSS expires in 45 days — renew before Med season")
  - 0–2 gap recommendations (e.g., "Adding ECDIS would qualify you for Chief Officer positions on 50m+")
  - Overall cert health status: "Up to date" / "Action needed" / "Critical renewals"
- ⬜ Delivery: in-app card in cert manager section + notification via `createNotification()` for critical alerts + optional monthly email digest
- ⬜ API route: `POST /api/ai/cert-intelligence` — Pro-gated
- ⬜ Rate limit: 5 on-demand checks/day (monthly cron is automatic)
- ⬜ Cost: ~EUR 0.001/analysis
- ⬜ Does NOT verify certs or make claims about validity — advisory only
- ⬜ Disclaimer: "This guidance is based on typical requirements. Check with your flag state authority for official requirements."

### AI-06 — Season Readiness Score

- ⬜ Trigger: automatic 6–8 weeks before season (Med: mid-March cron; Caribbean: mid-September cron). Re-generated weekly until season starts. On-demand via "Am I ready?" button on dashboard.
- ⬜ Inputs: profile completeness (photo, bio, yacht count, cert count, endorsement count), cert expiry dates vs season dates, endorsement recency, availability toggle status, target role, employment history gaps
- ⬜ API call: GPT-5 Nano with system prompt + user data
- ⬜ Output: structured JSON:
  - Percentage score (0–100, e.g., "82% season-ready")
  - 3–5 prioritised actionable items with direct deep links:
    - "Toggle your availability — you're not visible to recruiters" → deep link to availability toggle
    - "Request an endorsement from your most recent captain" → deep link to endorsement request flow
    - "Your ENG1 expires mid-season" → deep link to cert manager
    - "Add a profile photo — profiles with photos get 3x more views" → deep link to photo upload
  - Season context: "Med season 2027 starts in 6 weeks"
- ⬜ Delivery: in-app card on dashboard/home screen + notification when first generated + optional email
- ⬜ API route: `POST /api/ai/season-readiness` — Pro-gated
- ⬜ Score is **private** — never shown to other users, recruiters, or in search results (D-003)
- ⬜ Does NOT affect search ranking, trust weight, or profile visibility
- ⬜ Cost: ~EUR 0.001/check

### AI-09 — Endorsement Portfolio Advisor

- ⬜ Trigger: on-demand via "Improve my endorsements" button in the Audience/endorsements tab + monthly nudge notification for Pro users
- ⬜ Inputs: current endorsements (endorser role, department, yacht), full colleague graph, endorsement request history (avoid re-suggesting declined/ignored requests), target role
- ⬜ Analysis: embed existing endorsements via text-embedding-3-small to understand coverage; use GPT-5 Nano to identify gaps
- ⬜ Output: 2–4 specific recommendations with reasoning:
  - "You have 4 endorsements from fellow stewardesses but none from a captain. You overlapped with Captain James on MY Horizon for 8 months — request one." → deep link to endorsement request pre-filled
  - "Your 3 most recent yachts have no endorsements. Recent endorsements are most relevant." → deep link to request flow
  - "Strong Deck coverage — consider a cross-department endorsement from Engineering." → deep link
- ⬜ Recommendations link directly to the endorsement request flow with the suggested colleague pre-filled
- ⬜ Framing: always opportunity, never deficit (D-011: absence is neutral). "You could strengthen your portfolio by..." not "Your endorsements are weak."
- ⬜ API route: `POST /api/ai/portfolio-advisor` — Pro-gated
- ⬜ Rate limit: 3 analyses/day
- ⬜ Does NOT affect endorsement eligibility, trust weight, or search ranking
- ⬜ Cost: ~EUR 0.001/analysis

### AI-12 — Yacht History Gap Analyzer

- ⬜ Trigger: on-demand via "Review my timeline" button in employment history section + one-time prompt after profile setup is complete (for new users)
- ⬜ Inputs: all employment attachments (yacht, role, start date, end date) in chronological order
- ⬜ API call: GPT-5 Nano with system prompt + timeline data
- ⬜ Output: 1–3 observations with suggestions:
  - "6-month gap between MY Atlas (ended March 2024) and MY Coral (started September 2024). Consider adding any freelance, refit, or training work from that period."
  - "6-week stint on MY Phoenix — short stints are common for day work or relief. You may want to note the context."
  - "Strong timeline: 4 vessels over 6 years with no significant gaps. No changes needed."
- ⬜ Suggestions are advisory — the tool doesn't add or modify attachments, it suggests what the user might add
- ⬜ Does NOT penalise gaps or short stints — frames them as presentation opportunities
- ⬜ Does NOT surface analysis to recruiters or other users — completely private (D-003)
- ⬜ API route: `POST /api/ai/gap-analyzer` — Pro-gated
- ⬜ Rate limit: 5 analyses/day
- ⬜ Cost: ~EUR 0.0005/analysis

### Database Migration

- ⬜ `ALTER TABLE users ADD COLUMN target_role text`
- ⬜ `ALTER TABLE users ADD COLUMN target_yacht_size text`
- ⬜ No new tables needed — AI results are transient (displayed in UI cards, not stored). Notifications for proactive alerts use the existing `notifications` table (Sprint 22).
- ⬜ If caching of AI results is needed for performance: `ai_career_insights` table with `user_id`, `insight_type`, `result_json`, `generated_at`, `expires_at` — cache for 24 hours, regenerate on demand

### PostHog Events

- ⬜ `ai_cert_intelligence_generated` with alert_count, gap_count, cert_health_status
- ⬜ `ai_cert_intelligence_action_taken` with action_type (renewed, added, dismissed)
- ⬜ `ai_season_readiness_generated` with score, item_count, season
- ⬜ `ai_season_readiness_action_taken` with action_type
- ⬜ `ai_portfolio_advisor_generated` with recommendation_count
- ⬜ `ai_portfolio_advisor_request_sent` (user followed through and sent an endorsement request)
- ⬜ `ai_gap_analyzer_generated` with gap_count, short_stint_count
- ⬜ `ai_gap_analyzer_attachment_added` (user added a missing attachment after analysis)

## Exit Criteria

- Cert intelligence: Pro users see cert health analysis with expiry alerts and gap recommendations
- Season readiness: percentage score + actionable checklist generated before Med/Caribbean season
- Portfolio advisor: specific colleague recommendations with deep links to endorsement request flow
- Gap analyzer: timeline analysis with gap/short-stint observations and advisory suggestions
- All four features Pro-gated with graceful free-user CTA ("Upgrade to Pro for career intelligence")
- Career goals fields available in profile settings, feeding into AI-05 and AI-06
- Cert knowledge base loaded from structured JSON file, not baked into prompts
- Proactive alerts delivered via `createNotification()` (monthly cert check, seasonal readiness)
- All outputs are private to the crew member — nothing visible to recruiters or other users
- AI cost tracked in `ai_usage_log`; all features within EUR 0.10/user/month Pro target
- All components work at 375px width (mobile-first)
- PostHog events firing for generation, actions taken, and conversion funnel (analysis → action)
- No AI feature affects endorsement eligibility, trust weight, search ranking, or profile visibility

## Estimated Effort

7–9 days

## Notes

**Four features, one pattern.** All four AI career tools follow the same architecture: (1) gather user data from existing tables, (2) call GPT-5 Nano with a structured system prompt + user context, (3) parse structured JSON output, (4) display as an in-app card with deep links to actions. The shared `lib/ai/` infrastructure handles API calls, rate limiting, cost tracking, and error handling. The main differentiation is in the system prompts and the input data. This means the sprint can be parallelised: each feature is an independent API route + UI card.

**The cert knowledge base is the most maintainable approach.** Baking cert requirements into GPT prompts creates a maintenance nightmare — every time MCA changes a requirement or a new flag state cert appears, you'd need to update and redeploy prompts. A JSON file loaded into the system prompt at runtime is editable by anyone, version-controlled, and takes effect immediately. The knowledge base should be seeded with the 15–20 most common role/cert combinations and expanded based on user feedback.

**Season readiness drives engagement at the perfect moment.** The cron timing (6–8 weeks before season) coincides with when crew start thinking about their next position. A notification saying "You're 72% ready for Med season — here's what to do" creates urgency without being pushy. Track the funnel: readiness score generated → action taken → profile updated → position applied → hired. This is the Pro conversion story in one feature.

**AI-09 framing is critical (D-011).** The endorsement portfolio advisor MUST frame everything as opportunity, never as deficit. "You could strengthen your portfolio by requesting from Captain James" — not "Your endorsements are insufficient." The system prompt guardrails need explicit instructions: never use words like "weak", "insufficient", "lacking", "poor". Absence of endorsements is neutral. The advisor suggests how to improve, not what's wrong.

**Hardest technical challenge:** AI-09's endorsement analysis needs to cross-reference the colleague graph, existing endorsements, and past request history to avoid suggesting someone the user already asked (and was declined). This requires JOINing across `endorsements`, `attachments`, and `endorsement_requests` tables, filtering out already-endorsed colleagues and recently-requested-but-not-responded colleagues. The data assembly is more complex than the AI call itself.

**Next sprint picks up:** Sprint 25 introduces advanced AI features — voice onboarding (AI-14), photo coach (AI-18), cover letter generator (AI-19), and interview prep (AI-20). These are higher-cost, higher-value features that deepen the Pro subscription's worth. Voice onboarding (AI-14) is the standout: a free one-time use that dramatically improves activation for crew who are more comfortable speaking than typing.

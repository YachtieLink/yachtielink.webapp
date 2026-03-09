# Yachtielink Tech Stack (Phase 1)

**Version:** 1.1  
**Date:** 2026-01-28  
**Status:** Pre-build  
**Philosophy:** Bootstrap now, upgrade to enterprise grade when revenue allows

---

## Core Infrastructure

| Component | Service | Tier | Cost (Phase 1) | Cost (10k paying) | Notes |
|-----------|---------|------|----------------|-------------------|-------|
| **Hosting** | Vercel | Free â†’ Pro | Free | ~â‚¬20/mo | Upgrade to Pro before public beta |
| **Frontend** | Next.js 14 (App Router) | â€” | Free | Free | React framework |
| **Backend** | Next.js API Routes | â€” | Free | Free | Serverless functions |
| **Database** | Supabase Postgres | Free â†’ Pro | Free | â‚¬25-50/mo | Upgrade to Pro for backups before beta |
| **Authentication** | Supabase Auth | Included | Free | Included | Google OAuth, Apple OAuth, email/password |
| **File Storage** | Supabase Storage | Included | Free | Included | Profile photos, certs, yacht images |
| **Real-time Messaging** | Supabase Realtime | Free tier | Free | Free (migrate if >200 concurrent) | WebSocket messaging between contacts |

---

## Payments & Email

| Component | Service | Tier | Cost (Phase 1) | Cost (10k paying) | Notes |
|-----------|---------|------|----------------|-------------------|-------|
| **Payments** | Stripe | Pay-per-transaction | 1.5% + â‚¬0.25 | ~â‚¬2,273/mo in fees | EU VAT handling included |
| **Transactional Email** | Resend | Free â†’ Paid | Free | ~â‚¬20/mo | Account creation, notifications, password resets |
| **Founder Email** | Google Workspace | Business Starter | â‚¬5.75/mo | â‚¬5.75/mo + future hires | ari@yachtie.link mailbox |
| **DNS** | Cloudflare | Free | Free | Free | DNS hosting + email routing |

---

## Supporting Services

| Component | Service | Tier | Cost (Phase 1) | Cost (10k paying) | Notes |
|-----------|---------|------|----------------|-------------------|-------|
| **CV Parsing** | Claude API (Sonnet) | Pay-per-use | ~€0.02/parse | ~€200/mo (10k parses) | LLM-based CV extraction for onboarding |
| **PDF Generation** | @react-pdf/renderer | Open source | Free | Free | Profile PDF exports (upgrade path below) |
| **Image Optimization** | Vercel next/image | Built-in | Free | Included | Automatic image optimization |
| **Analytics** | PostHog | Free cloud | Free | Free (1M events/mo) | Product analytics for tripwire metrics |
| **Web Analytics** | Vercel Analytics | Free tier | Free | Included | Basic web vitals |
| **Error Tracking** | Sentry | Free tier | Free | Free (5k events/mo) | Application monitoring |
| **Rate Limiting** | Vercel KV (Upstash) | Free tier | Free | ~â‚¬5-10/mo | PDF generation limits, API abuse prevention |
| **Search** | Postgres FTS + pg_trgm | Built-in | Free | Included | Fuzzy name/yacht/role search |
| **Background Jobs** | Supabase Edge Functions + pg_cron | Included | Free | Included | Scheduled tasks, async work |
| **QR Codes** | qrcode.react | Open source | Free | Free | Profile sharing QR codes |
| **Custom Subdomains** | Vercel + Wildcard DNS | Built-in | Free | Included | username.yachtie.link routing |

---

## Media Storage (Timeline)

Timeline posts and interactions introduce additional media storage:
- **Bucket:** Supabase Storage (separate bucket for timeline media)
- **Access:** Signed URLs; no public listing
- **Limits:** Enforce per-user quotas and per-file size caps (see `yl_security.vNext.md`)
- **Retention:** Delete media when content is deleted or a user exits an interaction

Scaling consideration: media volume is the first likely cost inflection after messaging.

---

## Environments

| Environment | Hosting | Database | Purpose |
|-------------|---------|----------|---------|
| **Local** | localhost:3000 | Supabase CLI (local) | Development |
| **Staging** | Vercel Preview | Supabase project (staging) | Pre-production testing |
| **Production** | Vercel Production | Supabase project (prod) | Live system |

**Note:** Vercel preview deployments are automatic per PR. Staging Supabase project is separate from production for full isolation.

---

## Domains

| Domain | Purpose | Registrar | Annual Cost |
|--------|---------|-----------|-------------|
| yachtie.link | Primary domain | TBD | ~â‚¬15/year |
| yachtielink.com | Redirect to yachtie.link | TBD | ~â‚¬10/year |

---

## Total Cost Summary

| Phase | Monthly Cost | Notes |
|-------|--------------|-------|
| **Phase 1 (alpha)** | ~â‚¬6/mo | Google Workspace only |
| **Phase 1 (public beta)** | ~â‚¬31/mo | Add Supabase Pro for backups |
| **10k paying users (100k total)** | ~â‚¬90-165/mo | Before Stripe transaction fees (~â‚¬2,273/mo) |

**Revenue at 10k paying:** â‚¬129,900/mo  
**Gross margin:** 98%+ (excluding transaction fees)

---

## Technical Decisions

### Search: Postgres FTS + pg_trgm

Using Postgres full-text search with the pg_trgm extension for fuzzy matching. This handles:
- Exact and prefix matching (FTS)
- Typo tolerance and similarity matching (pg_trgm)
- Queries like "Lady M" finding "Lady Mary"

**Upgrade path:** Typesense (free tier: 25k docs) if search UX feels limited.

### Background Jobs: Supabase Edge Functions + pg_cron

Scheduled and async work handled by:
- **pg_cron** for scheduling (built into Supabase)
- **Edge Functions** for execution (serverless, can call external APIs)

Use cases:
- Tripwire metric calculations (daily/weekly)
- Async PDF generation if timeout risk
- Email queue processing

**Upgrade path:** Inngest or Trigger.dev if workflows become complex.

### PDF Generation: @react-pdf/renderer (with checkpoint)

Starting with @react-pdf/renderer for profile PDF exports. 

**Checkpoint:** Before premium templates become a paid feature, evaluate output quality. If insufficient, upgrade to:
- **Puppeteer** (self-hosted, full CSS control)
- **DocRaptor/PDFShift** (hosted, ~â‚¬15-50/mo)

### Rate Limiting: Vercel KV

Using Vercel KV (Upstash Redis) for rate limiting:
- PDF generation limits
- API abuse prevention
- Works across serverless instances

### CV Parsing: Claude API

LLM-based extraction of structured data from uploaded CVs (PDF/DOCX).

**Flow:**
1. Extract text from uploaded file (pdf-parse for PDF, mammoth for DOCX)
2. Send to Claude Sonnet with structured extraction prompt
3. Parse JSON response into profile fields
4. User reviews and confirms

**Libraries:**
- `pdf-parse` — PDF text extraction
- `mammoth` — DOCX text extraction  
- `@anthropic-ai/sdk` — Claude API client

**Cost:** ~€0.01-0.03 per parse (Sonnet). Budget €0.05 max.

**Rate limit:** 3 CV parses per user per day (prevent abuse).

**Fallback:** If extraction fails or times out (8s limit), skip silently to manual entry. No error shown to user.

**Why Claude over alternatives:**
- Handles messy yacht CV formats better than regex/template approaches
- No training data needed
- Flexible to format variations
- Already in stack for other potential uses

### Messaging Monitoring: PostHog Events

WebSocket session events tracked in PostHog:
- `messaging.session.opened`
- `messaging.session.closed`

Dashboard monitors concurrent sessions. Tripwire at 150 concurrent (75% of soft limit) triggers migration planning.

---

## Known Upgrade Paths (Post-Revenue)

| Component | Current | Enterprise Upgrade | Trigger | Est. Cost |
|-----------|---------|-------------------|---------|-----------|
| Messaging | Supabase Realtime | Cloudflare Durable Objects | >200 concurrent sessions | ~â‚¬15-20/mo |
| Search | Postgres FTS + pg_trgm | Typesense or Algolia | Complex search needs or poor UX | ~â‚¬75-300/mo |
| PDF Generation | @react-pdf/renderer | Puppeteer or DocRaptor | Premium template quality issues | ~â‚¬50-200/mo |
| Database | Supabase Pro | Supabase dedicated instance | >1M rows or high traffic | ~â‚¬200+/mo |
| Analytics | PostHog free tier | PostHog self-hosted dedicated | >1M events/mo | ~â‚¬50/mo |
| Background Jobs | Edge Functions + pg_cron | Inngest or Trigger.dev | Complex workflows, retries needed | Free tier â†’ ~â‚¬25/mo |
| Backups | Manual/Supabase Pro | Automated multi-region | Before public beta | Included in Supabase Pro |
| Media Storage | Supabase Storage | Dedicated media pipeline + CDN | Media costs or latency spike | ~â‚¬50-200/mo |

---

## Security & Compliance

| Requirement | Solution | Status |
|-------------|----------|--------|
| HTTPS/SSL | Vercel automatic | Included |
| Environment variables | Vercel encrypted storage | Included |
| GDPR compliance | Supabase EU-hosted + data export/delete flows | Build in Phase 1 |
| Terms of Service | Template (Termly or similar) | Draft before beta |
| Privacy Policy | Template (Termly or similar) | Draft before beta |
| Cookie consent | Essential cookies only (no tracking) | Build in Phase 1 |
| PCI compliance | Stripe handles | Included |

**Full security protocols:** See `yl_security.vNext.md` for external attack defense, system abuse prevention, resource exploitation limits, and code review checklist.

---

## Analytics Instrumentation (Sprint 1)

Events to implement as features ship:

| Event | Maps to Tripwire | Notes |
|-------|------------------|-------|
| `profile.created` | Endorsement-to-profile ratio denominator | On signup completion |
| `cv.parsed` | Onboarding friction | On successful CV extraction |
| `cv.parse_failed` | Onboarding friction | On extraction failure (silent to user) |
| `endorsement.created` | Endorsement-to-profile ratio numerator | On endorsement submit |
| `endorsement.deleted` | Retraction tracking (backend) | Track but don't expose |
| `profile.shared` | Organic share rate | On share button click or link copy |
| `messaging.session.opened` | WebSocket monitoring | On connect |
| `messaging.session.closed` | WebSocket monitoring | On disconnect |
| `timeline.viewed` | Timeline engagement | On profile timeline view |
| `post.created` | Content creation | On post submit |
| `post.viewed` | Content reach | On post view |
| `interaction.created` | IRL encounters | On interaction create |
| `interaction.participant.confirmed` | IRL encounters | On participant confirm |
| `interaction.participant.exited` | Consent and exits | On participant exit |
| `interaction.media.uploaded` | Media usage | On interaction media upload |

Tripwire dashboards built in PostHog during sprint 1.

---

## Migration Strategy

**Principle:** Start with free/cheap, upgrade incrementally as revenue grows

| Milestone | Actions |
|-----------|---------|
| **Phase 1 (now)** | Bootstrap stack, free tiers, staging environment |
| **Public Beta** | Upgrade Supabase to Pro (â‚¬25/mo), enable backups |
| **1k paying users** | Audit costs, evaluate PDF quality, plan upgrades |
| **10k paying users** | Upgrade to enterprise grade across the board |

---

## Stack Philosophy

- **Good now, scales to Phase 2/3** â€” No dead-end choices
- **Known bottlenecks have clear upgrade paths** â€” Documented above
- **Capital efficient** â€” 98%+ margin even at scale
- **Industry-standard choices** â€” Not bootstrap hacks
- **Ship fast, upgrade incrementally** â€” Speed over theoretical scale

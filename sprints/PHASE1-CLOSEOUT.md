# Phase 1 Close-Out — Launch Tracker

**Goal:** Ship YachtieLink to 20-50 invited crew for Med season soft launch (June 2026).

**How to use this file:** This is the single source of truth for what's left. Work top to bottom. Check boxes as items complete. Read this at session start.

**Last updated:** 2026-04-01

---

## Current State

```
Sessions 1-8   ✅ Waves 1-5 + DNS/follow-up
Sprint 10.1-3  ✅ Phase 1A closeout, design system, page layout
Sprint 11a-c   ✅ Public profile rewrite (bento grid, 3 view modes)
Sprint 12      ✅ Yacht graph foundation (wiring, navigation, yachts tab)
Sprint 13 W0+1 ✅ Public header/footer, cookie banner
Rally 005      ✅ Auth resilience (12 fixes)
QA fixes       ✅ Settings IA, bug sweep, mobile fixes, stale cookies

→ NOW: Rally 006 nearly done (date pickers + tick timing). Sprint 13 code complete (PR #130 merged). Ghost Profiles W1 in review (PR #133).
→ THEN: Merge PRs #132 + #133, run migrations, close Rally 006
→ THEN: Launch QA (Rally 007) + ops config + legal
→ THEN: 🚀 Invite mode
```

---

## What's Left (in execution order)

### 1. Rally: Pre-Launch Bug Sweep + Polish

See `sprints/rallies/rally-006-prelaunch/README.md` for full spec.

**Bugs (must fix):**
- [x] Safari public profile links broken — verified working (2026-03-30)
- [x] Subdomain cookie auth — verified working, links redirect to /u/{handle} (2026-03-30)
- [x] CV parse onboarding — All 5 steps reviewed and polished. Steps 1, 4-5 done in prior sessions. Steps 2-3 done via worktree Lane 1 (PR #132, 2026-04-01).
- [x] Avatar thumbnail framing — `object-top` default applied (2026-03-30)
- [x] CV yacht matching confidence — full redesign: compact career list, green/amber/blue states, multi-signal matching, prefix-aware search, inline editing, stat cards (2026-03-30)

**Analytics wiring (must fix for Pro value):**
- [x] Wire `record_profile_event('pdf_download')` in PDF download routes (2026-03-30)
- [x] Wire `record_profile_event('link_share')` in share handlers (2026-03-30)
- [x] Delete stub `/app/billing` page — replaced with `/app/settings/plan` (2026-03-30)

**UX fixes (P2 from mobile audit):**
- [x] Endorsement request banner not dismissable — replaced with 3-phase EndorsementBanner (2026-03-30)
- [x] Network tab bar crowded at 375px — moved Saved to More, 3 tabs (2026-03-30)
- [x] "Unknown" in endorsement requests sent — shows name/email/phone (2026-03-30)
- [x] Back button inconsistent across app — PageHeader component, 25 pages (2026-03-30)
- [x] Empty share button on endorsement request page — visible label + clipboard fallback (2026-03-30)
- [x] Language chip not editable on profile page — edit affordance + empty state (2026-03-30)

**Additional Rally 006 deliverables (2026-03-30):**
- [x] Plan management page at `/app/settings/plan` (free + pro states)
- [x] LLM swap: gpt-4o → gpt-5.4-mini (3.5x faster, 2.2x cheaper)
- [x] CV upload page redesign (mobile-first, amber section color, "sell the feature" copy)
- [x] CV career list redesign (compact rows, expand-on-tap, stat summary cards)
- [x] Yacht search prefix-aware comparison (5 DB migrations)
- [x] Design system documented (`patterns/page-layout.md`, CLAUDE.md + AGENTS.md wired)
- [x] Builder autocomplete from DB — yacht_builders table, 100 seed builders, FK migration, fuzzy search, BuilderInput component, resolveOrCreateBuilder helper (2026-03-31)
- [x] CV wizard UX rework Steps 1, 4-5 — chip hierarchy, review overhaul, celebration screen fix, amber wayfinding, DatePicker reorder, roles datalist, flag-outside-input (2026-04-01)
- [x] Code review fixes — stale closure, rate limit bucket split, Pro gate expiry check, redirect loop fix (2026-04-01)
- [x] Migration: skills_summary + interests_summary columns on users table (2026-04-01)
- [x] CV wizard Steps 2-3 UX rework — StepExperience amber states, StepQualifications two-state rework (PR #132, 2026-04-01)
- [x] Date pickers — text + calendar on mobile (done in PR #138; checkbox corrected 2026-04-02)
- [x] Progress tick timing — vary delays for natural feel (done in PR #138; checkbox corrected 2026-04-02)

---

### 2. Sprint 13 Completion — Launch Polish

Sprint 13 Wave 0+1 (public infrastructure) is merged. Remaining:

**Code work:**
- [x] Verify marketing landing page renders correctly (PR #130, 2026-04-01)
- [x] Cookie banner copy simplified — removed vendor names, founder approved (PR #130, 2026-04-01)
- [x] SEO verified — sitemap filters incomplete profiles + soft-deleted, robots.txt blocks /app/ /onboarding/ /api/ /invite-only, OG/Twitter fallback metadata added (PR #130, 2026-04-01)
- [x] Sitemap soft-delete filter already present on main; added `onboarding_complete` filter (PR #130, 2026-04-01)

**Ops (founder):**
- [ ] Configure Vercel env vars: PostHog, Sentry, Stripe prod, Supabase prod, Redis, Resend, OpenAI, CRON_SECRET
- [ ] Configure Stripe production webhook → `/api/stripe/webhooks`
- [ ] Test cron jobs in production (analytics-nudge, cert-expiry)

**Legal (founder):**
- [ ] Business address in terms/privacy pages (virtual office OK)
- [ ] Legal sign-off on terms + privacy

---

### 3. Ghost Profiles & Claimable Accounts

Design is complete (24 decisions resolved). Core viral loop — when a user adds a yacht, ghost profiles are created for crew they name. Those ghosts become claimable accounts when the real person signs up.

- [x] Ghost Profiles Wave 1 built — ghost_profiles table + RLS, 3 migrations, non-auth endorsement flow, claim flow, /endorse/[token] + /claim/[id] pages (PR #133 merged 2026-04-01; GhostEndorserBadge wired + RLS fixed PR #143 2026-04-02)
- [ ] Verify claim flow end-to-end (after PR #133 merge + migration run)
- [ ] Verify ghost → real profile data merge (after PR #133 merge + migration run)
- [x] Wire GhostEndorserBadge into profile views (done in PR #143; checkbox corrected 2026-04-02)
- [ ] Wave 2: phone OTP claim, signup shortcut onboarding bypass

---

### 4. Launch QA Checklist

All must pass before inviting users:

**Auth:**
- [ ] Signup with email → verify → login
- [ ] Signup with Google OAuth → login
- [ ] Signup with Apple OAuth → login
- [ ] Logout → session cleared → redirect to /welcome
- [ ] Stale cookie cleanup works (no retry loops)

**Onboarding:**
- [ ] Complete onboarding (all steps)
- [ ] CV upload path → parse → auto-populate profile
- [ ] Manual path (no CV) → name + handle → profile

**Core Features:**
- [ ] Add yacht (new + existing)
- [ ] Add certification with document upload
- [ ] Edit profile (bio, photo, contact info)
- [ ] Request endorsement → email received with deep link
- [ ] Follow deep link → write endorsement → appears on recipient profile
- [ ] Endorsement invite tokens correctly scope to sender
- [ ] View public profile at /u/:handle (logged out)
- [ ] Share public profile link → OG preview correct
- [ ] Generate PDF CV → download → content correct

**Payments:**
- [ ] Subscribe to Pro → Stripe Checkout → webhook → status updates
- [ ] Cancel Pro → Stripe Portal → webhook → features revoked
- [ ] Insights shows real data for Pro users (views, downloads, shares)

**Yacht Graph:**
- [ ] Navigate: profile → yacht → crew → profile (3+ hops, no dead ends)
- [ ] Yacht search works from Network Yachts tab
- [ ] Mutual colleagues show on public profiles

**Security:**
- [ ] Cannot view other user's private data via API
- [ ] Cannot create endorsement without shared yacht
- [ ] Rate limits trigger on abuse
- [ ] Stripe webhook rejects invalid signatures

**GDPR:**
- [ ] Delete account → data removed → session invalidated
- [ ] Download my data → JSON export works
- [ ] Deleted user's endorsements anonymised on recipient profiles

**Mobile (Safari iPhone):**
- [ ] All screens render correctly
- [ ] Bottom tab bar visible and functional
- [ ] Touch targets ≥ 44px
- [ ] No horizontal scroll
- [ ] Photo upload works

**Desktop (Chrome):**
- [ ] Responsive layout at 1024px+
- [ ] Keyboard navigation works

**Metrics & Monitoring:**
- [ ] Phase 1 metrics implemented: endorsement request rate, completion rate, organic share rate, time-to-first-endorsement
- [ ] Abuse escalation: report flow functional, flag rate monitoring, freeze mechanism
- [ ] PostHog receiving events (profile.created, endorsement.created)
- [ ] Sentry receiving exceptions

---

### 5. Deploy

- [ ] Final code review (no secrets, no console.logs, no TODOs)
- [ ] Tag `v1.0-launch`
- [ ] Verify production build clean
- [ ] Test invite link flow end-to-end in production
- [ ] Set `SIGNUP_MODE=invite`
- [ ] Send invite links to 20-50 crew
- [ ] Monitor Sentry 24h
- [ ] Monitor PostHog funnel (signup → onboarding → profile completion)

---

## Backlog Cross-Reference

All backlog items accounted for — where each one lands:

### Folded into Rally 006
- `safari-public-profile-links-broken.md` — Safari links broken *(see note: may be resolved via subdomain redirect)*
- `subdomain-cookie-auth-audit.md` — Subdomain auth cookies
- `onboarding-name-from-email.md` — Onboarding skips CV upload
- `avatar-thumbnail-framing.md` — Avatar heads cut off
- `cv-review-existing-yacht-badge.md` — Yacht matching confidence
- `endorsement-share-button-empty.md` — Empty share button on endorsement request
- `ux-audit-mobile-2026-03-29.md` — P1 + P2 items (7 of 22 issues)

### Folded into Launch QA (Rally 007)
- `endorsement-invite-token-qa.md` — E2E test that invite tokens correctly scope to sender

### Folded into Ghost Profiles Sprint
- `ghost-profiles-claimable-accounts.md` — Core viral loop

### Post-Launch (P3 from UX audit + remaining backlog)
- `ux-audit-mobile-2026-03-29.md` — remaining 15 P3 items (copy alignment, chip truncation, Pro badge wording, etc.)
- `profile-photo-reposition.md` — Crop/zoom/reposition
- `colleague-graph-explorer.md` — Full graph explorer
- `cv-review-socials-step.md` — Social links in CV review
- `social-links-add-prompt.md` — Prompt to add more socials
- `inner-page-header-component.md` — Consistent sub-page headers
- `custom-404-page.md` — Branded 404
- `reserved-subdomain-page-uxui.md` — Reserved page polish
- `cv-sharing-page-rework.md` — CV page layout rework
- `crew-pass.md` — Background checks (Phase 2+)
- `attachment-transfer.md` — "Wrong yacht?" flow (first week post-launch)
- `watch-profile-notifications.md` — Push notifications (deferred)

---

## Backlog Triage

### SHIP FIRST WEEK POST-LAUNCH

| Item | Effort | Why |
|------|--------|-----|
| Endorsement Writing Assist | 1-2 days | Design complete. Helps early users write better endorsements. |
| Attachment transfer ("Wrong yacht?") | 1-2 days | Self-correction flow for data quality |
| Pro Upsell Consistency | 1 day | Standardize upgrade CTAs |

### DEFER TO PHASE 2

| Item | Why defer |
|------|-----------|
| Availability Toggle (Sprint 14) | Needs user volume |
| Crew Search (Sprint 15) | Needs profiles to search |
| AI Pack (Sprint 16) | Growth features, not MVP |
| Attachment Confirmation (Sprint 17) | Needs yacht activity volume |
| Profile Photo Reposition | Polish |
| Colleague Graph Explorer (full) | Core explorer works, full version is Phase 2 |
| CV Sharing Page Rework | Current works |
| Saved Profiles Rework | Current works |
| Custom 404 Page | Branding polish |
| Watch Profile Notifications | Deferred explicitly |
| Crew Pass | Major new product |

---

## Completed Sprint History

<details>
<summary>Click to expand</summary>

- **Sessions 1-8** (2026-03-25 to 2026-03-27): Data integrity, public profile, import wizard, profile page, network tab, Pro subdomain, DNS migration
- **Sprint 10.1-10.3** (2026-03-27 to 2026-03-28): Design system tokens, nav refactor, page layout, IA, DM Serif typography, animation presets, section colours
- **Sprint 11a-c** (2026-03-28): Public profile rewrite — bento grid, 3 view modes, scroll reveal, endorsement cards
- **Sprint 12** (2026-03-29): Yacht graph — yacht detail page, crew lists, graph navigation, yachts tab, mutual colleagues, sea time card, endorsement request pre-fill
- **Sprint 13 W0+1** (2026-03-29): Public header/footer, cookie banner
- **Rally 005** (2026-03-29): 12 auth fixes, stale cookie cleanup, retry loop prevention
- **PR #114** Settings IA rework, **PR #115** Bug sweep, **PR #120** Mobile QA fixes

</details>

---

## Post-Launch Queue

After soft launch stabilizes:
- Ensign flags for yacht entries
- Endorsement Writing Assist
- Attachment transfer flow
- Pro Upsell Consistency
- Ghost Profile → Phase 2 growth loop
- Dark mode
- Saved Yachts

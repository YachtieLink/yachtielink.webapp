---
title: Rally 007 — Launch QA
status: spec complete, queued
created: 2026-04-03
depends_on: Rally 009 (all sessions), Rally 010
---

# Rally 007 — Launch QA

**Goal:** Verify every user-facing flow works end-to-end before sending invite links to 20-50 crew. This is the final gate before launch.

**When:** After Rally 009 Session 7 and Rally 010 are merged. Nothing new gets built here — this is pure testing and verification.

**Who:** Tester (Desktop app + Chrome MCP) + Founder. Master coordinates and handles any last-minute fixes.

---

## Structure

This is a **single session** with 2 lanes running sequentially (not parallel — each lane covers different test accounts and flows).

| Lane | Focus | Model | Effort |
|------|-------|-------|--------|
| 1 | Core user journeys (happy path) | Opus (Tester) | high |
| 2 | Edge cases, security, GDPR, payments | Opus (Tester) | high |

**Estimated time:** 4-6 hours total. No code changes expected unless blockers found.

---

## ⚠️ MANDATORY FIRST: Ghost Profile Claim Flow

**Before anything else, test the ghost claim flow end-to-end.** This is flagged as an untested launch blocker since PR #133 merged.

### Ghost Claim Test Plan

1. **Setup:** Ensure a ghost profile exists in the DB (created when a user added a yacht and named a colleague)
2. **Claim via link:** Navigate to `/claim/{ghost_id}` — verify the claim page loads with the ghost's name and yacht context
3. **New user claim:** Sign up as a new user → verify ghost data merges into the new profile (name, yacht attachment, any endorsements)
4. **Existing user claim:** Log in as an existing user → verify ghost data merges without duplicating existing data
5. **Endorsements transfer:** Verify endorsements written for the ghost profile now appear on the claimed profile
6. **Colleague connections:** Verify the claimed user now appears as a colleague to others on the same yacht
7. **Double claim prevention:** Try claiming an already-claimed ghost — verify it's rejected gracefully
8. **Invalid/expired claim:** Try a bogus claim ID — verify error state

**If any of these fail, STOP. This is a launch blocker. Fix before proceeding.**

---

## Lane 1 — Core User Journeys

Test with both Pro and Free test accounts (see `AGENTS.md` for credentials).

### Auth
- [ ] Signup with email → verify email → login → lands on onboarding
- [ ] Signup with Google OAuth → login → lands on onboarding
- [ ] Signup with Apple OAuth → login → lands on onboarding
- [ ] Logout → session cleared → redirect to /welcome
- [ ] Stale cookie cleanup — close tab, reopen after session expiry, no retry loops
- [ ] Password reset flow (if applicable)

### Onboarding
- [ ] CV upload path: upload PDF → parse completes → wizard steps (Personal → Experience → Land Experience → Qualifications → Extras → Review) → confirm → profile populated
- [ ] Manual path (skip CV): enter name + handle → profile created with empty sections
- [ ] Resume interrupted onboarding — close mid-flow, reopen, continues where left off

### Profile
- [ ] View My Profile — all sections render (hero, career timeline, certifications, endorsements, skills, hobbies, gallery, social links)
- [ ] Tap-to-edit hero (name, role, bio) — saves correctly
- [ ] Profile Strength ring updates as sections are completed
- [ ] Add/edit certification with document upload
- [ ] Add/edit yacht experience
- [ ] Add/edit land experience
- [ ] Photo upload — profile photo + gallery photos
- [ ] Social links — add, edit, remove (inline on profile)
- [ ] Visibility toggles — toggle off a section, verify it disappears from public profile

### Public Profile
- [ ] View `/u/{handle}` logged out — renders correctly with visible sections
- [ ] View `/u/{handle}` logged in as another user — correct data shown
- [ ] Pro subdomain `{handle}.yachtie.link` — redirects or renders correctly
- [ ] OG meta tags — share link, verify preview card shows name + photo + role
- [ ] Experience detail page (`/u/{handle}/experience`) — loads, back button works
- [ ] Bento grid layout — all tiles render, no overflow, no missing data

### CV
- [ ] Generate PDF CV → download → content matches profile data
- [ ] CV preview page renders correctly
- [ ] Re-parse confirmation dialog (UX5) — warns before overwriting
- [ ] Sharing toggles — enable/disable public CV download

### Network
- [ ] Yacht accordion view — expand/collapse, colleague rows, endorsement badges
- [ ] Yacht search — finds existing yachts, fuzzy matching works
- [ ] Add new yacht — creates yacht, creates attachment
- [ ] Navigate: profile → yacht → colleague → their profile (graph traversal, no dead ends)
- [ ] Saved profiles — save, unsave, watch toggle, notes
- [ ] Mutual colleagues shown on public profiles

### Endorsements
- [ ] Request endorsement → email received with deep link
- [ ] Follow deep link → write endorsement → appears on recipient profile
- [ ] Endorsement writing assist — "Help me start writing" generates draft
- [ ] Endorsement invite to external (non-user) — email sent, token works
- [ ] Ghost profile created for external invitee
- [ ] Invite token correctly scopes to sender (can't endorse someone else)
- [ ] Reminder button on pending requests (7+ days)

### Insights (Pro)
- [ ] Dashboard renders — metric cards, time range selector, WhoViewedYou
- [ ] Real data shown (views, downloads, shares) — not zeros if profile has activity
- [ ] Career snapshot section

### Insights (Free)
- [ ] Career snapshot visible
- [ ] Pro analytics blurred/gated with upgrade CTA
- [ ] Profile Strength coaching shown

### Settings / More
- [ ] 5-group IA renders correctly (Account, Plan, App, Community, Legal)
- [ ] Cert document manager accessible
- [ ] Bug report form — submit works
- [ ] Roadmap page — 3 tabs render (Roadmap / Feature Requests / Released)
- [ ] Feature submission — submit idea, verify it appears
- [ ] Voting — upvote/downvote works

---

## Lane 2 — Edge Cases, Security, Payments, GDPR

### Payments
- [ ] Subscribe to Pro → Stripe Checkout → webhook fires → user.subscription_status updates
- [ ] Cancel Pro → Stripe Portal → webhook fires → Pro features revoked
- [ ] Stripe webhook rejects invalid signatures
- [ ] Pro features gated correctly (insights analytics, photo slots, who-viewed, subdomain)

### Security
- [ ] Cannot view another user's private data via direct API call
- [ ] Cannot create endorsement without shared yacht (attachment check)
- [ ] Cannot endorse yourself
- [ ] Rate limits trigger on abuse (rapid API calls)
- [ ] LLM endpoints reject prompt injection attempts (test with obvious injection strings)
- [ ] Report button works on profiles, yachts, endorsements
- [ ] RLS policies — verify a user can't read/write another user's data via Supabase client

### GDPR
- [ ] Delete account → data removed → session invalidated → redirect to /welcome
- [ ] Download my data → JSON export works → contains all user data
- [ ] Deleted user's endorsements anonymised on recipient profiles
- [ ] Terms + Privacy pages render with correct content and business address

### Mobile (Safari iPhone — 375px)
- [ ] All 5 tabs render correctly
- [ ] Bottom tab bar visible and functional
- [ ] Touch targets ≥ 44px (no tiny tap targets)
- [ ] No horizontal scroll on any page
- [ ] Photo upload works from camera and gallery
- [ ] Keyboard doesn't cover inputs
- [ ] Safe area respected (notch, home indicator)

### Desktop/iPad (1024px)
- [ ] Responsive layout clean at iPad landscape
- [ ] Sidebar nav persistent and functional
- [ ] Content centered, no overflow
- [ ] Keyboard navigation works (tab through forms)

### Metrics & Monitoring
- [ ] PostHog receiving events (profile.created, endorsement.created, cv.parsed)
- [ ] Sentry receiving exceptions (trigger a deliberate error, verify it shows up)
- [ ] Analytics nudge cron job runs (or verify it's configured)
- [ ] Cert expiry cron job runs (or verify it's configured)

### Reporting & Flagging (Session 6)
- [ ] Report button on public profile — submit report, founder email received
- [ ] Report button on yacht — duplicate flagging with yacht search
- [ ] Bug report form — submit, verify data in DB

### Experience Transfer (Session 6)
- [ ] Transfer experience from one yacht to another
- [ ] Endorsements go dormant when yacht shared context breaks
- [ ] Endorsements reappear when context restored
- [ ] Colleague connections rebuild after transfer

### Cert Registry (Session 6)
- [ ] CV import — certs fuzzy match against registry (green/amber/blue)
- [ ] Amber resolution — user picks correct match
- [ ] Blue — manual entry works
- [ ] Alias learning — confirmed amber becomes green on next import

---

## Verdict

**PASS** — all items checked. Ready for deploy checklist.

**BLOCK** — list every failing item. Fix before re-running the failed items only.

---

## Post-QA Deploy Checklist

After Rally 007 passes:

- [ ] Final code review (no secrets, no console.logs, no TODOs)
- [ ] Tag `v1.0-launch`
- [ ] Verify production build clean (`npm run build` succeeds)
- [ ] Sprint 13 ops complete: Vercel env vars, Stripe webhook, cron jobs (founder)
- [ ] Sprint 13 legal complete: business address, terms/privacy sign-off (founder)
- [ ] Test invite link flow end-to-end in production
- [ ] Set `SIGNUP_MODE=invite`
- [ ] Send invite links to 20-50 crew
- [ ] Monitor Sentry 24h
- [ ] Monitor PostHog funnel (signup → onboarding → profile completion)

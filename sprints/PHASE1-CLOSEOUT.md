# Phase 1 Close-Out Plan

**Goal:** Ship the complete Phase 1 product with a clean codebase. Four sprints, sequential with explicit dependencies.

**How to use this file:** At session start, read this checklist. Find the current sprint. Cross-reference its README for full scope. Update checkboxes as sessions complete. If blocked, check the Blockers section.

**Last updated:** 2026-03-27 (restructured for new sprint sequence: 10.1 → Bugfix → 11 → 12 → 13)

---

## Blockers (must resolve before proceeding)

- [x] **D1-D8 design decisions** — Resolved 2026-03-25. All 8 answered and implemented in Waves 1-5. D1: maritime cert alias map + fuzzy match. D2: 1mo overlap tolerance. D3: country name labels. D4: libphonenumber-js. D5: ensign flags deferred post-launch. D6: transform:scale (deferred from Wave 2). D7: list-based yacht graph. D8: attachment upsert on user+yacht+role.
- [x] **Vercel Pro upgrade** — Purchased 2026-03-25. Account: ari@yachtie.link. Wildcard SSL provisioned. Subdomain routing live.
- [x] **Legal business address** — Deferred. Using ari@yachtie.link as GDPR contact. Must be resolved before Sprint 13 public launch.
- [x] **DNS migration to Vercel** — Completed 2026-03-27. All MX/TXT records migrated. Custom domain `yachtie.link` on Vercel nameservers.

---

## Execution Sequence

### ✅ COMPLETED: Sessions 1-8 (Waves 1-5 + Junior Work)

**Wave 1: Data Integrity** ✅ 2026-03-25
- Cert/attachment dedup
- Date overlap validation
- Canonical save pipeline
- Collapsed dual-path code (301 LOC deleted)

**Wave 2: Public Profile + Read Models** ✅ 2026-03-25
- Hero fields (age, sea time)
- CV 404 fix
- Shared query extraction
- TypeScript typing (eliminated `any[]`)
- 5 section components created

**Wave 3: Import Wizard UX** ✅ 2026-03-25
- Languages support
- Bio field handling
- Phone formatting
- Date consistency

**Wave 4: Profile Page + Skills** ✅ 2026-03-26
- Personal details card
- Editability improvements
- Skills chip UX
- Hook extraction (`useProfileSettings`)

**Wave 5: Network Tab + Pro Subdomain** ✅ 2026-03-26
- Yacht-grouped colleagues
- Endorsement helpers
- Pro subdomain middleware
- Cookie refresh fix (P1)

**Junior/Follow-up Work** ✅ 2026-03-27
- DNS migration to Vercel + SSL provisioning
- Pro subdomain route hardening
- Two-phase code review (Sonnet + Opus)
- YachtieLink drift review

---

## Next: Four-Sprint Phase 1B Execution

### Sprint 10.1: Phase 1A Closeout (5-4 days)

**Status:** 📋 Ready for execution

**Why:** Close Phase 1A cleanly so Phase 1B has a solid foundation. Finish dark mode, animations, missing pages, public layout infrastructure.

**What it depends on:**
- PRs #96 + #97 merged to main (Waves 4-5)
- Education edit page verified working (already exists)
- API routes verified (already exist)

**Key deliverables:**
- [ ] Wave 0: Public layout infrastructure (app/(public)/layout.tsx + PublicHeader + PublicFooter)
- [ ] Wave 0: EmptyState component (card/inline variants)
- [ ] Dark mode: ProfileAccordion, PhotoGallery, ProfileStrength, SaveProfileButton, SectionManager
- [ ] Animation: wire 12 presets into components
- [ ] Typography: DM Serif Display on headings (weight 400, no synthetic bold)
- [ ] Route cleanup: delete `/app/audience`
- [ ] API hardening: try/catch on 5 routes, Zod on 2 routes
- [ ] Storage abstraction: verify all calls routed through `lib/storage/`
- [ ] Tag `v1.0-phase-1a` after merge

**Exit:** Phase 1A closed, public layout ready for Sprint 13

**See:** `sprints/major/phase-1a/sprint-10.1/README.md`

---

### Sprint CV-Parse-Bugfix: Fix 37 QA Bugs (5-7 days)

**Status:** 📋 Ready for execution

**Depends on:** Sprint 10.1 complete

**Why:** Waves 1-5 shipped with 37 QA bugs found in founder walkthrough (2026-03-24). Data integrity issues (stacking, duplication), missing fields (age, flag, sea time), UX gaps (wizard steps, profile editability). Must fix before Sprint 11 onboarding rebuild.

**Five waves (sequential, some parallelization possible after Wave 1):**

**Wave 1: Data Integrity (P0)** — Dedup + validation
- [ ] Cert fuzzy dedup (maritime alias map + Levenshtein match)
- [ ] Attachment dedup (upsert on user+yacht+role)
- [ ] Skill dedup verification
- [ ] Yacht date overlap validation (1mo tolerance)

**Wave 2: Public Profile Hero + CV View (P0/P1)**
- [ ] Create `formatDate.ts` utility (needed by Wave 3)
- [ ] Add age, sea time, country flag to public profile hero
- [ ] Fix CV view 404 (`cv_public` + `latest_pdf_path` after parse)
- [ ] Make CV view responsive (transform:scale, no h-scroll)
- [ ] Add share + download buttons

**Wave 3: Import Wizard UX (P1)** — Depends on Wave 2's `formatDate.ts`
- [ ] Languages support in Step 1
- [ ] Bio textarea in Step 1
- [ ] Phone formatting
- [ ] Date display consistency
- [ ] Editable cards (certs, education, experience)

**Wave 4: Profile Page + Skills (P1)**
- [ ] Personal Details card on profile (with visibility toggles)
- [ ] Visa/Travel Documents visible on profile
- [ ] Languages row editable
- [ ] Experience section shows imported entries
- [ ] Skills chip UX: explicit delete, add input, removable saved items

**Wave 5: Network Tab Grouping (P1)**
- [ ] Endorsements grouped by yacht (collapsed)
- [ ] Colleagues grouped by yacht (collapsed)
- [ ] Yacht tab added to Network
- [ ] Bookmark/save yacht support

**Exit:** 37 bugs resolved, profile populated correctly, network tab grouped, data integrity solid

**See:** `sprints/major/phase-1b/sprint-cv-parse-bugfix/README.md`

---

### Sprint 11: Public Profile Rewrite (3 sub-sprints: 11a/b/c)

**Status:** 🔧 In Progress (11a started 2026-03-28)

**Depends on:** Sprint 10.1 complete + CV-Parse-Bugfix complete

**Why:** Collapse 6-step onboarding into a fork: one-drop CV path (1 screen, ~5-8s) vs minimal manual path (name + handle). Fast entry, no endorsement/role selection in onboarding (those are contextual later).

**Key deliverables:**
- [ ] `StepCvUpload` — drag-drop, upload + parse + auto-handle in parallel
- [ ] Handle auto-generation via `suggest_handles` + `handle_available`
- [ ] Refactor onboarding steps to fork on CV presence
- [ ] Delete old steps: `/app/onboarding/role`, `/app/onboarding/yachts`, `/app/onboarding/endorsements`
- [ ] Section colours on public profile (6 sections with `accentColor`)
- [ ] Motion polish: staggered cards, hover effects, entrance animations
- [ ] OG image enhancement: DM Serif, profile photo, branding
- [ ] QR code branded + PNG download
- [ ] Verify standalone CV flow still works

**Exit:** Onboarding fast and clean, users land on populated profile, standalone CV flow verified

**See:** `sprints/major/phase-1b/sprint-11/README.md`

---

### Sprint 12: Yacht Graph Foundation (6-8 days)

**Status:** 📋 Ready for execution

**Depends on:** Sprint 11 complete

**Why:** Make the yacht graph tangible. Yacht detail pages, colleague explorer grouped by yacht, sea time display, lightweight "wrong yacht?" correction flow. Graph is usable through links alone (no visualization).

**Database foundation first, then UI:**
- [ ] Fix `get_sea_time()` date arithmetic bug
- [ ] Implement 4 new RPCs: `get_sea_time_detailed()`, `get_yacht_endorsement_count()`, `get_yacht_avg_tenure_days()`, `get_mutual_colleagues()`
- [ ] Create `attachment_transfers` + `reports` tables (audit + trust foundation)
- [ ] `transfer_attachment()` RPC + `submit_report()` RPC

**UI Waves:**
- [ ] Yacht detail page (`/app/yacht/[id]`) — current/alumni crew, mutual connections, endorsement cross-refs, stats
- [ ] Colleague explorer (`/app/network/colleagues`) — grouped by yacht, search, endorse quick-action
- [ ] Sea time display: profile card + breakdown page + public stat
- [ ] Yacht search UX: crew count, match quality, duplicate detection
- [ ] Attachment transfer: "Wrong yacht?" section + BottomSheet + impact preview

**Exit:** Yacht graph navigable, sea time accurate, users can self-correct wrong entries, multi-hop navigation works (profile → yacht → crew → yacht, 3+ hops without dead ends)

**See:** `sprints/major/phase-1b/sprint-12/README.md`

---

### Sprint 13: Launch Polish + Go-Live (6-7 days)

**Status:** 📋 Ready for execution

**Depends on:** Sprint 12 complete

**Why:** Ship to production in invite mode. Build public-facing infrastructure (layout, marketing page), configure ops, run QA, get legal sign-off.

**Wave 0 (BLOCKER): Public Layout Infrastructure**
- [ ] Create `app/(public)/layout.tsx` — wrapper for public pages
- [ ] Create `PublicHeader` + `PublicFooter` components
- [ ] Apply to: `/`, `/privacy`, `/terms`, `/roadmap`

**Code work:**
- [ ] Verify marketing page (`app/page.tsx` already built, just verify)
- [ ] Create static roadmap page (`/app/more/roadmap`)
- [ ] Update cookie banner text (PostHog, Sentry)
- [ ] Verify SEO (sitemap, robots, OG tags)

**Ops (founder):**
- [ ] Configure Vercel env vars: PostHog, Sentry, Stripe prod, Supabase prod, Redis, Resend, OpenAI, CRON_SECRET
- [ ] Verify Stripe production webhook
- [ ] Test cron jobs in production

**QA & Legal:**
- [ ] Run full QA checklist: auth, Stripe, core flows, yacht graph, cross-browser, GDPR
- [ ] Legal sign-off: business address in terms/privacy (**BLOCKER** for public mode)
- [ ] Test `SIGNUP_MODE=invite` mode
- [ ] Monitor Sentry for first 24h

**Exit:** Marketing page live, production env configured, legal approved, invite mode working, ready for soft launch (20-50 crew)

**See:** `sprints/major/phase-1b/sprint-13/README.md`

---

## Summary

```
Sessions 1-8 ✅ Complete (Waves 1-5 + DNS/follow-up)
     ↓
Sprint 10.1 (Phase 1A closeout) — 4-5 days
     ↓
Sprint CV-Parse-Bugfix (37 bugs, 5 waves) — 5-7 days
     ↓
Sprint 11 (Onboarding rebuild) — 5-7 days
     ↓
Sprint 12 (Yacht graph) — 6-8 days
     ↓
Sprint 13 (Launch) — 6-7 days
     ↓
🚀 Phase 1 shipped to production (invite mode)
```

---

## Session Start Checklist

Every session, before doing anything:

1. Read this file — find the current sprint in the sequence above
2. Read `STATUS.md` — check which sprint is active and next action
3. Read the latest `CHANGELOG.md` entry — know what happened last
4. Read the sprint's README — full scope, dependencies, exit criteria
5. At session end: update checkboxes here, run `/shipslog`

---

## Post-Launch Queue

After Sprint 13 ships, next phase begins:

- Ensign flags for yacht entries (D5 — maritime flag SVGs)
- Ghost Profiles & Claimable Accounts (24 decisions, viral loop)
- Endorsement Writing Assist (12 decisions, no schema changes)
- CV Actions Card Redesign
- Profile Photo Reposition
- Feature Pro Subdomain (junior sprint)
- Feature CV Sharing Rework (junior sprint)
- Feature Saved Profiles Rework (junior sprint)

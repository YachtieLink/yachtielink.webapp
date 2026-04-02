# Rally 009 — Pre-MVP Polish

**Created:** 2026-04-02
**Goal:** Clear every known bug, UX issue, tech debt item, and design gap before Rally 007 (Launch QA). Ship a codebase the founder is proud to put in front of 20-50 invited crew.

**Scope:** 30 items across 7 worktree sessions — bugs, tech debt, data integrity, tab redesigns, endorsement flow, data quality, safety, desktop polish, feedback, and settings.

---

## Session Plan

| Session | Focus | Lanes | Effort | Deps | Status |
|---------|-------|-------|--------|------|--------|
| **1** | Bugs + tech debt + quick wins | 3 | ~4h | None — start immediately | Queued |
| **2** | Data integrity features | 2-3 | ~6h | Session 1 merged | Queued |
| **3** | Network tab Phase 1 + Profile redesign | 2 | ~8h | /grill-me required | Blocked |
| **4** | Insights Layer 1 + Photo unification + More tab | 2-3 | ~8h | /grill-me required | Blocked |
| **5** | Endorsement flow + LLM defense | 2 | ~6h | /grill-me required, Session 2 merged | Blocked |
| **6** | Cert registry + Reporting + Pro upsell | 3 | ~8h | /grill-me required, Session 5 LLM layer | Blocked |
| **7** | Desktop polish + Roadmap/feedback + Settings | 3 | ~6h | ALL prior sessions merged (final polish) | Blocked |

**Total estimated effort:** ~46h of worker time across 7 sessions.

---

## Session 1 — Bugs + Tech Debt (Start Immediately)

All small items, no dependencies, no design decisions needed. Three Sonnet lanes.

### Lane 1: Mobile UX Fixes
- **Tab bar padding** — Add `pb-24 md:pb-0` to app layout shell so ALL pages clear the bottom nav. One-line fix in `app/(protected)/app/layout.tsx`.
- **Interests chips responsive** — Verify PR #150 fix. If still broken at wider viewports, fix the chip layout to match MY SKILLS pattern.
- **CV preview ghost join** — Verify PR #148 fix. If the CV preview page still has an inline stale query (`app/(protected)/app/cv/preview/page.tsx:21`), replace with `getCvSections()`.

### Lane 2: P2 Bug Fixes
- **SavedProfileCard wiring** — Wire `seaTimeDays` + `yachtCount` props from `SavedProfilesClient.tsx`. Extend saved profiles query.
- **Yacht prefix null type** — Fix `prefixedYachtName()` in `lib/yacht-prefix.ts` to skip prefix when `yacht_type` is null.
- **Ghost endorser card layout** — Update ghost branch in `EndorsementCard.tsx` to match non-ghost layout (role + yacht on separate line).
- **Show home country on CV** — Wire `show_home_country` toggle to CV generation output in `CvPreview.tsx`.

### Lane 3: Tech Debt Sweep
- **Social platform config dedup** — Consolidate `SOCIAL_PLATFORM_CONFIG` (settings) + `PLATFORM_CONFIG` (SocialLinksRow) into `lib/social-platforms.ts`. Parameterize icon size.
- **Social icons dedup** — Extract `TikTokIcon` + `XIcon` to `components/ui/social-icons.tsx` (file already exists from PR #150 — verify and consolidate remaining duplicates).
- **formatSeaTime collision** — Pick canonical location (`lib/sea-time.ts`), remove duplicate from `lib/profile-summaries.ts`, update all imports.
- **EndorsementsSection dead code** — Fix nullable types (`yacht_id: string | null`), remove dead `isOwn` check, clean up unused `endorser_id`.

**Model:** All Sonnet | **Effort:** Lane 1 high, Lane 2 medium, Lane 3 medium

---

## Session 2 — Data Integrity Features

Medium complexity. Non-yachting experience needs a migration (→ Opus). Overlapping dates is validation logic (→ Sonnet).

### Lane 1: Non-Yachting Experience (Opus, high)
- **Migration:** Create `land_experience` table (id, user_id, company, role, start_date, end_date, description, industry, created_at, sort_order) + RLS (owner RW, public read for visible profiles).
- **CV save:** Update `save-parsed-cv-data.ts` to persist `employment_land` data (parser already extracts it via `ParsedLandJob`).
- **Wizard step:** Add "Shore-side Experience" step between Experience and Certifications. Reuse yacht experience card pattern. Allow edit/delete/reorder.
- **Profile section:** Add "Other Experience" section to profile page + public profile. Chronological with yacht experience, distinguished by icon/badge.
- **Queries:** Extend `getProfileSections()` + `getCvSections()` to include land experience.

### Lane 2: Overlapping Yacht Dates (Sonnet, high)
- **Date merge utility:** Create `lib/sea-time.ts` `mergeOverlappingRanges()` — union of date ranges for accurate sea time calculation.
- **Sea time fix:** Replace naive sum-of-durations with union-based calculation in all sea time display locations.
- **CV import validation:** In `StepExperience.tsx`, detect overlapping entries. Short overlap (<4 weeks): info note. Long overlap (>4 weeks): amber warning with highlight on both entries.
- **No retroactive recalc** for existing users at launch — recalculate on next profile view/edit.

### Lane 3: More Tab IA Prep (Sonnet, medium) — Optional
- **Reorganize** More tab into 6 groups: Your Account, Your Profile, Saved, App, Legal, Sign Out.
- **Apply** sand section color wayfinding.
- **Prep** empty slots for Cert Manager + Subscription (moved from Insights in Session 4).

**Note:** Lane 1 has open questions flagged for quick founder confirmation (see `grill-me-prep.md` §1). If founder unavailable, build with these defaults:
- Display: Separate "Shore-side Experience" section below yacht experience
- Industry field: Include but optional
- Toggle: Default ON for new users

---

## Session 3 — Network Tab Phase 1 + Profile Redesign ⚠️ NEEDS /GRILL-ME

These are major redesigns. Open questions in `grill-me-prep.md` §2-3 must be resolved before building.

### Lane 1: Network Tab Phase 1 (Opus, high)
- **Replace 3-tab segment control** with unified yacht-grouped view.
- **Yacht accordion:** Each yacht the user has sailed on becomes an expandable section showing: colleagues, endorsements given/received, date range.
- **Endorsement summary** elevated to top of page (not buried in a tab).
- **Empty state redesign:** Education card explaining what endorsements are, why they matter, CTA to request first one.
- **Pending state redesign:** Show progress toward first endorsement, who's been asked, quick re-nudge.
- **Fix "0/5 endorsements"** — clarify what the number means.
- **Files:** `app/(protected)/app/network/page.tsx`, `components/audience/AudienceTabs.tsx` (570 lines → rewrite), new `NetworkUnifiedView.tsx`, `EndorsementSummaryCard.tsx`.

### Lane 2: Profile Page Redesign Issues 1-4 (Opus, high)
- **Issue 1: Section color** — Apply teal wayfinding to profile page (background, icon accents, edit affordances).
- **Issue 2: Compact list** — Replace 2-column `ProfileSectionGrid` with compact list + expand-on-tap for 4+ items.
- **Issue 3: Empty states** — Reframe missing data as opportunity ("Add your first certification" not "No certifications").
- **Issue 4: Information hierarchy** — Group sections under icon+label headers (About Me, Personal Details, Career, Media).
- **Files:** `app/(protected)/app/profile/page.tsx` (325 lines → restructure), `components/profile/ProfileSectionGrid.tsx` (→ replace), `components/profile/ProfileStrength.tsx` (move up).

---

## Session 4 — Insights + Photo + More Tab ⚠️ NEEDS /GRILL-ME

### Lane 1: Insights Tab Layer 1 (Opus, high)
- **Move out:** Cert Document Manager → More tab. Subscription card → More tab.
- **Analytics display:** Profile views, PDF downloads, link shares, search appearances — all with sparkline charts.
- **Free tier:** Show teaser with blurred data + "Upgrade to see who's viewing your profile."
- **Pro tier:** Real data with time range selector (7d / 30d / all).
- **Coral section color** throughout.
- **Files:** `app/(protected)/app/insights/page.tsx` (rewrite), `components/insights/` (new metric cards), `app/(protected)/app/more/page.tsx` (receive cert manager + subscription).

### Lane 2: Photo Management Unification (Opus, high)
- **Merge 3 pages** (`/photos`, `/gallery`, `/photo`) into one unified photo management page.
- **Single profile photo** used everywhere (avatar circle, hero 16:9, CV square) with focal point picker + 3-format live preview.
- **Work gallery** section below profile photo.
- **Free:** 1 profile photo, 3 gallery. **Pro:** 3 profile photos (per-context assignment), 15 gallery.
- **Migration:** Add `role` column to `user_photos` table (avatar/hero/cv/gallery).
- **Files:** Merge `/profile/photos/page.tsx` + `/profile/gallery/page.tsx`, update `FocalPointPicker.tsx`, update all avatar/hero consumers.

### Lane 3: More Tab Completion (Sonnet, medium)
- **Receive** Cert Manager + Subscription card from Insights.
- **Final IA:** Your Account (login, security, data export, delete), Your Profile (edit, display settings, visibility), Saved (profiles, yachts), App (notifications, appearance), Legal (terms, privacy), Sign Out.
- **Files:** `app/(protected)/app/more/page.tsx` (restructure).

---

## /Grill-Me Requirements

See `grill-me-prep.md` for the full question list. Summary:

| Topic | Questions | Blocks |
|-------|-----------|--------|
| Non-yachting experience | 3 (display hierarchy, naming, industry field) | Session 2 Lane 1 |
| Network tab | 6 (unified layout, tab replacement, "0/5", yacht vision, colleague discovery, search) | Session 3 Lane 1 |
| Profile page | 5 (section groupings, identity card, Pro messaging, sticky CTA, CV details move) | Session 3 Lane 2 |
| Insights tab | 5 (views retention, ghost tracking, salary scope, digest opt-in, benchmarks) | Session 4 Lane 1 |
| Photo management | 5 (gallery location, AI API, adjustments, Pro assignment, migration backfill) | Session 4 Lane 2 |

**Recommended /grill-me sessions:**
1. **Quick call (10 min):** Non-yachting + overlapping dates — 5 questions, simple choices. Could also just build with defaults and adjust.
2. **Design interview (30 min):** Network + Profile — 11 questions, fundamental IA decisions.
3. **Design interview (20 min):** Insights + Photo — 10 questions, feature scope + privacy model.

---

## Dependency Graph

```
Session 1 (bugs + debt) ←── no deps, start immediately
    ↓ merged
Session 2 (data integrity)
    ↓ merged
                         ┌── /grill-me (ALL topics, ~60 min with browser)
                         │   Run during Sessions 1-2 build time
                         ↓
Session 3 (Network + Profile)
    ↓ merged
Session 4 (Insights + Photo + More)
    ↓ merged
Session 5 (Endorsement flow + LLM)
    ↓ merged
Session 6 (Cert registry + Reporting + Pro upsell)
    ↓ merged
Session 7 (Desktop + Roadmap + Settings) ←── LAST (touches everything)
    ↓ merged
Rally 007 — Launch QA ✅
```

**Sessions 1-2:** No /grill-me needed. Start immediately.
**Sessions 3-7:** All need /grill-me decisions. Run the design interview during Sessions 1-2 build time so everything is unblocked.

**Parallel opportunity:** The /grill-me covers ALL sessions in one 60-min browser session. See `GRILL-ME-AGENT-PROMPT.md` for the agent prompt.

---

## Backlog Items Covered

| Backlog Item | Session | Lane | Status |
|--------------|---------|------|--------|
| Tab bar padding (UX audit P1) | 1 | 1 | Queued |
| Interests chips responsive | 1 | 1 | Verify + fix |
| CV preview ghost join | 1 | 1 | Verify + fix |
| SavedProfileCard wiring | 1 | 2 | Queued |
| Yacht prefix null type | 1 | 2 | Queued |
| Ghost endorser card layout | 1 | 2 | Queued |
| Show home country on CV | 1 | 2 | Queued |
| Social platform config dedup | 1 | 3 | Queued |
| Social icons dedup | 1 | 3 | Queued |
| formatSeaTime collision | 1 | 3 | Queued |
| EndorsementsSection dead code | 1 | 3 | Queued |
| Non-yachting experience | 2 | 1 | Needs quick call |
| Overlapping yacht dates | 2 | 2 | Queued |
| More tab overhaul | 2/4 | 3/3 | Queued (two phases) |
| Network tab overhaul Phase 1 | 3 | 1 | Needs /grill-me |
| Profile page redesign 1-4 | 3 | 2 | Needs /grill-me |
| Insights tab Layer 1 | 4 | 1 | Needs /grill-me |
| Photo management unified | 4 | 2 | Needs /grill-me |
| Endorsement writing assist | 5 | 1 | Design complete |
| LLM prompt injection defense | 5 | 1 | New |
| Endorsement request redesign | 5 | 2 | Needs /grill-me |
| CV cert matching registry | 6 | 1 | Needs /grill-me |
| Reporting/flagging foundation | 6 | 2 | Needs /grill-me |
| Bug reporter form | 6 | 2 | Design complete |
| Pro upsell consistency | 6 | 3 | Queued |
| Desktop responsiveness audit | 7 | 1 | Queued |
| Roadmap + feedback mechanism | 7 | 2 | Needs /grill-me |
| Visibility toggle clarity | 7 | 3 | Queued |
| Display settings cleanup | 7 | 3 | Needs /grill-me confirm |
| Phone/WhatsApp split | 7 | 3 | Needs /grill-me |
| Attachment transfer | 7 | 3 | Needs /grill-me |

---

## Exit Criteria

Rally 009 is complete when:
- [ ] All 30 items above are shipped and merged
- [ ] No known P1/P2 bugs remain in backlog
- [ ] All 5 tabs have section color wayfinding applied
- [ ] Profile, Network, Insights pages pass mobile UX audit at 375px AND desktop at 1280px
- [ ] Endorsement flow has writing assist + yacht-grouped request page
- [ ] CV import has cert matching with green/amber/blue tiers
- [ ] Report button on profiles, yachts, endorsements
- [ ] Bug report form in More tab
- [ ] Roadmap page with feedback mechanism live
- [ ] All LLM surfaces defended against prompt injection
- [ ] Pro upsell CTAs consistent across app
- [ ] Settings polished (visibility sublabels, display cleanup, phone/WhatsApp split)
- [ ] Tech debt items (dedup, dead code) resolved
- [ ] PHASE1-CLOSEOUT.md updated with all completions
- [ ] Ready to begin Rally 007 (Launch QA)

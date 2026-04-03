# QA Report — 2026-04-03

**Tester:** Claude Code (Opus 4.6) — Tester
**Branch:** chain/rally-009 (PR #159)
**Sessions tested:** 2, 3, 4, 5
**Verdict:** PASS (after fixes applied in this session)

---

## Tested (every input -> output pair)

| # | Session | Feature | Input | Expected Output | Actual | Status |
|---|---------|---------|-------|-----------------|--------|--------|
| 1 | S2 | Land experience on profile | Navigate to /app/profile, Career section | Sublabel shows yacht + shore-side counts | "11y 4mo sea time · 11 yachts + 4 shore-side" | pass |
| 2 | S2 | Career timeline entries | Click "Show 13 more" | All 16 entries render (12 yacht + 4 shore-side) | 16 entries in DOM, expand/collapse works | pass |
| 3 | S2 | Career entry expand | Click M/Y Go entry | Expands with yacht type, links | "Motor Yacht", "View yacht page", "Edit" | pass |
| 4 | S2 | Public profile experience page | Navigate to /u/dev-qa/experience | All entries including shore-side | "16 positions", all present with correct icons | pass |
| 5 | S2 | Public profile position count | Check "See all N positions" on /u/dev-qa | Should say 16 | "See all 16 positions" (was 12 — fixed) | pass |
| 6 | S2 | Sea time consistency | Compare hero card to Experience row | Same value | Both show "11y 4mo" (was mismatched — fixed) | pass |
| 7 | S3 | Network yacht accordion | Click Big Sky on /app/network | Accordion expands | "No colleagues found" + "Invite former crew" | pass |
| 8 | S3 | Network endorsement section | Check ENDORSEMENTS | Count and button | "ENDORSEMENTS 0/5", "Request endorsement" button | pass |
| 9 | S3 | Network colleagues | Check M/Y Go colleagues | Avatars, roles, Request buttons | 3 colleagues: Ari Steele, ari, aristeelesignup | pass |
| 10 | S3 | Profile redesign groups | Navigate to /app/profile | 4-group compact list | About Me, Personal Details, Career, Media — all render | pass |
| 11 | S3 | Profile hero card | Check hero info | Name, role, sea time, completeness | "Krista Lee Graham", "Yacht Chef", "11y 4mo · 11 yachts", "70%" | pass |
| 12 | S3 | Social links row | Check social links | Icons with correct hrefs | Instagram, LinkedIn, Website — all present | pass |
| 13 | S4 | Insights dashboard (Pro) | Navigate to /app/insights | Metric cards, coral wayfinding | Profile Views (460), Downloads (0), Shares (0), Saves (0) | pass |
| 14 | S4 | Insights time range toggle | Click 7d | Values update | Profile Views: 37, chart shifted | pass |
| 15 | S4 | Insights Who Viewed You | Check Pro section | Dynamic copy matching range | "No profile viewers in the last 7 days" on 7d (was hardcoded 30 — fixed) | pass |
| 16 | S4 | Insights non-Pro (James) | Switch to seed account, /app/insights | CareerSnapshot + upgrade CTA | "5y 10mo Sea Time · 2 Yachts · 3 Certs", Profile Strength 80%, upgrade pricing | pass |
| 17 | S4 | Photos page | Navigate to /app/profile/photos | Upload areas for profile + gallery | Profile Photo upload + Work Gallery (0/14) with drag-to-reorder | pass |
| 18 | S4 | CV tab output-only | Navigate to /app/cv | Generated + uploaded CV, design, sharing | All sections present, regenerate notice, amber wayfinding | pass |
| 19 | S4 | Settings 5-group IA | Navigate to /app/more | 5 groups with sand wayfinding | Account, Plan, App, Community, Legal — all correct | pass |
| 20 | S5 | Endorsement request page | Navigate to /app/endorsement/request | Yacht-grouped UI | Renders correctly (was redirecting to /app/attachment/new — fixed) | pass |
| 21 | S5 | Network Request button | Click "Request" next to Ari Steele | Sends endorsement request | Button changes to "Sent" (was broken — same root cause, fixed) | pass |
| 22 | S5 | Invite former crew link | Check href on Network page | Routes to endorsement request | Correct: /app/endorsement/request?yacht_id=... (was broken — fixed) | pass |
| 23 | S5 | Endorsement writer | Navigate to /endorse/[token] | Write form with assist button | "Endorse Krista Lee Graham from M/Y Go", text area, assist button | pass |
| 24 | S5 | Writing assist | Click "Help me start writing" | LLM generates draft | 907 chars generated, no error (was failing quality check — fixed) | pass |
| 25 | S5 | Writing assist button state | After draft generated | Button changes + hint appears | "Help me finish this" + "Edit this to add your personal touch" | pass |
| 26 | S5 | Reminder endpoint | Code review | Auth, ownership, 7-day cooldown, 1 max | All guards present and correct | pass (code) |
| 27 | S5 | Photo context API | Code review | Focal point + is_avatar/is_hero/is_cv, Pro-gated | PATCH validates, clears-others-first, Pro check | pass (code) |
| 28 | S5 | LLM defense layer | Code review | Input sanitize, output validate, prompt guard | sanitize.ts + prompt-guard.ts both solid | pass (code) |

## Toggle Matrix

| Toggle | ON result | OFF result | Sensible? |
|--------|-----------|------------|-----------|
| Show Experience on public profile | Toggle present, functional | N/A | yes |
| Show Bio/Skills/Hobbies on public profile | Toggles present | N/A | yes |
| Insights 7d/30d/All time | 7d: 37 views, 30d: 460, chart updates | N/A | yes |
| Network yacht accordion | Expands to show colleagues or empty state | Collapses to header only | yes |
| Career timeline Show more/less | Expands from 3 to all 16 entries | Collapses back to 3 | yes |

## Copy Review
- All user-facing copy across Profile, CV, Insights, Network, Settings, Public Profile reviewed — clear, accurate, consistent.
- "Who Viewed You" copy now dynamically matches time range (fixed).
- "1 Hotel & Dovetale Restaurant" has no date range — data quality from CV parse, not a code issue.

## Visual Consistency
- Section color wayfinding correctly applied: Profile=teal, CV=amber, Insights=coral, Network=navy, More=sand.
- All 5 tabs have consistent nav bar highlighting.
- Career timeline: yacht entries get navy Anchor icon, shore-side entries get amber Briefcase icon — consistent across private profile and public experience page.

## Journey Tests
- **Profile -> Public Profile -> Experience**: Full journey works end-to-end.
- **Network -> Request Endorsement -> Endorsement Writer -> Writing Assist**: Full journey works after fixes.
- **Insights -> Toggle time range**: Works, copy updates correctly.
- **CV tab -> Regenerate/Preview/Download**: Actions present and functional.
- **Settings -> All 5 groups**: Navigable with correct sub-items.

## Architecture Check
- Endorsement request query now uses correct column names matching DB schema.
- Endorsement assist API now fetches endorsee's attachment on the specific yacht (role + dates), not just their current primary role.
- Public profile layouts (Portfolio, RichPortfolio, ExperienceTile) all receive and render land experience entries.

---

## Fixed in this session

| # | Severity | File(s) | Issue | Fix |
|---|----------|---------|-------|-----|
| 1 | **HIGH** | `app/(protected)/app/endorsement/request/page.tsx` | Supabase query used wrong column names (`start_date`/`end_date`/`role_title` instead of `started_at`/`ended_at`/`role_label`), causing redirect to /app/attachment/new | Fixed all column names in interface, query, order clause, and yachtMap builder |
| 2 | **HIGH** | `components/public/layouts/PortfolioLayout.tsx`, `RichPortfolioLayout.tsx`, `bento/tiles/ExperienceTile.tsx`, `PublicProfileContent.tsx` | "See all 12 positions" excluded land_experience entries | Added `landExperience` prop through component tree, fixed counts, added land entry rendering with Briefcase icon |
| 3 | **MEDIUM** | `app/(protected)/app/profile/page.tsx` | Hero card showed "11y 4mo" (RPC) but Experience sublabel showed "7y 1mo" (union-based) | Experience sublabel now uses same `seaTimeTotalDays` from RPC as hero card |
| 4 | **MEDIUM** | `components/profile/CareerTimeline.tsx` | Duplicate "Career" heading — one from section group, one inside timeline | Removed redundant h3 heading + "Add" link from CareerTimeline |
| 5 | **MEDIUM** | `components/insights/WhoViewedYou.tsx`, `app/(protected)/app/insights/page.tsx` | "No profile viewers in the last 30 days" hardcoded regardless of range | Added `range` prop, copy now says "last 7 days" / "last 30 days" / "last 12 months" |
| 6 | **MEDIUM** | `app/api/endorsements/assist/route.ts` | Same wrong column names as #1 (`role_title`, `start_date`) | Fixed to `role_label`, `started_at` |
| 7 | **MEDIUM** | `app/api/endorsements/assist/route.ts` | `maxSentences: 5` too strict — rejected valid 907-char drafts | Removed sentence limit, bumped maxLength to 2000 |
| 8 | **LOW** | `lib/llm/prompt-guard.ts` | Prompt asked for "2-4 sentences" — too short for a proper endorsement | Changed to "800-1000 characters (roughly 4-6 sentences)" |
| 9 | **LOW** | `app/api/endorsements/assist/route.ts` | LLM only got endorsee's `primary_role` (current role, not yacht-specific) | Now fetches endorsee's attachment on the specific yacht — gets their actual role + time period on that yacht |

## Backlog items created

| File | Description |
|------|-------------|
| `sprints/backlog/role-context-data-layer.md` | **HIGH priority.** Add `description` field to `attachments` table. Foundation for rich endorsements, expandable career entries, and CV output. CV parser should capture role write-ups. |
| `sprints/backlog/career-entry-detail-expand.md` | Expandable career entries with inline role descriptions + yacht name as clickable link. Depends on role-context-data-layer. |
| `sprints/backlog/unsolicited-endorsements.md` | Allow endorsing a colleague without a request. Writing assist included. |
| `sprints/backlog/trending-yachts-discovery.md` | Discovery section showing high-activity yachts (rolling 24h) as graph entry point. Separate from "My Yachts". |
| `sprints/backlog/social-links-crud.md` | Add/remove social links directly from Profile page. |

## Discovered Issues (out of scope, not blocking)

- **[DEBT]** `get_sea_time` DB RPC uses naive sum — needs migration to union-based calculation (deferred, consistent display achieved by using same source)
- **[UX]** Career section has both compact summary rows AND timeline below — founder confirmed should be folded into one (heading removed, structural merge is a larger redesign)
- **[UX]** Social links row on Profile has no add/remove affordance (captured in backlog)
- **[DATA]** "1 Hotel & Dovetale Restaurant" entry has no dates — CV parse data quality

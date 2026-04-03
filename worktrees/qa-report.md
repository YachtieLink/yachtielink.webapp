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

---

## Session 6 — Lane 2 QA (feat/reporting-bugs)

**Tester:** Claude Code (Opus) — Tester
**Date:** 2026-04-03
**Session:** sessions/2026-04-03-rally009-session6.md
**Lane tested:** Lane 2 (feat/reporting-bugs, yl-wt-2)
**Verdict:** PASS (after fixes)

### Tested (every input → output pair)
| # | Lane | Feature | Input | Expected Output | Actual | Status |
|---|------|---------|-------|-----------------|--------|--------|
| 1 | 2 | ReportButton on profile | Click flag on Charlotte's public profile | Bottom sheet with profile categories | 6 categories: Fake profile, False employment claim, Inappropriate content, Harassment, Spam, Other | pass |
| 2 | 2 | Report submission | Select category + reason + submit | 201 response, success message | "Report submitted — Thank you for helping keep YachtieLink safe." + POST 201 | pass |
| 3 | 2 | Report persists to DB | Submit report | Row in reports table | POST /api/report 201, RLS prevents anon read (correct) | pass |
| 4 | 2 | Self-report guard (API) | POST /api/report with own user ID | 400 error | `{"error":"Cannot report your own profile"}` 400 | pass |
| 5 | 2 | Owner hides report button | View own profile /u/dev-qa | No flag icon | No flag icon, no report button in DOM | pass |
| 6 | 2 | ReportButton on yacht | Click flag on M/Y Go yacht detail | Bottom sheet with yacht categories | 3 categories: Duplicate yacht entry, Incorrect details, Other | pass |
| 7 | 2 | Duplicate yacht search | Select "Duplicate yacht entry" → type "Drift" | Yacht search results | "TS Driftwood" appears after debounce | pass |
| 8 | 2 | Bug report page nav | More → Report a bug | Navigate to /app/more/report-bug | Page loads with form, sand section color | pass |
| 9 | 2 | Bug report form | Fill category + description → submit | 201 response, success message | "Thanks for the report" confirmation, POST /api/bug-reports 201 | pass |
| 10 | 2 | Bug report URL auto-fill | Navigate from yacht page → report-bug | Page URL field pre-populated | Shows referrer URL from yacht page | pass |
| 11 | 2 | Endorsement card flags | View Charlotte's /endorsements as non-owner | Flag icons on each card | Rose flag icons on both endorsement cards | pass |
| 12 | 2 | Endorsement report categories | Click flag on endorsement card | Endorsement-specific categories | 5 categories: Fake endorsement, Inappropriate content, Harassment, Spam, Other | pass |
| 13 | 2 | Profile view toggle | Switch Portfolio → Profile view on Charlotte | Page renders without crash | All sections render correctly (after fix #1) | pass |
| 14 | 2 | More page rows | Check Help section in More tab | "Report a bug" and "Contact us" rows | Both present with correct icons and sublabels | pass |

### Toggle Matrix
| Toggle | ON result | OFF result | Sensible? |
|--------|-----------|------------|-----------|
| Category = duplicate_yacht | Yacht search field appears | Yacht search hidden | Yes |
| isOwner = true (own profile) | Flag icon hidden | Flag icon visible | Yes |
| isLoggedIn = false | Flag icon hidden on endorsement cards | Flag icon visible when logged in | Yes |

### Copy Review
- Report sheet: "Report" title, "What's the issue?" heading — clear ✅
- Category labels: human-readable (Fake profile, not fake_profile) ✅
- Submit button: "Submit report" — clear action ✅
- Success (report): "Report submitted — Thank you for helping keep YachtieLink safe." ✅
- Success (bug): "Thanks for the report — We'll look into this as soon as possible." ✅
- Bug placeholder: "Describe the issue — what you did, what you expected, what actually happened..." ✅
- More tab rows: "Report a bug / Something broken? Let us know" + "Contact us / hello@yachtie.link" ✅
- Character counters: "0/2000" on both forms ✅

### Visual Consistency
- Flag icons: rose-300 (idle) / rose-500 (hover), 14px — visible but not aggressive ✅
- Bottom sheet follows existing BottomSheet pattern with drag handle ✅
- Bug report page uses sand section color (correct for More tab) ✅
- Radio buttons for categories (not select) — clean on mobile ✅
- Endorsement card flags: positioned bottom-right, consistent across cards ✅

### Journey Tests
- Profile → flag → category → reason → submit → success → close ✅
- Yacht → flag → duplicate yacht → search → select → ready to submit ✅
- More → Report a bug → category → description → submit → confirmation ✅
- Own profile → flag hidden; Other profile → flag visible ✅

### Architecture Check
- Dual persistence: reports table + email to founder ✅
- Rate limiting: 10/hour/user via count query ✅
- Fire-and-forget email (won't block save) ✅
- Zod validation + category-target cross-validation ✅
- HTML escaping on email content (XSS protection) ✅
- Self-report guard on API ✅

### Fixed (applied in yl-wt-2)
| # | Severity | File | Issue | Fix |
|---|----------|------|-------|-----|
| 1 | HIGH | `components/public/PublicProfileContent.tsx:461` | `viewerRelationship` referenced in `ProfileModeContent` where not in scope — crashes Profile view toggle | Changed to `isOwnProfile` (the local prop) |
| 2 | MED | `components/ui/ReportButton.tsx:164-166` | Flag icon 12px in tertiary gray — invisible | Changed to rose-300/rose-500, 14px (founder request) |
| 3 | PRE-EXISTING | `components/yacht/YachtEndorsements.tsx:52` | Null endorser/recipient crashes yacht page | Added `.filter((e) => e.endorser && e.recipient)` |
| 4 | PRE-EXISTING | `components/public/HeroSection.tsx:88` | Hero photo stretches at landscape viewports | Added `md:max-h-[28rem] lg:max-h-[32rem]` (founder request) |

### Backlog items created
- `sprints/backlog/hero-photo-landscape.md` — Hero photo at landscape viewports (fixed, backlog for docs)
- `sprints/backlog/bug-report-screenshot.md` — Bug report should support screenshot uploads (founder feedback)

### Discovered Issues
- **[BUG/pre-existing]** `components/yacht/YachtEndorsements.tsx` — Null endorser data crashes yacht page (fixed)
- **[BUG/pre-existing]** `components/public/HeroSection.tsx` — No max-height at desktop (fixed)
- **[DEBT]** `EndorsementsPageClient.tsx` — Duplicates `PublicEndorsement` type fields (worker-identified)

---

## Session 6 — Lane 1 QA (feat/cert-registry)

**Tester:** Claude Code (Opus) — Tester
**Date:** 2026-04-03
**Session:** sessions/2026-04-03-rally009-session6.md
**Lane tested:** Lane 1 (feat/cert-registry, yl-wt-1)
**Verdict:** PASS

### Tested (every input → output pair)
| # | Lane | Feature | Input | Expected Output | Actual | Status |
|---|------|---------|-------|-----------------|--------|--------|
| 1 | 1 | CV wizard qualifications step | Upload Charlotte's seed CV → advance to Step 4 | Qualifications step with cert cards | 7 certs parsed, all three card states visible | pass |
| 2 | 1 | Green card (auto-match) | Certs with clear registry matches | ✓ icon, canonical name, issuing authority badge, expiry | ENG1→ENG1 Medical Certificate (MCA), Powerboat Level 2 (RYA), Level 2 Food Safety (CIEH), WSET Level 2 (WSET) — all green with badges | pass |
| 3 | 1 | Amber card (ambiguous) | "STCW BST" parsed from CV | ⟡ "did you mean?" with multiple options | 3 options: Basic Safety Training (MCA/AMSA/USCG) + "None of these — keep as is" | pass |
| 4 | 1 | Amber card #2 | "First Aid at Work" parsed from CV | ⟡ "did you mean?" with options | Medical First Aid (MCA), Elementary First Aid (MCA) + "None of these" | pass |
| 5 | 1 | Blue card (unmatched) | "Silver Service & Housekeeping" | ? icon, editable fields, helpful message | "We couldn't match this cleanly, so keep the details you know..." + Issuing Authority + Expiry fields | pass |
| 6 | 1 | Amber → Green resolution | Click "Basic Safety Training (MCA)" on amber card | Card turns green with canonical name + badge | ✓ Basic Safety Training, MCA badge, "Valid until 2028", "Parsed as 'STCW BST'" | pass |
| 7 | 1 | Wizard blocked by amber | Scroll to bottom with unresolved amber cards | Continue button disabled | "Choose the closest match first" — grayed out, not clickable | pass |
| 8 | 1 | Wizard unblocked after resolution | All amber cards resolved | Continue button enabled | "Looks good" — active, clickable | pass |
| 9 | 1 | "Parsed as" transparency | All green/resolved cards | Show original text from CV | Each green card shows "Parsed as 'X'" in muted text | pass |
| 10 | 1 | Issuing authority badges | Green matched certs | Badge chips with authority name | MCA, RYA, CIEH, WSET badges rendered as chips | pass |
| 11 | 1 | Cert count header | Step header | Cert and education counts | "CERTIFICATES 7 · EDUCATION 0" | pass |
| 12 | 1 | "None of these" option | Amber card escape hatch | Keeps cert as-is with no registry match | Option present and clearly labeled | pass |

### Toggle Matrix
| Toggle | ON result | OFF result | Sensible? |
|--------|-----------|------------|-----------|
| Amber resolved (all) | "Looks good" button active | "Choose the closest match first" (disabled) | Yes — prevents saving unresolved matches |
| Blue card issuing authority | Editable text field with pre-filled value | Empty field with label | Yes — user fills what they know |

### Copy Review
- **Amber card heading**: `"STCW BST" — did you mean?` — clear, uses original parsed text ✅
- **Amber sublabel**: "Pick the closest canonical certificate so we can keep the name, authority, and renewal guidance consistent." — informative without jargon ✅
- **Blue card message**: "We couldn't match this cleanly, so keep the details you know and we'll save it as entered." — positive framing, no blame ✅
- **Blocked button**: "Choose the closest match first" — direct, actionable ✅
- **"Parsed as" labels**: Transparent about what was extracted from CV ✅
- **"None of these — keep as is"**: Clear escape hatch ✅

### Visual Consistency
- Green cards: teal/green border + ✓ icon + issuing authority badge chips ✅
- Amber cards: amber/gold border + ⟡ icon + match options as tappable items ✅
- Blue cards: neutral border + ? icon + editable fields ✅
- All cards follow consistent layout pattern (icon → name → details) ✅
- Section uses amber wayfinding (correct for CV tab) ✅

### Journey Tests
- **Full CV import → Qualifications**: Upload → parse → Step 1 (Details) → Step 2 (Career) → Step 4 (Qualifications) — complete flow works ✅
- **Amber resolution flow**: See ambiguous → pick match → card turns green → can proceed ✅
- **Blue card edit flow**: See unmatched → edit issuing authority → cert accepted as-is ✅

### Architecture Check
- Cert matching uses `search_certifications` RPC (trigram similarity) — correct
- Match tiers: ≥0.6 = green, 0.3–0.59 = amber, <0.3 = blue — implemented correctly
- Alias learning: RLS UPDATE policy added (migration 20260403100004) — unblocked
- `WizardCert` type properly flows through wizard → save pipeline (reviewer fix #2)
- `matchTrigger` debounce prevents re-matching on every keystroke (reviewer fix #3)
- No console errors during full qualifications step interaction ✅

### Fixed (applied in yl-wt-1)
_No additional fixes needed during QA — all reviewer items were resolved before testing._

### Escalated
_None._

### Discovered Issues
- **[DEBT]** `StepQualifications.tsx` at 934 LOC is a hotspot (drift-check warning). Consider extracting GreenCertCard, AmberCertCard, BlueCertCard components. Not blocking.
- **[DEBT]** Alias learning moderation is row-level only (`review_status`). Per-alias pending/approved state would need a dedicated alias submissions table. Deferred.

---

## Session 6 — Lane 3 QA (feat/experience-transfer)

**Tester:** Claude Code (Opus) — Tester
**Date:** 2026-04-03
**Session:** sessions/2026-04-03-rally009-session6.md
**Lane tested:** Lane 3 (feat/experience-transfer, yl-wt-3)
**Verdict:** PASS (after 1 fix)

### Tested (every input → output pair)
| # | Lane | Feature | Input | Expected Output | Actual | Status |
|---|------|---------|-------|-----------------|--------|--------|
| 1 | 3 | Transfer button on career entry | Expand TS Driftwood entry on profile | "Edit" and "⇆ Transfer" buttons | Both visible in expanded entry | pass |
| 2 | 3 | Yacht picker modal | Click Transfer | "Find your yacht" bottom sheet with search | Sheet opens with Find/Add tabs + search input | pass |
| 3 | 3 | Yacht search in transfer | Type "Artemis" | Yacht results | "TS Artemis (Established) Motor Yacht · 65m · Cayman Islands" | pass |
| 4 | 3 | Confirmation step | Select TS Artemis | Confirmation dialog with transfer details | "Move your Chief Stewardess experience from TS Driftwood to TS Artemis?" + dormancy warning | pass |
| 5 | 3 | Confirmation copy — dormancy warning | Read sublabel | Explains endorsement effects | "Endorsements will update automatically — any endorsements tied to TS Driftwood may become hidden..." | pass |
| 6 | 3 | Same-yacht guard (API) | POST with same source + dest yacht | 400 error | `{"error":"Source and destination yacht are the same"}` | pass |
| 7 | 3 | Dormant pin guard (code review) | Pin endpoint with dormant endorsement | 400 "Cannot pin a dormant endorsement" | Guard at line 31-33, verified in code | pass (code) |
| 8 | 3 | Pin count excludes dormant (code) | Pin count query | Filters dormant from count | `.or('is_dormant.is.null,is_dormant.eq.false')` at line 42 | pass (code) |
| 9 | 3 | is_dormant filter — profile queries | endorsement display queries | Filter out dormant endorsements | 3 locations in lib/queries/profile.ts | pass (code) |
| 10 | 3 | is_dormant filter — app-wide | All endorsement display queries | Filter applied across app | 8 code files, 15 total references to is_dormant | pass (code) |
| 11 | 3 | Endorsement count on public profile | Charlotte's public profile stats | Shows non-dormant count | "2 endorsed" (correct — all non-dormant) | pass |
| 12 | 3 | Transfer API — audit logging | POST success response | Includes audit_logged field | Verified in code (reviewer fix #5) | pass (code) |
| 13 | 3 | Service client for dormancy | visibility.ts client type | Uses admin/service client | `createServiceClient` from `lib/supabase/admin` (reviewer fix #4) | pass (code) |

### Toggle Matrix
| Toggle | ON result | OFF result | Sensible? |
|--------|-----------|------------|-----------|
| is_dormant = true | Endorsement hidden from all display queries | N/A | Yes — yacht graph integrity |
| is_dormant = false/null | Endorsement visible everywhere | N/A | Yes — backward compatible with existing data |

### Copy Review
- **Transfer button**: "⇆ Transfer" — clear, compact with arrow icon ✅
- **Yacht picker**: "Find your yacht" with Find/Add tabs ✅
- **Confirmation**: "Move your **Chief Stewardess** experience from **TS Driftwood** to **TS Artemis**?" — uses actual role and yacht names ✅
- **Dormancy warning**: "Endorsements will update automatically — any endorsements tied to TS Driftwood may become hidden if you and the endorser no longer share that vessel." — honest, clear, no jargon ✅
- **Success state** (code): Shows count of endorsements made dormant / reactivated ✅
- **Error state** (code): Shows error message with "Try again" button ✅

### Visual Consistency
- Transfer button follows existing Edit button styling (text-secondary, xs size) ✅
- Yacht picker reuses existing YachtPickerModal component ✅
- Confirmation uses BottomSheet with Cancel/Transfer button pair ✅

### Architecture Check
- Both transfer endpoints (old + new) now call dormancy recalculation + colleague rebuild (reviewer fix #1) ✅
- Duplicate-attachment guard prevents corrupted graph data (reviewer fix #2) ✅
- Service-role client for dormancy updates bypasses RLS correctly (reviewer fix #4) ✅
- `is_dormant` filter applied as `.or('is_dormant.is.null,is_dormant.eq.false')` — backward compatible with null values ✅
- Endorsement request page intentionally shows dormant endorsements (documented choice) ✅

### Fixed (applied in yl-wt-3)
| # | Severity | File | Issue | Fix |
|---|----------|------|-------|-----|
| 1 | **HIGH** | `components/experience/TransferExperienceButton.tsx` | Transfer flow broken — YachtPickerModal calls `onClose()` after `onSelect()`, resetting step to `idle` before confirmation renders | Added `useRef` flag (`justSelectedRef`) to skip close when transitioning to confirm step |

### Escalated
_None._

### Discovered Issues
- **[DEBT]** `YachtPicker.tsx:114-118` — `setTimeout(() => searchYachts(...), 0)` in render body instead of `useEffect`. Fires twice in StrictMode.
- **[DEBT]** `YachtPicker.tsx:141-165` — `is_established` fetched in second sequential query. Extra round-trip per keystroke.
- **[BUG/pre-existing]** `app/api/attachment/transfer/route.ts` — Old transfer endpoint now calls dormancy+rebuild (fixed by worker), but still uses different semantics (RPC cascade vs direct update). Consider consolidating.
- **[DEBT]** No FK constraint from `experience_transfers.employment_id` to `attachments(id)`. No indexes on `experience_transfers` for `user_id`/`employment_id`.

---

## Session 6 — Lane 4 QA (chore/pro-upsell-consistency)

**Tester:** Claude Code (Opus) — Tester
**Date:** 2026-04-03
**Session:** sessions/2026-04-03-rally009-session6.md
**Lane tested:** Lane 4 (chore/pro-upsell-consistency, yl-wt-4)
**Verdict:** PASS (after fixes)

### Tested (every input → output pair)
| # | Lane | Feature | Input | Expected Output | Actual | Status |
|---|------|---------|-------|-----------------|--------|--------|
| 1 | 4 | ProUpsellCard on photos page | Navigate to /app/profile/photos as free user | Inline upsell in gallery section | "Unlock 14 gallery photos with Crew Pro →" — teal wayfinding | pass |
| 2 | 4 | ProUpsellCard on certs page | Navigate to /app/certs as free user | Banner upsell at top | "Unlock cert expiry tracking and email reminders with Crew Pro" + "Upgrade to Crew Pro" button | pass |
| 3 | 4 | Insights page — no ProUpsellCard | Navigate to /app/insights as free user | Only UpgradeCTA, no double CTA | UpgradeCTA with pricing/founding member info, no ProUpsellCard | pass |
| 4 | 4 | CTA copy consistency | Check all upsell locations | "Upgrade to Crew Pro" everywhere | Certs: "Upgrade to Crew Pro" ✅, Photos: "Crew Pro →" ✅ | pass |
| 5 | 4 | Section color wayfinding | Check each context | Correct section colors | Photos: teal (Profile), Certs: amber (CV) | pass |
| 6 | 4 | CV page — no teal button | Navigate to /app/cv as free user | Amber-styled upload zone | Clickable drop zone with amber icon + dashed border (fixed) | pass |

### Copy Review
- **Certs banner headline**: "Unlock cert expiry tracking and email reminders with Crew Pro" — benefit-first ✅
- **Certs banner sublabel**: "Know before your tickets lapse — automated alerts keep you compliant and ready for the next contract" — sells the pain point ✅
- **Certs CTA**: "Upgrade to Crew Pro" — consistent ✅
- **Photos inline**: "Unlock 14 gallery photos with Crew Pro →" — benefit-first with arrow link ✅
- **No "Go Pro"** anywhere — never mentions GoPro camera ✅
- **Design system docs**: Upsell pattern section appended to page-layout.md ✅

### Visual Consistency
- ProUpsellCard banner variant: rounded card with amber border, prominent CTA ✅
- ProUpsellCard inline variant: subtle text link with section color ✅
- No double CTAs on any page (insights fix verified) ✅

### Fixed (applied in yl-wt-4)
| # | Severity | File | Issue | Fix |
|---|----------|------|-------|-----|
| 1 | **MED** | `components/cv/CvImportCard.tsx` | Teal "Build profile from CV" button on amber CV page — section color violation | Replaced with amber clickable drop zone matching onboarding pattern (founder request) |
| 2 | **PRE-EXISTING** | `components/certs/CertsClient.tsx` | Left border accent stripe on cert cards (border-l-4 amber) — founder hates this | Replaced with normal `border border-[var(--color-border)]` |
| 3 | **PRE-EXISTING** | `components/profile/CertsSection.tsx` | Left border accent stripe on profile cert list items | Removed `border-l-4 border-amber-500` |
| 4 | **PRE-EXISTING** | `components/profile/YachtsSection.tsx` | Left border accent stripe on profile yacht list items | Removed `border-l-4 border-navy-500` |

### Discovered Issues
- **[UX/pre-existing]** `components/profile/EndorsementsSection.tsx:64` — `border-l-2` on endorsement list items. Should be removed in a follow-up sweep.
- **[UX/pre-existing]** `components/cv/CvPreview.tsx:155` — `border-l-2` on CV endorsement excerpts. May be intentional for blockquote styling but should be reviewed.
- **[DEBT]** `components/insights/UpgradeCTA.tsx` — Feature list is hardcoded; needs manual update if Pro features change.
- **[UX/pre-existing]** `--color-teal-200` has no dark mode override — garish in dark mode.

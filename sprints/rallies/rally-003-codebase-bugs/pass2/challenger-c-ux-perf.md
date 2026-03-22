# Rally 003 — Pass 2 — Challenger C: UX/Accessibility + Performance

**Challenging:** Agent 4 (UX & Accessibility, 20 findings) and Agent 6 (Performance, 18 findings)
**Date:** 2026-03-22
**Method:** Each finding verified against the actual source file and line cited. Nothing rubber-stamped.

---

## Verified Findings

### From Agent 4 — UX & Accessibility

**UX-1 (was Finding 1) — More/Settings: Flash of Free Plan**
CONFIRMED. `app/(protected)/app/more/page.tsx:75` — `useState(false)` default means a Pro user sees "Current plan: Free" until the `useEffect` resolves. The `loading.tsx` skeleton does cover the billing section visually during initial navigation, but once the client hydrates the `isPro=false` default renders the free-user link before the fetch completes. **Severity: HIGH — confirmed.** The suggested fix (initialize to `null` and gate the billing section) is correct.

**UX-2 (was Finding 2) — Public Profile Back Button Hard-coded to `/`**
CONFIRMED. Both `components/public/HeroSection.tsx:86` and `PublicProfileContent.tsx:192` have `<Link href="/">` with `aria-label="Go back"`. There is no `router.back()` or referrer awareness. A logged-in user navigating from `/app/network` gets sent to the marketing homepage. **Severity: HIGH — confirmed.**

**UX-3 (was Finding 3) — SectionManager `role="checkbox"` on Toggle**
CONFIRMED. `components/profile/SectionManager.tsx:62` uses `role="checkbox"` on a `<button>` element that renders a pill-shaped toggle switch. The correct ARIA role is `role="switch"`. **Severity: MEDIUM — confirmed.** Note: Finding 14 is a direct duplicate of this (see Duplicates section).

**UX-4 (was Finding 4) — `window.confirm()` for Destructive Deletes**
CONFIRMED across all five locations:
- `app/(protected)/app/certification/[id]/edit/page.tsx:100` — `confirm('Remove this certification?')`
- `app/(protected)/app/profile/photos/page.tsx:217` — `confirm('Delete this photo?')`
- `app/(protected)/app/education/[id]/edit/page.tsx:86` — `confirm('Delete this education entry?')`
- `app/(protected)/app/profile/gallery/page.tsx:65` — `confirm('Remove this photo from your gallery?')`
- `app/(protected)/app/network/saved/SavedProfilesClient.tsx:100` — `confirm('Delete this folder?...')`
All five use the native browser dialog. **Severity: MEDIUM — confirmed.**

**UX-5 (was Finding 5) — Attachment New: YachtPicker Blank While userId Loads**
CONFIRMED. `app/(protected)/app/attachment/new/page.tsx:105` — `{userId && (<YachtPicker .../>)}`. No skeleton or spinner exists for the period before `userId` is populated. **Severity: MEDIUM — confirmed.**

**UX-6 (was Finding 6) — Certification New: Silent Failure if Cert Types Fetch Fails**
CONFIRMED. `app/(protected)/app/certification/new/page.tsx:52-58` — `.then(({ data }) => { if (data) setCertTypes(data) })` swallows any error silently. No error state, no retry. **Severity: MEDIUM — confirmed.**

**UX-7 (was Finding 7) — Endorsement Request: Share Buttons Disabled With Unclear Feedback**
CONFIRMED. `app/(protected)/app/endorsement/request/RequestEndorsementClient.tsx:347` — `disabled={!shareLink}` on three buttons. The "Generating link..." text at line 357-359 is placed below the button row as a `<p>` element. **Severity: MEDIUM — confirmed.** Minor amendment: the text does render below the buttons while loading but is easy to miss; the severity is appropriate.

**UX-8 (was Finding 8) — Certs Page: No `loading.tsx`**
CONFIRMED. Searched the entire codebase; no `loading.tsx` exists under `app/(protected)/app/certs/`. Other similarly-structured pages (`more`, `network`, `profile`) all have loading skeletons. **Severity: MEDIUM — confirmed.**

**UX-9 (was Finding 9) — Photos Page: Silent Error on Fetch Failure**
CONFIRMED. `app/(protected)/app/profile/photos/page.tsx:132-135` — the `catch` block is `} catch { // silently fail }` with no error state and no toast. The user sees an empty "Add photo" state if the fetch fails. **Severity: MEDIUM — confirmed.**

**UX-10 (was Finding 10) — Public Profile: Entirely Blank Content Section Possible**
CONFIRMED. `components/public/PublicProfileContent.tsx:278-598` — every content section is conditional. If all section_visibility flags are false and no contact info is configured, the right panel is empty except for the bottom CTA. No fallback message exists. **Severity: MEDIUM — confirmed.**

**UX-11 (was Finding 11) — Network Page Heading Padding Inconsistency**
CONFIRMED BUT DOWNGRADED. `app/(protected)/app/network/page.tsx:141-151` — the `<h1>` is inside `<PageTransition>` with no horizontal padding, while `<AudienceTabs>` starts at line 144 with its own `-mx-4 px-4` breakout. However, this is actually indented correctly in the source: the `<AudienceTabs>` is visually outside the `<PageTransition>` indent. The heading has no `px-` class but is a direct child of the `<PageTransition>` which itself has no padding override here. The visual effect is minimal. **Severity: LOW — confirmed but cosmetic only.**

**UX-12 (was Finding 12) — WriteEndorsementForm: No Hint When Textarea is Empty**
CONFIRMED. `components/endorsement/WriteEndorsementForm.tsx:178-181` — `{!minMet && charCount > 0 ? ... : <span />}`. The hint is invisible at `charCount === 0`. The submit button is disabled with no explanation visible. **Severity: LOW — confirmed.**

**UX-13 (was Finding 13) — SaveProfileButton: No Success Toast on Unsave**
CONFIRMED. `components/profile/SaveProfileButton.tsx:28-33` — on successful delete (`res.ok`), only `router.refresh()` is called. No toast is shown. The optimistic UI update (visual toggle to unsaved) does provide implicit feedback, which slightly reduces severity. **Severity: LOW — confirmed, but the optimistic update mitigates user confusion somewhat.**

**UX-15 (was Finding 15) — Attachment New: Missing `px-4` on Yacht/Role Steps**
CONFIRMED. `app/(protected)/app/attachment/new/page.tsx:97` yacht step and `:121` role step both use `"min-h-screen bg-[var(--color-surface)] pt-8 pb-24"` without `px-4`. The dates step at line 220 correctly includes `px-4`. **Severity: LOW — confirmed.**

**UX-16 (was Finding 16) — Delete Account: No Two-Step Confirmation**
CONFIRMED AS FILED BUT SEVERITY OVERSTATED. The page does require typing `DELETE MY ACCOUNT` verbatim, which is a strong single-step confirmation. The agent's suggestion of a two-step flow is a stylistic preference, not a safety issue. The delete button is disabled until the exact string is entered. **Severity: LOW — confirmed, but the current UX is already robust. This is an enhancement suggestion, not a bug.**

**UX-17 (was Finding 17) — Network: Saved Tab Has No Count Badge**
CONFIRMED. `components/audience/AudienceTabs.tsx:165-174` — colleagues tab shows a count badge, saved tab renders just the string `'Saved'` with no badge. The saved tab content is also a link card to another page rather than inline content. **Severity: LOW — confirmed.**

**UX-18 (was Finding 18) — CV Page: `handle!` Non-Null Assertion**
CONFIRMED BUT SEVERITY UPGRADED. `app/(protected)/app/cv/page.tsx:24` — `handle={profile.handle!}`. The `CvActions` component uses this handle to construct the public profile URL and QR code. If `profile.handle` is null (possible if a user completed onboarding without setting a handle, or if the handle field was added after their account was created), the QR code and share URL will include a literal `null` value. This is a real data integrity risk. **Severity: MEDIUM — upgrading from LOW.** The page fetches the profile before rendering, so it won't runtime-crash TypeScript, but it will silently produce a broken URL.

**UX-19 (was Finding 19) — Button Spinner: No ARIA Loading State**
CONFIRMED. `components/ui/Button.tsx:50-74` — when `loading={true}`, no `aria-busy` attribute is added to the `<button>` element. The spinner SVG has no accessible text. **Severity: LOW — confirmed.**

**UX-20 (was Finding 20) — More Loading Skeleton: `w-0` Zero-Width Element**
CONFIRMED. `app/(protected)/app/more/loading.tsx:72` — `<Skeleton className="h-3 w-0 mx-1 mt-4 mb-1" />`. This skeleton renders as a 0px-wide, 3px-tall invisible element before the sign-out button. It serves no visual purpose. **Severity: LOW — confirmed.**

---

### From Agent 6 — Performance

**PERF-1 (was Finding 1) — Analytics Nudge Cron: N+1 Sequential Sends**
CONFIRMED. `app/api/cron/analytics-nudge/route.ts:63-70` — `for (const user of users)` with two sequential `await` calls inside the loop (email send + DB update). The code is exactly as cited. **Severity: HIGH — confirmed.**

**PERF-2 (was Finding 2) — Cert-Expiry Cron: N+1 Sequential Sends**
CONFIRMED. `app/api/cron/cert-expiry/route.ts:52-73` — identical sequential pattern. The 60d/30d branching means each cert gets one email + one DB update in sequence. **Severity: HIGH — confirmed.**

**PERF-3 (was Finding 3) — CV Save: Sequential Per-Yacht RPC Loop**
CONFIRMED. `lib/cv/save-parsed-cv-data.ts:123-173` — `for...of` loop with sequential `supabase.rpc`, optional `supabase.from('yachts').insert`, and `supabase.from('attachments').insert` per employment entry. The same pattern applies to the certifications loop at lines 182-204. **Severity: HIGH — confirmed.**

**PERF-4 (was Finding 4) — Analytics Nudge: Full Table Scan**
CONFIRMED. `app/api/cron/analytics-nudge/route.ts:22-26` — fetches all `profile_analytics` rows for the last 7 days with no limit, aggregates in JS. As the platform grows this will scan an unbounded number of rows. **Severity: HIGH — confirmed.**

**PERF-5 (was Finding 5) — Export: Unbounded `select('*')` on profile_analytics**
CONFIRMED. `app/api/account/export/route.ts:33` — `admin.from('profile_analytics').select('*').eq('user_id', user.id)` with no limit. For a user with years of activity this could be thousands of rows loaded into memory at once. **Severity: HIGH — confirmed. However, note that this is behind a rate limit (fileUpload budget: 20/hour) which mitigates abuse; the real risk is a legitimate power user with dense analytics data.**

**PERF-6 (was Finding 6) — Public Profile: 3-Level Sequential Mutual-Colleague Waterfall**
CONFIRMED. `app/(public)/u/[handle]/page.tsx:129-172` — the code shows exactly the three-level sequential dependency chain described. This adds measurable latency to every public profile load for authenticated viewers who share yachts with the viewed profile. **Severity: MEDIUM — confirmed.**

**PERF-7 (was Finding 7) — Public Profile: `user_photos` Outside `Promise.all`**
CONFIRMED. `app/(public)/u/[handle]/page.tsx:88-92` — `user_photos` is fetched with a standalone `await` after the `Promise.all` block closes at line 85. The fetch has no dependency on the parallel results. **Severity: MEDIUM — confirmed.**

**PERF-8 (was Finding 8) — Private Profile: `user_photos` Outside `Promise.all`**
CONFIRMED. `app/(protected)/app/profile/page.tsx:44-48` — same pattern. `user_photos` is awaited after the `Promise.all` at lines 32-37 completes. **Severity: MEDIUM — confirmed.**

**PERF-9 (was Finding 9) — Missing Index: Cross-User Analytics Event-Type Query**
CONFIRMED AS A CONCERN. The existing index `idx_profile_analytics_user_event_date` covers `(user_id, event_type, occurred_at DESC)`. The nudge cron queries without a `user_id` filter, so the leading column of the index cannot be used for an index seek. The table will be scanned. **Severity: MEDIUM — confirmed.**

**PERF-10 (was Finding 10) — Missing Index on `users.subscription_status`**
CONFIRMED. No `CREATE INDEX` for `users.subscription_status` was found in any migration file. Multiple queries filter on this column. **Severity: MEDIUM — confirmed.**

**PERF-11 (was Finding 11) — `unoptimized` on All Image Components**
CONFIRMED. The `unoptimized` prop exists in exactly 10 production source files (confirmed via full codebase search, excluding node_modules and archive directories):
- `components/profile/PhotoGallery.tsx:85`
- `components/public/PublicProfileContent.tsx:532, 547`
- `components/network/SavedProfileCard.tsx:55`
- `components/profile/IdentityCard.tsx:102`
- `components/cv/ShareModal.tsx:88`
- `components/profile/ProfileHeroCard.tsx:64`
- `app/(protected)/app/profile/page.tsx:185`
- `app/(protected)/app/profile/gallery/page.tsx:98`
- `app/(protected)/app/profile/photos/page.tsx:75`
The Supabase CDN hostname is whitelisted in `next.config.ts`, so removing `unoptimized` would immediately enable WebP conversion and responsive srcsets. **Severity: MEDIUM — confirmed. The count of 10 is correct.**

**PERF-14 (was Finding 14) — MorePage useEffect: Missing Mounted Guard**
CONFIRMED. `app/(protected)/app/more/page.tsx:81-100` — `fetchSub()` is called without a mounted guard. State setters (`setIsPro`, `setSubPlan`, etc.) will be called on an unmounted component if navigation occurs before the fetch resolves. **Severity: LOW — confirmed.**

**PERF-15 (was Finding 15) — Saved Profiles: In-Memory Sort Fetches All Rows**
CONFIRMED. `app/api/saved-profiles/route.ts:47-54, 112-130` — for `name` and `role` sort options, all saved profiles are fetched (no `.range()` applied to the DB query), sorted in JavaScript, then sliced. The comment explicitly acknowledges this: `// P3 fix: for name/role sort, we must fetch all rows, sort, then paginate`. **Severity: MEDIUM — confirmed.**

**PERF-16 (was Finding 16) — OG Route: Raw `fetch` to Supabase REST**
CONFIRMED AS FILED. `app/api/og/route.tsx:30-33` — uses a manually-constructed REST URL rather than the Supabase client. This is an edge runtime constraint (cannot use Node.js Supabase client in edge functions). The finding is valid but the agent correctly notes this is an acceptable edge-runtime pattern. **Severity: LOW — confirmed. The fix suggestion (edge-compatible Supabase client) is the right direction.**

**PERF-17 (was Finding 17) — `getUserByHandle` Called Twice (React.cache Mitigates)**
CONFIRMED AS NO-ACTION. `app/(public)/u/[handle]/page.tsx:17, 45` — called in both `generateMetadata` and the page function. `React.cache()` deduplicates within a request. This is working as intended. The finding's own conclusion is "no code change needed." **Severity: LOW — confirmed no-op. Still useful to document.**

**PERF-18 (was Finding 18) — `console.error` Logs Expected 4xx Errors**
CONFIRMED BUT REASSESSED. `lib/api/errors.ts:9` — `handleApiError` calls `console.error` and `Sentry.captureException`. Critically: `handleApiError` is only called from catch blocks — it is the unexpected error handler, not the 4xx handler. Looking at the codebase, expected 4xx errors are returned with `apiError(message, status)` directly, not via `handleApiError`. The agent's concern that `handleApiError` fires for expected 4xx errors is **incorrect** — it is only called when an unexpected exception is thrown. **Severity: this finding is partially a false positive — see False Positives section.**

---

## False Positives

### Agent 4 — UX-14 is a Duplicate, Not a Separate Finding
**Finding 14** (SectionManager `role="checkbox"` — known unresolved, LOW) is the exact same issue as **Finding 3** (SectionManager `role="checkbox"`, MEDIUM). Both reference `components/profile/SectionManager.tsx:62`, describe the same bug, and suggest the same fix. Filing the same issue twice at different severities inflates the finding count by one. See Duplicates section.

### Agent 6 — Finding 12: AnalyticsChart Incorrectly Flagged as Pure Component
**Finding 12** claims `AnalyticsChart` has "no hooks, no state, no event handlers, and no browser APIs." The code at `components/insights/AnalyticsChart.tsx:1` confirms `'use client'` is present. However, the component does use inline styles with CSS custom properties (`var(--color-surface-raised)`) which are computed values that require the browser DOM at runtime — the component is not trivially server-renderable. More importantly, the component uses `aria-hidden` (an accessibility hint) but has no tooltip text for the bars accessible to screen readers outside of the SVG. Removing `'use client'` is unlikely to cause a breakage but the finding overstates the simplicity. The performance gain from this specific change is negligible (the parent Insights page is already `'use client'` due to other components). **Severity: downgrade from LOW to INFO — technically valid but negligible impact given the rendering context.**

### Agent 6 — Finding 13: ProfileStrength Cannot Be a Server Component
**Finding 13** is marked "(not fully read but identified via import pattern)" — the agent flagged this without reading the file. The actual code in `components/profile/ProfileStrength.tsx` uses `'use client'`, `motion` (Framer Motion), and the `popIn` animation variant from `@/lib/motion`. Framer Motion requires client-side rendering; this component cannot become a server component. **This is a false positive.** The agent acknowledges the finding is unverified, but it should have been removed rather than filed.

### Agent 6 — Finding 18 (console.error) is Partially Wrong
The agent claims `handleApiError` in `lib/api/errors.ts:9` logs expected 4xx errors. Reading the actual usage in the codebase, `handleApiError` is only called from `catch(e)` blocks — it handles thrown exceptions (unexpected errors). Expected 4xx responses are returned with `return apiError('message', 404)` directly, bypassing `handleApiError`. The pattern of `console.error` in `handleApiError` is therefore appropriate and intentional — it fires on real unexpected errors, not routine 4xx responses. The finding as stated is inaccurate. **The concern about log noise from 4xx errors is unfounded.**

---

## Missed Issues

### MISS-1 — UX + Performance: Profile Load Latency Creates Blank-Content Window (Cross-Concern)
The sequential `user_photos` fetch after `Promise.all` (PERF-7, PERF-8) has a direct UX consequence that neither agent flagged: when navigating to a profile, the photo gallery section (both mobile hero and desktop gallery panel) will render with a loading/empty state for an additional network round-trip after the rest of the page renders. This creates a layout shift visible to users. The `PhotoGallery` component does handle empty `photos` gracefully (falls back to `profilePhotoUrl`), but gallery sections that depend on `user_photos` will pop in visibly after the initial render. This is a UX-regression of a performance problem that both agents looked at from only one angle.

### MISS-2 — Accessibility: `AnalyticsChart` Has No Screen Reader Content
`components/insights/AnalyticsChart.tsx:25` — the chart container has `aria-hidden` applied to it (`<div ... aria-hidden>`). This hides the entire chart from screen readers, but there is no alternative text or accessible table equivalent provided anywhere in the parent component. A user relying on a screen reader using the Insights page sees no analytics data at all. The `title` attributes on individual bars (`title={`${point.day}: ${point.count}`}`) are mouse-hover tooltips only — they are not announced by screen readers. This is a missed accessibility finding that neither agent caught.

### MISS-3 — UX: `ProfileStrength` SVG Text Has No ARIA Label
`components/profile/ProfileStrength.tsx:47` — the SVG displays a percentage score as `<text>` inside an SVG circle. There is no `aria-label` on the outer SVG element and no `role="img"` with a descriptive label. Screen readers will either skip the SVG or announce raw coordinates. The profile strength score — a key engagement metric — is invisible to assistive technology.

### MISS-4 — UX: `WriteEndorsementForm` Has No Character Count on Initial Render When in Edit Mode
`components/endorsement/WriteEndorsementForm.tsx:49, 178` — in edit mode, `content` is initialized from `existingEndorsement.content`. If the existing content is near the 2000-character max, the user may not realize they are close to the limit until they start typing and see the counter. The counter is rendered correctly but there is no visual warning state on load when the existing content is already long.

### MISS-5 — Performance: `export` Route Also Fetches `endorsement_requests` Without Limit
Agent 6's Finding 5 correctly identified `profile_analytics` as unbounded in the export route. It missed that `admin.from('endorsement_requests').select('*').eq('requester_id', user.id)` at `app/api/account/export/route.ts:32` is also unbounded. A user who has sent many endorsement requests would also produce a large payload from this table. The same fix applies.

### MISS-6 — Accessibility: `SaveProfileButton` Uses Emoji Heart with No Screen Reader Label
`components/profile/SaveProfileButton.tsx:48-51` — the button renders `♥` (saved) or `♡` (unsaved) emoji characters as visual indicators. These emoji will be announced by screen readers as "black heart suit" or "white heart suit" rather than the intended "saved"/"unsaved" meaning. The `aria-label` on the outer `<button>` (`aria-label={saved ? 'Unsave profile' : 'Save profile'}`) correctly labels the button action, but the inner `<span>` containing the emoji is not `aria-hidden`, meaning screen readers will announce both the emoji and the button text label ("Unsave profile, black heart suit, Saved"). The emoji spans should have `aria-hidden="true"`.

### MISS-7 — Performance + UX: OG Image Fetches Unoptimized Full-Resolution Profile Photo
`app/api/og/route.tsx:82-91` — the OG image renders `user.profile_photo_url` directly at 240x240px in the Satori renderer. The profile photo URL is the full-resolution Supabase storage URL. For users with large profile photos (multiple MB), the OG image generation will download the entire original file on every cache miss. This is particularly impactful for social media crawlers (Twitter cards, Facebook previews) that bypass caching. A Supabase image transformation URL with explicit dimensions should be used instead.

---

## Duplicates

### UX Finding 3 and UX Finding 14 — Same Bug, Duplicate Filing
Both Agent 4 Finding 3 (MEDIUM) and Agent 4 Finding 14 (LOW) refer to `components/profile/SectionManager.tsx:62` and the `role="checkbox"` vs `role="switch"` issue. Finding 3 is the canonical report with the correct severity (MEDIUM). Finding 14 should be merged into Finding 3 or dropped. The agent appears to have filed it twice because it also appears in `docs/ops/lessons-learned.md`, but both findings describe the same underlying bug in the same component at the same line.

---

## Summary

| Category | Count | Notes |
|----------|-------|-------|
| Agent 4 findings verified | 19/20 | Finding 14 is a duplicate of Finding 3 |
| Agent 4 false positives | 0 | (Finding 14 is a duplicate, not a FP) |
| Agent 4 severity adjustments | 2 | UX-18 upgraded to MEDIUM; UX-16 reconsidered as enhancement |
| Agent 6 findings verified | 15/18 | |
| Agent 6 false positives | 2 | Finding 13 (ProfileStrength, unread), Finding 18 (console.error logic incorrect) |
| Agent 6 non-actionable | 1 | Finding 17 (React.cache works as intended) |
| Agent 6 severity adjustments | 1 | Finding 12 (AnalyticsChart) downgraded to INFO |
| Missed issues found | 7 | MISS-1 through MISS-7 |
| Cross-report duplicates | 0 | No overlap between the two agents' findings |

### Top Priority Additions from This Review
1. **MISS-2** — AnalyticsChart entirely hidden from screen readers with no alternative (Accessibility, MEDIUM)
2. **MISS-7** — OG image generator downloading full-resolution profile photos on every cache miss (Performance, MEDIUM)
3. **MISS-3** — ProfileStrength SVG score not accessible to screen readers (Accessibility, LOW)
4. **MISS-6** — Emoji hearts not `aria-hidden` in SaveProfileButton, causing double-announcement (Accessibility, LOW)

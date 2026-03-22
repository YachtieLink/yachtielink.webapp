# Rally 003 — Pass 1 — Agent 4: UX & Accessibility

**Scope:** All pages under `app/` and all components under `components/`. Focus on empty states, loading states, error states, mobile layout, Pro feature gates, navigation, public profile degradation, and form UX.

**Date:** 2026-03-22

---

## Finding 1 — More/Settings Page: No Loading State for Subscription Data

**Severity:** HIGH
**File:** `app/(protected)/app/more/page.tsx:75-100`
**Issue:** The More page is a client component that fetches subscription status in a `useEffect` on mount. Until the fetch resolves, `isPro` is `false` and `subPlan`/`subEndsAt` are `null`. This means a Pro user briefly sees "Current plan: Free" and the "Upgrade to Crew Pro" link in the Billing section before the real data arrives. There is no loading skeleton or placeholder for the Billing section during this window.
**Evidence:** `const [isPro, setIsPro] = useState(false)` — default is free. The billing section immediately renders the free-user view. The page does have a `loading.tsx` skeleton, but that only covers the initial server render; the client-side fetch fires after hydration.
**Fix:** Initialize `isPro` as `null` (unknown) and render a skeleton or nothing in the Billing section until the fetch resolves, rather than defaulting to the free state.

---

## Finding 2 — Public Profile: Back Button Always Goes to `/` (Homepage)

**Severity:** HIGH
**File:** `components/public/HeroSection.tsx:86` and `components/public/PublicProfileContent.tsx:192`
**Issue:** The back button in the public profile hero (both mobile `HeroSection` and desktop panel in `PublicProfileContent`) hard-codes `href="/"`. If a logged-in user navigates to a colleague's public profile from `/app/network`, clicking Back sends them to the marketing homepage (`/`) instead of back to the network page. Logged-in users lose their navigation context.
**Evidence:** `<Link href="/" … aria-label="Go back">`. There is no `router.back()` or referrer-aware navigation here.
**Fix:** Use `router.back()` in a client component, or pass a `backHref` prop from the server page (which can inspect the referrer or use a known safe default like `/app/network` for logged-in users vs `/` for anonymous visitors).

---

## Finding 3 — SectionManager Uses `role="checkbox"` on a Toggle Button

**Severity:** MEDIUM
**File:** `components/profile/SectionManager.tsx:62`
**Issue:** The visibility toggle buttons in the Profile Section Manager use `role="checkbox"` on a `<button>` element. The correct ARIA role for a toggle switch is `role="switch"`. This is a known project pattern that was flagged in `docs/ops/lessons-learned.md:173` but not fixed in this component.
**Evidence:** `<button role="checkbox" aria-checked={checked} ...>` — this is semantically wrong; screen readers will announce these as checkboxes but they behave like switches.
**Fix:** Change `role="checkbox"` to `role="switch"` to match the ARIA specification and how the other toggle components in the codebase (`ProfileSectionGrid`, `CvActions`, `ProfileSettingsPage`) already implement it.

---

## Finding 4 — Multiple Destructive Delete Actions Use `window.confirm()`

**Severity:** MEDIUM
**File:** `app/(protected)/app/certification/[id]/edit/page.tsx:100`, `app/(protected)/app/profile/photos/page.tsx:217`, `app/(protected)/app/education/[id]/edit/page.tsx:86`, `app/(protected)/app/profile/gallery/page.tsx:65`, `app/(protected)/app/network/saved/SavedProfilesClient.tsx:100`
**Issue:** Five distinct delete/remove actions rely on `window.confirm()` for confirmation. On mobile browsers (iOS Safari especially), `window.confirm()` renders as a generic browser dialog with no styling, no context about what is being deleted, and no branding. It also blocks the JS thread. The app has a Toast system and a BottomSheet component that could provide a consistent, styled confirmation experience.
**Evidence:** `if (!confirm('Delete this photo?')) return` — plain browser dialog.
**Fix:** Replace `window.confirm()` calls with a modal or bottom sheet confirmation dialog that uses the app's design system, shows a clear description of what will be deleted, and includes labelled "Confirm" / "Cancel" buttons.

---

## Finding 5 — Attachment New Page: YachtPicker Only Renders After User ID Is Fetched

**Severity:** MEDIUM
**File:** `app/(protected)/app/attachment/new/page.tsx:104-114`
**Issue:** The YachtPicker on the "Add a yacht" step is conditionally rendered: `{userId && <YachtPicker ... />}`. Until the `useEffect` resolves the auth call, the page shows only the heading and description with no visible content or loading indicator. On slow connections this produces a blank-looking form area.
**Evidence:** `{userId && (<YachtPicker .../>)}` — no skeleton or spinner while `userId` is empty string.
**Fix:** Add a skeleton placeholder for the YachtPicker area while the user ID is loading.

---

## Finding 6 — Certification New Page: Empty Category Grid if `certification_types` Fetch Fails

**Severity:** MEDIUM
**File:** `app/(protected)/app/certification/new/page.tsx:52-58`
**Issue:** The certification categories are fetched client-side in a `useEffect`. If the fetch fails or returns empty, `categories` is an empty array and the grid renders nothing — no error message, no retry button, no "no categories found" explanation. The user sees a heading and an "Other / not listed" button with a blank grid above it.
**Evidence:** The `useEffect` `.then(({ data }) => { if (data) setCertTypes(data) })` silently discards errors. No error state variable exists.
**Fix:** Track a fetch error state and render a message like "Could not load certification types. Please try again." with a retry action if the fetch fails.

---

## Finding 7 — Endorsement Request Page: Share Link Buttons Are Disabled While Link Loads With No Explanation

**Severity:** MEDIUM
**File:** `components/endorsement/RequestEndorsementClient.tsx:357-360`
**Issue:** The WhatsApp, Copy Link, and Share buttons are `disabled={!shareLink}` while the share link is being fetched. The only feedback is a small `"Generating link..."` text below the buttons. The buttons appear greyed out and unresponsive without a clear visual affordance explaining why.
**Evidence:** `disabled={!shareLink}` combined with `{loadingShareLink && <p>Generating link...</p>}`. The text is easy to miss and below the disabled buttons.
**Fix:** Show a loading spinner inside the buttons, or use a skeleton/shimmer in place of the button row until the link is ready. Move the "Generating link..." copy to be visually adjacent to or inside the buttons.

---

## Finding 8 — Certs Page: Missing Loading State (No `loading.tsx`)

**Severity:** MEDIUM
**File:** `app/(protected)/app/certs/page.tsx`
**Issue:** The `/app/certs` page is a server component with two async data fetches (`getProStatus` and the certifications query). There is no `loading.tsx` file for this route. During navigation, the page will show no content until both fetches complete. Compare with `/app/insights`, `/app/network`, `/app/more`, and `/app/profile`, which all have `loading.tsx` skeletons.
**Evidence:** Checked `app/(protected)/app/certs/` — no `loading.tsx` file exists.
**Fix:** Add a `loading.tsx` for the certs page with a skeleton that matches the page layout (header row, optional Pro banner, list of cert cards).

---

## Finding 9 — Photos Page: Silent Error on Fetch Failure

**Severity:** MEDIUM
**File:** `app/(protected)/app/profile/photos/page.tsx:113-139`
**Issue:** The `load()` function in `useEffect` wraps everything in a `try/catch` but the `catch` block does nothing (`// silently fail`). If the `GET /api/user-photos` request fails, `photos` stays `[]` and `loading` becomes `false` — the page renders as if the user has no photos, with an "Add photo" prompt. The user has no way to know a fetch error occurred.
**Evidence:** `} catch { // silently fail }` at line ~136. No error state, no toast.
**Fix:** Catch and surface the error to the user via a toast or inline error message. At minimum, show a "Could not load your photos" message rather than an empty state that implies no photos exist.

---

## Finding 10 — Public Profile: Entire Content Section Can Be Empty Without Any Message

**Severity:** MEDIUM
**File:** `components/public/PublicProfileContent.tsx:278-598`
**Issue:** When a user has all sections hidden via `section_visibility` (all set to `false`) AND has no contact info, no CV public download, the right-hand scrollable content area renders completely empty — just a bottom CTA bar. A visitor sees only the hero photo panel and then a blank content area. There is no message like "This user has chosen to keep their profile private" or similar graceful degradation.
**Evidence:** Every section is wrapped in `sectionVisible(sectionVisibility, key, hasData)` — if all return `false`, nothing renders. The contact block and CV block are also conditional.
**Fix:** Add a fallback message in the content area if all sections are hidden, e.g. "Profile content is private" or equivalent, so the page looks intentional rather than broken.

---

## Finding 11 — Network Page Indentation Issue: `AudienceTabs` Not Inside `PageTransition` Container

**Severity:** LOW
**File:** `app/(protected)/app/network/page.tsx:141-152`
**Issue:** The `<h1>` "Network" heading is inside the `<PageTransition>` component but the `<AudienceTabs>` component immediately uses `-mx-4 px-4 md:-mx-6 md:px-6` negative margin to break out of the parent container. The `<h1>` itself has no horizontal padding, which means it renders flush against the container without the normal `px-4` of the layout. This produces a slight inconsistency compared to other pages.
**Evidence:** `<h1 className="text-[28px] font-bold tracking-tight ...">Network</h1>` has no px padding, while `AudienceTabs` uses `className="min-h-screen bg-[var(--color-navy-50)] -mx-4 px-4 ..."`.
**Fix:** Add `px-1` or match padding on the heading, or move it inside `AudienceTabs` for consistency.

---

## Finding 12 — WriteEndorsementForm: Submit Button Not Disabled on First Keystroke / Before 10 Characters

**Severity:** LOW
**File:** `components/endorsement/WriteEndorsementForm.tsx:249-256`
**Issue:** The endorsement textarea has a 10-character minimum. The submit button is disabled when `!minMet || charCount > maxAllowed || submitting`. However, `minMet` is `charCount >= 10`, meaning at 0 characters (empty textarea) the button is correctly disabled. But there is no visible indicator to the user that they need to write at least 10 characters before the button will enable — the "10 characters minimum" hint only appears when `!minMet && charCount > 0`. A user clicking an empty form sees a disabled button with no explanation.
**Evidence:** `{!minMet && charCount > 0 ? (<p>10 characters minimum</p>) : (<span />)}` — hint is invisible when `charCount === 0`.
**Fix:** Show the character minimum hint immediately when the form is in its initial state (either as static hint text below the textarea, or as placeholder information), so the user understands why the button is disabled.

---

## Finding 13 — Save Profile Button: No Feedback on Unsave Action

**Severity:** LOW
**File:** `components/profile/SaveProfileButton.tsx`
**Issue:** Based on the pattern in `SavedProfilesClient.tsx:71-81`, the unsave action (DELETE to `/api/saved-profiles`) performs an optimistic UI update and shows a toast only on failure. There is no success toast when a profile is unsaved from the public profile page via the `SaveProfileButton`. The user receives no confirmation that the unsave completed.
**Evidence:** `if (!res.ok) toast('Could not unsave', 'error')` — only error state is announced.
**Fix:** Add a `toast('Profile unsaved', 'success')` on successful delete.

---

## Finding 14 — `role="checkbox"` vs `role="switch"` on Toggle Pattern Is Systemic

**Severity:** LOW
**File:** `components/profile/SectionManager.tsx:62`
**Issue:** As documented in `docs/ops/lessons-learned.md:173`, the project has a known inconsistency between toggle implementations. `SectionManager` uses `role="checkbox"` while `ProfileSectionGrid`, `CvActions`, and `ProfileSettingsPage` correctly use `role="switch"`. This is a known issue that has been documented but not resolved in `SectionManager`.
**Evidence:** See `docs/ops/lessons-learned.md:173-174` — explicitly calls out `SectionManager` as the remaining incorrect instance.
**Fix:** Update `SectionManager` button from `role="checkbox"` to `role="switch"`.

---

## Finding 15 — Attachment New Page: No Padding on Yacht/Role Steps

**Severity:** LOW
**File:** `app/(protected)/app/attachment/new/page.tsx:95-116` and `119-216`
**Issue:** The `yacht` and `role` steps render `<div className="min-h-screen bg-[var(--color-surface)] pt-8 pb-24">` without horizontal padding (`px-4`). The content inherits padding from the parent layout (`mx-auto max-w-2xl px-4`), but the `min-h-screen` background fill will not extend edge-to-edge at narrow widths the way other fullscreen step pages do. The `dates` step correctly adds `px-4`.
**Evidence:** `<div className="min-h-screen bg-[var(--color-surface)] pt-8 pb-24">` on lines 97 and 121 — no `px-4`, while the dates step at line 219 includes it.
**Fix:** Add `px-4` to the yacht and role step containers for consistent spacing.

---

## Finding 16 — Delete Account: No Loading Skeleton While Page Renders

**Severity:** LOW
**File:** `app/(protected)/app/more/delete-account/page.tsx`
**Issue:** This is a client component that renders immediately (no async data fetch), so there is no loading state issue. However, the destructive action flow has no intermediate "Are you sure?" confirmation before showing the delete form. The user lands directly on the deletion form with the confirmation input visible. This is a minor UX concern — most destructive flows show a warning step before the confirmation input, not both on the same page without gatekeeping.
**Evidence:** The page directly shows the full destruction consequences and the confirmation input in one view. There is no "I understand" toggle or step 1 → step 2 progression.
**Fix:** Consider a two-step flow: step 1 shows consequences and asks "Continue to delete?"; step 2 shows the typed confirmation input. This is low priority given the current confirmation string requirement.

---

## Finding 17 — Network Page Doesn't Reflect Saved Profiles Count in "Saved" Tab

**Severity:** LOW
**File:** `components/audience/AudienceTabs.tsx:118` and `154-175`
**Issue:** The "Colleagues" tab shows a count badge (`{colleagues.length}`), but the "Saved" tab shows no count. This inconsistency means a user has no way to see at a glance how many profiles they have saved without navigating to the sub-page. The "Saved" tab is also just a single link card that redirects to `/app/network/saved` rather than showing inline content, which is a dead-end tab experience.
**Evidence:** `tab === 'colleagues' ? (<span ...>{colleagues.length}</span>) : 'Saved'` — saved has no badge, and the tab content is just a link.
**Fix:** Either pass the saved profiles count to `AudienceTabs` and show it as a badge, or restructure the saved tab to show inline content. At minimum, add the count badge.

---

## Finding 18 — CV Page: `profile.handle!` Non-Null Assertion Without Guard

**Severity:** LOW
**File:** `app/(protected)/app/cv/page.tsx:24`
**Issue:** The CV page passes `handle={profile.handle!}` (non-null assertion) to `CvActions`. A user who skipped setting a handle during onboarding would cause a runtime type error. The QR code and profile URL construction in `CvActions` would render `yachtie.link/u/undefined`.
**Evidence:** `handle={profile.handle!}` — if `profile.handle` is `null`, the `!` suppresses the TypeScript error but the value at runtime is `null`.
**Fix:** Add a guard: if `!profile.handle`, redirect to `/app/more/account` with a message asking the user to set a handle, or render a prompt inside the page rather than crashing.

---

## Finding 19 — Spinner Inside Button Has No `aria-label` for Loading State

**Severity:** LOW
**File:** `components/ui/Button.tsx:64-68`
**Issue:** When `loading={true}`, the Button renders a `<Spinner>` SVG alongside the button's text content. The spinner has no `aria-label` or `aria-busy` attribute on the button itself. Screen readers will announce the button text normally without indicating that an action is in progress.
**Evidence:** The spinner SVG has no accessible text. The button does not set `aria-busy="true"` or `aria-label` during loading state.
**Fix:** Add `aria-busy={loading}` to the button element. Optionally add a visually-hidden `<span className="sr-only">Loading</span>` inside the spinner rendering path.

---

## Finding 20 — MorePage Loading Skeleton Has a Zero-Width Skeleton

**Severity:** LOW
**File:** `app/(protected)/app/more/loading.tsx:72`
**Issue:** The loading skeleton for the sign-out section renders `<Skeleton className="h-3 w-0 ..." />` — a skeleton with `w-0` (zero width). This renders nothing visible for that section header, which likely looks like a missing separator rather than a deliberate skeleton element.
**Evidence:** `<Skeleton className="h-3 w-0 mx-1 mt-4 mb-1" />` at line 72 — `w-0` means 0px width, invisible.
**Fix:** Change `w-0` to the intended width (likely `w-12` or similar to match other section header skeletons) or remove this skeleton line entirely since there is no section header text before "Sign out" in the actual page.

---

## Summary

| # | Title | Severity |
|---|-------|----------|
| 1 | More/Settings: No loading state for subscription data | HIGH |
| 2 | Public profile back button always goes to `/` | HIGH |
| 3 | SectionManager uses `role="checkbox"` on toggle | MEDIUM |
| 4 | Destructive deletes use `window.confirm()` | MEDIUM |
| 5 | Attachment new: YachtPicker blank while userId loads | MEDIUM |
| 6 | Cert new: silent failure if cert types fetch fails | MEDIUM |
| 7 | Endorsement request: share buttons disabled with unclear feedback | MEDIUM |
| 8 | Certs page: no `loading.tsx` skeleton | MEDIUM |
| 9 | Photos page: silent error on fetch failure | MEDIUM |
| 10 | Public profile: entirely blank content section possible | MEDIUM |
| 11 | Network page heading has no padding | LOW |
| 12 | WriteEndorsementForm: no hint when textarea is empty | LOW |
| 13 | SaveProfileButton: no success toast on unsave | LOW |
| 14 | SectionManager `role="checkbox"` — known unresolved | LOW |
| 15 | Attachment new: missing `px-4` on yacht/role steps | LOW |
| 16 | Delete account: no two-step confirmation flow | LOW |
| 17 | Network: Saved tab has no count badge | LOW |
| 18 | CV page: `handle!` assertion without null guard | LOW |
| 19 | Button spinner has no ARIA loading state | LOW |
| 20 | More loading skeleton has `w-0` zero-width element | LOW |

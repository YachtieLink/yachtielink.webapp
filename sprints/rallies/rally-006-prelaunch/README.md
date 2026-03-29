# Rally 006 — Pre-Launch Bug Sweep + Polish

**Status:** Ready for execution
**Priority:** P0 — blocks launch
**Effort:** 2-3 days
**Depends on:** All current PRs merged (done)

---

## Why

Backlog audit surfaced 4 bugs and 2 analytics gaps that block a viable MVP. Plus 6 P2 UX issues from the mobile audit that would embarrass us with first users. Fix everything in one rally before Sprint 13 completion and Ghost Profiles.

---

## Scope

### Unit 1: Bugs (P0/P1)

**1. Subdomain cookie auth**
- File: `middleware.ts`, `lib/supabase/middleware.ts`
- Problem: Auth cookies not shared across subdomains. Pro subdomain feature broken.
- Note: Subdomain links currently redirect to `/u/{handle}` as workaround. Root cause (cookie domain scope) unresolved.
- Fix: Set cookie domain to `.yachtie.link` so auth persists across subdomains. Verify in production.

**2. Onboarding skips CV upload**
- File: `app/(protected)/onboarding/`
- Problem: Auth trigger sets `full_name` from email prefix on signup. When user arrives at onboarding, name is pre-filled so they skip past the CV upload step thinking they're done.
- Fix: Don't set name from email prefix in auth trigger, OR ensure CV upload step is not skippable regardless of name state.

**3. Avatar thumbnail framing**
- Files: All avatar/thumbnail renders across the app
- Problem: `object-cover` with default `object-center` crops heads on portrait photos.
- Fix: Default to `object-top` for portrait aspect ratios, `object-center` for square. Apply to: hero card, colleague cards, endorsement cards, yacht crew list, saved profiles, public profile.

**4. CV yacht matching confidence**
- File: `app/(protected)/app/cv/review/`
- Problem: During CV import, yacht matches show no confidence indicator. User can't tell if "Ocean Explorer" matched correctly or is a false positive.
- Fix: Show match quality (exact match badge, fuzzy match with "Did you mean?", no match with create-new option). Show crew count on matched yachts as social proof.

### Unit 2: Analytics Wiring

**5. PDF download tracking**
- Files: `app/api/cv/download-pdf/route.ts`, `app/api/cv/public-download/[handle]/route.ts`, `app/api/cv/generate-pdf/route.ts`
- Fix: Add `record_profile_event('pdf_download')` call in each route after successful response.

**6. Link share tracking**
- Files: Share buttons across profile, CV, public profile
- Fix: Add `record_profile_event('link_share')` when user copies link or triggers share sheet.

**7. Delete billing stub**
- File: `app/(protected)/app/billing/page.tsx`
- Fix: Delete this page. Billing is handled via Settings → Current Plan → Stripe Portal. The stub just says "coming soon" and confuses routing.

### Unit 3: UX Fixes (P2)

**8. Request endorsements banner not dismissable**
- File: `components/audience/AudienceTabs.tsx`
- Fix: Add dismiss X button. Persist dismissal in localStorage. Don't show again for 7 days (or until endorsement count changes).

**9. Network tab bar crowded at 375px**
- File: `components/audience/AudienceTabs.tsx`
- Fix: Make tabs horizontally scrollable on mobile, or use icon-only tabs with labels below at small widths.

**10. "Unknown" in endorsement requests sent**
- File: `components/audience/AudienceTabs.tsx` (Endorsements tab, requests sent section)
- Fix: Fetch recipient display_name. If null (invited via email/phone, no account yet), show the email/phone instead of "Unknown".

**11. Back button inconsistency**
- Files: Multiple pages use different back button styles
- Fix: Audit all BackButton usages. Standardize on one component with consistent padding (especially top margin for safe area).

**12. Empty share button on endorsement request**
- File: `app/(protected)/app/endorsement/request/RequestEndorsementClient.tsx`
- Fix: This is the Web Share API button. Add the share icon, or hide the button when Web Share API is unavailable.

**13. Language chip not editable**
- File: `app/(protected)/app/profile/page.tsx`
- Fix: Add Edit link or make the chip tappable → navigate to language edit page/modal.

---

## Exit Criteria

- [ ] All 4 bugs verified fixed with screenshots
- [ ] Insights shows real PDF download + link share data for Pro user (test with Charlotte)
- [ ] All 6 UX fixes verified on mobile (375px)
- [ ] `npm run build` zero errors
- [ ] Type-check clean
- [ ] No new console errors

---

## Chain

```
BUILD → type-check → /review → /yachtielink-review → /test-yl → /shipslog → WAIT FOR FOUNDER → commit + push → PR
```

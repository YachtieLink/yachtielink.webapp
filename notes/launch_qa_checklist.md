# Launch QA Checklist

Legend: ✅ Pass · ❌ Fail · 🔲 Manual / not yet tested

---

## Critical Path (must pass)
- 🔲 Signup with email → verify email → login
- 🔲 Signup with Google OAuth → login
- 🔲 Signup with Apple OAuth → login
- 🔲 Complete onboarding (all 6 steps)
- 🔲 Add yacht (new + existing)
- 🔲 Add certification with document upload
- 🔲 Edit profile (bio, photo, contact info)
- 🔲 Request endorsement → email received with deep link
- 🔲 Follow deep link → write endorsement → appears on recipient profile
- ✅ View public profile at /u/:handle (logged in) — renders correctly
- 🔲 View public profile at /u/:handle (logged out)
- 🔲 Share public profile link → OG preview correct
- 🔲 Upload CV → parse → review → save
- 🔲 Generate PDF → download → content correct
- 🔲 Subscribe to Pro → Stripe Checkout → webhook fires → status updates
- 🔲 Cancel Pro → Stripe Portal → webhook fires → features revoked
- ✅ Download data export → GET /api/account/export → 200 + correct filename
- 🔲 Delete account → data removed → session invalidated (end-to-end)

---

## Sprint 8 Pages (automated — 2026-03-16)
- ✅ /terms renders correctly (full content, Privacy Policy link works)
- ✅ /privacy renders correctly (full GDPR content, all sections present)
- ✅ /invite-only renders correctly
- ✅ /app/more/delete-account renders correctly (confirmation phrase input present)
- ✅ More tab → PRIVACY section: Download my data + Delete my account links
- ✅ More tab → LEGAL section: Terms of Service + Privacy Policy links
- ✅ More tab → BILLING: shows plan + renewal date

---

## Security (automated — 2026-03-16)
- ✅ Cannot access /app/* without auth → redirects to /welcome?returnTo=...
- 🔲 Cannot view other user's private data via API
- 🔲 Cannot create endorsement without shared yacht
- ✅ Rate limiter fails open gracefully when KV not configured (fixed 2026-03-16)
- 🔲 Rate limits trigger on abuse (requires real KV)
- 🔲 Stripe webhook rejects invalid signatures
- ✅ No console errors in dev (React DevTools info + HMR only — expected)

---

## Cookie Banner (automated — 2026-03-16)
- ✅ Shows on first visit (after clearing localStorage)
- ✅ Dismisses on "Got it" click
- ✅ Does not reappear after dismiss (localStorage key `cookie_consent` set)

---

## Mobile Safari (iPhone) — manual required
- 🔲 All screens render correctly
- 🔲 Bottom tab bar doesn't overlap iOS home indicator
- 🔲 Touch targets ≥ 44px
- 🔲 No horizontal scroll on any screen
- 🔲 Dark mode works (system preference)
- 🔲 Photo upload works (camera + library)
- 🔲 File upload works (CV PDF/DOCX)

---

## Desktop (Chrome) — manual required
- 🔲 Responsive layout works at 1024px+
- 🔲 All features accessible
- 🔲 Keyboard navigation works

---

## Dark Mode (automated — 2026-03-16)
- ✅ More page renders correctly in dark mode (screenshot verified)
- ✅ Terms page renders correctly in dark mode
- 🔲 Every other screen checked in dark mode
- 🔲 No invisible text or broken contrast
- 🔲 Public profile respects viewer's system preference

---

## Instrumentation — manual required (needs real keys)
- 🔲 Sign up → PostHog receives `profile.created` event
- 🔲 Create endorsement → PostHog receives `endorsement.created`
- 🔲 Trigger a server error → Sentry receives the exception

---

## GDPR
- ✅ Download data export → GET /api/account/export → 200 + attachment header
- 🔲 Delete account → profile shows "[Deleted User]", files deleted, session invalidated
- 🔲 Deleted user's endorsements still visible on recipient profiles (anonymised)

---

## Legal
- ✅ /terms page renders correctly
- ✅ /privacy page renders correctly
- ✅ Links from More tab work (Terms of Service + Privacy Policy)
- 🔲 Legal pages reviewed by lawyer before going public

---

_Last automated run: 2026-03-16 by Claude (dev account: dev@yachtie.link)_
_Rate limiter fix applied: `lib/rate-limit/limiter.ts` — fails open when KV_REST_API_URL is placeholder or missing_

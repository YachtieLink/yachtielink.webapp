# Launch QA Checklist

## Critical Path (must pass)
- [ ] Signup with email → verify email → login
- [ ] Signup with Google OAuth → login
- [ ] Signup with Apple OAuth → login
- [ ] Complete onboarding (all 6 steps)
- [ ] Add yacht (new + existing)
- [ ] Add certification with document upload
- [ ] Edit profile (bio, photo, contact info)
- [ ] Request endorsement → email received with deep link
- [ ] Follow deep link → write endorsement → appears on recipient profile
- [ ] View public profile at /u/:handle (logged out)
- [ ] Share public profile link → OG preview correct
- [ ] Upload CV → parse → review → save
- [ ] Generate PDF → download → content correct
- [ ] Subscribe to Pro → Stripe Checkout → webhook fires → status updates
- [ ] Cancel Pro → Stripe Portal → webhook fires → features revoked
- [ ] Download data export → JSON contains all user data
- [ ] Delete account → data removed → session invalidated

## Mobile Safari (iPhone)
- [ ] All screens render correctly
- [ ] Bottom tab bar doesn't overlap iOS home indicator
- [ ] Touch targets ≥ 44px
- [ ] No horizontal scroll on any screen
- [ ] Dark mode works (system preference)
- [ ] Photo upload works (camera + library)
- [ ] File upload works (CV PDF/DOCX)

## Desktop (Chrome)
- [ ] Responsive layout works at 1024px+
- [ ] All features accessible
- [ ] Keyboard navigation works

## Security
- [ ] Cannot access /app/* without auth
- [ ] Cannot view other user's private data via API
- [ ] Cannot create endorsement without shared yacht
- [ ] Rate limits trigger on abuse
- [ ] Stripe webhook rejects invalid signatures
- [ ] No console errors or warnings in production

## Dark Mode
- [ ] Every screen checked in dark mode
- [ ] No invisible text or broken contrast
- [ ] Public profile respects viewer's system preference

## Instrumentation
- [ ] Sign up → PostHog receives `profile.created` event
- [ ] Create endorsement → PostHog receives `endorsement.created`
- [ ] Trigger a server error → Sentry receives the exception
- [ ] Cookie banner shows on first visit, hidden after "Got it"

## GDPR
- [ ] Download data export → JSON contains all user data across all tables
- [ ] Delete account → profile shows "[Deleted User]", files deleted, session invalidated
- [ ] Deleted user's endorsements still visible on recipient profiles (anonymised)

## Legal
- [ ] /terms page renders correctly
- [ ] /privacy page renders correctly
- [ ] Links from More tab work

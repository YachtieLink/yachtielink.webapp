# Onboarding: Auth Trigger Sets Name from Email Prefix

**Status:** idea
**Priority guess:** P2 (important)
**Date captured:** 2026-03-26

## Summary

The auth trigger that creates a `users` row on signup pre-populates `full_name` from the email prefix (e.g. `test-onboard-james@yachtie.link` → `full_name: "test-onboard-james"`). This causes the onboarding wizard to skip the CV upload and name steps, since `getStartingStep()` checks `data.full_name` and advances past those steps.

## Impact

- New users who sign up with an email like `john.smith@gmail.com` get `full_name: "john.smith"` and skip straight to the handle step
- They never see the CV upload prompt — the primary onboarding value proposition
- They never get asked their real name

## Fix Options

1. **Don't set `full_name` in the auth trigger** — leave it empty/blank for the wizard to handle
2. **Change `getStartingStep()` to be smarter** — check if `full_name` looks like a real name vs an email prefix
3. **Both** — don't pre-populate, and also make the wizard more resilient

## Files Likely Affected

- `supabase/migrations/` — the auth trigger that creates user rows
- `components/onboarding/Wizard.tsx` — `getStartingStep()` function (line 40-44)

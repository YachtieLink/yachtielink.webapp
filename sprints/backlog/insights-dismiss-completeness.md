# Insights — Dismiss Profile Strength + Photo Prompt at 100%

**Source:** Founder feedback during QA (2026-04-03)
**Priority:** Medium
**Module:** insights

## Problem

The Insights tab shows "Profile Strength" percentage and "Add a profile photo" prompt even when the profile is 100% complete. This is redundant — the same info is already on the My Profile tab. Once the user has completed everything, it's just noise on Insights.

## Expected Behavior

- Profile Strength card and its sub-prompts (e.g., "Add a profile photo → Go →") should **not render** on the Insights tab once profile completeness reaches 100%
- Below 100%: show the strength card with actionable prompts (current behavior)
- At 100%: card is gone — the Insights page focuses on actual analytics (views, downloads, shares)
- This is non-persistent dismissal based on completeness state, not a manual "dismiss" button

## Files Likely Involved

- `app/(protected)/app/insights/page.tsx` — conditionally render profile strength section
- Wherever `profile_completeness` or `profileStrength` is calculated/fetched — add `< 100` check

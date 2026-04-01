# Interests Chips — Broken at Wider Viewports

**Status:** idea
**Priority guess:** P2 (visible on every public profile with interests)
**Date captured:** 2026-04-01

## Summary
The MY INTERESTS section on public profiles renders chips as tall pill shapes with an emoji + label at the top and a large empty rounded rectangle below. At wider viewports (~500px+) the pills spread out horizontally and the empty space becomes very prominent. The chips appear to expect an image/illustration that isn't rendering, or the layout is stretching to fill available width when it should stay compact.

## Observed on
- `/u/test-seed-charlotte` — interests: Travel, Photography, Running, Guitar, Gym
- Viewport: ~544px wide (desktop app browser)

## Expected
Compact interest chips that wrap naturally like the MY SKILLS chips above them — simple pill with emoji + label, no tall empty rectangle below.

## Files Likely Affected
- Component rendering the interests section on public profile (likely in `components/public/` or the profile layout components)
- Check if there's an `InterestChip` or `HobbyChip` component vs the `SkillChip` pattern

## Notes
- MY SKILLS chips directly above look fine — compact pills that wrap. Interests should match that pattern.
- Seen on Charlotte Beaumont's profile (test-seed-charlotte) — a content-rich test profile

# Safari: Public Profile Links Not Clickable

**Status:** idea
**Priority guess:** P1 (critical)
**Date captured:** 2026-03-26

## Summary
On Safari (iOS and/or macOS), no links on the public profile page (`/u/[handle]`) are clickable. This is a critical UX bug — the public profile is the most shared page in the app and the primary "aha moment." If visitors can't click through to anything, the profile is a dead end.

## Scope
- Investigate: likely a CSS/z-index/pointer-events issue, or an invisible overlay intercepting taps
- Test on Safari iOS (primary) and Safari macOS
- Check: accordion sections, social links, endorsement links, share button, back button
- Verify fix doesn't break Chrome/Firefox

## Notes
- Reported by founder during QA session 2026-03-26
- May be related to the hero section gradient overlay or the accordion expand/collapse behavior
- Chrome likely works fine (not reported there)

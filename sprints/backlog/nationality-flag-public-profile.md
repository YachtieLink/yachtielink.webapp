# Nationality Flag on Public Profile Photo

**Status: RESOLVED** — Shipped in PR #142 (SVG flag toggle wired in hero + settings, 2026-04-02)

**Status:** proposed
**Priority guess:** P3 (nice-to-have)
**Date captured:** 2026-03-27

## Summary
Show the user's nationality as a flag emoji/icon overlaid on their public profile photo (hero section). Toggleable on/off in profile settings via a `show_nationality_flag` boolean.

## Implementation Notes
- Flag position: bottom-right corner of hero photo, semi-transparent background pill
- Use country code → flag emoji mapping (e.g. "United Kingdom" → 🇬🇧, "France" → 🇫🇷)
- Settings toggle: add `show_nationality_flag` boolean to users table (default true)
- Add toggle to profile settings page alongside existing visibility controls
- Public profile: only render if `show_nationality_flag` is true AND `home_country` is set
- Consider: flag emoji rendering varies across OS/browsers — may need a flag icon library for consistency

## Open Questions
- Flag emoji or SVG icon library? (emoji is zero-dependency but inconsistent on Windows)
- Should it show on the avatar thumbnail in search results / saved profiles too?
- Position: corner overlay on photo, or next to name/role text?

# Yacht Type Prefix Format (M/Y, S/Y)

**Status:** idea
**Priority guess:** P2 (important)
**Date captured:** 2026-04-01

## Summary
Yacht names throughout the app currently show the yacht type as a subtitle ("Motor Yacht", "Sailing Yacht"). The industry standard is to prefix: M/Y Big Sky, S/Y Jade Wave. This is more compact and professional — one line instead of two.

## Scope
- Replace "Name\nMotor Yacht" pattern with "M/Y Name" single-line pattern across the app
- Mapping: Motor Yacht → M/Y, Sailing Yacht → S/Y, Explorer Yacht → E/Y, etc.
- Affects: endorsement request yacht list, colleague explorer yacht groupings, CV experience entries, profile yacht cards, anywhere yacht names appear with type subtitles
- Consider a shared formatter: `formatYachtName(name, type) → "M/Y Big Sky"`

## Files Likely Affected
- `app/(protected)/app/endorsement/request/page.tsx` — yacht list
- `components/network/ColleagueExplorer.tsx` — yacht group headers
- CV step components — experience yacht names
- Possibly a shared utility in `lib/`

## Notes
- Founder feedback: "should just be M/Y XYZ S/Y YXZ" — strong preference, industry standard
- Single line is more compact, better for mobile lists

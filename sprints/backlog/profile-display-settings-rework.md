# Profile Display Settings — Rework or Remove

**Filed:** 2026-03-28
**Priority:** High — current implementation is actively bad UX
**Source:** Founder review of Sprint 11 merge

## Problem

The scrim preset, accent colour, and template picker settings are:
- Buried at the bottom of the "Contact info" settings page (wrong page entirely)
- No live preview — user picks "warm" or "teal" with zero visual feedback
- Accent colour dots have no context for where they apply
- Template picker (Classic/Bold) shows text descriptions, not visual examples
- The whole thing feels like a config panel, not a design tool

Founder verdict: "the feature is bullshit."

## Options

1. **Remove entirely** — strip scrim/accent/template settings from the settings page. Use sensible defaults. Ship without customization. Revisit post-launch if users ask for it.
2. **Rebuild properly** — dedicated "Customize Profile" page accessible from the profile page, with a live mini-preview showing the public profile as you change settings. This is real work.
3. **Simplify** — keep view mode toggle only (Profile/Portfolio/Rich Portfolio), remove scrim/accent/template. The three modes are meaningful choices; the rest is premature customization.

## Recommendation

Option 3 for now. The view mode toggle is useful. Scrim/accent/template are cosmetic knobs that don't need to exist until there's a proper preview experience. Remove them from the settings page, hardcode sensible defaults (dark scrim, teal accent, classic template).

## Affected Files

- `app/(protected)/app/profile/settings/page.tsx` — remove scrim/accent/template UI
- `lib/hooks/useProfileSettings.ts` — simplify form (keep view mode)
- `lib/scrim-presets.ts` — keep file, just use 'dark' as default everywhere
- `lib/accent-colors.ts` — keep file, just use 'teal' as default everywhere
- Schema columns can stay (no migration needed) — they just won't be user-configurable yet

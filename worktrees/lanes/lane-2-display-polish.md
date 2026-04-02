# Lane 2 — Endorsement & Yacht Display Polish

**Session:** sessions/2026-04-02-ghost-closeout-ux-polish.md
**Worktree:** yl-wt-2
**Branch:** fix/display-polish
**Model:** Sonnet
**Status:** active

---

## Task

Polish endorsement and yacht display across the app. Show endorser context (role + yacht) on endorsement cards, display yacht type prefix everywhere (M/Y, S/Y instead of bare name), improve saved profile card detail line, and add descriptive subtext to visibility toggles in settings.

## Scope

### 1. Endorsement Context Display
Show endorser's role + yacht alongside their name on endorsement cards. Pattern: "Ryan Campbell, Second Engineer on M/Y Driftwood". The endorsement data already includes yacht info — just needs display formatting.

**Files:**
- `components/public/EndorsementCard.tsx` — main endorsement card (public + private)
- `components/profile/EndorsementsSection.tsx` — private profile endorsement list
- `components/public/sections/EndorsementsSection.tsx` — public profile section
- `components/public/bento/tiles/EndorsementsTile.tsx` — bento grid tile

### 2. Yacht Type Prefix Display
Yacht names should show their type prefix: "M/Y Big Sky" not "Big Sky". The `vessel_type` field exists on yachts. Format: `{vessel_type} {name}` when vessel_type is present.

**Files:**
- `components/public/sections/ExperienceSection.tsx` — public experience
- `components/public/bento/tiles/ExperienceTile.tsx` — bento experience tile
- `components/profile/YachtsSection.tsx` — private yacht list
- `components/yacht/YachtMatchCard.tsx` — yacht match cards

Consider creating a tiny helper: `formatYachtName(yacht: { name: string; vessel_type?: string }) => string`

### 3. Saved Profile Card Detail Line
Replace current subtitle with richer context: "6y 7m at sea · 2 yachts" style. Use existing data from the saved profile query.

**Files:**
- `components/network/SavedProfileCard.tsx`

### 4. Visibility Toggle Subtext
Add short descriptive text under each visibility toggle explaining what it controls. E.g., under "Show date of birth": "Your age will appear on your public profile".

**Files:**
- `app/(protected)/app/profile/settings/page.tsx` — ToggleRow components (~lines 408-415)

## Allowed Files

```
components/public/EndorsementCard.tsx
components/public/sections/EndorsementsSection.tsx
components/public/sections/ExperienceSection.tsx
components/public/bento/tiles/EndorsementsTile.tsx
components/public/bento/tiles/ExperienceTile.tsx
components/profile/EndorsementsSection.tsx
components/profile/YachtsSection.tsx
components/yacht/YachtMatchCard.tsx
components/network/SavedProfileCard.tsx
app/(protected)/app/profile/settings/page.tsx
lib/utils.ts (if adding formatYachtName helper)
```

## Forbidden Files

```
CHANGELOG.md
STATUS.md
docs/ops/
lib/queries/ (Lane 1 territory)
components/cv/ (Lane 1 territory)
components/profile/SocialLinksRow.tsx (Lane 3 territory)
```

## Design Rules (from docs/design-system/)

- Section color wayfinding — use the nav tab's accent color for each page
- Positive framing — missing data is an opportunity, not failure
- Compact lists with expand-on-tap for 4+ items
- Never mention AI in user-facing copy

## Definition of Done

- [ ] Endorsement cards show endorser role + yacht context
- [ ] Yacht names display with type prefix (M/Y, S/Y) everywhere
- [ ] SavedProfileCard shows richer detail line
- [ ] Visibility toggles have descriptive subtext
- [ ] Type check passes
- [ ] /yl-review passes (run by reviewer)
- [ ] Completion report filled out

---

## Worker Report

_Worker appends their completion report here when done._

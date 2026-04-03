---
title: Social Links — Inline CRUD + Config Dedup
status: ready
source: founder (multiple sessions), Rally 009 Session 2 worker/reviewer
priority: medium
modules: [profile, settings]
estimated_effort: 2-3 hours (Sonnet, medium effort)
grill_me_date: 2026-04-03
---

# Social Links — Inline CRUD + Config Dedup

Consolidates: `social-links-add-prompt.md`, `social-links-crud.md`, `social-platform-config-dedup.md`

## Problem

1. **No discoverability** — Profile shows existing social links as icons but doesn't prompt users to add more platforms. Users may not know they can add LinkedIn, TikTok, etc.
2. **Navigation friction** — Adding/editing social links requires navigating to `/app/social-links/edit`. Should be inline on the profile page.
3. **Config duplication** — `SOCIAL_PLATFORM_CONFIG` exists in both the edit page and `SocialLinksRow.tsx`. Only difference is icon size. `lib/social-platforms.ts` has a third copy (`SOCIAL_PLATFORM_META`).

## Current State

| What | Where |
|------|-------|
| Data storage | `users.social_links` — JSON array of `{platform, url}` (max 8) |
| Validation | `lib/validation/schemas.ts:172` — Zod schema, `.url()` validation |
| Platform config | `lib/social-platforms.ts` (canonical) + duplicated in edit page + SocialLinksRow |
| Edit page | `app/(protected)/app/social-links/edit/page.tsx` — 7 inputs, filters empties on save |
| API | `app/api/profile/social-links/route.ts` — GET + PATCH (filters out empty URLs on save) |
| Display (private) | `components/profile/SocialLinksRow.tsx` — icon row on My Profile |
| Display (public) | `components/public/HeroSection.tsx` — icon row on public profile |
| Icon rendering | `components/ui/social-icons` — `getPlatformIcon()` |

## Grill-me Decisions (2026-04-03)

| # | Question | Decision |
|---|----------|----------|
| 1 | Edit mode interaction pattern | **(c)** Row morphs into edit form in-place. No modal, no navigation. Matches "pages evolve, don't jump" design principle and tap-to-edit pattern in profile hero. |
| 2 | Show all platforms or picker? | **(a)** All 8 platform slots visible at once. 8 is short enough. Picker adds unnecessary interaction complexity. |
| 3 | Platforms | Current 7 + **Telegram** (8th). Telegram groups increasingly common in yachting. WhatsApp covered by contacts. |
| 4 | Save behavior | **(b)** Explicit "Done" button. One PATCH call, clean exit back to icon row. No auto-save on blur (avoids 8 separate API calls and loading flash). |
| 5 | Delete behavior | **(a)** Empty field = removed on save. No explicit delete button. Clearing the URL is the delete action. Consistent with existing edit page behavior (filters empties). |
| 6 | Empty state location | **(a)** Inside `SocialLinksRow` component. Replaces the empty icon row with prompt. Tapping enters edit mode directly. No separate card or layout change. |

## Spec

### Task 1: Consolidate platform config + add Telegram

**Single source of truth:** `lib/social-platforms.ts`

```typescript
export const SOCIAL_PLATFORMS = [
  'instagram', 'linkedin', 'tiktok', 'youtube', 'x', 'facebook', 'telegram', 'website'
] as const

export type SocialPlatform = typeof SOCIAL_PLATFORMS[number]

export const SOCIAL_PLATFORM_META: Record<SocialPlatform, {
  label: string
  hoverColor: string
  placeholder: string
  getIcon: (size?: number) => ReactNode
}> = { ... }
```

- Move icon rendering into the meta config (parameterized size)
- Add Telegram: icon `Send` from lucide or custom Telegram SVG, placeholder `https://t.me/yourhandle`, hover color `#26A5E4`
- Update Zod schema in `lib/validation/schemas.ts`: `.max(8)`, add `'telegram'` to platform enum
- Delete duplicate configs from edit page and SocialLinksRow
- Both consumers import from `lib/social-platforms.ts`

**Files:** `lib/social-platforms.ts` (modify), `lib/validation/schemas.ts` (modify), `components/profile/SocialLinksRow.tsx` (simplify), `app/(protected)/app/social-links/edit/page.tsx` (simplify), `components/ui/social-icons` (add Telegram icon if needed)

### Task 2: Inline add/edit on Profile page

Rewrite `SocialLinksRow.tsx` from static display to interactive edit-in-place:

- **Default state:** Icon row as-is (no visual change). Tap row or `+` icon at end → enters edit mode.
- **Edit mode:** Row morphs into compact form. All 8 platforms shown:
  - Populated platforms: icon + URL text (truncated) + input visible
  - Empty platforms: icon + "Add {platform}" placeholder in muted text, tap to focus input
  - Each field is a URL input with the platform's placeholder from config
- **Clearing a URL = removing that link** (no explicit delete button)
- **"Done" button** at the bottom of the form → single PATCH to `/api/profile/social-links` → morphs back to icon row
- **Inline validation:** show error on invalid URL, disable "Done" until all populated fields are valid URLs
- **Animation:** smooth height transition between icon row and form (same-page evolution)

**Files:** `components/profile/SocialLinksRow.tsx` (rewrite), `app/(protected)/app/profile/page.tsx` (may need minor prop changes for edit callbacks)

**Keep `/app/social-links/edit/` as fallback** — onboarding and CV import link to it. Deprecate after this ships.

### Task 3: Empty state prompt

When user has 0 social links, `SocialLinksRow` renders a soft prompt instead of an empty row:

> "Add your social links — agents and captains check these when considering crew."

- Teal section color (profile tab)
- Compact — single line with a subtle "+" affordance, not a full card
- Tap enters edit mode directly (all 8 empty slots visible)
- Disappears once any link is added and saved

**File:** `components/profile/SocialLinksRow.tsx` (same component, conditional render)

## Edge Cases

- **Max 8 platforms** — all slots visible in edit mode, no "add" overflow possible
- **URL validation** — use existing Zod `.url()` schema. Show inline error per field, disable "Done" until valid
- **Duplicate platform** — impossible by design (one slot per platform, fixed list)
- **Public profile impact** — no changes needed, `HeroSection.tsx` reads from the same `social_links` data
- **CV import** — `save-parsed-cv-data.ts` writes social links via the user update path. No conflict. CV import already handles instagram/linkedin/tiktok/website. Telegram would need adding to `save-parsed-cv-data.ts` social media mapping if LLM starts parsing it.
- **Existing edit page** — keep working, don't break. Onboarding links to it. Deprecate later.

## Not in scope

- New platforms beyond the current 8
- Social link verification (proving you own the account)
- Reordering links
- Dark mode styling (enforced light mode for Phase 1)

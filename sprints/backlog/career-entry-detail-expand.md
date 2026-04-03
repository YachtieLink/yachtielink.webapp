---
title: Expandable Career Entry Details
status: ready
source: founder (QA session, 2026-04-03)
priority: medium
modules: [profile, public-profile]
estimated_effort: 2-3 hours (Sonnet, medium effort)
grill_me_date: 2026-04-03
---

# Expandable Career Entry Details

## Problem

Career timeline entries show minimal info — yacht name, role, dates. Users can't see what someone actually *did* in each role without leaving the page. The data already exists in the DB (`attachments.description`, `land_experience.description`) from CV import — it's just not displayed.

## Current State

| What | Where |
|------|-------|
| `attachments.description` column | Already exists, populated by CV import (`save-parsed-cv-data.ts:363`) |
| `attachments.cruising_area` | Already exists, populated by CV import |
| `attachments.employment_type` | Already exists (permanent, freelance, etc.) |
| `attachments.yacht_program` | Already exists (charter, private, etc.) |
| `land_experience.description` | Already exists, populated by CV import (`save-parsed-cv-data.ts:535`) |
| `land_experience.industry` | Already exists |
| Private profile career | `components/profile/CareerTimeline.tsx` |
| Public profile experience | `app/(public)/u/[handle]/experience/page.tsx` |

**No migration needed.** The description field and all metadata columns already exist and are populated during CV import.

## Grill-me Decisions (2026-04-03)

| # | Question | Decision |
|---|----------|----------|
| 1 | Show description only or all metadata? | **(b)** Description + all populated metadata (cruising area, employment type, yacht program). Show fields that have data, hide empty ones. Captains want the full picture. |
| 2 | Expand trigger | **(a)** Tap anywhere on the card to expand/collapse. Yacht name link is excluded (navigates to yacht page). Matches Network tab yacht accordion pattern. Better thumb target than a tiny chevron. |
| 3 | Description visibility on public profile | **(a)** Always public if the experience section is visible. Same content goes on their CV. No per-field visibility toggles — complexity not justified. |

## Spec

### Task 1: Expandable career entries on private profile

**File:** `components/profile/CareerTimeline.tsx` (modify)

For each career entry (yacht and shore-side):

- **Collapsed (default):** Current card — yacht/company name, role, dates. Small chevron hint in corner to signal expandability.
- **Tap card** → expands in-place (accordion, smooth height transition)
- **Expanded state shows** (only fields that have data):
  - Description paragraph (the main content)
  - Employment type badge (permanent / freelance / rotational)
  - Yacht program badge (charter / private / commercial)
  - Cruising area
  - For yacht entries: yacht name is still a link to the yacht page
  - For land entries: industry field
- **Tap again** → collapses back
- **If no description AND no metadata populated** → card is not expandable (no chevron, no tap response). Don't show an empty expanded state.

### Task 2: Expandable entries on public profile experience page

**File:** `app/(public)/u/[handle]/experience/page.tsx` and/or `components/public/sections/ExperienceSection.tsx` (modify)

Same expand pattern as Task 1. Public profile shows:
- Description (public, per decision #3)
- Employment type, yacht program, cruising area, industry
- No edit affordances (it's the public view)

Reuse the same expand component from Task 1 with a `readOnly` prop or similar to suppress edit controls.

### Task 3: Fetch description data

Check that the queries feeding `CareerTimeline` and the public experience page actually SELECT the `description`, `cruising_area`, `employment_type`, `yacht_program` columns. They may currently omit them.

**Files to check:**
- `lib/queries/profile.ts` — private profile data fetch
- `app/(public)/u/[handle]/experience/page.tsx` — public experience data fetch
- `app/(public)/u/[handle]/page.tsx` — public profile data fetch

Add missing columns to SELECT statements if needed.

### Task 4: Manual description editing

**File:** wherever attachment editing lives (find the edit flow for career entries)

Users should be able to write/edit their role description from the profile, not just via CV import. The expanded card in edit mode (private profile) should have a textarea for the description field.

## Edge Cases

- **No description populated** — card is not expandable. No empty state, no "Add a description" prompt (that's scope creep). Just a clean non-expandable card.
- **Very long descriptions** — cap display at ~500 chars with "Show more" expand. The DB allows ~2000 chars.
- **Yacht name link vs expand** — yacht name tap navigates to yacht page, everything else on the card toggles expand. Clear separation of tap targets.
- **Multiple entries expanded** — allow multiple cards expanded simultaneously (not single-accordion). Users may want to compare roles.
- **Shore-side entries** — same pattern, shows `description` + `industry`. No yacht-specific fields.

## Not in scope

- Per-entry visibility toggles
- Description AI generation (future feature)
- Description prompts/templates
- Endorsement writing assist integration (separate backlog item, will consume this field)

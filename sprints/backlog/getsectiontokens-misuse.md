# Bug: getSectionTokens called with SectionColor instead of section name

**Discovered:** Rally 010 QA (2026-04-05)
**Severity:** LOW (visual — falls back to teal instead of correct accent color)
**Status:** Backlog

## Problem

Three components pass `SectionColor` values ("coral", "navy", "amber") directly to `getSectionTokens()`, which expects section names ("cv", "network", "insights"). The function does `sectionColors[section] ?? "teal"`, so unrecognized inputs fall back to teal.

## Affected files

1. `components/profile/ProfileSectionGroup.tsx:18` — `getSectionTokens(accentColor === 'teal' ? 'profile' : accentColor)`
2. `components/profile/ProfileAccordion.tsx:37` — `getSectionTokens(accentColor)`
3. `components/ui/EmptyState.tsx:35` — `getSectionTokens(accentColor)`

## Fix

Replace `getSectionTokens(accentColor)` with `colorMap[accentColor]` (now exported from `lib/section-colors.ts` as of Rally 010). Same pattern used by `FirstVisitCard.tsx`.

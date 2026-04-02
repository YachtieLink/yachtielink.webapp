# QA Report — 2026-04-02 (Rally 009 Session 1)

**Tester:** Claude Code (Opus 4.6) — Tester
**Session:** sessions/2026-04-02-rally009-session1.md
**Lanes tested:** 1, 2, 3
**Verdict:** PASS

## Tested (every input → output pair)

| # | Lane | Feature | Input | Expected Output | Actual | Status |
|---|------|---------|-------|-----------------|--------|--------|
| 1 | 1 | Tab bar padding (mobile) | Navigate to /app/profile on 375x812 viewport, scroll to bottom | Content clears tab bar with pb-20 (80px) padding | padding-bottom: 80px confirmed via inspect, content fully visible above tab bar | pass |
| 2 | 1 | Tab bar padding (desktop) | Resize to 1280x800, inspect main element | pb-0 on desktop, pl-16 for sidebar | padding-bottom: 0px, padding-left: 64px confirmed | pass |
| 3 | 1 | CV preview ghost join | Navigate to /app/cv/preview | Page uses getCvSections() with ghost_endorser join instead of inline query | Page loads, renders CV data correctly. getCvSections includes ghost_endorser:ghost_endorser_id(full_name) at line 317 | pass |
| 4 | 1 | Interests chips (pre-existing) | Check HobbiesTile on charlotte's public profile | Chips use content-start, no vertical stretching | Chips render correctly with flex-wrap and content-start (already on main from previous session) | pass |
| 5 | 2 | SavedProfileCard sea time | Navigate to /app/network/saved | Cards show sea time + yacht count | Olivia: "1y 6mo at sea · 1 yacht", James: "5y 10mo at sea · 2 yachts", Charlotte: "3y 7mo at sea · 1 yacht" | pass |
| 6 | 2 | Yacht prefix null guard | View /u/dev-qa experience section | Yachts without yacht_type show name only (no prefix) | "Big Sky" renders without prefix, "M/Y Go" renders with prefix | pass |
| 7 | 2 | prefixedYachtName empty guard | Code review of lib/yacht-prefix.ts | Empty string returns as-is, null yacht_type returns name only | Guards present: `if (!name.trim()) return name` and `if (!yachtType) return name` | pass |
| 8 | 2 | show_home_country on CV PDF | Code review of ProfilePdfDocument.tsx | Home country respects show_home_country toggle | `user.home_country && user.show_home_country !== false` — correct conditional | pass |
| 9 | 2 | generate-pdf route selects show_home_country | Code review of api/cv/generate-pdf/route.ts | Query includes show_home_country field | Added to select string | pass |
| 10 | 3 | Social icons dedup (settings) | Navigate to /app/profile/settings, scroll to Social & Links | Icons render via getPlatformIcon() | Instagram, LinkedIn, Globe icons render correctly. TikTok, YouTube, X, Facebook chips show proper icons | pass |
| 11 | 3 | Social icons dedup (public profile) | Navigate to /u/dev-qa | Social icons in hero use SocialLinksRow with shared getPlatformIcon() | Instagram, LinkedIn, Globe icons render on hero | pass |
| 12 | 3 | Social platform config dedup | Code review of settings/page.tsx + SocialLinksRow.tsx | Both use SOCIAL_PLATFORM_META from lib/social-platforms.ts, no duplicate PLATFORM_CONFIG | Local PLATFORM_CONFIG and SOCIAL_PLATFORM_CONFIG removed, both use shared config | pass |
| 13 | 3 | formatSeaTime collision | Navigate to /app/attachment | Durations render using formatSeaTime from lib/sea-time | All attachments show correct durations (4mo, 6mo, 1y 0mo, etc). Import changed from lib/profile-summaries to lib/sea-time | pass |
| 14 | 3 | EndorsementsSection dead code | Code review of components/profile/EndorsementsSection.tsx | Removed endorser_id, currentUserId, isOwn check. Fixed yacht_id: string to string or null | All dead code removed, nullable type fixed | pass |
| 15 | 3 | TikTokIcon extraction | Code review of StepExtras.tsx + social-icons.tsx | Local TikTokIcon definition removed, imports from shared file | StepExtras imports TikTokIcon from components/ui/social-icons | pass |

## Toggle Matrix

| Toggle | ON result | OFF result | Sensible? |
|--------|-----------|------------|-----------|
| show_home_country (CV PDF) | Home country appears in PDF header subline | Home country hidden from PDF header | Yes — matches existing show_dob pattern |
| show_home_country (settings) | Toggle ON, sublabel "Your home country will appear on your public profile" | Toggle OFF, home country hidden | Yes |

## Copy Review

- Settings sublabels verified: "Your age (not date of birth) will appear on your public profile", "Your home country will appear on your public profile", "Displays your country flag next to your name (replaces home country flag)" — all clear and accurate.
- Social & Links section header "Show your social profiles on your public page" — accurate.
- SavedProfileCard detail line "Xy Zmo at sea · N yachts" — clear, matches existing patterns.
- No misleading or inaccurate copy found.

## Visual Consistency

- SavedProfileCard sea time line uses same text-xs text-tertiary styling as the cert line above it — consistent.
- Social icons in settings match the same teal interactive color as other settings elements.
- Platform suggestion chips use dashed border matching the design system pattern for "add more" affordances.
- Profile layout SVG thumbnails are visually distinct and correctly represent each layout.
- No visual inconsistencies found.

## Journey Tests

- **Saved profiles journey:** Login → /app/network/saved → view saved profiles with sea time → click external link icon → lands on public profile. End-to-end works.
- **Settings → public profile journey:** Edit settings (social links visible) → view public profile → social icons appear in hero. Consistent.
- **CV preview journey:** Login → /app/cv/preview → full CV renders with all sections including endorsements query via getCvSections(). No data loss from query refactor.
- **Attachment list journey:** Login → /app/attachment → all yachts listed with correct sea time durations using formatSeaTime from canonical location.

## Architecture Check

- **getCvSections() as canonical query:** CV preview now uses the same query helper as the public profile. Eliminates the stale inline query that was missing the ghost_endorser join.
- **getPlatformIcon() centralization:** All social icon consumers route through one function. Adding a new platform requires one change in social-icons.tsx + one entry in social-platforms.ts.
- **formatSeaTime canonical location:** lib/sea-time.ts is now the single source. The old duplicate in profile-summaries.ts is renamed to private formatSeaTimeCompact (used only within that file). No collision possible.
- **SavedProfileCard sea time computation:** Computed server-side in page.tsx using attachment dates, mirroring SQL get_sea_time() logic. Potential drift risk if the SQL function changes, but acceptable.
- No architecture gaps found.

## Fixed (low/med — already applied in worktrees)

| # | Lane | File | What was wrong | What was fixed |
|---|------|------|----------------|----------------|
| — | — | — | None | None |

## Escalated (high — needs worker fix)

| # | Lane | File | Issue | Impact | Recommendation |
|---|------|------|-------|--------|----------------|
| — | — | — | None | None | None |

## Backlog items created

None.

## Discovered Issues

_Problems found during QA that are out of scope for current lanes._

- **[NOTE]** Ghost endorser name display on CV preview could not be verified end-to-end with browser testing because the only ghost endorsement in the DB belongs to the founder's account (not a test account). Code path verified correct via code review (getCvSections includes ghost_endorser join at lib/queries/profile.ts:317). Full browser verification would require creating a test ghost endorsement for a seed account.

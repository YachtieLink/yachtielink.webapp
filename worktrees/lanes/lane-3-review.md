## Review: fix/interests-socials (yl-wt-3)

**Verdict: BLOCK**

### /yl-review results
- Type-check: **PASS**
- Drift-check: **PASS** (0 new warnings)
- Sonnet scan: 2 CRITICAL, 3 HIGH, 3 MEDIUM, 1 LOW
- Opus deep review: confirmed most, found 8 additional
- YL drift patterns: **WARNING** — duplicate components, duplicate config, out-of-scope files
- QA: Skipped — no browser tools

### Fix List (ordered by severity)

#### 1. Revert HeroSection.tsx — out of scope + behavioral regression
`components/public/HeroSection.tsx`
This file is NOT in Lane 3's allowed list. The change removes the `homeCountryFlag` emoji fallback — users with `show_home_country=true` and `show_nationality_flag=false` now see no flag at all. This is a behavioral regression affecting likely the majority of users with a home country set.
**Fix:** `git checkout main -- components/public/HeroSection.tsx` — revert entirely. If this needs changing, open a separate lane/PR.

#### 2. Revert CountryFlag.tsx — out of scope + accessibility regression
`components/ui/CountryFlag.tsx`
This file is NOT in Lane 3's allowed list. The change to `alt=""` marks the flag as decorative, but it's semantically meaningful content (user's nationality). Screen readers will skip it entirely.
**Fix:** `git checkout main -- components/ui/CountryFlag.tsx` — revert entirely. If this needs changing, scope it properly with correct alt text.

#### 3. Extract TikTokIcon to shared file
`StepReview.tsx:12-18`, `settings/page.tsx:34-40`, `SocialLinksRow.tsx:22-28`
Identical SVG component defined in 3 files. Any fix must be applied in 3 places.
**Fix:** Create `components/ui/social-icons.tsx` with `TikTokIcon` and `XIcon`. Import from all three consumers. (This requires adding `components/ui/social-icons.tsx` to allowed files — approved since it's a new shared file, not another lane's territory.)

#### 4. Extract XIcon to shared file
`settings/page.tsx:43-49`, `SocialLinksRow.tsx:13-19`
Same issue — 2 copies.
**Fix:** Extract alongside TikTokIcon in fix #3.

#### 5. Deduplicate SOCIAL_PLATFORM_CONFIG
`settings/page.tsx:51-65` duplicates `SocialLinksRow.tsx:30-38` (PLATFORM_CONFIG)
Different extra fields but same 7 platforms, labels, and icons.
**Fix:** Create a shared config in `lib/social-platforms.ts` with the base config (platform, label, icon). Each consumer extends it with their extra fields (placeholder for settings, hoverColor for SocialLinksRow).

#### 6. Non-atomic save — misleading error on partial failure
`settings/page.tsx:277-315`
Profile fields save via Supabase `.update()` first. If that succeeds but social links save fails, the user sees "Failed to save social links" but their profile changes are already committed. No rollback.
**Fix:** Change the error toast to "Profile saved, but social links failed — please try again." so the user knows the partial state.

#### 7. homeCountryFlag dead prop cleanup
`HeroSection.tsx:35,65` + `PublicProfileContent.tsx:178,215`
After reverting HeroSection (fix #1), the prop is alive again. No action needed on this item if fix #1 is applied.
**Fix:** No action — resolved by fix #1.

#### 8. SocialLinksRow editable/onDelete props — dead code
`components/profile/SocialLinksRow.tsx:44-45`
New props added but no caller ever passes `editable={true}`. Dead API surface.
**Fix:** Remove the `editable` and `onDelete` props. Add them back when a caller needs them.

#### 9. Settings page sublabel tweaks — revert with HeroSection
The 2 uncommitted sublabel changes in `settings/page.tsx` (home country, nationality flag) are part of the out-of-scope flag work.
**Fix:** Revert the uncommitted sublabel changes in settings/page.tsx. Only keep the committed social links + thumbnail work.

### Pre-existing issues (backlog, not introduced by this diff)
- `socialLinksSchema` in `lib/validation/schemas.ts:177` accepts `javascript:` URLs via `z.string().url()`. Known critical from overnight audit. Not introduced by this diff — the diff correctly routes through this schema. Needs a `.refine(u => /^https?:\/\//.test(u))` but that's a separate fix.

### Lane compliance
- [ ] ~~All changed files within allowed list~~ — HeroSection.tsx and CountryFlag.tsx are OUT OF SCOPE
- [x] No shared doc edits
- [ ] ~~No scope creep~~ — 2 files outside allowed list

### Recommendation
~~Send back to worker. Fix all 9 items (items 1+2 are simple reverts, 3-5 are extractions, 6-9 are small).~~

---

### Round 2 — Fix Verification

**Verdict: PASS**

| # | Original Finding | Status |
|---|-----------------|--------|
| 1 | Revert HeroSection.tsx (out of scope) | **RESOLVED** — no diff against main |
| 2 | Revert CountryFlag.tsx (out of scope) | **RESOLVED** — no diff against main |
| 3 | Extract TikTokIcon to shared file | **RESOLVED** — `components/ui/social-icons.tsx` created, all 3 consumers import |
| 4 | Extract XIcon to shared file | **RESOLVED** — same shared file |
| 5 | Deduplicate SOCIAL_PLATFORM_CONFIG | **RESOLVED** — `lib/social-platforms.ts` with shared type, ALL_PLATFORMS, SOCIAL_PLATFORM_META |
| 6 | Non-atomic save misleading error | **RESOLVED** — toast: "Profile saved, but social links failed — please try again." |
| 7 | homeCountryFlag dead prop | **RESOLVED** — by fix #1 revert |
| 8 | SocialLinksRow editable/onDelete dead code | **RESOLVED** — props and editable branch removed |
| 9 | Settings sublabel revert | **RESOLVED** — no out-of-scope sublabel changes remain |

No new issues introduced. Lane 3 is clean. Ready to ship.

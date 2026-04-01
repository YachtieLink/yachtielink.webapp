## Review: fix/country-select-monaco (yl-wt-4)

**Verdict: WARNING**

### /yl-review results
- Type-check: PASS (zero errors)
- Drift-check: PASS (0 new warnings)
- Sonnet scan: 1 MEDIUM, 2 LOW — no criticals
- Opus deep review: 1 P1, 1 P1 (pre-existing), 2 P2
- YL drift patterns: PASS
- QA: skipped — data normalization change, no new UI

### Findings

#### P1-1: ISO_FALLBACK_NAMES produces values not in ALL_COUNTRIES (WARNING, not BLOCK)

`country-normalize.ts` lines 22-26 define Gibraltar, Cayman Islands, and British Virgin Islands as fallback names. These are NOT in `ALL_COUNTRIES`. If a DB value like "GI" is normalized to "Gibraltar", the settings page SearchableSelect won't find it in its options — the field shows the text but the user can't re-select it from the dropdown.

**Impact:** Cosmetic — affects only users with these specific flag states stored as ISO codes. The value displays correctly as text but can't be re-selected. Not a data loss or crash.

**Fix:** Either add these 3 territories to `ALL_COUNTRIES`, or remove them from `ISO_FALLBACK_NAMES` so the raw value passes through. Founder's call — this is a product decision (should Gibraltar be a selectable country?).

**Why not BLOCK:** The fallback `?? rawValue` pattern means no data is ever lost. The worst case is a cosmetic display issue for a small subset of users. The fix is trivial and can be done post-merge.

#### P1-2: Pre-existing — Russia mapped to "SU" in country-iso.ts (not caused by this PR)

`country-iso.ts` line 195 maps Russia to "SU" (Soviet Union, retired 1991). This PR doesn't change `country-iso.ts` but increases the number of code paths that flow through `countryToFlag()`. Russian crew (common in superyachts) get broken flag emoji on their profile.

5 other countries also have retired/wrong codes: Serbia (YU→RS), Benin (DY→BJ), Burkina Faso (HV→BF), Congo-Kinshasa (ZR→CD), Timor-Leste (TP→TL).

**Not blocking this PR** — it's pre-existing. Should be a separate fix.

#### P2-1: CV wizard display path not normalized

`StepPersonal.tsx` and `StepExperience.tsx` display AI-parsed country values directly without normalization. If the LLM returns ISO codes despite the updated prompt, the wizard preview shows no flag. Save path correctly normalizes. Low probability after prompt fix.

#### P2-2: useProfileSettings hook not normalized

`lib/hooks/useProfileSettings.ts` lines 73, 80 — loads country values without normalization. Currently zero importers (dead code), so no live impact. Forward risk if someone imports it later.

### Lane compliance
- [x] All changed files within allowed list
- [x] No shared doc edits
- [x] No scope creep

### Blockers
None.

### Warnings
1. **P1-1:** ISO_FALLBACK_NAMES → phantom SearchableSelect values. Fix post-merge or pre-merge, founder's call.
2. **P1-2:** Pre-existing Russia "SU" bug — separate fix recommended.
3. **P2-1:** Wizard display path shows raw LLM output — mitigated by prompt change, low risk.
4. **P2-2:** Dead hook has no normalization — no live impact.

### Recommendation
Merge as-is. P1-1 is a product decision (add territories to ALL_COUNTRIES?) that can be resolved in a follow-up. Core fix is solid — normalizer logic is correct, fail-soft, and properly wired into both save and load paths.

# Rally 009 — Pre-MVP Polish

**Created:** 2026-04-02
**Updated:** 2026-04-02 (restructured post grill-me + design guide)
**Goal:** Clear every known bug, UX issue, tech debt item, and design gap before Rally 007 (Launch QA). Ship a codebase the founder is proud to put in front of 20-50 invited crew.

**Scope:** 35+ items across 7 worktree sessions — bugs, tech debt, data integrity, tab redesigns, endorsement flow, data quality, safety, desktop polish, feedback, and settings.

**Key references:**
- `frontend-design-guide.md` — per-tab wireframes, component patterns, universal principles (→ promote to `docs/design-system/` before Session 3)
- `grill-me-decisions-2026-04-02.md` — all 42 design decisions + 9 UX audit items
- `ux-audit-2026-04-02.md` — per-tab UX/IA findings and ownership map

---

## Session Plan

| Session | Focus | Lanes | Effort | Deps | Status |
|---------|-------|-------|--------|------|--------|
| **1** | Bugs + tech debt + quick wins | 3 | ~4h | None — start immediately | ✅ Complete (branches ready to push) |
| **2** | Data integrity + CV restore gaps | 3 | ~6h | Session 1 merged | Ready |
| **3** | Network tab + Profile redesign | 2 | ~8h | Session 2 merged | Ready (grill-me done) |
| **4** | Insights + Photos + CV tab + More tab | 3 | ~10h | Session 3 merged | Ready (grill-me done) |
| **5** | Endorsement flow + LLM defense | 2 | ~6h | Session 2 merged | Ready (grill-me done) |
| **6** | Cert registry + Reporting + Pro upsell | 3 | ~8h | Session 5 merged (LLM layer) | Ready (grill-me done) |
| **7** | Desktop polish + Roadmap/feedback + Settings + Cross-cutting | 3 | ~8h | ALL prior sessions merged (final polish) | Ready (grill-me done) |

**Total estimated effort:** ~50h of worker time across 7 sessions.

---

## Session 1 — Bugs + Tech Debt (Start Immediately)

All small items, no dependencies, no design decisions needed. Three Sonnet lanes. **See `session-1-bugs-debt.md` for full spec.**

- **Lane 1:** Mobile UX fixes (tab bar padding, interests chips, CV preview ghost join)
- **Lane 2:** P2 bug fixes (SavedProfileCard, yacht prefix null, ghost endorser card, home country on CV)
- **Lane 3:** Tech debt sweep (social config dedup, social icons dedup, formatSeaTime, EndorsementsSection)

---

## Session 2 — Data Integrity + CV Restore Gaps

Medium complexity. Non-yachting experience needs a migration (→ Opus). **See `session-2-data-integrity.md` for full spec.**

- **Lane 1:** Non-yachting experience — migration, save parsed data, wizard step, profile display. **Grill-me:** Integrated timeline (not separate section), briefcase vs anchor icon, industry if present. (Opus, high)
- **Lane 2:** Overlapping yacht dates — date merge utility, sea time fix, import validation. **Grill-me:** 4-week threshold, recalc on next view. (Sonnet, high)
- **Lane 3:** CV restore data integrity (NEW) — `trackOverwrite` for 7 missing fields, education dedup, languages merge, travel docs merge. From UX audit UX6a-d. (Sonnet, high)

---

## Session 3 — Network Tab + Profile Redesign

Major redesigns. All grill-me decisions resolved. **See `session-3-tab-redesigns.md` for full spec.**

- **Lane 1:** Network tab Phase 1 — unified yacht accordion (1 expanded), rich yacht mini cards, endorsement summary stat card, 0/5 CTA with dynamic copy, "Request" not "Endorse", saved profiles bookmark icon, "Invite former crew" CTAs, ghost suggestions inline, yacht search at bottom, navy wayfinding. (Opus, high)
- **Lane 2:** Profile page redesign — teal wayfinding, compact grouped list (4 groups), tap-to-edit on hero card, Profile Strength ring in hero, positive empty states, remove "Edit profile" from More tab. (Opus, high)

---

## Session 4 — Insights + Photos + CV Tab + More Tab

**See `session-4-insights-photos.md` for full spec.**

- **Lane 1:** Insights tab Layer 1 — move cert manager + subscription to Settings, enhanced metric cards with sparklines + trends, **"Who Viewed You" as Pro feature** (Layer 1), **Profile Saves**, **View Source Breakdown**, time range selector, free tier = career snapshot + coaching + blurred analytics, coral wayfinding, "make it beautiful". (Opus, high)
- **Lane 2:** Photo management unification — merge 3 pages, focal point + 3-format preview, **AI photo enhancement as Pro feature**, **Pro contextual photo assignment** (3 slots), migration with explicit backfill. (Opus, high)
- **Lane 3:** CV tab redesign + More tab completion (NEW) — CV becomes output-only, rename "Visitor Downloads" → "Sharing", add education card linking to Profile, re-parse confirmation dialog (UX5), template picker collapsed. More tab: receive cert manager + subscription, final IA (Account, Plan, App, Community, Legal), remove "Edit profile" row, remove Saved Profiles, sand wayfinding. (Sonnet, high)

---

## Session 5 — Endorsement Flow + LLM Defense

**See `session-5-endorsement-flow.md` for full spec.**

- **Lane 1:** Endorsement writing assist + LLM defense layer — sanitize/validate/guard utilities, `gpt-4o-mini` draft generation, audit existing LLM calls. (Opus, high)
- **Lane 2:** Endorsement request redesign — colleague-first yacht-grouped view, ghost suggestions inline per yacht (tagged "not on platform"), "Invite former crew" CTA, ghost profile creation on external invite, 1 reminder after 7 days. (Opus, high)

---

## Session 6 — Cert Registry + Reporting + Pro Upsell

**See `session-6-quality-safety.md` for full spec.**

- **Lane 1:** CV cert matching registry — ~60 seed entries, fuzzy match with green/amber/blue tiers, alias learning, smart expiry prompts, **separate entries per issuing authority** (not aliases). (Opus, high)
- **Lane 2:** Reporting/flagging + bug reporter — profiles: fake/false claim/inappropriate/harassment/spam/other. **Yachts: duplicate flagging tool** (search to select duplicate) + incorrect details + other. **Email notification to founder on every report.** Bug report form in Settings. **Transfer experience feature** (user-initiated yacht re-match). **Endorsement visibility = dormant until both on same yacht node.** (Sonnet, high)
- **Lane 3:** Pro upsell consistency — standard component with inline/banner/card variants, audit + retrofit across app. (Sonnet, medium)

---

## Session 7 — Desktop Polish + Roadmap + Settings + Cross-Cutting

**See `session-7-polish-feedback.md` for full spec.**

- **Lane 1:** Desktop responsiveness audit + fixes — all pages at 1024/1280/1440/1920px, public profile priority. (Sonnet, high)
- **Lane 2:** Roadmap + feedback mechanism — **fully in-app 3-tab BuddyBoss pattern** (Roadmap / Feature Requests / Released), user submissions with upvote, equal votes (no Pro weighting), sand section color. (Sonnet, high)
- **Lane 3:** Settings polish + cross-cutting — visibility toggle sublabels, **keep 3 view modes** (removed items already gone), ~~phone/WhatsApp~~ (already built), **back navigation platform-wide** ("← Network" not "← Back"), skeleton loading for new components. (Sonnet, medium)

---

## Dependency Graph

```
Session 1 (bugs + debt) ←── no deps, start immediately ✅ DONE
    ↓ merged
Session 2 (data integrity + CV restore)
    ↓ merged
Session 3 (Network + Profile)
    ↓ merged
Session 4 (Insights + Photo + CV tab + More)
    ↓ merged
Session 5 (Endorsement flow + LLM) ←── can start after Session 2 (parallel with 3-4 if no file overlap)
    ↓ merged
Session 6 (Cert registry + Reporting + Pro upsell)
    ↓ merged
Session 7 (Desktop + Roadmap + Settings + Cross-cutting) ←── LAST (touches everything)
    ↓ merged
Rally 007 — Launch QA ✅
```

**All grill-me decisions resolved.** No sessions are blocked. Execute sequentially starting from Session 2.

---

## Backlog Items Covered

| Backlog Item | Session | Lane | Status |
|--------------|---------|------|--------|
| Tab bar padding (UX audit P1) | 1 | 1 | ✅ |
| Interests chips responsive | 1 | 1 | ✅ |
| CV preview ghost join | 1 | 1 | ✅ |
| SavedProfileCard wiring | 1 | 2 | ✅ |
| Yacht prefix null type | 1 | 2 | ✅ |
| Ghost endorser card layout | 1 | 2 | ✅ |
| Show home country on CV | 1 | 2 | ✅ |
| Social platform config dedup | 1 | 3 | ✅ |
| Social icons dedup | 1 | 3 | ✅ |
| formatSeaTime collision | 1 | 3 | ✅ |
| EndorsementsSection dead code | 1 | 3 | ✅ |
| Non-yachting experience | 2 | 1 | Ready |
| Overlapping yacht dates | 2 | 2 | Ready |
| CV restore: trackOverwrite 7 fields (UX6a) | 2 | 3 | Ready |
| CV restore: education dedup (UX6b) | 2 | 3 | Ready |
| CV restore: languages merge (UX6c) | 2 | 3 | Ready |
| CV restore: travel docs merge (UX6d) | 2 | 3 | Ready |
| Network tab overhaul Phase 1 | 3 | 1 | Ready |
| Profile page redesign 1-4 | 3 | 2 | Ready |
| Insights tab Layer 1 | 4 | 1 | Ready |
| Photo management unified | 4 | 2 | Ready |
| CV tab redesign (output-only) | 4 | 3 | Ready |
| More tab completion | 4 | 3 | Ready |
| Endorsement writing assist | 5 | 1 | Ready |
| LLM prompt injection defense | 5 | 1 | Ready |
| Endorsement request redesign | 5 | 2 | Ready |
| CV cert matching registry | 6 | 1 | Ready |
| Reporting/flagging + duplicate yacht tool | 6 | 2 | Ready |
| Transfer experience (yacht re-match) | 6 | 2 | Ready |
| Bug reporter form | 6 | 2 | Ready |
| Pro upsell consistency | 6 | 3 | Ready |
| Desktop responsiveness audit | 7 | 1 | Ready |
| Roadmap + feedback (in-app 3-tab) | 7 | 2 | Ready |
| Visibility toggle sublabels | 7 | 3 | Ready |
| Back navigation platform-wide | 7 | 3 | Ready |
| Skeleton loading (new components) | 7 | 3 | Ready |

---

## Exit Criteria

Rally 009 is complete when:
- [ ] All items above are shipped and merged
- [ ] No known P1/P2 bugs remain in backlog
- [ ] All 5 tabs have section color wayfinding applied
- [ ] Profile, Network, Insights pages pass mobile UX audit at 375px AND desktop at 1280px
- [ ] Network tab uses unified yacht accordion with rich mini cards
- [ ] Profile tab has tap-to-edit hero, compact grouped list, teal wayfinding
- [ ] Insights tab has sparkline metrics, "Who Viewed You" Pro feature, free tier career snapshot
- [ ] CV tab is output-only with "Sharing" section and re-parse confirmation
- [ ] Endorsement flow has writing assist + yacht-grouped request page
- [ ] CV import has cert matching with green/amber/blue tiers
- [ ] Report button on profiles and yachts (duplicate flagging)
- [ ] Email notification on every report filed
- [ ] Transfer experience feature works (yacht re-match)
- [ ] Bug report form in Settings
- [ ] Roadmap page with in-app 3-tab feedback mechanism
- [ ] Back navigation shows destination everywhere ("← Network" not "← Back")
- [ ] All LLM surfaces defended against prompt injection
- [ ] Pro upsell CTAs consistent across app
- [ ] Settings polished (visibility sublabels, display cleanup)
- [ ] Tech debt items (dedup, dead code) resolved
- [ ] PHASE1-CLOSEOUT.md updated with all completions
- [ ] Ready to begin Rally 007 (Launch QA)

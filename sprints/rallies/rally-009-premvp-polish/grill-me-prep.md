# /Grill-Me Prep — Rally 009 Open Questions

**Purpose:** All design questions that need founder input before building. Organized by topic with recommendations. Run `/grill-me` with this file as context.

**42 questions across 10 topics. One 60-min browser session covers everything.**

See `GRILL-ME-AGENT-PROMPT.md` for the Desktop app agent prompt (uses Chrome MCP + localhost:3000).

**Topics:**
1. §1: Non-yachting + Overlapping dates (5 Qs, quick)
2. §2: Network tab redesign (6 Qs, with browser)
3. §3: Profile page redesign (5 Qs, with browser)
4. §4: Insights tab (5 Qs)
5. §5: Photo management (5 Qs)
6. §6: Endorsement request redesign (4 Qs, with browser)
7. §7: CV cert matching (3 Qs)
8. §8: Reporting & safety (2 Qs)
9. §9: Roadmap & feedback (3 Qs, with browser)
10. §10: Settings polish (3 Qs, with browser)

---

## §1 — Non-Yachting Experience + Overlapping Dates (Quick, 10 min)

These have enough spec to build with defaults. Quick founder confirmation saves rework.

### Q1.1: Land experience display hierarchy

**Context:** CV parser already extracts shore-side employment. We need to display it.

**Options:**
- **A) Separate section** — "Shore-side Experience" below yacht experience. Clear separation, easy to build.
- **B) Integrated timeline** — Chronological with yacht experience, distinguished by icon (anchor vs briefcase). More sophisticated, harder to build.
- **C) Collapsible section** — Like A, but collapsed by default. Shows yacht experience is primary.

**Recommendation:** A (separate section). Simplest for MVP. Can evolve to B post-launch.

**Default if no answer:** A

**DECISION:** B — Integrated reverse-chronological timeline. Shore-side jobs appear alongside yacht jobs sorted by date (most recent first). Since shore-side is typically pre-yachting, it naturally falls at the bottom. Collapsible sections on public profile handle any length. Distinguish with icon (anchor vs briefcase), not a separate section. — 2026-04-02

### Q1.2: Section naming

**Options:** "Shore-side Experience" / "Other Experience" / "Additional Experience" / "Land-based Experience"

**Recommendation:** "Shore-side Experience" — industry-specific term crew will recognize.

**Default if no answer:** "Shore-side Experience"

**DECISION:** Moot — no separate section exists (Q1.1 chose integrated timeline). Shore-side entries use a briefcase icon vs anchor icon for yacht entries within the same experience list. No section label needed. — 2026-04-02

### Q1.3: Industry field

The parser can extract industry. Should we show it?

**Options:**
- **A) Include, optional** — Show if present, don't require. Useful for context.
- **B) Skip for MVP** — Just company + role + dates + description. Add later if needed.

**Recommendation:** A — it's already parsed, zero effort to display.

**Default if no answer:** A

**DECISION:** Accepted recommendation. Include industry if present, don't require it. — 2026-04-02

### Q1.4: Overlap threshold

**Context:** CV imports can have overlapping yacht dates (handovers, dual roles). We're adding validation.

**Question:** Is 4 weeks the right cutoff for "short overlap (info note)" vs "long overlap (amber warning)"?

**Recommendation:** 4 weeks is reasonable. Short handover periods are 1-2 weeks. Anything over 4 weeks is likely a data error or unusual situation worth flagging.

**Default if no answer:** 4 weeks

**DECISION:** Accepted recommendation. 4-week threshold. — 2026-04-02

### Q1.5: Retroactive sea time recalculation

**Question:** When we fix the overlap calculation, should existing users' sea time be recalculated immediately, or only on their next profile edit/view?

**Recommendation:** On next profile view. No batch migration needed — the calculation happens at display time. Users won't notice unless their overlaps were significant.

**Default if no answer:** On next profile view

**DECISION:** Accepted recommendation. Recalculate on next profile view, no batch migration. — 2026-04-02

---

## §2 — Network Tab Redesign (Design Interview, 15 min)

These decisions shape the entire Network tab rebuild. Must resolve before building.

### Q2.1: Unified view layout structure

**Context:** Replacing 3-tab segment control with yacht-grouped unified view.

**Options:**
- **A) Accordion** — Each yacht is an expandable/collapsible section. Clean, familiar pattern. Works well on mobile.
- **B) Flat list with yacht headers** — All colleagues shown, grouped under yacht name headers. No collapsing. Better for small networks.
- **C) Card stack** — Each yacht is a card that expands to show colleagues. More visual, less dense.

**Recommendation:** A (accordion). Most recent 2-3 yachts expanded by default, older collapsed. Handles both small and large networks well. Familiar mobile pattern.

**Needs answer:** Which layout? Affects all downstream components.

**DECISION:** Accordion, but only most recent 1 yacht expanded by default (not 2-3). Yacht crews are large — keeping just one expanded keeps the page tight. — 2026-04-02

### Q2.2: Tab replacement strategy

**Question:** When moving from 3 tabs to unified view, what happens to:
- **Endorsements tab content** → Endorsement summary card at top + status per colleague
- **Colleagues tab content** → Yacht-grouped list (main view)
- **Yachts tab content** → Each yacht section IS the yacht display + yacht search at bottom

Is this mapping correct? Anything missing?

**DECISION:** Mapping confirmed correct. Additional platform-wide rule: back navigation must always return to the previous context (e.g., Network > Yacht detail > back = Network, not Profile). Back button label shows where you're going back to. Applies everywhere. — 2026-04-02

### Q2.3: "0/5 endorsements" meaning

**Context:** The current UI shows "0/5 endorsements." Users don't understand what 5 means.

**Options:**
- **A) Free tier limit** — Free users can receive max 5 endorsements. Pro unlimited.
- **B) Goal tier** — "Get 5 endorsements to reach Gold status" (gamification).
- **C) Just remove it** — Show the count without a denominator. "0 endorsements" or "3 endorsements."

**Recommendation:** C — remove the denominator. If there IS a limit, explain it. If there isn't, don't show one. Simplest for MVP.

**Needs answer:** Is there an actual endorsement limit for free users? If not, remove the denominator.

**DECISION:** Keep the 0/5 fraction format and the endorsement CTA card. It's a goal-based CTA driving endorsement requests — existing milestone code kicks in at targets. Change the collapsed copy to dynamic count: "You have no endorsements yet" / "You have 1 endorsement" / etc. Expanded keeps "0/5 endorsements" fraction + motivational copy about 5+ endorsements getting more attention. Don't remove the denominator. — 2026-04-02

### Q2.4: Yacht page long-term vision

**Context:** Backlog has "yacht as living entity" concept — crew maintainers, review system, timeline.

**Question:** For MVP, should each yacht section in the Network tab link to the existing yacht detail page? Or should we just show crew inline and skip the yacht page link?

**Recommendation:** Link to existing yacht detail page. It already exists and shows crew list. No new work needed.

**DECISION:** Accepted recommendation. Yacht name in accordion links to existing yacht detail page. — 2026-04-02

### Q2.5: Colleague discovery model

**Question:** Are colleagues ONLY auto-discovered from shared yacht history? Or should there be a manual "add colleague" option?

**Recommendation:** Auto-discovery only for MVP. Manual add introduces complexity (friend requests, approvals) that doesn't match the yacht-graph model. Colleagues are people you actually sailed with.

**DECISION:** Auto-discovery only. Colleagues are platform users with shared yacht history. No manual "add colleague." Each yacht section in the accordion includes an "Invite former crew" CTA for off-platform growth — when invitees join and add that yacht, the colleague link forms automatically. — 2026-04-02

### Q2.6: Yacht search placement

**Question:** The current Yachts tab has a yacht search. Where does it go in the unified view?

**Options:**
- **A) Bottom of unified view** — "Find a yacht" search section after all yacht groups
- **B) Floating action button** — "+" button that opens yacht search
- **C) Sub-page** — "Manage Yachts" link that opens separate yacht search page

**Recommendation:** A — simple, discoverable, no new navigation needed.

**DECISION:** Accepted recommendation. Yacht search at bottom of unified view. — 2026-04-02

---

## §3 — Profile Page Redesign (Design Interview, 15 min)

### Q3.1: Section groupings

**Proposed 4-group model:**
```
ABOUT ME: Bio, Skills, Hobbies & Interests, Languages
PERSONAL DETAILS: Personal Info, Contact & Visibility, CV Details
CAREER: Yacht Experience, Shore-side Experience, Certifications, Sea Time
MEDIA: Profile Photo, Work Gallery
```

**Question:** Is this grouping right? Any fields misplaced? Should Career include Sea Time or should that stay as a hero card stat?

**DECISION:** Accepted recommendation. 4-group model confirmed. — 2026-04-02

### Q3.2: Sea time card placement

**Options:**
- **A) Hero card stat** — Current placement. Compact, visible.
- **B) Career section item** — Moved into Career group. More organized, less prominent.
- **C) Both** — Summary in hero, detail in Career.

**Recommendation:** C — summary number in hero card, detailed breakdown (by yacht, by role) in Career section.

**DECISION:** Accepted recommendation. Both — summary in hero, detail in Career. — 2026-04-02

### Q3.3: Profile Strength repositioning

**Current:** Below fold, after sections. Users may never see it.

**Options:**
- **A) Inside hero card** — Compact ring next to name/handle. Always visible.
- **B) Sticky floating card** — Follows scroll until profile is complete. Disappears at 100%.
- **C) Top of section list** — First item in the grouped list. Prominent but not intrusive.

**Recommendation:** A — compact ring in hero card. Clean, always visible, doesn't take extra space.

**DECISION:** Accepted recommendation. Compact ring inside hero card. — 2026-04-02

### Q3.4: Sticky CTA format

**Context:** Dynamic CTA based on profile state (<50%: "Complete profile", 50-80%: "Add photo", >80%: "Share profile").

**Options:**
- **A) Floating bottom button** — Fixed above tab bar, always visible. `bottom-20` to clear tab bar.
- **B) Banner at top** — Below hero card, scrolls with content. Less intrusive.
- **C) Inside Profile Strength** — CTA text changes based on state, inside the strength meter area.

**Recommendation:** C — keeps it contained. Floating buttons are annoying on mobile. Banner is ignorable. Strength meter + CTA together make a clear "here's what to do next" widget.

**DECISION:** Accepted recommendation. CTA inside Profile Strength area. — 2026-04-02

### Q3.5: CV Details relocation

**Context:** CV Details (smoking preference, tattoo visibility, travel docs, driving license) currently live on the CV tab. Proposal: move to Profile tab under Personal Details.

**Question:** Will users expect these on the Profile tab? Or should they stay on CV because they're CV-specific?

**Recommendation:** Move to Profile. These are personal attributes, not CV formatting choices. The CV tab should be output-only (generated PDF, sharing controls).

**DECISION:** Accepted recommendation. Move CV Details to Profile under Personal Details. CV tab becomes output-only. — 2026-04-02

---

## §4 — Insights Tab (Design Interview, 10 min)

### Q4.1: Profile view retention (GDPR)

**Question:** How long should individual profile view records be stored?

**Options:**
- **A) 90 days** — Standard analytics retention
- **B) 30 days individual / aggregate forever** — Show "who viewed" for 30 days, keep counts forever
- **C) Configurable by user** — Let users choose retention

**Recommendation:** B — 30-day individual records (for "who viewed" in Layer 2), aggregate counts kept indefinitely. Simplest GDPR approach.

**Note:** Layer 1 (this session) only shows aggregate counts, so retention only matters when Layer 2 ships. But design the schema now so we don't need to migrate later.

**DECISION:** Accepted recommendation (30d individual / aggregate forever). PLUS: "Who Viewed You" pulled into Layer 1 as Pro feature — show individual viewers (name, role, date) for last 30 days. Free users see blurred teaser. — 2026-04-02

### Q4.2: Free tier teaser — real or placeholder?

**Options:**
- **A) Real aggregate count, blurred detail** — "47 profile views" visible, sparkline blurred. Honest.
- **B) Completely blurred** — Everything behind upgrade wall. Mysterious.
- **C) Sample data** — Show what it WOULD look like with fake data. Aspirational.

**Recommendation:** A — real count, blurred detail. Builds trust (real number) and creates desire (what's behind the blur).

**DECISION:** Accepted recommendation. Real aggregate count, blurred detail for free tier. — 2026-04-02

### Q4.3: Search appearances — do we track this?

**Question:** Is "search appearances" (how often the user appears in search results) currently tracked? If not, should we add it for Layer 1?

**Recommendation:** Check if `record_profile_event('search_appearance')` exists. If yes, show it. If no, skip for Layer 1 — add in Layer 2 when we build search properly.

**DECISION:** Accepted recommendation. Check if tracking exists, show if yes, skip if no. — 2026-04-02

### Q4.4: Cert Manager — where in More tab?

**Options:**
- **A) Under YOUR ACCOUNT** — Documents are account-level
- **B) New DOCUMENTS group** — Separate section for cert docs
- **C) Under YOUR PROFILE** — Certs are profile content

**Recommendation:** A — under YOUR ACCOUNT. Keeps groups lean. Certs-as-documents are account management, not profile display.

**DECISION:** Accepted recommendation. Cert Manager under YOUR ACCOUNT in More tab. — 2026-04-02

### Q4.5: Weekly digest opt-in

**Question:** If/when we add a weekly insights email digest (Layer 5), should it be:
- **A) Opt-in** — User explicitly enables
- **B) Opt-out** — Enabled by default, user can disable

**Recommendation:** A — opt-in. Less email = less annoyance. Better for a product that serves a community with trust at its core.

**Note:** Not building this in Layer 1. Just need the decision to inform the More tab IA (where notification preferences live).

**DECISION:** Accepted recommendation. Opt-in. Not building in Layer 1. — 2026-04-02

**ADDITIONAL DECISIONS (§4):**
- **"Who Viewed You" pulled into Layer 1** as Pro feature. Individual viewers (name, role, date) for last 30 days. Free users see blurred teaser.
- **Profile Saves added to Layer 1.** "X people saved your profile" — already tracked, easy win.
- **View Source Breakdown added to Layer 1.** Where views come from: direct link, public profile search, QR code scan.
- **Insights dashboard visual upgrade.** Make it look cooler — richer metric cards, bold coral wayfinding, sparklines with personality. Same "make it beautiful" standard as Network redesign.

---

## §5 — Photo Management (Design Interview, 10 min)

### Q5.1: Work gallery location

**Options:**
- **A) Same page, below profile photo** — Unified page with two sections. Simpler.
- **B) Separate tab within photo page** — "Profile Photo" tab + "Gallery" tab. Cleaner separation.
- **C) Keep as separate page** — Just improve the profile photo page, keep gallery separate.

**Recommendation:** A — same page. Two sections: "Profile Photo" (single photo + focal point + 3-format preview) and "Work Gallery" (grid). One page, complete photo management.

**DECISION:** Accepted recommendation. Unified page with two sections. — 2026-04-02

### Q5.2: AI photo enhancement

**Question:** Should we ship AI enhancement for MVP? If yes, which API?

**Options evaluated in backlog spec:**
- AILab Tools — free tier, basic
- Claid.ai — mid-range, good auto-crop
- Let's Enhance — premium, best quality

**Recommendation:** Skip for MVP. Focal point picker + smart crop covers 90% of the use case. AI enhancement is a Pro upsell feature for post-launch.

**DECISION:** Override recommendation. Include AI photo enhancement as Pro feature for MVP. One-tap "Enhance" button, API integration (evaluate Claid.ai or similar). Brilliant upsell if quality is good. Need to pick API and test quality during build. — 2026-04-02

### Q5.3: Basic adjustments

**Question:** Should the focal point picker also include brightness/contrast/crop adjustments?

**Recommendation:** No. Keep it focal-point-only for MVP. The point is "tell us where your face is, we'll crop smart everywhere." Adjustments add complexity. Users have their own photo editors.

**DECISION:** Accepted recommendation. Focal point only, no adjustments. — 2026-04-02

### Q5.4: Pro contextual assignment

**Context:** Pro users will eventually get 3 photos with per-context assignment (avatar/hero/CV). Not building this in MVP Layer 1, but the architecture should support it.

**Question:** When we do build it, how should the UX work?
- **A) Drag to context** — Drag photos to avatar/hero/CV slots
- **B) Click photo, pick context** — Select photo, then choose where it goes
- **C) Context-first** — Show 3 slots, click to assign photo to each

**Recommendation:** C — context-first. Show "Avatar Photo", "Hero Photo", "CV Photo" as 3 labeled slots. Click to change. Most intuitive.

**Note:** For MVP, just one photo for all contexts. This question is for architecture planning only.

**DECISION:** Include in MVP as Pro feature. Context-first UX: 3 labeled slots (Avatar Photo, Hero Photo, CV Photo), click to assign. Free users get 1 photo for all contexts. — 2026-04-02

### Q5.5: Migration backfill

**Question:** If we add a `role` column to `user_photos`, how do we handle existing users?
- **A) First photo = profile, rest = gallery** — Simple convention
- **B) Run a backfill migration** — Set `role = 'profile'` where `sort_order = 0`

**Recommendation:** B — explicit migration is safer. Don't rely on convention when a one-time SQL update takes 2 minutes to write.

**DECISION:** Developer decision — not a founder question. Will use explicit migration. — 2026-04-02

---

---

## §6 — Endorsement Request Redesign (10 min, with browser)

Browse to `/app/endorsement/request` on localhost:3000 while asking these.

### Q6.1: External invite — ghost profile creation

**Context:** When a user invites a former colleague who isn't on the platform, should the system create a ghost profile for them?

- **A) Yes, create ghost** — ghost profile created with name + email/phone. When they sign up, they claim it. Ties into existing Ghost Profiles Wave 1.
- **B) No, just send invite link** — generic invite with endorsement context. No ghost profile until they actually sign up.

**Recommendation:** A — ghost profiles are already built. Creating one on invite means the endorsement request is pre-linked.

**DECISION:** Accepted recommendation. Create ghost profile on external invite. — 2026-04-02

### Q6.2: Yacht-first or colleague-first

**Question:** Should the request flow be:
- **A) Pick yacht first** → see overlapping crew → request from them
- **B) See all colleagues grouped by yacht** → pick who to request from

**Recommendation:** B — shows the full picture. User may not remember which yacht a colleague was on.

**DECISION:** Accepted recommendation. Colleague-first — show all grouped by yacht. — 2026-04-02

### Q6.3: Ghost profile suggestions prominence

Where should "Suggested (not on YachtieLink)" appear?
- **A) Above on-platform colleagues** — growth priority
- **B) Below on-platform colleagues** — less confusing
- **C) Inline within yacht groups** — show alongside, tagged as "not on platform"

**Recommendation:** C — most natural. Growth happens organically.

**DECISION:** Accepted recommendation. Inline within yacht groups, tagged as "not on platform." — 2026-04-02

### Q6.4: Re-nudge limits

If someone was requested and hasn't responded, how many reminders?
- **A) 1 reminder after 7 days** — gentle, respectful
- **B) 2 reminders (7 days, 21 days)** — more persistent
- **C) No limit, but rate-limited** (max 1 per week)

**Recommendation:** A — one gentle nudge. Crew talk, being pushy hurts reputation.

**DECISION:** Accepted recommendation. 1 reminder after 7 days, no more. — 2026-04-02

---

## §7 — CV Cert Matching (5 min)

### Q7.1: Crowdsourced cert moderation

When unrecognized certs appear 10+ times, should they:
- **A) Auto-approve** after 10 confirmations
- **B) Queue for manual review**
- **C) Auto-approve but flag for review** — goes live, admin can correct later

**Recommendation:** C — ship fast, correct later. 20-50 invited crew are trusted.

**DECISION:** Accepted recommendation. Auto-approve after 10+ appearances, flag for admin review. — 2026-04-02

### Q7.2: Existing certification_type_id migration

- **A) Migrate to new registry** — repoint FK
- **B) Add new column** — `certification_registry_id` alongside existing
- **C) Keep separate** — new registry only used during CV import

**Recommendation:** B — add new column. Don't break existing data.

**DECISION:** Accepted recommendation. Add new column alongside existing. Don't break existing data. — 2026-04-02

### Q7.3: Regional cert variants

AMSA (Australian) vs MCA (UK) naming:
- **A) Aliases on same entry** — "ENG1" with aliases for regional variants
- **B) Separate entries per region**

**Recommendation:** A — aliases. Same qualification, different regional names.

**DECISION:** Override recommendation. Separate entries per issuing authority (MCA, AMSA, etc.). No aliases, no assumed equivalencies. Can flag with a note like "Commonly accepted as ENG1 equivalent" — but the decision is the captain's/flag state's, not the registry's. — 2026-04-02

---

## §8 — Reporting & Safety (5 min)

### Q8.1: Report categories

**Proposed:** fake_profile, false_attachment, inappropriate_content, harassment, spam, other

Is this the right set? Anything missing or too granular?

**Recommendation:** Good set. Keep as-is.

**DECISION:** Report button on profiles AND yacht pages. Profile categories: fake profile, false employment claim, inappropriate content, harassment, spam, other. Yacht reporting is primarily a **duplicate flagging tool** — "This is the same vessel as [search]" feeds a merge queue. Yacht categories: duplicate yacht (primary — with search to select the other entry), incorrect details, other. The graph self-verifies through connection strength, so fake yachts aren't the real problem — duplicates fragmenting the graph are. — 2026-04-02

**ADDITIONAL DECISIONS (§8):**
- **Transfer experience feature needed.** User-initiated: move your employment attachment from one yacht node to another (e.g., from duplicate "Serenity" to correct "M/Y Serenity"). Dates, role, everything moves.
- **Endorsement visibility on yacht transfer:** Endorsement is hidden until BOTH endorser and endorsee are attached to the same yacht node. Not deleted — dormant. Reappears automatically when the second person transfers or when admin merges the duplicates. No user confirmation needed — the graph state determines visibility.
- **Colleague connections rebuild automatically** based on new shared yacht after transfer.
- **This overrides Q10.3** — no "move endorsements?" dialog. The system handles it through graph consistency.

### Q8.2: Admin workflow

- **A) Supabase dashboard** — view reports table directly. Zero dev.
- **B) Simple admin page** — `/admin/reports`
- **C) Email notifications** — reports trigger email to founder

**Recommendation:** A for MVP. 20-50 users won't generate many reports.

**DECISION:** Override recommendation. Email notification to founder on every report filed (who reported, who/what reported, category, notes). Could scale beyond 20-50 fast. No admin page needed yet, but alerts are non-negotiable. — 2026-04-02

---

## §9 — Roadmap & Feedback (5 min, with browser)

Browse to `/app/more/roadmap` on localhost:3000.

### Q9.1: Canny vs in-app

- **A) Canny** — external board, fast, proven
- **B) In-app build** — custom voting tables + UI
- **C) Hybrid** — curated roadmap in-app, Canny for voting/suggestions

**Recommendation:** C — keep the roadmap page, add Canny for "Share your idea."

**DECISION:** Override recommendation. Fully in-app, 3-tab pattern modeled on BuddyBoss: Roadmap (curated pipeline in columns — In Progress / Next / Committed but later), Feature Requests (user submissions with upvote + title + description + category), Released (shipped features). Sand section color. No external tools, users never leave the app. — 2026-04-02

### Q9.2: What to show on public roadmap

**Show:** Endorsement writing assist, Smart cert matching, Network redesign, Crew search, Direct messaging, Yacht reviews, AI profile enhancement

**Don't show:** Salary benchmarks, Career intelligence, Mobile app, Crew Pass

Is this the right split?

**DECISION:** Populate roadmap with Phase 2 and Phase 3 features. No specific list curated now — pull from the phase plans when building. — 2026-04-02

### Q9.3: Pro weighted votes

Should Pro users' votes count more?

**Recommendation:** No. Equal votes. Weighted voting feels unfair and undermines community trust.

**DECISION:** Accepted recommendation. Equal votes. No Pro weighting. — 2026-04-02

---

## §10 — Settings Polish (5 min, with browser)

Browse to `/app/profile/settings` on localhost:3000.

### Q10.1: Display settings cleanup

Confirm: remove scrim picker, accent color picker, template picker. Keep view mode only.

**Recommendation:** Yes, remove them all.

**DECISION:** Keep the 3 view mode options (Profile, Portfolio, Rich Portfolio). These are the "presentation is paid" Pro feature. No scrim/accent/template pickers exist — question was outdated. — 2026-04-02

### Q10.2: Phone/WhatsApp split

- **A) Two separate fields** — Phone + WhatsApp, with "Same as phone" checkbox
- **B) Single field with type selector** — dropdown (Phone/WhatsApp/Both)
- **C) Keep single field** — label it "Phone / WhatsApp"

**Recommendation:** A — two fields with checkbox. Cleanest.

**DECISION:** Already built. Phone and WhatsApp are separate fields with individual "Show on profile" toggles. No change needed. — 2026-04-02

### Q10.3: Attachment transfer scope

When user corrects a yacht match, should endorsements transfer too?
- **A) Just move experience entry**
- **B) Move experience + endorsements**
- **C) Ask user** — "Move endorsements too?" confirmation

**Recommendation:** C — ask the user. The endorsement context may be yacht-specific.

**DECISION:** Superseded by §8 yacht graph integrity decisions. Endorsement visibility is automatic based on graph state — hidden (dormant) until both parties are on the same yacht node. No user dialog needed. — 2026-04-02

---

## Status: ALL QUESTIONS RESOLVED — 2026-04-02

All 42 original questions answered. Additionally, a full UX/IA audit of all 5 tabs was conducted and produced 5 cross-tab fixes + 4 CV restore gap fixes.

### UX Audit — Additional Decisions (confirmed by founder)

| # | Decision | Affects |
|---|----------|---------|
| UX1 | **Add tap-to-edit on Profile hero card** for name/role/handle. Remove "Edit profile & contact info" from More tab. | Profile, More |
| UX2 | **Rename "Endorse" to "Request"** on Colleagues tab. | Network |
| UX3 | **Free Insights: career snapshot + coaching + blurred analytics.** Sea time/yachts/certs/colleagues (always non-zero), Profile Strength coaching, then blurred real analytics with upgrade CTA. | Insights |
| UX4 | **Move Saved Profiles to Network.** Bookmark icon in header → sub-page. Remove from More. | Network, More |
| UX5 | **Confirmation dialog on CV re-parse.** | CV |
| UX6a | **Add `trackOverwrite` to 7 missing fields** (location country/city, DOB, smoking, appearance, travel docs, languages). | CV import |
| UX6b | **Add dedup for education** on re-parse (institution + qualification check). | CV import |
| UX6c | **Languages: merge instead of replace** (dedup by name, append new). | CV import |
| UX6d | **Travel docs: merge instead of replace** (union of existing + parsed). | CV import |

### Full reference docs
- `grill-me-decisions-2026-04-02.md` — clean summary table of all decisions
- `ux-audit-2026-04-02.md` — full per-tab UX/IA audit with findings and ownership map

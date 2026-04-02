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

### Q3.2: Sea time card placement

**Options:**
- **A) Hero card stat** — Current placement. Compact, visible.
- **B) Career section item** — Moved into Career group. More organized, less prominent.
- **C) Both** — Summary in hero, detail in Career.

**Recommendation:** C — summary number in hero card, detailed breakdown (by yacht, by role) in Career section.

### Q3.3: Profile Strength repositioning

**Current:** Below fold, after sections. Users may never see it.

**Options:**
- **A) Inside hero card** — Compact ring next to name/handle. Always visible.
- **B) Sticky floating card** — Follows scroll until profile is complete. Disappears at 100%.
- **C) Top of section list** — First item in the grouped list. Prominent but not intrusive.

**Recommendation:** A — compact ring in hero card. Clean, always visible, doesn't take extra space.

### Q3.4: Sticky CTA format

**Context:** Dynamic CTA based on profile state (<50%: "Complete profile", 50-80%: "Add photo", >80%: "Share profile").

**Options:**
- **A) Floating bottom button** — Fixed above tab bar, always visible. `bottom-20` to clear tab bar.
- **B) Banner at top** — Below hero card, scrolls with content. Less intrusive.
- **C) Inside Profile Strength** — CTA text changes based on state, inside the strength meter area.

**Recommendation:** C — keeps it contained. Floating buttons are annoying on mobile. Banner is ignorable. Strength meter + CTA together make a clear "here's what to do next" widget.

### Q3.5: CV Details relocation

**Context:** CV Details (smoking preference, tattoo visibility, travel docs, driving license) currently live on the CV tab. Proposal: move to Profile tab under Personal Details.

**Question:** Will users expect these on the Profile tab? Or should they stay on CV because they're CV-specific?

**Recommendation:** Move to Profile. These are personal attributes, not CV formatting choices. The CV tab should be output-only (generated PDF, sharing controls).

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

### Q4.2: Free tier teaser — real or placeholder?

**Options:**
- **A) Real aggregate count, blurred detail** — "47 profile views" visible, sparkline blurred. Honest.
- **B) Completely blurred** — Everything behind upgrade wall. Mysterious.
- **C) Sample data** — Show what it WOULD look like with fake data. Aspirational.

**Recommendation:** A — real count, blurred detail. Builds trust (real number) and creates desire (what's behind the blur).

### Q4.3: Search appearances — do we track this?

**Question:** Is "search appearances" (how often the user appears in search results) currently tracked? If not, should we add it for Layer 1?

**Recommendation:** Check if `record_profile_event('search_appearance')` exists. If yes, show it. If no, skip for Layer 1 — add in Layer 2 when we build search properly.

### Q4.4: Cert Manager — where in More tab?

**Options:**
- **A) Under YOUR ACCOUNT** — Documents are account-level
- **B) New DOCUMENTS group** — Separate section for cert docs
- **C) Under YOUR PROFILE** — Certs are profile content

**Recommendation:** A — under YOUR ACCOUNT. Keeps groups lean. Certs-as-documents are account management, not profile display.

### Q4.5: Weekly digest opt-in

**Question:** If/when we add a weekly insights email digest (Layer 5), should it be:
- **A) Opt-in** — User explicitly enables
- **B) Opt-out** — Enabled by default, user can disable

**Recommendation:** A — opt-in. Less email = less annoyance. Better for a product that serves a community with trust at its core.

**Note:** Not building this in Layer 1. Just need the decision to inform the More tab IA (where notification preferences live).

---

## §5 — Photo Management (Design Interview, 10 min)

### Q5.1: Work gallery location

**Options:**
- **A) Same page, below profile photo** — Unified page with two sections. Simpler.
- **B) Separate tab within photo page** — "Profile Photo" tab + "Gallery" tab. Cleaner separation.
- **C) Keep as separate page** — Just improve the profile photo page, keep gallery separate.

**Recommendation:** A — same page. Two sections: "Profile Photo" (single photo + focal point + 3-format preview) and "Work Gallery" (grid). One page, complete photo management.

### Q5.2: AI photo enhancement

**Question:** Should we ship AI enhancement for MVP? If yes, which API?

**Options evaluated in backlog spec:**
- AILab Tools — free tier, basic
- Claid.ai — mid-range, good auto-crop
- Let's Enhance — premium, best quality

**Recommendation:** Skip for MVP. Focal point picker + smart crop covers 90% of the use case. AI enhancement is a Pro upsell feature for post-launch.

### Q5.3: Basic adjustments

**Question:** Should the focal point picker also include brightness/contrast/crop adjustments?

**Recommendation:** No. Keep it focal-point-only for MVP. The point is "tell us where your face is, we'll crop smart everywhere." Adjustments add complexity. Users have their own photo editors.

### Q5.4: Pro contextual assignment

**Context:** Pro users will eventually get 3 photos with per-context assignment (avatar/hero/CV). Not building this in MVP Layer 1, but the architecture should support it.

**Question:** When we do build it, how should the UX work?
- **A) Drag to context** — Drag photos to avatar/hero/CV slots
- **B) Click photo, pick context** — Select photo, then choose where it goes
- **C) Context-first** — Show 3 slots, click to assign photo to each

**Recommendation:** C — context-first. Show "Avatar Photo", "Hero Photo", "CV Photo" as 3 labeled slots. Click to change. Most intuitive.

**Note:** For MVP, just one photo for all contexts. This question is for architecture planning only.

### Q5.5: Migration backfill

**Question:** If we add a `role` column to `user_photos`, how do we handle existing users?
- **A) First photo = profile, rest = gallery** — Simple convention
- **B) Run a backfill migration** — Set `role = 'profile'` where `sort_order = 0`

**Recommendation:** B — explicit migration is safer. Don't rely on convention when a one-time SQL update takes 2 minutes to write.

---

---

## §6 — Endorsement Request Redesign (10 min, with browser)

Browse to `/app/endorsement/request` on localhost:3000 while asking these.

### Q6.1: External invite — ghost profile creation

**Context:** When a user invites a former colleague who isn't on the platform, should the system create a ghost profile for them?

- **A) Yes, create ghost** — ghost profile created with name + email/phone. When they sign up, they claim it. Ties into existing Ghost Profiles Wave 1.
- **B) No, just send invite link** — generic invite with endorsement context. No ghost profile until they actually sign up.

**Recommendation:** A — ghost profiles are already built. Creating one on invite means the endorsement request is pre-linked.

### Q6.2: Yacht-first or colleague-first

**Question:** Should the request flow be:
- **A) Pick yacht first** → see overlapping crew → request from them
- **B) See all colleagues grouped by yacht** → pick who to request from

**Recommendation:** B — shows the full picture. User may not remember which yacht a colleague was on.

### Q6.3: Ghost profile suggestions prominence

Where should "Suggested (not on YachtieLink)" appear?
- **A) Above on-platform colleagues** — growth priority
- **B) Below on-platform colleagues** — less confusing
- **C) Inline within yacht groups** — show alongside, tagged as "not on platform"

**Recommendation:** C — most natural. Growth happens organically.

### Q6.4: Re-nudge limits

If someone was requested and hasn't responded, how many reminders?
- **A) 1 reminder after 7 days** — gentle, respectful
- **B) 2 reminders (7 days, 21 days)** — more persistent
- **C) No limit, but rate-limited** (max 1 per week)

**Recommendation:** A — one gentle nudge. Crew talk, being pushy hurts reputation.

---

## §7 — CV Cert Matching (5 min)

### Q7.1: Crowdsourced cert moderation

When unrecognized certs appear 10+ times, should they:
- **A) Auto-approve** after 10 confirmations
- **B) Queue for manual review**
- **C) Auto-approve but flag for review** — goes live, admin can correct later

**Recommendation:** C — ship fast, correct later. 20-50 invited crew are trusted.

### Q7.2: Existing certification_type_id migration

- **A) Migrate to new registry** — repoint FK
- **B) Add new column** — `certification_registry_id` alongside existing
- **C) Keep separate** — new registry only used during CV import

**Recommendation:** B — add new column. Don't break existing data.

### Q7.3: Regional cert variants

AMSA (Australian) vs MCA (UK) naming:
- **A) Aliases on same entry** — "ENG1" with aliases for regional variants
- **B) Separate entries per region**

**Recommendation:** A — aliases. Same qualification, different regional names.

---

## §8 — Reporting & Safety (5 min)

### Q8.1: Report categories

**Proposed:** fake_profile, false_attachment, inappropriate_content, harassment, spam, other

Is this the right set? Anything missing or too granular?

**Recommendation:** Good set. Keep as-is.

### Q8.2: Admin workflow

- **A) Supabase dashboard** — view reports table directly. Zero dev.
- **B) Simple admin page** — `/admin/reports`
- **C) Email notifications** — reports trigger email to founder

**Recommendation:** A for MVP. 20-50 users won't generate many reports.

---

## §9 — Roadmap & Feedback (5 min, with browser)

Browse to `/app/more/roadmap` on localhost:3000.

### Q9.1: Canny vs in-app

- **A) Canny** — external board, fast, proven
- **B) In-app build** — custom voting tables + UI
- **C) Hybrid** — curated roadmap in-app, Canny for voting/suggestions

**Recommendation:** C — keep the roadmap page, add Canny for "Share your idea."

### Q9.2: What to show on public roadmap

**Show:** Endorsement writing assist, Smart cert matching, Network redesign, Crew search, Direct messaging, Yacht reviews, AI profile enhancement

**Don't show:** Salary benchmarks, Career intelligence, Mobile app, Crew Pass

Is this the right split?

### Q9.3: Pro weighted votes

Should Pro users' votes count more?

**Recommendation:** No. Equal votes. Weighted voting feels unfair and undermines community trust.

---

## §10 — Settings Polish (5 min, with browser)

Browse to `/app/profile/settings` on localhost:3000.

### Q10.1: Display settings cleanup

Confirm: remove scrim picker, accent color picker, template picker. Keep view mode only.

**Recommendation:** Yes, remove them all.

### Q10.2: Phone/WhatsApp split

- **A) Two separate fields** — Phone + WhatsApp, with "Same as phone" checkbox
- **B) Single field with type selector** — dropdown (Phone/WhatsApp/Both)
- **C) Keep single field** — label it "Phone / WhatsApp"

**Recommendation:** A — two fields with checkbox. Cleanest.

### Q10.3: Attachment transfer scope

When user corrects a yacht match, should endorsements transfer too?
- **A) Just move experience entry**
- **B) Move experience + endorsements**
- **C) Ask user** — "Move endorsements too?" confirmation

**Recommendation:** C — ask the user. The endorsement context may be yacht-specific.

---

## Summary: All Questions (42 total)

### Must answer before building (blocks sessions):
- Q2.1: Network unified view layout
- Q2.3: "0/5 endorsements" — is there a limit?
- Q3.1: Profile section groupings
- Q4.2: Free tier teaser approach
- Q6.2: Yacht-first or colleague-first endorsement request
- Q9.1: Canny vs in-app for feedback

### Should answer but have safe defaults:
- Q1.1-Q1.5: Non-yachting + overlapping dates
- Q2.2, Q2.4-Q2.6: Network details
- Q3.2-Q3.5: Profile details
- Q4.1, Q4.3-Q4.5: Insights details
- Q5.1-Q5.5: Photo details
- Q6.1, Q6.3-Q6.4: Endorsement request details
- Q7.1-Q7.3: Cert registry details
- Q8.1-Q8.2: Reporting details
- Q9.2-Q9.3: Roadmap details
- Q10.1-Q10.3: Settings details

### Can defer entirely:
- Q5.4: Pro contextual assignment UX (not building this session)
- Q4.5: Weekly digest opt-in (not building this session)

# Grill-Me Decisions — 2026-04-02

**Rally:** 009 Pre-MVP Polish
**Interviewer:** Claude (Opus)
**Founder:** Ari

---

## §1 — Non-Yachting Experience + Overlapping Dates

| Q | Topic | Decision |
|---|-------|----------|
| Q1.1 | Land experience display | **Integrated reverse-chronological timeline.** Shore-side jobs sit alongside yacht jobs sorted by date. Distinguished by icon (anchor vs briefcase), not a separate section. Since shore-side is typically pre-yachting, it naturally falls at the bottom. |
| Q1.2 | Section naming | **Moot.** No separate section — shore-side entries are inline with yacht experience. Icon differentiates them. |
| Q1.3 | Industry field | **Include if present, don't require.** Already parsed, zero effort to display. |
| Q1.4 | Overlap threshold | **4 weeks.** Under 4w = info note, over 4w = amber warning. |
| Q1.5 | Retroactive recalc | **On next profile view.** No batch migration. |

---

## §2 — Network Tab Redesign

| Q | Topic | Decision |
|---|-------|----------|
| Q2.1 | Unified view layout | **Accordion.** Only most recent 1 yacht expanded by default (not 2-3). Yacht crews are large — keep it tight. |
| Q2.2 | Tab replacement mapping | **Confirmed.** Endorsements → summary card at top. Colleagues → yacht-grouped accordion. Yachts → each accordion section IS the yacht + search at bottom. |
| Q2.3 | "0/5 endorsements" | **Keep the 0/5 fraction format.** It's a goal-based CTA, not a limit. Existing milestone code kicks in at targets. Change collapsed copy to dynamic: "You have no endorsements yet" / "You have 1 endorsement" / etc. Expanded keeps fraction + motivational copy about 5+ endorsements getting more attention. |
| Q2.4 | Yacht detail page link | **Yes.** Yacht name in accordion links to existing yacht detail page. |
| Q2.5 | Colleague discovery | **Auto-discovery only.** Colleagues are platform users with shared yacht history. No manual "add colleague." Each yacht section includes an "Invite former crew" CTA for off-platform growth. |
| Q2.6 | Yacht search placement | **Bottom of unified view.** Simple, discoverable. |

---

## §3 — Profile Page Redesign

| Q | Topic | Decision |
|---|-------|----------|
| Q3.1 | Section groupings | **4-group model confirmed.** ABOUT ME (Bio, Skills, Hobbies, Languages), PERSONAL DETAILS (Personal Info, Contact & Visibility, CV Details), CAREER (Yacht Experience, Shore-side Experience, Certifications, Sea Time), MEDIA (Profile Photo, Work Gallery). |
| Q3.2 | Sea time placement | **Both.** Summary number in hero card, detailed breakdown (by yacht, by role) in Career section. |
| Q3.3 | Profile Strength position | **Inside hero card.** Compact ring next to name/handle. Always visible. |
| Q3.4 | Sticky CTA format | **Inside Profile Strength.** CTA text changes based on state, contained within strength meter area. No floating buttons. |
| Q3.5 | CV Details relocation | **Move to Profile** under Personal Details. CV tab becomes output-only (generated PDF, sharing controls). |

---

## §4 — Insights Tab

| Q | Topic | Decision |
|---|-------|----------|
| Q4.1 | Profile view retention | **30 days individual / aggregate forever.** PLUS: "Who Viewed You" pulled into Layer 1 as Pro feature — individual viewers (name, role, date) for last 30 days. Free users see blurred teaser. |
| Q4.2 | Free tier teaser | **Real aggregate count, blurred detail.** Honest, builds trust, creates desire. |
| Q4.3 | Search appearances | **Check if tracking exists. Show if yes, skip if no.** |
| Q4.4 | Cert Manager placement | **Under YOUR ACCOUNT** in More tab. |
| Q4.5 | Weekly digest | **Opt-in.** Not building in Layer 1. |
| NEW | Profile Saves | **Added to Layer 1.** "X people saved your profile" — already tracked. |
| NEW | View Source Breakdown | **Added to Layer 1.** Where views come from: direct link, public profile search, QR code. |
| NEW | Dashboard visual upgrade | **Make it look cooler.** Richer metric cards, bold coral wayfinding, sparklines with personality. Same "make it beautiful" standard as Network. |

---

## §5 — Photo Management

| Q | Topic | Decision |
|---|-------|----------|
| Q5.1 | Gallery location | **Same page, below profile photo.** Unified page with two sections. |
| Q5.2 | AI photo enhancement | **Include as Pro feature for MVP.** One-tap "Enhance" button, API integration (evaluate Claid.ai or similar). Brilliant upsell. |
| Q5.3 | Basic adjustments | **Focal point only.** No brightness/contrast/crop. Users have their own editors. |
| Q5.4 | Pro contextual assignment | **Include in MVP as Pro feature.** Context-first UX: 3 labeled slots (Avatar, Hero, CV), click to assign. Free users get 1 photo for all contexts. |
| Q5.5 | Migration backfill | **Developer decision.** Explicit migration, not convention. |

---

## §6 — Endorsement Request Redesign

| Q | Topic | Decision |
|---|-------|----------|
| Q6.1 | External invite | **Create ghost profile.** Pre-linked to endorsement request. Already built. |
| Q6.2 | Flow structure | **Colleague-first.** See all colleagues grouped by yacht, pick from there. |
| Q6.3 | Ghost suggestions | **Inline within yacht groups,** tagged as "not on platform." Most natural. |
| Q6.4 | Re-nudge limits | **1 reminder after 7 days.** Gentle, respectful. Crew talk. |

---

## §7 — CV Cert Matching

| Q | Topic | Decision |
|---|-------|----------|
| Q7.1 | Crowdsourced moderation | **Auto-approve after 10+ appearances, flag for admin review.** Trusted invited crew at launch. |
| Q7.2 | Existing cert migration | **Add new column alongside existing.** Don't break existing data. |
| Q7.3 | Regional cert variants | **Separate entries per issuing authority (MCA, AMSA, etc.).** No aliases, no assumed equivalencies. Can flag with "Commonly accepted as ENG1 equivalent" note — but whether a yacht accepts it is the captain's/flag state's call, not the registry's. |

---

## §8 — Reporting & Safety

| Q | Topic | Decision |
|---|-------|----------|
| Q8.1 | Report categories | **Profiles:** fake profile, false employment claim, inappropriate content, harassment, spam, other. **Yachts:** duplicate yacht (primary — with search to select the other entry), incorrect details, other. Yacht reporting is primarily a duplicate flagging tool — duplicates fragment the graph, which is the real problem. |
| Q8.2 | Admin workflow | **Email notification to founder on every report.** Could scale beyond 20-50 fast. No admin page yet, but alerts are non-negotiable. |

### Additional §8 decisions — Yacht Graph Integrity

- **Transfer experience feature needed.** User-initiated: move employment attachment from one yacht node to another (duplicate → correct vessel).
- **Endorsement visibility on yacht transfer:** Endorsement is hidden (dormant, not deleted) until BOTH endorser and endorsee are attached to the same yacht node. Reappears automatically when second person transfers or admin merges duplicates.
- **Foundational principle:** An endorsement always means these two people were on the same yacht at the same time. The shared yacht attachment IS the proof. Without it, the endorsement has no weight.
- **Colleague connections rebuild automatically** based on new shared yacht after transfer.

---

## §9 — Roadmap & Feedback

| Q | Topic | Decision |
|---|-------|----------|
| Q9.1 | Feedback tool | **Fully in-app, 3-tab pattern modeled on BuddyBoss.** Roadmap (curated pipeline: In Progress / Next / Committed but later), Feature Requests (user submissions + upvote + title + description + category), Released (shipped features). Sand section color. No external tools, users never leave the app. |
| Q9.2 | What to show | **Populate with Phase 2 and Phase 3 features.** Pull from phase plans when building. |
| Q9.3 | Pro weighted votes | **No. Equal votes.** Weighted feels unfair, undermines community trust. |

---

## §10 — Settings Polish

| Q | Topic | Decision |
|---|-------|----------|
| Q10.1 | Display settings / view modes | **Keep the 3 view mode options** (Profile, Portfolio, Rich Portfolio). These are the "presentation is paid" Pro feature. |
| Q10.2 | Phone/WhatsApp split | **Already built.** Separate fields with individual "Show on profile" toggles. No change needed. |
| Q10.3 | Attachment transfer | **Superseded by §8 yacht graph integrity decisions.** Endorsement visibility is automatic based on graph state, not user choice. |

---

## Platform-Wide Rules (discovered during interview)

| Rule | Context |
|------|---------|
| **Back navigation must return to previous context** | If I'm in Network > tap a yacht > back button says "Network" and goes there. Never a default page. Label shows where you're going. Applies everywhere. |
| **Visual quality bar = public profile** | All tabs must match the visual standard of Charlotte's public profile: section cards with icon + uppercase headers, endorsement quote cards, warm card backgrounds, generous spacing. |
| **Each tab owns its color fully** | Same commitment as CV tab with amber. The color IS the wayfinding — users know where they are by color alone. Navy for Network, coral for Insights, teal for Profile, sand for More. |
| **Don't send users off-platform** | Build features in-app. No external tools (Canny, etc.) that break the experience. |
| **Endorsement = proof of co-service** | An endorsement inherently means two people were on the same yacht at the same time. The shared yacht attachment is the foundation of its validity. |

---

## Network Tab — Visual Design Decisions

| # | Topic | Decision |
|---|-------|----------|
| D1 | Yacht accordion headers | **Rich mini yacht card.** Name, type, size, and yacht photo if one exists. Dial it in — not bare text. |
| D2 | Endorsement presentation in accordion | **Beautiful design.** Mini quote cards inline for received endorsements. Any design choice that looks beautiful is the right choice. |
| D3 | Endorsement summary card at top | **Stat card.** Number-forward (X received, Y given, Z pending), not quote-forward. |
| D4 | Colleague row photos | **Avatar circles** with initials fallback. Good enough for now. |
| D5 | Navy color intensity | **Full navy commitment.** Same boldness as CV tab with amber. |

**Design reference:** Pull visual quality from Charlotte Beaumont's public profile (`/u/test-seed-charlotte`). The CV tab's amber treatment is the benchmark for color commitment.

---

## UX Audit Findings — Confirmed Decisions

Full audit in `ux-audit-2026-04-02.md`. These were confirmed by founder during the interview:

### Cross-Tab IA Fixes

| # | Decision | Affects |
|---|----------|---------|
| UX1 | **Add tap-to-edit on Profile hero card** for name/role/handle. Remove "Edit profile & contact info" from More tab entirely. | Profile, More |
| UX2 | **Rename "Endorse" buttons to "Request"** on Colleagues tab. Currently means the opposite of what users think. | Network |
| UX3 | **Free Insights: career snapshot stats + coaching, blurred real analytics below.** Show sea time/yachts/certs/colleagues (always non-zero after CV parse), Profile Strength coaching, then blur the real analytics with upgrade CTA. No dead tab. | Insights |
| UX4 | **Move Saved Profiles from More to Network.** Bookmark icon in Network page header → `/network/saved` sub-page. Minimal footprint, discoverable. | Network, More |
| UX5 | **Add confirmation dialog on CV re-parse.** "This will re-parse your CV and may overwrite edits you've made. Continue?" | CV |

### CV Import Restore — Gap Fixes

Field-level restore (`trackOverwrite`) exists for 6 fields but is missing for 7 others that silently overwrite:

| # | Fix | Risk Addressed |
|---|-----|---------------|
| UX6a | **Add `trackOverwrite` to 7 missing fields:** location_country, location_city, DOB, smoking pref, appearance note, travel docs, languages | High — these overwrite silently with no restore button |
| UX6b | **Add dedup for education** — check institution + qualification before insert. Currently creates duplicates on re-parse. | High — duplicate entries on every re-parse |
| UX6c | **Change languages from replace to merge** — dedup by language name, append new, keep existing. | High — entire array silently replaced |
| UX6d | **Change travel docs from replace to merge** — union of existing + parsed. | High — entire array silently replaced |

### Ownership Map (Target State)

| Tab | Owns | Does NOT own |
|-----|------|-------------|
| **My Profile** | Everything a captain sees: name, role, photos, bio, experience, certs, endorsements received, skills, visibility. All content editing. Strength coaching. | Account settings, billing, analytics |
| **CV** | The document: generate, preview, download, share, template. Output-only after import. | Data entry, personal attributes, cert management |
| **Insights** | Analytics only: views, downloads, shares, saves, who viewed, trends. Free gets career snapshot + coaching. Pro gets full detail. | Cert documents, subscription management |
| **Network** | People: colleagues, endorsements, saved profiles, yacht-grouped connections, invite flow. | Yacht management as CV data |
| **Settings** | Account: login, billing, appearance, notifications, data export, delete. Legal. Support. | Profile editing, saved profiles |

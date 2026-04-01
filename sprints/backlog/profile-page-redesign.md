# Profile Page Redesign — Landing Page Quality

**Status:** fleshed-out
**Priority guess:** P1 (this is the page users land on every time they open the app)
**Date captured:** 2026-04-01

## Summary
The profile page is the app's home screen but fails to meet the design system standards that the public profile and CV tab already hit. It needs section color wayfinding, proper hierarchy, better empty states, and a clear next-best-action for the user.

## Issues (ordered by impact)

### 1. No section color wayfinding
Profile tab = teal, but the page is entirely neutral grey/white. No teal accents on section headers, icons, or the Profile Strength ring. CV tab (amber) and Insights (coral) both use their section color throughout — Profile doesn't.
**Fix:** Apply teal accents to section icons, Profile Strength ring, edit affordances, and upload zones per `patterns/page-layout.md` rules.

### 2. Profile Sections grid violates compact list rules
The 2-column toggle grid has 9 items (About, Experience, Endorsements, Certifications, Education, Hobbies, Extra Skills, Photos, Work Gallery). Design system says 4+ items → compact rows with expand-on-tap, not cards. The grid is dense, hard to scan, and truncated text ("Experienced First Officer with 6 years on...") isn't useful at that length.
**Fix:** Replace the 2-column grid with a compact list. Each row: section name + summary stat + toggle + Edit link. Tap to expand inline with preview content.

### 3. Empty states use negative framing
"No endorsements yet", "No photos yet" — design system says reframe gaps as opportunities.
**Fix:**
- "No endorsements yet" → "Request endorsements from crew mates to build your reputation"
- "No photos yet" → "Show the crew who you are — add your first photo"
- Each empty state should include an action verb and a reason to act

### 4. No information hierarchy — page is a flat stack
Photo CTA → identity card → sea time → social icons → languages → personal details → profile strength → toggle grid → work gallery CTA. No section headers with icons. Everything runs together. Compare the public profile's clear "ABOUT ME", "MY EXPERIENCE", "MY INTERESTS" sections with distinct icon + label headers.
**Fix:** Group content into named sections with icon + label headers (matching public profile pattern). Create clear visual breaks between groups.

### 5. Profile Strength is buried below the fold
At 70% it should be one of the first things the user sees — it drives engagement. Currently it's below languages and personal details. Its CTA ("Add a photo to make it yours") is easy to miss.
**Fix:** Move Profile Strength to just below the identity card. Make the next action prominent and specific ("Add a profile photo to reach 80%"). Consider making this the sticky bottom action when profile is incomplete.

### 6. Two competing photo CTAs
"Add profile photos" banner at top, "Add photos" in the toggle grid, "Work Gallery - Add photos" at the bottom. Three photo prompts, no clear primary.
**Fix:** One prominent photo CTA. If no profile photo exists, show it in the identity card area. Remove redundant photo prompts — the toggle grid row can say "Photos · 0" without a separate CTA.

### 7. Identity card is a mess of features with zero context
The card below the photo CTA tries to do too much and explains none of it:

**What's in the card now (all crammed together):**
- Name, role, flag, sea time summary, yacht count — raw data dump
- `yachtie.link/u/dev-qa` — a huge feature (your professional URL) thrown away as plain text with a copy icon. No explanation that this is THEIR link, what it's for, why they should use it.
- `dev-qa.yachtie.link` with tiny "PRO" pill — premium feature (custom subdomain) with zero explanation of why it's valuable. No comparison, no sell.
- "Preview" button — preview of what? Profile? Public page? CV? No context at all.
- "Share Profile" — share whose profile? Share where? Should say "Share My Profile" at minimum.

**Sea Time sits directly below with no visual separation** — reads like it's part of the identity/sharing card.

**Fix: Split into two distinct cards:**

**Card 1: Your Identity**
- Name, role, photo — the professional headline
- Profile Strength here (not buried below fold) — this drives engagement
- Sea time summary as a stat, not a separate section

**Card 2: Your YachtieLink (sell the product)**
- Explain what this is: "This is your professional link — share it with captains, agents, and crew"
- `yachtie.link/u/dev-qa` with prominent copy button and context
- Pro upsell: "Want `dev-qa.yachtie.link`? Easier to remember, looks professional on a business card" → upgrade CTA or show it if they have Pro
- "Preview My Profile" — clear label, maybe a thumbnail preview of what it looks like
- "Share My Profile" — clear whose profile, explain what happens (copy link? share sheet? QR?)
- This card IS the product pitch — "yachtie link" is literally a link for yachties. This card should make that click.

**Sea Time** becomes its own section below with clear visual separation (section header with icon, like the public profile uses).

### 8. Information architecture is broken — data scattered with no mental model
User information is split across Profile tab and CV tab with no logic. Users have no idea where to put info or where it appears.

**Current fragmentation:**
- "Personal Details" card has ONLY age and nationality — 2 fields orphaned in a card
- Smoking, tattoos, driving license, visas are buried on the CV tab → CV Details section at the bottom. These are personal details too but they're on a completely different tab.
- Social links are just floating grey icons in a card — no labels, no "add more", no explanation
- Languages get their own card for two words. Not worth a whole card.
- Profile Sections grid mixes content (About), social proof (Endorsements), credentials (Certs, Education), personality (Hobbies, Skills), and media (Photos, Gallery) in one flat 2-column grid with no grouping.
- "Choose what shows on your public profile" — but some data also goes on the CV, and the user can't tell which from this screen.

**Fix: One unified "My Information" model with clear groupings:**
- **About Me** — bio, languages, social links, interests/hobbies (personality)
- **Personal Details** — age, nationality, smoking, tattoos, driving license, visas (ALL personal details in one place)
- **Career** — experience/yachts, certifications, education, skills (professional)
- **Media** — profile photo, work gallery (reworked per photo-management-unified.md)

Each group clearly labels where data appears: badge/icon per field saying "Public profile", "CV only", or "Both". User fills in info in ONE place and understands where it goes. No more hunting across tabs.

**CV tab should NOT have input fields.** The CV tab should be about the *output* — design, template, download, share. All *input* lives on the Profile tab in unified sections.

### 9. No clear primary action or sticky CTA
This is the page users land on every time. What should they do? There's no clear next-best-action. Design system says pages should guide users toward their next step.
**Fix:** Dynamic sticky bottom action based on profile state:
- Profile < 50%: "Complete your profile" → deeplink to the weakest section
- Profile 50-80%: "Add a photo" or "Get your first endorsement" → specific CTA
- Profile > 80%: "Share your profile" → share flow
- Profile 100%: No sticky action needed — the page is a dashboard

## Files Likely Affected
- `app/(protected)/app/profile/page.tsx` — main profile page layout and hierarchy
- `components/profile/` — profile section components, identity card, profile strength
- `lib/section-colors.ts` — teal tokens already exist, just need to be applied

### 10. CV tab has data entry fields — should be output only
CV Details section (smoking preference, tattoos/piercings, driving license, visa/travel documents) is buried at the bottom of the CV tab with a "Save CV Details" button. This is data entry on what should be a presentation tab.

**The CV tab should be a read-only showcase:**

1. **Live CV preview** — always-visible zoomed-out rendering of the generated CV, like a document thumbnail. Updates live when profile data changes, template swaps, or photo changes. Tap to see full-scale.
2. **Template selector** — Standard, Classic Navy, Modern Minimal. Live preview updates instantly on swap. Pro templates show lock/upsell for free users.
3. **Visitor Downloads control** — stays here (it's about output control: "Who can download your CV?")
4. **Uploaded CV** — if they uploaded their own, show it as an alternative option.

**What moves OUT of CV tab:**
- CV Details (smoking, tattoos, driving license, visas) → moves to Profile tab under unified "Personal Details" section (see issue #8)
- No more "Save CV Details" button on CV tab — all data entry happens on Profile

**The principle:** Profile tab = input (all your data). CV tab = output (how it's presented, downloaded, shared). No data entry fields on the CV tab.

### 11. Certification picker needs search alongside category tabs
The add certification page (`/app/certification/new`) only offers category browsing (Engineering, Medical, Safety, etc.). Users who know what cert they want should be able to type to search directly — e.g. type "STCW" and see matching certs across all categories. Keep the category grid as an alternative browse path.

## Dependencies
- Inner-page-header redesign (Lane 1, current session) should land first — it establishes the sticky back bar pattern
- `app-tab-section-flow.md` backlog item is related but broader (all tabs, not just profile)
- `photo-management-unified.md` — profile photo changes should reflect in the live CV preview

## Notes
- The public profile is the north star for visual quality — this page should match that standard in its own way (edit-oriented rather than view-oriented, but same hierarchy and polish)
- This is likely a full sprint, not a quick win — touching the landing page affects every user's first impression
- Consider running a /grill-me before building to nail the section groupings and action priority

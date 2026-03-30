# Rally 006 — Build Spec

**Status:** In progress (grill-me phase)
**Last updated:** 2026-03-29

---

## Decisions Log

### 1. Subdomain Cookie Auth
- **Status:** CLOSED — working in production
- **Decision:** No code change needed. Backlog item created for future route upgrade.
- Subdomains render profiles correctly
- Non-Pro users see upgrade prompt
- Non-existent handles encourage signup
- Analytics events wired for subdomain views
- Links within subdomain redirect to `/u/{handle}` — acceptable for now
- OG sharing directs to `/u/{handle}` — acceptable for now

### 2. Safari Public Profile Links
- **Status:** CLOSED — verified working
- No code change needed.

### 3. Onboarding Skips CV Upload
- **Decision:** Fix Wizard skip logic (Option B)
- Don't touch DB trigger — email-prefix fallback is useful elsewhere
- Change `getStartingStep()` so it always starts at step 0 unless `onboarding_complete` is true
- CV upload is never skippable regardless of `full_name` state

### 4. Avatar Thumbnail Framing
- **Decision:** Change default to `object-top` (Option B)
- Apply to `ProfileAvatar` component — one CSS change
- Covers 90% of headshot cases (heads are at top of photos)
- Focal point plumbing deferred to post-launch

### 5. CV Yacht Matching — Full Spec (Option C)
- **Decision:** Build the full experience. Onboarding must be stunning.

#### Search Upgrade
- New migration: upgrade `search_yachts()` RPC
- Accept optional `p_builder` and `p_length` params
- Boost similarity score when builder/length match
- **Smart search, dumb storage** — never normalize stored yacht names
- Search handles prefix variants (M/Y, S/Y, MY, SY) without stripping them
- Roman numerals and digits treated as similar (boost, don't replace)
- "Excellence 5" surfaces both "M/Y Excellence 5" and "S/Y Excellence V" as candidates
- User disambiguates via the full yacht card (name + builder + length + photo + crew count)

#### Match States

**Green (high confidence):**
- Yacht card shows: name, builder, length, yacht photo (if available)
- Connected crew count
- Current crew count with good copy ("4 registered crew currently on this yacht")
- Card is tappable to view full yacht profile to verify
- Auto-selected

**Amber (fuzzy / partial signals):**
- "Did you mean...?" with a few suggestions
- Name might not match closely, but builder + length or other signals do
- Fallback option: "This yacht may not exist — create a new one?"

**Blue (no match):**
- "You're the first crew member to register this yacht"
- "Please ensure all details are correct so your crew mates can find it"
- Creates new yacht entry

#### Yacht Picker Modal (Reusable Component)
- Standalone `YachtPicker` modal component
- Search input, results list showing yacht name + builder + length + crew count + photo
- Tappable yacht cards link to yacht profile for verification
- Reusable for profile experience editing later

### 6. PDF Download Tracking
- Wire `pdf_download` event on:
  - `/api/cv/download-pdf` (authenticated own download)
  - `/api/cv/public-download/[handle]` (public download)
- Wire `profile_view` event on:
  - `/api/cv/generate-pdf` (generation = viewing the CV output)
- Event records against the profile owner's user_id, not the visitor

### 7. Link Share Tracking
- Wire `link_share` event on:
  - `ShareButton` (public profile)
  - `ShareModal` (CV share)
  - `ProfileHeroCard` (hero share button)
- Skip endorsement request share link (different funnel, already tracked via `endorsement_requests` table)

### 8. Delete Billing Stub → Build Plan Management Page
- Delete `/app/billing` stub
- Build `/app/settings/plan` — proper plan management page
- All former billing links redirect to `/app/settings/plan`

#### Plan Page States

**Free user:**
- Current plan: "Free" badge
- Pro benefits list
- Price shown
- "Upgrade to Pro" button → Stripe Checkout

**Pro user (active):**
- Current plan: "Pro" badge with renewal date
- "Upgrade to annual and save X%" upsell
- "Manage subscription" button → Stripe Customer Portal

**Pro user (cancelled, still active until period end):**
- Current plan: "Pro" badge with "expires [date]"
- Reminder of Pro features they'll lose
- "Your Pro data is saved — upgrade anytime to restore it"
- "Resubscribe" button → Stripe Checkout
- "Manage subscription" → Stripe Portal (invoices)

**Pricing:** Pull from Stripe, not hardcoded.

### 9. Endorsement Banner — Collapsible Engagement System

#### Phase 1: Building to 5 (new users)
- Collapsible bar with progress counter: 0/5, 1/5, etc.
- Collapsed state: small bar with just the counter
- Expanded state: motivational copy ("Yachties with 5+ endorsements get drastically more responses")
- Remembers collapsed state (localStorage)
- Re-expands every 7 days with fresh copy nudge
- Hitting 5: celebration moment, transitions to Phase 2

#### Phase 2: Gamification Tiers (5+)
- Bar becomes a counter with tier badge
- 5+ = Good, 10+ = Great, 20+ = Outstanding
- Visible only to the user on their dashboard (private, not on public profile)
- No nagging — it's a trophy

#### Phase 3: Staleness Nudge (dormant)
- Staleness clock starts from the LATER of:
  - Date the endorsement was received
  - Date either person (endorser or endorsee) ended the shared job
- If 12 months from that date with no new endorsement: bar re-expands every 7 days
- Copy: "You've got great endorsements — consider getting a recent one so employers see a current picture of your working relationships"
- If endorser and endorsee are still working together: endorsement still goes stale based on endorsement date (old endorsement from year 1 of a 5-year stint = stale)
- Stops nudging once user requests an endorsement from someone who worked with them within the last 12 months
- If user has no recent colleagues to ask: they just deal with the small collapsed banner

### 10. Analytics Event Wiring
- Wire `profile_view`, `pdf_download`, `link_share` events into Insights data layer
- Don't touch Insights UI (separate future run)
- Data flows and is ready when Insights page gets polished

### 11. Network Tab Bar — IA Change
- **Decision:** Move Saved tab out of Network → into More menu
- Network drops to 3 tabs: Endorsements, Colleagues, Yachts — fits at 375px
- Saved Profiles lives under More for now
- **Backlog:** Build Saved Yachts feature (heart on yacht cards, same pattern as Saved Profiles), then create a proper Saved section in More with both Yachts and Profiles

### 12. "Unknown" in Endorsement Requests Sent
- **Decision:** Show email or phone number the invite was sent to
- Invite record already stores the contact method — just display it instead of "Unknown"

### 13. Inner Page Header + Back Button Audit (merged)
- **Decision:** Full audit — back button consistency + inner page header standardisation
- Create a shared `PageHeader` component (title, back button, optional right-side actions slot)
- Consistent top padding, safe area margin, serif title (smaller than main page h1s)
- Refactor all ~12 inner/sub-pages to use `PageHeader` instead of ad-hoc headers
- Eliminates: inconsistent back buttons, mismatched heading fonts, varying spacing
- Affected pages include: /app/network/saved, /app/education/[id]/edit, /app/certification/[id]/edit, /app/certification/new, /app/about/edit, /app/profile/settings, /app/profile/photos, /app/profile/gallery, /app/attachment, /app/attachment/new, and any other sub-pages
- Main tab pages (Profile, Network, CV, Insights, More) are NOT affected — they have their own layout

### 14. Empty Share Button → Clipboard Fallback
- **Decision:** Fallback to "Copy link" when Web Share API is unavailable
- Button shows copy icon + copies link to clipboard
- Desktop users always have a share action

### 15. Editable Field Affordance Audit
- **Decision:** Define one consistent pattern for "this field is editable" across the profile page
- Language chip is the worst offender but this applies to all editable fields
- Audit all profile fields, pick one affordance pattern, apply everywhere
- No more inventing a new interaction per component

### 16. Colleague Display Names
- **Decision:** Show full names in colleague lists, not just first names
- RPC already returns the data — this is a rendering fix
- Show full name (first + last) in: Network Colleagues tab, endorsement request colleague list
- If `display_name` differs from first name (nickname), show both: "Charlie (Charlotte Beaumont)" or similar
- Investigate duplicate colleague entries (possible dedup issue in `get_colleagues` RPC)
- Consider a shared `<CrewName>` component for consistent name display

### 17. Pro Upsell Links
- **Decision:** All upgrade/billing links point to `/app/settings/plan`
- Visual treatment standardisation of upsell badges/locks is out of scope (founder's comprehensive UX run)
- For Rally 006: just ensure every CTA that says "upgrade" or "go Pro" navigates to the new plan page

### 18. Sprint 13 Items
- **Decision:** Separate scope — not part of Rally 006
- SEO, sitemap fix, cookie banner copy, marketing landing page handled in Sprint 13 completion

---

## Out of Scope (confirmed)

- Insights UI polish (separate run)
- Saved Yachts feature build (backlog)
- Subdomain route upgrade (backlog)
- Sprint 13 completion (separate)
- Focal point plumbing for avatars (post-launch)
- Settings preview UX (founder's comprehensive UX run-through)
- Pro upsell visual consistency (founder's comprehensive UX run-through)
- Visibility toggle clarity (founder's comprehensive UX run-through)

---

## Backlog Items Created

1. **Subdomain route upgrade** — upgrade subdomain routing in future (current redirect to `/u/{handle}` is acceptable for launch)
2. **Saved Yachts** — heart icon on yacht cards/pages, saves to list. Same pattern as Saved Profiles. Eventually lives in a Saved section (More menu) alongside Saved Profiles. Future employment/recruiter section inherits this naturally.
3. **Focal point avatars** — plumb `focalX`/`focalY` into `ProfileAvatar` for precise thumbnail framing (post-launch refinement)

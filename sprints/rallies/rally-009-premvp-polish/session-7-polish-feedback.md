# Session 7 — Desktop Polish + Feedback + Settings

**Rally:** 009 Pre-MVP Polish
**Status:** BLOCKED — needs /grill-me for roadmap/feedback decisions
**Estimated time:** ~6 hours across 3 workers
**Dependencies:** Sessions 1-6 merged (all features built, this is final polish)

---

## Lane 1: Desktop Responsiveness Audit + Fixes (Sonnet, high)

**Branch:** `fix/desktop-responsiveness`
**Objective:** Audit all key pages at desktop breakpoints and fix layout issues. Development has been mobile-first — desktop likely has stretched content, awkward whitespace, and misaligned grids.

### Task 1: Audit

Test at these breakpoints: **1024px** (iPad landscape / small laptop), **1280px** (standard laptop), **1440px** (large laptop), **1920px** (desktop monitor).

**Pages to audit (priority order):**

1. **Public profile** (`/u/:handle`) — This is what agents/captains see on desktop. Must look polished.
2. **Profile page** (`/app/profile`) — Landing page
3. **Network tab** (`/app/network`) — After Session 3 redesign
4. **Insights tab** (`/app/insights`) — After Session 4 redesign
5. **CV preview** (`/app/cv/preview`) — PDF preview should look great on desktop
6. **More/Settings** (`/app/more`) — Utility page
7. **Endorsement request** (`/app/endorsement/request`) — After Session 5 redesign
8. **Onboarding flow** — New users may start on desktop
9. **Marketing/welcome page** (`/welcome`) — First impression
10. **Auth pages** (login, signup, verify)

**For each page, check:**
- Content width: is `max-w-2xl` (672px) too narrow on 1920px? Should some pages go wider?
- Grid layouts: do 2-column grids become awkwardly wide? Should they go 3-4 column on desktop?
- Card sizes: do cards stretch too wide?
- Typography: is the 28px serif title appropriate at desktop scale?
- Whitespace: does centered narrow content create too much dead space?
- Images: do photos scale properly? Any stretching/distortion?
- Navigation: sidebar (`SidebarNav`) visible and functional at md+ breakpoints?
- Modals/sheets: do they center properly on large screens?

### Task 2: Fix Issues

**Common patterns likely needed:**
- `max-w-4xl` or `max-w-5xl` for wider content on desktop (override `max-w-2xl` at `lg:` breakpoint)
- Multi-column grids at `lg:` breakpoint (e.g., `lg:grid-cols-3` where mobile is single column)
- Card max-width constraints so they don't stretch to full container width
- Sidebar navigation polish (it exists but may need visual refinement)
- Image containers with `max-w` constraints

**Public profile is highest priority** — this is the page external people (agents, captains, recruiters) will view on desktop. It must look intentional, not like a stretched mobile app.

### Task 3: Breakpoint Consistency

Verify that all responsive breakpoints use the same Tailwind `md:` and `lg:` conventions:
- `md:` (768px) — tablet / sidebar appears
- `lg:` (1024px) — desktop layout adjustments
- `xl:` (1280px) — wide desktop refinements

**Allowed files:**
- Any page.tsx or component that needs responsive fixes
- `app/(protected)/app/layout.tsx` — if main content wrapper needs breakpoint adjustments
- `components/layout/SidebarNav.tsx` — if sidebar needs polish
- `tailwind.config.ts` — only if custom breakpoints needed (unlikely)

**Forbidden files:**
- `supabase/migrations/*`
- `app/api/*`
- Component logic (only CSS/layout changes)

---

## Lane 2: Roadmap + Feedback Mechanism (Sonnet, high)

**Branch:** `feat/roadmap-feedback`
**Objective:** Enhance the existing roadmap page with interactive feedback. Give users a voice. Show them what's coming to build excitement.

### Current State
- `/app/more/roadmap/page.tsx` exists with 10 hardcoded items (5 shipped, 5 planned)
- Email link for feature suggestions: `mailto:hello@yachtie.link`
- No voting, no interactive feedback

### Target State

Two options depending on /grill-me decision:

#### Option A: External Tool (Canny/Nolt) — Recommended for MVP

- Keep existing roadmap page as curated "What's Coming" showcase
- Add "Share Your Ideas" section at bottom linking to external board
- Set up Canny (or chosen tool) with YachtieLink branding
- SSO integration so logged-in users auto-authenticate on feedback board

**Minimal code changes:**
- Update roadmap page copy
- Add link/embed for external board
- Configure Canny SSO (API key + user token generation)

#### Option B: In-App Build

Full in-app feature voting:

**Migration:**
```sql
CREATE TABLE public.feature_suggestions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL CHECK (char_length(title) BETWEEN 5 AND 100),
  description TEXT CHECK (char_length(description) <= 1000),
  status TEXT DEFAULT 'suggested' CHECK (status IN ('suggested', 'under_review', 'planned', 'in_progress', 'shipped', 'declined')),
  vote_count INT DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE public.feature_votes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  suggestion_id UUID NOT NULL REFERENCES public.feature_suggestions(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, suggestion_id)
);
```

**Pages:**
- `/app/more/roadmap` — enhanced with Now/Next/Later columns + Shipped section
- `/app/more/roadmap/suggest` — suggestion form (title + description)
- Voting: upvote button per feature, one vote per user, toggle on/off

### Task 1: Roadmap Page Redesign

Regardless of Option A or B, update the roadmap page:

**Layout:**
```
┌──────────────────────────────┐
│ What's Coming           sand │
├──────────────────────────────┤
│                              │
│ RECENTLY SHIPPED        🟢  │
│ ┌──────────────────────────┐ │
│ │ Ghost Profiles     NEW   │ │
│ │ Inner Page Headers NEW   │ │
│ │ Nationality Flags  NEW   │ │
│ └──────────────────────────┘ │
│                              │
│ BUILDING NOW            🔧  │
│ ┌──────────────────────────┐ │
│ │ Endorsement Writing Help │ │
│ │ Smart Cert Matching      │ │
│ │ Network Tab Redesign     │ │
│ └──────────────────────────┘ │
│                              │
│ COMING SOON             📋  │
│ ┌──────────────────────────┐ │
│ │ Crew Search (Pro)        │ │
│ │ Direct Messaging         │ │
│ │ Yacht Reviews            │ │
│ └──────────────────────────┘ │
│                              │
│ ┌──────────────────────────┐ │
│ │ 💡 Have an idea?         │ │
│ │ We build what the        │ │
│ │ community wants.         │ │
│ │ [Share Your Idea]        │ │
│ └──────────────────────────┘ │
└──────────────────────────────┘
```

### Task 2: Feedback Mechanism

**If Canny (Option A):**
- "Share Your Idea" links to Canny board
- Set up Canny SSO in `/app/api/canny/sso/route.ts`
- Users auto-authenticated when they click through

**If In-App (Option B):**
- "Share Your Idea" opens `/app/more/roadmap/suggest`
- Simple form: title + optional description
- Vote mechanism on roadmap items
- Sort by votes

### Task 3: Curate Roadmap Content

Update hardcoded roadmap items to reflect current state. Show enough to excite, not everything:

**Show (exciting, builds anticipation):**
- Endorsement writing assist
- Smart cert matching
- Network redesign
- Crew search (Pro)
- Direct messaging
- Yacht reviews
- AI profile enhancement

**Don't show (keep up our sleeve):**
- Salary benchmarks
- Career intelligence
- Mobile app
- Crew Pass background checks

**Allowed files:**
- `app/(protected)/app/more/roadmap/page.tsx` — rewrite
- `app/(protected)/app/more/roadmap/suggest/page.tsx` — new (if Option B)
- `app/api/canny/` — new (if Option A with SSO)
- `supabase/migrations/` — only if Option B

**Forbidden files:**
- Other tab pages
- Endorsement/Network components

---

## Lane 3: Settings Polish (Sonnet, medium)

**Branch:** `fix/settings-polish`
**Objective:** Small but impactful settings improvements. Visibility toggle clarity, display settings cleanup, phone/WhatsApp split, attachment transfer.

### Task 1: Visibility Toggle Clarity

**Problem:** Profile visibility toggles in settings don't explain what they control. User toggles off "Experience" and has no idea what disappeared.

**Fix:** Add sublabels to every visibility toggle explaining what it shows/hides on the public profile.

Examples:
- **Experience** → "Your yacht positions and date ranges on your public profile"
- **Certifications** → "Your qualifications and expiry dates on your public profile"
- **Endorsements** → "Endorsements from colleagues on your public profile"
- **Skills** → "Your skill tags on your public profile"
- **Hobbies** → "Your interests and hobbies on your public profile"
- **Gallery** → "Your work photos on your public profile"
- **Languages** → "Languages you speak on your public profile"

**File:** `app/(protected)/app/profile/settings/page.tsx` or wherever visibility toggles are rendered

### Task 2: Display Settings Cleanup

**Problem:** Founder called scrim/accent/template pickers "bullshit." They add complexity for minimal value.

**Fix (pending /grill-me confirmation — expected answer: remove them):**
- Remove scrim picker (hardcode sensible default)
- Remove accent color picker (use section color system)
- Remove template picker (if it exists beyond view mode)
- Keep view mode selector only (Standard / Portfolio / Compact)
- Clean up any orphaned settings state/UI

**File:** Display settings section of profile settings page

### Task 3: Phone/WhatsApp Split

**Problem:** Single phone field forces crew to pick one number. Many have a ship SIM (calls) and home SIM (WhatsApp).

**Fix:** Split single `phone` field into two fields:
- **Phone** — primary contact number
- **WhatsApp** — WhatsApp number (can be same or different)
- "Same as phone" toggle/checkbox for convenience
- Both optional, both displayed on profile where appropriate

**Migration:** Add `whatsapp_number` column to users table (or wherever phone is stored).

**Files:**
- `supabase/migrations/` — add column (ONLY if Lane 1 doesn't already have a migration — otherwise coordinate)
- Profile settings form — split field
- Public profile — display both if different
- Endorsement share/invite — use WhatsApp number for WhatsApp share links

**IMPORTANT:** This lane may need a migration. If Lane 1 already has the migration slot, either:
- Add the column to Lane 1's migration (coordinate with Lane 1 worker)
- Or make this Task 3 a separate follow-up after Session 6 merges

### Task 4: Attachment Transfer ("Wrong Yacht?")

**Problem:** When CV parse matches someone to the wrong yacht, there's no way to fix it without deleting and re-adding the experience entry.

**Fix:** Add a "Wrong yacht?" action on experience entries that:
1. Shows the current yacht match
2. Opens yacht search to find the correct yacht
3. Updates the `yacht_id` on the attachment/experience entry
4. Preserves all other data (dates, role, description)

**Files:**
- Experience entry component (wherever yacht attachments are displayed with edit capability)
- May need a PATCH endpoint for updating yacht_id on an attachment
- Yacht search component (reuse from Network Yachts tab)

### Task 5: CV Staleness Nudge

**DEFERRED to Phase 2** per founder decision. Do not build.

**Allowed files:**
- `app/(protected)/app/profile/settings/page.tsx` — visibility sublabels + display settings
- Display settings components
- Profile/public profile — phone/WhatsApp display
- Experience entry components — "Wrong yacht?" action
- `supabase/migrations/` — whatsapp_number column (if migration slot available)

**Forbidden files:**
- Network/Insights/Photo pages (other sessions)
- CV wizard (Session 6 Lane 1)

---

## /Grill-Me Questions for Sessions 6-7

### Cert Registry
- **Q6.1:** Admin moderation for crowdsourced entries — auto-approve after N user confirmations, or manual review?
- **Q6.2:** Migrate existing `certification_type_id` to new registry, or keep both and merge later?
- **Q6.3:** Regional cert variants (AMSA vs MCA naming) — handle as aliases or separate entries?

### Reporting
- **Q6.4:** Report categories — are (fake_profile, false_attachment, inappropriate_content, harassment, spam, other) the right set?
- **Q6.5:** Admin workflow — Supabase dashboard for now, or build a simple admin page?

### Roadmap + Feedback
- **Q7.1:** Canny (external, fast to ship) vs in-app build (more integrated, more work)?
- **Q7.2:** What features to show on public roadmap? (See curated list in Lane 2)
- **Q7.3:** Pro users get weighted votes? Or equal voting?

### Settings
- **Q7.4:** Display settings — confirm: remove scrim/accent/template pickers, keep view mode only?
- **Q7.5:** Phone/WhatsApp — two separate fields, or single field with type selector (Phone/WhatsApp/Both)?
- **Q7.6:** Attachment transfer — should it trigger a re-match of endorsements tied to that yacht? Or just move the experience entry?

---

## Exit Criteria

- All key pages render properly at 1024px, 1280px, 1440px, 1920px
- Public profile looks polished on desktop (not stretched mobile)
- Roadmap page shows curated upcoming features with feedback mechanism
- Users can submit feature ideas and bug reports
- Visibility toggles have clear sublabels
- Display settings simplified (view mode only)
- Phone and WhatsApp are separate fields
- "Wrong yacht?" correction flow works on experience entries
- All settings changes persist correctly

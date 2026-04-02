# Session 7 — Desktop Polish + Roadmap + Settings + Cross-Cutting

**Rally:** 009 Pre-MVP Polish
**Status:** Ready (all grill-me decisions resolved)
**Estimated time:** ~6 hours across 3 workers
**Dependencies:** Sessions 1-6 merged (all features built, this is final polish)
**Grill-me decisions applied:** §9 (Q9.1–Q9.3), §10 (Q10.1–Q10.3), Platform-Wide Rules

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

## Lane 2: Roadmap + Feedback — In-App 3-Tab BuddyBoss Pattern (Sonnet, high)

**Branch:** `feat/roadmap-feedback`
**Objective:** Build a fully in-app roadmap and feedback system. Users never leave the app. Modeled on the BuddyBoss 3-tab pattern. Sand section color.

### Current State
- `/app/more/roadmap/page.tsx` exists with 10 hardcoded items (5 shipped, 5 planned)
- Email link for feature suggestions: `mailto:hello@yachtie.link`
- No voting, no interactive feedback

### Target State — 3-Tab In-App Pattern (Q9.1)

No external tools (Canny, Nolt, etc.) — users never leave the app (Platform-Wide Rule).

**Tab 1: Roadmap** — Curated pipeline managed by the team
- **In Progress** — features currently being built
- **Next** — features committed and coming soon
- **Committed (Later)** — features confirmed but further out

**Tab 2: Feature Requests** — User-submitted ideas with community voting
- Submit: title + description + category
- Upvote toggle (one vote per user, equal weight — no Pro weighting per Q9.3)
- Sort by votes / newest
- Categories TBD (e.g., Profile, Network, CV, Insights, General)

**Tab 3: Released** — Shipped features (celebration + transparency)
- Recently shipped features with brief descriptions
- Shows users their votes mattered

### Migration (Required)

```sql
CREATE TABLE public.feature_suggestions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL CHECK (char_length(title) BETWEEN 5 AND 100),
  description TEXT CHECK (char_length(description) <= 1000),
  category TEXT CHECK (category IN ('profile', 'network', 'cv', 'insights', 'general')),
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

### Task 1: Roadmap Page — 3-Tab Layout

**Layout:**
```
┌──────────────────────────────┐
│ Feature Roadmap         sand │
├──────────────────────────────┤
│ [Roadmap] [Requests] [Shipped]│  ← 3-tab segment control
│                              │
│ ── Tab 1: Roadmap ────────── │
│                              │
│ IN PROGRESS             🔧  │
│ ┌──────────────────────────┐ │
│ │ Endorsement Writing Help │ │
│ │ Smart Cert Matching      │ │
│ │ Network Tab Redesign     │ │
│ └──────────────────────────┘ │
│                              │
│ NEXT                    📋  │
│ ┌──────────────────────────┐ │
│ │ Crew Search (Pro)        │ │
│ │ Direct Messaging         │ │
│ └──────────────────────────┘ │
│                              │
│ COMMITTED (LATER)       🗓  │
│ ┌──────────────────────────┐ │
│ │ Yacht Reviews            │ │
│ │ AI Profile Enhancement   │ │
│ └──────────────────────────┘ │
│                              │
│ ── Tab 2: Feature Requests ─ │
│                              │
│ ┌──────────────────────────┐ │
│ │ 💡 Have an idea?         │ │
│ │ We build what the        │ │
│ │ community wants.         │ │
│ │ [Submit a Feature Idea]  │ │
│ └──────────────────────────┘ │
│                              │
│ Sort: [Most Voted] [Newest]  │
│                              │
│ ┌──────────────────────────┐ │
│ │ ▲ 12  Dark mode          │ │
│ │       "Would love a..."  │ │
│ │       Profile · 3 days   │ │
│ ├──────────────────────────┤ │
│ │ ▲  8  Job board          │ │
│ │       "Somewhere to..."  │ │
│ │       General · 1 week   │ │
│ └──────────────────────────┘ │
│                              │
│ ── Tab 3: Released ───────── │
│                              │
│ RECENTLY SHIPPED        🟢  │
│ ┌──────────────────────────┐ │
│ │ Ghost Profiles     NEW   │ │
│ │ Inner Page Headers NEW   │ │
│ │ Nationality Flags  NEW   │ │
│ └──────────────────────────┘ │
└──────────────────────────────┘
```

### Task 2: Feature Submission Form

Route: `/app/more/roadmap/suggest`

Simple form:
- Title (required, 5-100 chars)
- Description (optional, max 1000 chars)
- Category dropdown (Profile, Network, CV, Insights, General)
- Submit button
- Back nav: "← Feature Roadmap" (Platform-Wide Rule)

### Task 3: Voting Mechanism

- Upvote button per feature request (toggle on/off)
- One vote per user, equal weight for all users (Q9.3)
- `vote_count` maintained via trigger or app logic
- Sort by most voted (default) or newest

### Task 4: Populate with Phase 2 + Phase 3 Features (Q9.2)

Seed the Roadmap tab with real features from Phase 2 and Phase 3 plans. Show enough to excite, not everything:

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
- `app/(protected)/app/more/roadmap/page.tsx` — rewrite with 3-tab pattern
- `app/(protected)/app/more/roadmap/suggest/page.tsx` — new submission form
- `supabase/migrations/` — feature_suggestions + feature_votes tables

**Forbidden files:**
- Other tab pages
- Endorsement/Network components

---

## Lane 3: Settings Polish + Cross-Cutting (Sonnet, medium)

**Branch:** `fix/settings-cross-cutting`
**Objective:** Settings improvements plus platform-wide cross-cutting items discovered during the grill-me interview.

### Task 1: Visibility Toggle Sublabels

**Problem:** Profile visibility toggles in settings don't explain what they control. User toggles off "Experience" and has no idea what disappeared.

**Fix:** Add sublabels to every visibility toggle explaining what it shows/hides on the public profile.

Examples:
- **Experience** — "Your yacht positions and date ranges on your public profile"
- **Certifications** — "Your qualifications and expiry dates on your public profile"
- **Endorsements** — "Endorsements from colleagues on your public profile"
- **Skills** — "Your skill tags on your public profile"
- **Hobbies** — "Your interests and hobbies on your public profile"
- **Gallery** — "Your work photos on your public profile"
- **Languages** — "Languages you speak on your public profile"

**File:** `app/(protected)/app/profile/settings/page.tsx` or wherever visibility toggles are rendered

### Task 2: Display Settings — Keep 3 View Modes (Q10.1)

**Decision:** Keep the 3 view mode options (Profile, Portfolio, Rich Portfolio). These are the "presentation is paid" Pro feature. No changes needed to view mode selector.

**No removal of scrim/accent/template pickers** — they don't exist in the current build. The original spec was based on an incorrect assumption. This task is effectively a no-op unless the view mode selector needs visual polish to match the sand section color system.

### Task 3: Back Navigation — Platform-Wide Audit (Platform-Wide Rule)

**Decision from grill-me:** Back navigation must show WHERE you're going, not generic "Back." Label format is "← Network" / "← Profile" / "← Settings". Never a default page — always returns to previous context.

**Fix:** Audit all pages that have back buttons and update:
- Every inner page / detail view must show contextual back label
- Format: "← [Parent Page Name]"
- Position: top-left, `text-[var(--color-interactive)]`
- Never "← Back"

**Pages to audit (at minimum):**
- `/app/more/roadmap` — "← Settings"
- `/app/more/roadmap/suggest` — "← Feature Roadmap"
- `/app/endorsement/request` — "← Network"
- `/app/network/saved` — "← Network"
- Yacht detail pages — "← Network"
- Profile section edit pages — "← Profile"
- CV preview — "← CV"
- Any other inner pages added in Sessions 1-6

**Reference:** `frontend-design-guide.md` Back Navigation section, Platform-Wide Rules in grill-me decisions.

### Task 4: Skeleton Loading for New Components (Design Guide Universal Principle 7)

**Decision from design guide:** Every page loads with content-shaped skeleton placeholders that match the actual layout. Section-colored pulse animation. The page should feel like it's materializing, not loading.

**Fix:** Audit all new components built in Sessions 3-6 and add skeleton loading states:
- Network accordion (navy pulse) — Session 3
- Insights dashboard metrics (coral pulse) — Session 4
- Endorsement request flow (navy pulse) — Session 5
- Any new Settings/More pages (sand pulse) — Session 6
- Roadmap 3-tab page (sand pulse) — this session's Lane 2

**Pattern:**
- Skeleton shapes match actual content layout (not generic rectangles)
- Pulse animation uses the section color (navy-200, coral-200, sand-200, etc.)
- Skeleton appears immediately, content fades in when loaded
- Use existing skeleton utilities if available, or create a shared `<SectionSkeleton color="navy" />` component

### Task 5: CV Staleness Nudge

**DEFERRED to Phase 2** per founder decision. Do not build.

**Allowed files:**
- `app/(protected)/app/profile/settings/page.tsx` — visibility sublabels
- Display settings components — view mode polish only
- All page files with back navigation — contextual back labels
- All new Session 3-6 components — skeleton loading states
- Shared skeleton component if created

**Forbidden files:**
- Network/Insights/Photo page logic (other sessions own those)
- `supabase/migrations/*` (no migration needed for this lane)
- CV wizard (Session 6 Lane 1)

---

## Exit Criteria

- All key pages render properly at 1024px, 1280px, 1440px, 1920px
- Public profile looks polished on desktop (not stretched mobile)
- In-app roadmap with 3 tabs (Roadmap / Feature Requests / Released) is functional
- Users can submit feature ideas with title + description + category
- Users can upvote feature requests (equal weight, one vote per user)
- Roadmap tab populated with Phase 2 + Phase 3 features
- Visibility toggles have clear sublabels
- 3 view modes retained (Profile, Portfolio, Rich Portfolio)
- All back buttons show contextual destination labels ("← Network", not "← Back")
- All new Session 3-6 components have section-colored skeleton loading states
- All settings changes persist correctly

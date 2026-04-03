# Lane 2 — Roadmap + Feedback — In-App 3-Tab BuddyBoss Pattern

**Branch:** `feat/roadmap-feedback`
**Model:** Opus | **Effort:** high

## Objective

Build a fully in-app roadmap and feedback system. Users never leave the app. 3-tab pattern: Roadmap / Feature Requests / Released. Sand section color.

## Current State
- `/app/more/roadmap/page.tsx` exists with 10 hardcoded items (5 shipped, 5 planned)
- Email link for feature suggestions: `mailto:hello@yachtie.link`
- No voting, no interactive feedback

## Tasks

### Task 1: Migration

Create migration for `feature_suggestions` and `feature_votes` tables:

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

Add appropriate RLS policies:
- Authenticated users can SELECT all suggestions
- Authenticated users can INSERT their own suggestions
- Authenticated users can INSERT/DELETE their own votes
- vote_count maintained via trigger (increment on vote insert, decrement on vote delete)

### Task 2: Roadmap Page — 3-Tab Layout

Rewrite `/app/more/roadmap/page.tsx` with 3-tab segment control:

**Tab 1: Roadmap** — Curated pipeline
- In Progress section (features currently being built)
- Next section (features committed and coming soon)
- Committed (Later) section (confirmed but further out)
- Populate with Phase 2 + Phase 3 features (see list below)

**Tab 2: Feature Requests** — User-submitted ideas
- CTA card: "Have an idea? We build what the community wants."
- Submit button → `/app/more/roadmap/suggest`
- Sort: Most Voted (default) / Newest
- Feature request cards: upvote toggle, title, truncated description, category, time ago

**Tab 3: Released** — Shipped features
- Recently shipped features with brief descriptions

### Task 3: Feature Submission Form

Route: `/app/more/roadmap/suggest`
- Title (required, 5-100 chars)
- Description (optional, max 1000 chars)
- Category dropdown (Profile, Network, CV, Insights, General)
- Submit button
- Back nav: "← Feature Roadmap"

### Task 4: Voting Mechanism

- Upvote button per feature request (toggle on/off)
- One vote per user, equal weight
- DB trigger maintains `vote_count`
- Sort by most voted (default) or newest

### Task 5: Seed Roadmap Content

**Show (exciting):**
- Endorsement writing assist (In Progress)
- Smart cert matching (In Progress)
- Network redesign (In Progress)
- Crew search — Pro (Next)
- Direct messaging (Next)
- Yacht reviews (Committed Later)
- AI profile enhancement (Committed Later)

**Don't show:** Salary benchmarks, Career intelligence, Mobile app, Crew Pass

## Allowed Files
- `app/(protected)/app/more/roadmap/page.tsx` — rewrite with 3-tab
- `app/(protected)/app/more/roadmap/suggest/page.tsx` — new submission form
- `supabase/migrations/` — feature_suggestions + feature_votes tables + RLS + trigger
- Any shared components needed for the voting UI

## Forbidden Files
- Other tab pages (profile, network, insights, cv)
- Endorsement/Network components
- Settings pages (Lane 3 territory)
- Any files owned by Lane 1 or Lane 3

## Patterns to Follow
- Read `docs/design-system/patterns/page-layout.md` — section color wayfinding (sand for More tab)
- Read `docs/design-system/style-guide.md` — component patterns
- Read `lib/section-colors.ts` — Sand section color for More pages
- Use InnerPageHeader for sub-pages with contextual back nav
- Follow existing form patterns from endorsement/report pages

## Edge Cases
- Empty state for Feature Requests tab (no suggestions yet)
- User voting on their own suggestion (allowed — auto-vote on create)
- Long titles/descriptions — truncation with expand
- Category filter (nice-to-have, not required)

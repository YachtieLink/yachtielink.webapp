# YachtieLink — Phase 1A: Profile Robustness Sprint

## Context

YachtieLink's core features are built (Sprints 1-8 complete), but the UI needs to evolve from "functional professional tool" to "delightful crew identity platform." The founder wants Bumble-style photo-forward profiles, Notion-level visual energy, collapsible sections with smart summaries, save/bookmark functionality, and hidden-by-default empty sections. This spec covers every page in the app with implementation-ready detail.

**Design philosophy**: Mobile-first, photo-forward, progressive disclosure, empty = invisible, AI-invisible, crew-first trust model.

**Critical UX principle — "Instant Good Profile"**: Users can upload a CV (PDF/DOCX) which is parsed by AI (GPT-4o-mini) to auto-populate their profile — name, role, yachts, certs, bio, education, skills. After a CV parse, the profile should look polished and complete *immediately*, not like a half-empty skeleton. The design must:

1. **Look great with AI-populated data** — Even before the user touches anything, a CV-parsed profile should feel like a real, complete profile. Sections auto-fill, the AI summary generates, experience/certs populate.
2. **Gracefully handle partial data** — If the CV parse only extracts 3 of 7 sections, the filled sections look complete and the empty ones simply don't appear (hidden-by-default rule).
3. **Prompt uplift, not completion** — The nudges after CV parse aren't "finish your profile" (which implies it's broken), they're "make your profile incredible" — add photos, edit your summary, add hobbies. The profile already *works*, you're making it *stand out*.
4. **Progressive enhancement flow**: CV upload → instant profile → "Add a photo to make it yours" → "Your AI summary is ready — want to tweak it?" → "Add hobbies to show your personality" → each step makes a good profile better.
5. **Profile Strength meter** reframes from "completion" to "strength" — 60% after CV parse feels like a strong start, not a failing grade. Labels: "Getting started" (0-30%), "Looking good" (31-60%), "Standing out" (61-85%), "All squared away" (86-100%).

---

## New Data Requirements

Before page designs, these new tables/columns are needed:

### New Supabase Tables
```sql
-- Multi-photo gallery
create table user_photos (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references users(id) on delete cascade,
  photo_url text not null,
  sort_order int default 0,
  caption text check (char_length(caption) <= 200),
  created_at timestamptz default now()
);

-- Save/bookmark profiles
create table saved_profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references users(id) on delete cascade,
  saved_user_id uuid references users(id) on delete cascade,
  folder_id uuid references profile_folders(id) on delete set null,
  created_at timestamptz default now(),
  unique(user_id, saved_user_id)
);

create table profile_folders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references users(id) on delete cascade,
  name text not null check (char_length(name) <= 50),
  emoji text,
  sort_order int default 0,
  created_at timestamptz default now()
);

-- Hobbies
create table user_hobbies (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references users(id) on delete cascade,
  name text not null check (char_length(name) <= 100),
  sort_order int default 0
);

-- Education
create table user_education (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references users(id) on delete cascade,
  institution text not null check (char_length(institution) <= 200),
  qualification text check (char_length(qualification) <= 200),
  field_of_study text check (char_length(field_of_study) <= 200),
  started_at date,
  ended_at date,
  sort_order int default 0,
  created_at timestamptz default now()
);

-- Work gallery / portfolio
create table user_gallery (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references users(id) on delete cascade,
  image_url text not null,
  caption text check (char_length(caption) <= 300),
  yacht_id uuid references yachts(id) on delete set null,  -- optional: link to a yacht
  sort_order int default 0,
  created_at timestamptz default now()
);

-- Extra skills
create table user_skills (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references users(id) on delete cascade,
  name text not null check (char_length(name) <= 100),
  category text check (char_length(category) <= 50),
  sort_order int default 0
);
```

### New Columns on `users` Table
```sql
alter table users add column ai_summary text;           -- AI-generated about summary
alter table users add column ai_summary_edited boolean default false;
alter table users add column section_visibility jsonb default '{
  "about": true,
  "experience": true,
  "endorsements": true,
  "certifications": true,
  "hobbies": true,
  "education": true,
  "skills": true,
  "photos": true,
  "gallery": true
}'::jsonb;

-- Social links (JSONB — flexible, no migration needed for new platforms)
alter table users add column social_links jsonb default '[]'::jsonb;
-- Format: [{ "platform": "instagram", "url": "https://instagram.com/handle" }, ...]
-- Supported platforms: instagram, linkedin, tiktok, youtube, x (twitter), facebook, website
```

#### Social Links — Display & Edit

**Display** (public + own profile): A row of platform icons just below location, above connection badges. Only filled links show — no empty placeholders. Icons are 20px, spaced 12px apart, tappable (opens link in new tab).

**Supported platforms & icons:**
| Platform | Icon | Color (on hover) |
|----------|------|-----------------|
| Instagram | Camera icon | #E4405F |
| LinkedIn | LinkedIn logo | #0A66C2 |
| TikTok | TikTok logo | #000000 |
| YouTube | Play button | #FF0000 |
| X / Twitter | X logo | #000000 |
| Facebook | F logo | #1877F2 |
| Personal website | Globe icon | teal-500 |

**Edit** (in Settings → Contact Info, or inline on own profile):
- List of platform rows, each with a URL input
- "Add link" button at bottom with platform picker dropdown
- Validation: must be a valid URL matching the platform domain (or any URL for website)
- Max 7 links (one per platform)
- Drag to reorder

**Icons library**: Use `lucide-react` icons (Globe, Camera, Linkedin, etc.) or simple SVG brand icons. Keep them monochrome (text-secondary) with platform color on hover.

### New API Routes Needed
- `POST/DELETE /api/saved-profiles` — save/unsave a profile
- `GET /api/saved-profiles` — list saved profiles (with folder filter)
- `CRUD /api/profile-folders` — manage folders
- `CRUD /api/user-photos` — upload/reorder/delete photos
- `CRUD /api/user-hobbies` — manage hobbies
- `CRUD /api/user-education` — manage education
- `CRUD /api/user-skills` — manage skills
- `POST /api/profile/ai-summary` — generate AI summary from bio + experience
- `PATCH /api/profile/section-visibility` — toggle section visibility

---

## Page-by-Page Design Spec

---

### 1. PUBLIC PROFILE — `/u/[handle]`
**This is the most important page. Redesigned from scratch.**

#### Layout (Mobile)
```
┌─────────────────────────────┐
│  ← Back          [Save] [⋯] │  ← sticky top bar (transparent over photo)
│                              │
│  ┌──────────────────────┐   │
│  │                      │   │
│  │    HERO PHOTO        │   │  ← full-width, 65vh, object-cover
│  │    (swipeable)       │   │
│  │                      │   │
│  │  · · ○ · ·           │   │  ← dot indicators for photo gallery
│  └──────────────────────┘   │
│                              │
│  ┌──────────────────────┐   │
│  │ Display Name      🟢 │   │  ← name + availability dot
│  │ Chief Engineer        │   │  ← primary role
│  │ Interior · Deck       │   │  ← departments as subtle chips
│  │                       │   │
│  │ 📍 Antibes, FR        │   │  ← location (if visible)
│  │                       │   │
│  │ 🔗 📸 ▶️ 🐦            │   │  ← social icons row (only filled ones)
│  │                       │   │
│  │ [Connection badge]    │   │  ← "Colleague" / "2nd" / nothing
│  │ [Founding Member]     │   │  ← badge if applicable
│  └──────────────────────┘   │
│                              │
│  ┌──────────────────────┐   │  ← COLLAPSIBLE: About
│  │ About           ▾    │   │
│  │ "Passionate engineer  │   │  ← AI summary (2 lines) OR user bio
│  │  with 8y experience…" │   │
│  │ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ │   │  ← expand to see full bio
│  └──────────────────────┘   │
│                              │
│  ┌──────────────────────┐   │  ← COLLAPSIBLE: Experience
│  │ Experience       ▾   │   │
│  │ 4y 9m · 5 yachts     │   │  ← summary line
│  │ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ │   │  ← expand: full yacht list
│  └──────────────────────┘   │
│                              │
│  ┌──────────────────────┐   │  ← COLLAPSIBLE: Endorsements
│  │ Endorsements     ▾   │   │
│  │ 23 total · 2 from    │   │  ← summary line
│  │ people you know       │   │
│  │ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ │   │  ← expand: endorsement cards
│  └──────────────────────┘   │
│                              │
│  ┌──────────────────────┐   │  ← COLLAPSIBLE: Certifications
│  │ Certifications   ▾   │   │
│  │ 8 certs · 2 expiring │   │  ← summary line
│  │ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ │   │  ← expand: cert list with status
│  └──────────────────────┘   │
│                              │
│  ┌──────────────────────┐   │  ← COLLAPSIBLE: Education
│  │ Education        ▾   │   │
│  │ BSc Marine Eng, UKSA  │   │  ← summary line
│  └──────────────────────┘   │
│                              │
│  ┌──────────────────────┐   │  ← COLLAPSIBLE: Hobbies
│  │ Hobbies          ▾   │   │
│  │ 🏄 Surfing · 🎸 Guitar│   │  ← pill chips
│  └──────────────────────┘   │
│                              │
│  ┌──────────────────────┐   │  ← COLLAPSIBLE: Skills
│  │ Extra Skills     ▾   │   │
│  │ Welding · Watermaker  │   │  ← pill chips
│  │ Scuba Instructor      │   │
│  └──────────────────────┘   │
│                              │
│  ┌──────────────────────┐   │  ← COLLAPSIBLE: Gallery
│  │ Gallery          ▾   │   │
│  │ 12 photos             │   │  ← summary: photo count
│  │ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ │   │  ← expand: 3-col masonry grid
│  └──────────────────────┘   │
│                              │
│  ┌──────────────────────┐   │
│  │ [Share Profile]       │   │  ← bottom CTA area
│  │ [Request Endorsement] │   │
│  └──────────────────────┘   │
│                              │
└─────────────────────────────┘
```

#### Photo Gallery
- **Hero**: Full-width, 65vh height on mobile, `object-cover`
- **Multi-photo**: Horizontal swipe (like Bumble), dot indicators at bottom of photo
- **First photo**: Always `profile_photo_url` (main profile pic)
- **Additional photos**: From `user_photos` table, sorted by `sort_order`
- **If only 1 photo**: No dots, no swipe — just the hero
- **Desktop**: Photo takes left 40% of viewport, content scrolls on right 60%
- **Transition**: Swipe gesture on mobile, click arrows on desktop

#### Collapsible Sections — `<ProfileAccordion>`
New reusable component. Each section:

**Collapsed state** (default):
- Section title (DM Sans 16px semibold) + chevron right
- Summary line below title (DM Sans 14px, text-secondary)
- Entire row is tappable
- `rounded-2xl bg-surface p-4`
- Subtle `shadow-sm`

**Expanded state**:
- Chevron rotates 90° → down (animated, 200ms spring)
- Content slides down with Framer Motion `AnimatePresence` + height auto
- Full content appears below summary
- Background stays same

**Summary line content** (computed on server):
| Section | Summary format |
|---------|---------------|
| About | First ~80 chars of AI summary or bio + "…" |
| Experience | "{totalTime} sea time on {yachtCount} yachts" (e.g., "4y 9m · 5 yachts") |
| Endorsements | "{count} endorsements · {mutualCount} from people you know" |
| Certifications | "{count} certs · {expiringCount} expiring soon" |
| Education | Most recent qualification + institution |
| Hobbies | First 3 hobby names as comma-separated |
| Skills | First 3 skill names as comma-separated |

**Hidden sections rule**: If section has no data AND user hasn't explicitly toggled it visible → don't render at all. No empty accordion rows on public profile. This is controlled by `section_visibility` on the users table AND a data check — both must be true.

#### Save/Bookmark Feature
- **Save button**: Heart/bookmark icon in top-right of profile (next to share)
- **Tap to save**: Filled icon + haptic feedback + toast "Profile saved"
- **Long-press or second tap**: Opens folder picker bottom sheet
- **Folder picker**: List of folders + "New folder" option at bottom
- **Default**: Saved to "All Saved" (no folder = null folder_id)

#### AI Summary
- Generated via `POST /api/profile/ai-summary` using bio + experience + endorsement excerpts
- 2-3 sentence summary, professional tone, no AI language
- Shown in About section collapsed state
- User can edit it → sets `ai_summary_edited = true` (stops auto-regeneration)
- Regenerates when: bio changes, new endorsement received, new yacht added (only if not manually edited)

#### Desktop Layout (≥768px)
```
┌──────────────────┬──────────────────────────────┐
│                  │  Display Name            🟢  │
│                  │  Chief Engineer              │
│   PHOTO          │  Interior · Deck             │
│   GALLERY        │  📍 Antibes, FR              │
│   (40% width)    │                              │
│   fixed/sticky   │  [Accordion sections scroll] │
│                  │  About ▾                     │
│                  │  Experience ▾                │
│                  │  Endorsements ▾              │
│                  │  ...                         │
│                  │                              │
│                  │  [Share] [Save] [Request]    │
└──────────────────┴──────────────────────────────┘
```

#### States
- **Loading**: Photo skeleton (gray shimmer 65vh) + 4 accordion skeletons
- **Not found**: Salty "lost" pose (120px) + "This crew member doesn't exist yet"
- **Own profile**: "Save" becomes "Edit profile" button, no endorsement request
- **Not logged in**: Save button prompts login, CTA "Join YachtieLink"

#### Key files to modify
- `app/(public)/u/[handle]/page.tsx` — full rewrite of layout
- `components/public/PublicProfileContent.tsx` — full rewrite
- NEW: `components/profile/ProfileAccordion.tsx`
- NEW: `components/profile/PhotoGallery.tsx`
- NEW: `components/profile/SaveProfileButton.tsx`
- NEW: `components/profile/ProfileSummaryLine.tsx`

---

### 2. OWN PROFILE (PRIVATE) — `/app/profile`
**The authenticated user's view of their own profile.**

#### Layout (Mobile)
```
┌─────────────────────────────┐
│  My Profile        [👁 Preview]│  ← page title + preview toggle
│                              │
│  ┌──────────────────────┐   │
│  │  [Photo Gallery]     │   │  ← same gallery component, with + button
│  │  + Add photos        │   │  ← overlay button on last photo slot
│  └──────────────────────┘   │
│                              │
│  ┌──────────────────────┐   │
│  │ Display Name    [✏️]  │   │  ← inline edit links
│  │ Chief Engineer  [✏️]  │   │
│  │ Interior · Deck      │   │
│  │ 📍 Antibes, FR       │   │
│  └──────────────────────┘   │
│                              │
│  ┌──────────────────────┐   │
│  │ Profile Strength 75% │   │  ← progress wheel (replaces WheelACard)
│  │ "Looking good"        │   │  ← strength label (not "75% complete")
│  │ [Add a photo to stand │   │  ← next uplift action
│  │  out →]               │   │
│  └──────────────────────┘   │
│                              │
│  ┌──── Section Manager ─┐   │
│  │ Toggle which sections │   │
│  │ show on your profile  │   │
│  │                       │   │
│  │ ☑ About        [Edit]│   │  ← each section: toggle + edit link
│  │ ☑ Experience   [Edit]│   │
│  │ ☑ Endorsements       │   │
│  │ ☑ Certifications     │   │
│  │ ☐ Education   [Add] │   │  ← unchecked = hidden, shows "Add" if empty
│  │ ☐ Hobbies    [Add]  │   │
│  │ ☐ Skills     [Add]  │   │
│  │ ☐ Gallery   [Add]  │   │  ← work showcase portfolio
│  │ ☑ Photos            │   │
│  └──────────────────────┘   │
│                              │
│  [Same accordion sections   │
│   as public profile but     │
│   with edit buttons on each]│
│                              │
└─────────────────────────────┘
```

#### Key differences from public profile
- **Edit buttons** on every section header
- **Section Manager card** — checkboxes to toggle visibility per section
- **"+ Add photos"** button in gallery
- **Preview button** — opens public profile view of yourself
- **Profile Strength** replaces the old WheelACard (same milestones, new visual)
- **Empty sections show** with "Add [section]" CTA (unlike public where they're hidden)

#### Section Visibility Controls
- Each section has a toggle (checkbox/switch)
- Toggling updates `section_visibility` JSONB on users table
- Sections with no data: toggle is off by default, shows "Add" button
- Sections with data: toggle is on by default
- Changes are instant (optimistic update + API call)

#### Key files to modify
- `app/(protected)/app/profile/page.tsx` — rewrite layout
- `components/profile/IdentityCard.tsx` — update to support gallery
- `components/profile/WheelACard.tsx` — evolve into ProfileStrength
- NEW: `components/profile/SectionManager.tsx`
- Reuse `ProfileAccordion.tsx` from public profile (with `editable` prop)

#### CV-Parse-to-Profile Flow ("Instant Good Profile")
When a user uploads a CV (PDF/DOCX), the AI parser (GPT-4o-mini) extracts structured data. After parsing:

1. **Immediate population**: Name, role, department, bio, yachts, certs, education, skills all auto-fill
2. **AI summary auto-generates**: Runs immediately after CV parse completes
3. **Section visibility auto-enables**: Any section that received data → `section_visibility[key] = true`
4. **Profile strength jumps**: A typical CV parse fills enough to hit 50-65% ("Looking good")
5. **Uplift prompts appear** (in order of impact):

| Prompt | When shown | CTA |
|--------|-----------|-----|
| "Add a photo to make it yours" | No profile photo | → Photo upload |
| "Your summary is ready — want to tweak it?" | AI summary generated | → Edit summary |
| "Show your personality — add hobbies" | No hobbies | → Hobbies edit |
| "Request endorsements from shipmates" | 0 endorsements, has yachts | → Endorsement request |
| "Add more photos to stand out" | 1 photo only | → Photo gallery |

These show as a **single floating card** at the top of the own-profile page (one at a time, most impactful first, dismissible). Not a checklist — a friendly nudge. The card uses Salty (curious mood, 48px) with the prompt text and a single CTA button.

---

### 3. PHOTO UPLOAD & GALLERY — `/app/profile/photos`
**New page for managing photo gallery.**

#### Layout
```
┌─────────────────────────────┐
│  ← Photos                    │
│                              │
│  ┌─────┐ ┌─────┐ ┌─────┐   │  ← 3-column grid of thumbnails
│  │ 📷1 │ │ 📷2 │ │ 📷3 │   │
│  │ ★   │ │     │ │     │   │  ← ★ = primary photo
│  └─────┘ └─────┘ └─────┘   │
│  ┌─────┐ ┌─────┐ ┌─────┐   │
│  │ 📷4 │ │ 📷5 │ │  +  │   │  ← + = add photo
│  │     │ │     │ │     │   │
│  └─────┘ └─────┘ └─────┘   │
│                              │
│  Drag to reorder. First     │
│  photo is your main pic.    │
│                              │
│  Max 6 photos (Pro: 9)      │
└─────────────────────────────┘
```

#### Behavior
- **Drag-to-reorder** (react-beautiful-dnd or similar)
- **Long-press thumbnail**: Shows delete option
- **First photo**: Always the main profile photo (syncs to `profile_photo_url`)
- **Upload**: Tap "+" → camera/gallery picker, crops to 4:5 aspect ratio
- **Limits**: Free = 6 photos, Pro = 9 photos
- **Storage**: Supabase Storage `user-photos/{user_id}/{uuid}.webp`
- **Optimization**: Resize to max 1200px width, WebP format, progressive loading

---

### 4. SAVED PROFILES — `/app/network/saved`
**New page under the Network tab.**

#### Layout
```
┌─────────────────────────────┐
│  Saved Profiles              │
│                              │
│  [All] [⭐ Favourites] [📁+]│  ← folder tabs + create folder
│                              │
│  ┌──────────────────────┐   │  ← profile card (compact)
│  │ 🖼 Jane Smith        │   │
│  │    Chief Stew · M/Y X│   │
│  │    Saved 2d ago   [⋯]│   │  ← overflow: move to folder, unsave
│  └──────────────────────┘   │
│  ┌──────────────────────┐   │
│  │ 🖼 Tom Jones         │   │
│  │    Engineer · S/Y Z   │   │
│  │    Saved 1w ago  [⋯] │   │
│  └──────────────────────┘   │
│                              │
│  ─── Empty state ───        │
│  Salty (helpful, 120px)     │
│  "Save profiles you want   │
│   to remember. They'll be  │
│   here when you need them." │
└─────────────────────────────┘
```

#### Folder management
- **Create folder**: Bottom sheet with name + optional emoji
- **Move to folder**: Long-press card or tap overflow menu → folder picker
- **Delete folder**: Swipe or overflow → profiles move back to "All"
- **Pre-built folders**: None — user creates their own

---

### 5. NETWORK PAGE — `/app/network`
**Redesigned tabs structure to include saved profiles.**

#### Tabs
```
[Colleagues] [Endorsements] [Saved] [Requests]
```

- Add "Saved" tab (new)
- Colleagues: Grid of profile cards (2-col mobile, 3-col desktop)
- Endorsements: Received endorsements list with expandable content
- Saved: Saved profiles with folder filter
- Requests: Sent/received endorsement requests

---

### 6. ENDORSEMENTS SECTION (expanded detail)

#### Inside profile accordion (expanded)
```
┌──────────────────────────────┐
│ Endorsements                 │
│ 23 total · 2 from people     │
│ you know                     │
│                              │
│  ┌────────────────────────┐  │
│  │ 🖼 Sarah Chen          │  │  ← endorser photo + name
│  │ Chief Stew on M/Y Luna │  │  ← role + yacht context
│  │ "Incredible work ethic  │  │  ← excerpt (150 chars)
│  │  and always reliable…"  │  │
│  │ Jan 2025     [Read more]│  │
│  └────────────────────────┘  │
│                              │
│  ┌────────────────────────┐  │
│  │ 🖼 Mark Davies         │  │  ← "You know Mark" badge
│  │ 🤝 You know Mark       │  │     if mutual colleague
│  │ Captain on M/Y Storm   │  │
│  │ "A true professional…" │  │
│  └────────────────────────┘  │
│                              │
│  [Show all 23 →]             │  ← if > 5, truncate + "show all"
└──────────────────────────────┘
```

#### Mutual colleague detection
- For each endorser, check if the viewer shares a yacht with them
- If yes, show "You know [Name]" badge with teal accent
- Summary counts mutual endorsers: "2 from people you know"

---

### 7. EXPERIENCE SECTION (expanded detail)

#### Inside profile accordion (expanded)
```
┌──────────────────────────────┐
│ Experience                    │
│ 4y 9m sea time · 5 yachts   │
│                              │
│  M/Y Luna ──────────────── │
│  Chief Engineer              │
│  Mar 2023 – Present (2y 0m) │
│  🏳 Cayman Islands · 62m    │
│                              │
│  S/Y Horizon ────────────── │
│  2nd Engineer                │
│  Jun 2021 – Feb 2023 (1y 8m)│
│  🏳 Marshall Islands · 48m  │
│                              │
│  [3 more yachts →]           │
└──────────────────────────────┘
```

#### Sea time calculation (server-side)
```
totalDays = sum of (ended_at ?? today) - started_at for all attachments
years = floor(totalDays / 365)
months = floor((totalDays % 365) / 30)
→ "4y 9m"
```

---

### 8. ABOUT SECTION (expanded detail)

#### Inside profile accordion (expanded)
```
┌──────────────────────────────┐
│ About                        │
│ "Passionate engineer with…"  │  ← AI summary (collapsed)
│                              │
│ [Full bio text here, up to  │  ← expanded: full 500-char bio
│  500 characters, preserving │
│  whitespace and line breaks] │
│                              │
│  ── On own profile only ──  │
│  [✨ Regenerate summary]     │  ← only if user owns profile
│  [✏️ Edit bio]               │
└──────────────────────────────┘
```

#### AI summary generation
- Input: bio + top 3 endorsement excerpts + primary role + sea time
- Output: 2-3 sentences, professional, no AI language
- Model: GPT-4o-mini (already in stack for CV parsing)
- Trigger: On profile view if `ai_summary` is null and bio exists
- Cache: Stored in `users.ai_summary`, regenerated on bio/endorsement changes
- User override: If user edits the summary, `ai_summary_edited = true` — no auto-regen

---

### 9. HOBBIES SECTION (new)

#### Inside profile accordion (expanded)
```
┌──────────────────────────────┐
│ Hobbies                      │
│ Surfing · Guitar · Diving    │  ← collapsed: pill chips
│                              │
│ ┌────────┐ ┌────────┐       │  ← expanded: larger pill chips
│ │ 🏄 Surf │ │ 🎸 Guitar│      │     with optional emoji
│ └────────┘ └────────┘       │
│ ┌────────┐ ┌─────────┐     │
│ │ 🤿 Dive │ │ 📚 Reading│    │
│ └────────┘ └─────────┘     │
└──────────────────────────────┘
```

#### Edit mode
- Pill input: Type hobby name → Enter to add → shows as pill
- Optional emoji selector per hobby
- Drag to reorder
- Max 10 hobbies

---

### 10. EDUCATION SECTION (new)

#### Inside profile accordion (expanded)
```
┌──────────────────────────────┐
│ Education                    │
│ BSc Marine Engineering, UKSA │  ← summary: most recent
│                              │
│  UKSA ────────────────────  │
│  BSc Marine Engineering      │
│  2018 – 2021                 │
│                              │
│  Antibes Maritime Academy ── │
│  STCW Advanced               │
│  2017                        │
└──────────────────────────────┘
```

#### Edit page: `/app/education/new` and `/app/education/[id]/edit`
- Fields: Institution (required), Qualification, Field of study, Start date, End date
- Sorted by end date descending (most recent first)

---

### 11. SKILLS SECTION (new)

#### Inside profile accordion (expanded)
```
┌──────────────────────────────┐
│ Extra Skills                 │
│ Welding · Watermaker · Scuba │  ← collapsed: comma-separated
│                              │
│ Technical ──────────────── │  ← expanded: grouped by category
│ ┌──────────┐ ┌────────────┐ │
│ │ Welding  │ │ Watermaker │ │
│ └──────────┘ └────────────┘ │
│                              │
│ Certifiable ─────────────── │
│ ┌─────────────────┐         │
│ │ Scuba Instructor │         │
│ └─────────────────┘         │
└──────────────────────────────┘
```

#### Edit mode
- Pill input with optional category dropdown (Technical, Certifiable, Language, Software, Other)
- Max 20 skills
- Category grouping in display, flat list in edit

---

### 11b. WORK GALLERY SECTION (new)
**A portfolio/showcase of work — engine rooms, table settings, paint jobs, yacht interiors, etc.**

#### Inside profile accordion (expanded)
```
┌──────────────────────────────┐
│ Gallery                      │
│ 12 photos                    │  ← collapsed: count
│                              │
│ ┌──────┐ ┌──────┐ ┌──────┐ │  ← 3-column masonry grid
│ │      │ │      │ │      │ │
│ │ 📷   │ │ 📷   │ │ 📷   │ │
│ │      │ │      │ │      │ │
│ └──────┘ └──────┘ └──────┘ │
│ ┌──────┐ ┌──────┐ ┌──────┐ │
│ │ 📷   │ │ 📷   │ │ 📷   │ │
│ └──────┘ └──────┘ └──────┘ │
│                              │
│  [Show all 12 →]            │  ← if > 6, show first 6 + link
└──────────────────────────────┘
```

#### Tap behavior
- Tap photo → full-screen lightbox with swipe navigation
- Caption shown below photo in lightbox
- Yacht name shown if linked (e.g., "M/Y Luna")

#### Edit mode (`/app/profile/gallery`)
- Same grid layout with + button and drag-to-reorder
- Each photo: optional caption (300 chars), optional yacht link (dropdown of user's yachts)
- Limits: Free = 12 photos, Pro = 30 photos
- Storage: Supabase Storage `user-gallery/{user_id}/{uuid}.webp`
- Optimization: Max 1600px width, WebP, lazy load

#### Difference from profile photos
| | Profile Photos | Work Gallery |
|---|---|---|
| Purpose | Personal — show who you are | Professional — showcase your work |
| Where shown | Hero carousel at top of profile | Gallery accordion section |
| Captions | No | Yes (optional) |
| Yacht link | No | Yes (optional) |
| Limits | 6 free / 9 Pro | 12 free / 30 Pro |

---

### 12. CERTIFICATIONS SECTION (expanded detail)

#### Inside profile accordion (expanded)
```
┌──────────────────────────────┐
│ Certifications               │
│ 8 certs · 2 expiring soon   │
│                              │
│  STCW Basic Safety ──────── │
│  ✅ Valid until Dec 2027     │
│  Issued by MCA              │
│                              │
│  ENG1 Medical ──────────── │
│  ⚠️ Expires in 45 days      │  ← amber warning
│  Issued by MCA              │
│                              │
│  Powerboat Level 2 ──────── │
│  🔴 Expired                 │
│  Issued by RYA              │
│                              │
│  [Show all 8 →]             │
└──────────────────────────────┘
```

- Status colors: Valid = green, Expiring <90d = amber, Expired = red, No expiry = gray
- Show max 3 in collapsed expansion, "Show all" link

---

### 13. ONBOARDING WIZARD — `/onboarding`
**Extended to capture new sections.**

#### Current steps (keep)
1. Full name + display name
2. Handle claim
3. Department + primary role
4. First yacht + role + dates
5. Request endorsements
6. Complete

#### New optional steps (add after step 4)
- **4b.** Upload photos (show gallery grid, "Add at least 1 photo")
- **4c.** Add bio (textarea, show AI summary preview)
- **4d.** Hobbies (pill input, "What do you do off the water?")
- **4e.** Education (optional, skip-able)
- **4f.** Extra skills (pill input)

Each new step has a "Skip" button. Steps 4b-4f are a secondary flow that appears after the core setup, framed as "Make your profile stand out" with a progress bar.

---

### 14. WELCOME / AUTH PAGES — `/welcome`, `/login`, `/signup`

#### `/welcome`
```
┌─────────────────────────────┐
│                              │
│  [YachtieLink Logo]          │
│                              │
│  Your professional          │  ← DM Serif Display, 36px
│  identity on the water      │
│                              │
│  Build your crew profile,   │  ← DM Sans, 16px, text-secondary
│  earn endorsements, and     │
│  share your sea story.      │
│                              │
│  [Get Started →]             │  ← primary button (teal)
│  [I have an account]        │  ← text link
│                              │
│  Salty (neutral, 120px)     │  ← mascot illustration
│                              │
└─────────────────────────────┘
```

#### `/login` and `/signup`
- Clean, centered card layout
- Logo at top
- Email + password fields (rounded-xl)
- OAuth buttons (Apple, Google) with divider "or"
- Error states inline below fields (red text, shake animation)
- Return-to redirect preserved

---

### 15. YACHT DETAIL — `/app/yacht/[id]`

#### Layout
```
┌─────────────────────────────┐
│  ← M/Y Luna                 │
│                              │
│  ┌──────────────────────┐   │
│  │   YACHT COVER PHOTO   │   │  ← 40vh, rounded-2xl
│  │   [📷 Change photo]   │   │  ← if user is attached
│  └──────────────────────┘   │
│                              │
│  Motor Yacht · 62m           │
│  🏳 Cayman Islands · 2019   │
│                              │
│  ── Crew (12) ─────────── │
│  ┌────────────────────────┐ │
│  │ 🖼 Jane · Chief Stew   │ │  ← crew roster cards
│  │    Mar 2023 – Present  │ │
│  └────────────────────────┘ │
│  ┌────────────────────────┐ │
│  │ 🖼 Tom · Captain       │ │
│  │    Jan 2022 – Dec 2024 │ │
│  └────────────────────────┘ │
└─────────────────────────────┘
```

---

### 16. CV PAGE — `/app/cv`

#### Layout
```
┌─────────────────────────────┐
│  CV & Documents              │
│                              │
│  ┌──────────────────────┐   │
│  │  Profile PDF Preview  │   │  ← thumbnail of generated PDF
│  │  Last generated: 2d   │   │
│  │                       │   │
│  │  [Download] [Share]   │   │
│  │  [Regenerate]         │   │
│  └──────────────────────┘   │
│                              │
│  ┌──────────────────────┐   │
│  │  Upload CV            │   │
│  │  Drop PDF/DOCX here   │   │
│  │  or tap to browse     │   │
│  └──────────────────────┘   │
│                              │
│  ── Empty state ───         │
│  Salty (helpful, 120px)     │
│  "Your profile makes a     │
│   solid first impression.  │
│   Generate a PDF to share." │
└─────────────────────────────┘
```

---

### 17. INSIGHTS (Pro) — `/app/insights`

#### Layout
```
┌─────────────────────────────┐
│  Insights            [7d ▾] │  ← time filter dropdown
│                              │
│  ┌──────┐ ┌──────┐ ┌──────┐│  ← stat cards (bento row)
│  │  47  │ │  12  │ │   3  ││
│  │views │ │ PDFs │ │shares││
│  └──────┘ └──────┘ └──────┘│
│                              │
│  ┌──────────────────────┐   │  ← main chart (full width)
│  │  Profile Views        │   │
│  │  📈 [chart]           │   │
│  └──────────────────────┘   │
│                              │
│  ┌──────────────────────┐   │
│  │  Cert Expiry Tracker  │   │
│  │  ⚠️ 2 certs expiring  │   │
│  │  within 90 days       │   │
│  └──────────────────────┘   │
│                              │
│  ── Free user overlay ──    │
│  Blurred cards + lock icon  │
│  "Upgrade to Crew Pro to    │
│   see who's viewing your    │
│   profile" [Upgrade →]      │
└─────────────────────────────┘
```

- **Stat cards**: Use coral (views), navy (PDFs), amber (shares) backgrounds at 10% opacity
- **Chart**: Multi-color lines using the new palette
- **Free users**: See blurred teaser with upgrade CTA

---

### 18. SETTINGS — `/app/more`

#### Layout
```
┌─────────────────────────────┐
│  Settings                    │
│                              │
│  ── Appearance ────────── │
│  Theme    [System ▾]        │
│                              │
│  ── Account ──────────── │
│  Name & Handle          [→] │
│  Contact Info           [→] │
│  Profile Sections       [→] │  ← NEW: links to section manager
│                              │
│  ── Privacy ──────────── │
│  Profile Visibility     [→] │
│  Export My Data         [→] │
│  Delete Account         [→] │
│                              │
│  ── Subscription ──────── │
│  Crew Pro · Active      [→] │  ← or "Free · Upgrade →"
│                              │
│  ── Help ─────────────── │
│  Send Feedback          [→] │
│  Terms of Service       [→] │
│  Privacy Policy         [→] │
│                              │
│  [Sign Out]                  │
└─────────────────────────────┘
```

---

### 19. CERTIFICATION MANAGER — `/app/certs`

#### Layout
```
┌─────────────────────────────┐
│  Certifications    [+ Add]   │
│                              │
│  ── Expiring Soon ───────── │  ← section header (amber bg)
│  ┌────────────────────────┐ │
│  │ ⚠️ ENG1 Medical        │ │
│  │ Expires in 45 days     │ │
│  │ [Renew reminder]       │ │
│  └────────────────────────┘ │
│                              │
│  ── Valid ──────────────── │  ← section header (green bg)
│  ┌────────────────────────┐ │
│  │ ✅ STCW Basic          │ │
│  │ Valid until Dec 2027   │ │
│  └────────────────────────┘ │
│                              │
│  ── Expired ─────────────── │  ← section header (red bg)
│  ┌────────────────────────┐ │
│  │ 🔴 Powerboat Level 2  │ │
│  │ Expired Mar 2025       │ │
│  └────────────────────────┘ │
└─────────────────────────────┘
```

- Grouped by status (expiring → valid → expired)
- Color-coded section headers
- Tap card to edit

---

### 20. ENDORSEMENT REQUEST — `/app/endorsement/request`
No major visual changes needed. Current flow is solid. Minor updates:
- Use `ProfileAccordion` animation for yacht picker expand
- Add Salty empty state if no colleagues found
- Staggered list animation for colleague cards

---

## Cross-Cutting Design Patterns

### Empty States (all pages)
Every page that can be empty gets a Salty illustration:
| Page | Salty mood | Message |
|------|-----------|---------|
| No endorsements | helpful | "Your shipmates know your work. Ask them." |
| No experience | curious | "Where have you sailed? Add your first yacht." |
| No certs | alert | "Keep your certs in order. Add them here." |
| No saved profiles | neutral | "Save profiles you want to remember." |
| No photos | helpful | "Show the crew who you are. Add some photos." |
| No network | searching | "Work on a yacht to start building your network." |
| CV empty | helpful | "Your profile makes a solid first impression. Generate a PDF." |
| Insights (free) | curious | "Upgrade to see who's looking at your profile." |

### Animation Standards
- **Page enter**: `fadeUp` (opacity 0→1, y 20→0, 400ms)
- **List items**: `staggerContainer` (60ms between items)
- **Cards**: `cardHover` on interactive cards (lift + shadow)
- **Buttons**: `buttonTap` (scale 0.97, 150ms)
- **Accordions**: Height auto animation via `AnimatePresence` + `motion.div`
- **Photo swipe**: Spring physics (stiffness 300, damping 30)
- **Skeleton → content**: Crossfade (200ms)
- **Respect `prefers-reduced-motion`**: Disable all animations if set

### Dark Mode
- All new colors have dark variants already in `globals.css`
- Photo gallery: Slightly darkened overlay on photo edges for text readability
- Accordion sections: `bg-surface` (adapts automatically)
- Status colors stay the same in dark mode (green/amber/red)

### Performance
- **Photos**: Lazy load below fold, progressive JPEG/WebP, `next/image` with `sizes` prop
- **Accordions**: Content not rendered until first expand (lazy mount)
- **Saved profiles**: Paginated (20 per page, infinite scroll)
- **AI summary**: Generated server-side, cached in DB, not on every page load
- **Skeleton states**: Every section shows skeleton while data loads

### Accessibility
- **Accordions**: `aria-expanded`, `aria-controls`, keyboard navigation (Enter/Space to toggle)
- **Photo gallery**: `aria-label` on each photo, keyboard arrow navigation
- **Save button**: `aria-pressed` state
- **Color contrast**: All text meets WCAG AA (4.5:1 ratio minimum)
- **Focus rings**: Teal outline on all interactive elements

---

## Documents to Update

1. **`yl_style_guide.md`** — Add sections for: collapsible accordion pattern, photo gallery, save/bookmark, section visibility, AI summary, new data sections (hobbies/education/skills)
2. **`notes/salty_mascot_spec.md`** — Add empty state messages for new sections (photos, education, hobbies, skills, saved profiles)
3. **`CHANGELOG.md`** — Update with session entry before commit

---

## Phase 1A: Profile Robustness Sprint — Implementation Order

### Step 1: Database Migrations (foundation)
1. Create `user_photos` table (multi-photo gallery)
2. Create `user_gallery` table (work portfolio)
3. Create `saved_profiles` + `profile_folders` tables
4. Create `user_hobbies` table
5. Create `user_education` table
6. Create `user_skills` table
7. Add columns to `users`: `ai_summary`, `ai_summary_edited`, `section_visibility`, `social_links`
8. Add RLS policies for all new tables
9. Create Supabase Storage buckets: `user-photos`, `user-gallery`

### Step 2: Core Components
10. Build `ProfileAccordion` — collapsible section with summary line, chevron animation, AnimatePresence
11. Build `PhotoGallery` — swipeable hero carousel with dot indicators
12. Build `ProfileSummaryLine` — computed summary text per section type
13. Build `SocialLinksRow` — icon row with platform colors on hover
14. Build `SectionManager` — checkbox toggles per section with edit/add links

### Step 3: API Routes
15. CRUD `/api/user-photos` — upload, reorder, delete profile photos
16. CRUD `/api/user-gallery` — upload, reorder, delete, caption, yacht-link gallery photos
17. `POST/DELETE /api/saved-profiles` — save/unsave profiles
18. CRUD `/api/profile-folders` — create, rename, delete folders
19. CRUD `/api/user-hobbies` — add, remove, reorder
20. CRUD `/api/user-education` — add, edit, remove
21. CRUD `/api/user-skills` — add, remove, reorder
22. `POST /api/profile/ai-summary` — generate AI summary
23. `PATCH /api/profile/section-visibility` — toggle sections
24. `PATCH /api/profile/social-links` — update social links

### Step 4: Public Profile Redesign (`/u/[handle]`)
25. Full rewrite of `PublicProfileContent.tsx` — Bumble-style hero photo + accordion layout
26. Integrate `PhotoGallery` as hero section
27. Integrate `ProfileAccordion` for all sections (about, experience, endorsements, certs, education, hobbies, skills, gallery)
28. Implement hidden-by-default logic (empty + not visible → don't render)
29. Add `SocialLinksRow` below identity info
30. Add `SaveProfileButton` with folder picker bottom sheet
31. Compute summary lines server-side (sea time, endorsement counts, mutual colleagues)
32. Desktop layout: photo left 40% sticky, content right 60% scrolling

### Step 5: Own Profile Redesign (`/app/profile`)
33. Rewrite profile page with `SectionManager` card
34. Integrate `PhotoGallery` with "+ Add photos" overlay
35. Replace `WheelACard` with Profile Strength meter (new labels: Getting started → Looking good → Standing out → All squared away)
36. Add uplift prompt card (single floating nudge, Salty 48px, one at a time)
37. All accordion sections with `editable` prop (edit buttons on each)
38. "Preview" button → opens public profile view

### Step 6: New Section Edit Pages
39. `/app/profile/photos` — photo gallery management (drag-to-reorder, 3-col grid)
40. `/app/profile/gallery` — work portfolio management (captions, yacht links)
41. `/app/hobbies/edit` — pill input for hobbies
42. `/app/education/new` + `/app/education/[id]/edit` — education form
43. `/app/skills/edit` — pill input with category dropdown
44. Social links editor (in `/app/profile/settings` or `/app/more/account`)

### Step 7: AI Summary
45. Build AI summary generation endpoint (GPT-4o-mini: bio + experience + endorsements → 2-3 sentences)
46. Auto-generate on first profile view if bio exists and ai_summary is null
47. Regenerate on bio/endorsement changes (only if not manually edited)
48. Edit UI in About section (own profile only)

### Step 8: Save/Bookmark + Folders
49. `SaveProfileButton` component — heart/bookmark icon, tap to save, long-press for folder
50. Folder picker bottom sheet — list of folders + "New folder"
51. "Saved" tab in Network page (`/app/network`)
52. Saved profiles list with folder filter tabs
53. Folder CRUD (create with emoji, rename, delete → profiles move to All)

### Step 9: CV Parse Integration
54. Update CV parser output to populate new tables (education, skills, hobbies if extractable)
55. Auto-enable section_visibility for populated sections after CV parse
56. Trigger AI summary generation after CV parse completes
57. Show uplift prompts after parse ("Add a photo to make it yours", etc.)

### Step 10: Polish & QA
58. Animation pass: all accordions, galleries, save buttons use `lib/motion.ts` presets
59. Dark mode QA for all new components and sections
60. Mobile responsiveness (375px, 768px, 1280px breakpoints)
61. Accessibility audit (aria-expanded, keyboard nav, color contrast, focus rings)
62. Empty state pass: Salty illustrations for every empty section
63. Performance: lazy load gallery images, lazy mount accordion content, skeleton states
64. Lighthouse check (target: 90+ mobile)

---

## Verification

- Run `npm run dev` and check every page
- Test collapsible sections: expand/collapse animation, summary computation accuracy
- Test photo gallery: swipe on mobile, arrows on desktop, upload, reorder, delete
- Test work gallery: upload with caption, yacht link, lightbox view
- Test save/bookmark: save, unsave, folder create, move between folders
- Test section visibility: toggle on/off on own profile, verify hidden on public profile
- Test social links: add/remove/reorder, icons render correctly, links open in new tab
- Test AI summary: auto-generate, manual edit, regenerate after bio change
- Test CV parse flow: upload CV → profile populates → uplift prompts appear
- Test dark mode on all new components
- Test mobile responsiveness (375px, 768px, 1280px)
- Test with completely empty profile (all sections hidden, only name shows)
- Test with fully populated profile (all sections expanded, gallery full)
- Lighthouse performance check (target: 90+ on mobile)

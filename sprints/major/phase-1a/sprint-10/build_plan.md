# Sprint 10: Profile Robustness — Detailed Build Plan

## Context

Sprint 10 (Phase 1A Profile Robustness) transforms the profile from a flat list of cards into a Bumble-style photo-forward, accordion-based, saveable profile with smart summaries and new data sections. This is the most user-facing sprint yet — it changes how every crew member presents themselves.

**Dependencies from prior sprints:**
- User profiles with all fields (Sprint 3)
- Employment history, yacht graph (Sprints 2-5)
- Endorsements with shared-yacht gating (Sprint 5)
- Public profile at `/u/:handle` (Sprint 6)
- CV parse pipeline (Sprint 6, GPT-4o-mini)
- Pro subscription status (Sprint 7)
- Zod validation + rate limiting patterns (Sprint 8)
- Expanded colour palette, DM Serif Display, motion presets (Phase 1A UI refresh)

**What Sprint 10 delivers:**
1. Multi-photo profile gallery (Bumble-style hero)
2. Collapsible accordion sections with smart summaries
3. Section visibility controls (empty = hidden by default)
4. Social links on profile
5. New data sections: hobbies, education, skills, work gallery
6. AI-generated profile summary
7. Save/bookmark profiles with folder organisation
8. Profile Strength meter (replaces completion wheel)
9. Uplift prompts (post-CV-parse nudges)

---

## Part 1: Database Migration

**File to create:** `supabase/migrations/20260317000021_sprint10_profile_robustness.sql`

```sql
-- Sprint 10: Profile Robustness
-- Multi-photo gallery, work portfolio, saved profiles, hobbies, education, skills, social links

-- ═══════════════════════════════════════════════════════════
-- 1. USER PHOTOS (profile gallery — personal photos)
-- ═══════════════════════════════════════════════════════════

create table user_photos (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  photo_url text not null,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

create index idx_user_photos_user on user_photos(user_id, sort_order);

-- RLS: owner can CRUD, anyone can read (public profiles show photos)
alter table user_photos enable row level security;

create policy "Users can read any user_photos"
  on user_photos for select using (true);

create policy "Users can insert own photos"
  on user_photos for insert with check (auth.uid() = user_id);

create policy "Users can update own photos"
  on user_photos for update using (auth.uid() = user_id);

create policy "Users can delete own photos"
  on user_photos for delete using (auth.uid() = user_id);


-- ═══════════════════════════════════════════════════════════
-- 2. USER GALLERY (work portfolio — professional showcase)
-- ═══════════════════════════════════════════════════════════

create table user_gallery (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  image_url text not null,
  caption text check (char_length(caption) <= 300),
  yacht_id uuid references yachts(id) on delete set null,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

create index idx_user_gallery_user on user_gallery(user_id, sort_order);

alter table user_gallery enable row level security;

create policy "Users can read any user_gallery"
  on user_gallery for select using (true);

create policy "Users can insert own gallery"
  on user_gallery for insert with check (auth.uid() = user_id);

create policy "Users can update own gallery"
  on user_gallery for update using (auth.uid() = user_id);

create policy "Users can delete own gallery"
  on user_gallery for delete using (auth.uid() = user_id);


-- ═══════════════════════════════════════════════════════════
-- 3. PROFILE FOLDERS (for organising saved profiles)
-- ═══════════════════════════════════════════════════════════

create table profile_folders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  name text not null check (char_length(name) <= 50),
  emoji text check (char_length(emoji) <= 10),
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

create index idx_profile_folders_user on profile_folders(user_id, sort_order);

alter table profile_folders enable row level security;

create policy "Users can read own folders"
  on profile_folders for select using (auth.uid() = user_id);

create policy "Users can insert own folders"
  on profile_folders for insert with check (auth.uid() = user_id);

create policy "Users can update own folders"
  on profile_folders for update using (auth.uid() = user_id);

create policy "Users can delete own folders"
  on profile_folders for delete using (auth.uid() = user_id);


-- ═══════════════════════════════════════════════════════════
-- 4. SAVED PROFILES (bookmark other users' profiles)
-- ═══════════════════════════════════════════════════════════

create table saved_profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  saved_user_id uuid not null references users(id) on delete cascade,
  folder_id uuid references profile_folders(id) on delete set null,
  created_at timestamptz not null default now(),
  unique(user_id, saved_user_id),
  check (user_id != saved_user_id)
);

create index idx_saved_profiles_user on saved_profiles(user_id, created_at desc);
create index idx_saved_profiles_folder on saved_profiles(user_id, folder_id);

alter table saved_profiles enable row level security;

create policy "Users can read own saved_profiles"
  on saved_profiles for select using (auth.uid() = user_id);

create policy "Users can insert own saved_profiles"
  on saved_profiles for insert with check (auth.uid() = user_id);

create policy "Users can update own saved_profiles"
  on saved_profiles for update using (auth.uid() = user_id);

create policy "Users can delete own saved_profiles"
  on saved_profiles for delete using (auth.uid() = user_id);


-- ═══════════════════════════════════════════════════════════
-- 5. USER HOBBIES
-- ═══════════════════════════════════════════════════════════

create table user_hobbies (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  name text not null check (char_length(name) <= 100),
  emoji text check (char_length(emoji) <= 10),
  sort_order int not null default 0
);

create index idx_user_hobbies_user on user_hobbies(user_id, sort_order);

alter table user_hobbies enable row level security;

create policy "Users can read any user_hobbies"
  on user_hobbies for select using (true);

create policy "Users can insert own hobbies"
  on user_hobbies for insert with check (auth.uid() = user_id);

create policy "Users can update own hobbies"
  on user_hobbies for update using (auth.uid() = user_id);

create policy "Users can delete own hobbies"
  on user_hobbies for delete using (auth.uid() = user_id);


-- ═══════════════════════════════════════════════════════════
-- 6. USER EDUCATION
-- ═══════════════════════════════════════════════════════════

create table user_education (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  institution text not null check (char_length(institution) <= 200),
  qualification text check (char_length(qualification) <= 200),
  field_of_study text check (char_length(field_of_study) <= 200),
  started_at date,
  ended_at date,
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  check (ended_at is null or started_at is null or ended_at >= started_at)
);

create index idx_user_education_user on user_education(user_id, sort_order);

alter table user_education enable row level security;

create policy "Users can read any user_education"
  on user_education for select using (true);

create policy "Users can insert own education"
  on user_education for insert with check (auth.uid() = user_id);

create policy "Users can update own education"
  on user_education for update using (auth.uid() = user_id);

create policy "Users can delete own education"
  on user_education for delete using (auth.uid() = user_id);


-- ═══════════════════════════════════════════════════════════
-- 7. USER SKILLS
-- ═══════════════════════════════════════════════════════════

create table user_skills (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  name text not null check (char_length(name) <= 100),
  category text check (category in ('technical', 'certifiable', 'language', 'software', 'other')),
  sort_order int not null default 0
);

create index idx_user_skills_user on user_skills(user_id, sort_order);

alter table user_skills enable row level security;

create policy "Users can read any user_skills"
  on user_skills for select using (true);

create policy "Users can insert own skills"
  on user_skills for insert with check (auth.uid() = user_id);

create policy "Users can update own skills"
  on user_skills for update using (auth.uid() = user_id);

create policy "Users can delete own skills"
  on user_skills for delete using (auth.uid() = user_id);


-- ═══════════════════════════════════════════════════════════
-- 8. NEW COLUMNS ON USERS TABLE
-- ═══════════════════════════════════════════════════════════

alter table users add column if not exists ai_summary text;
alter table users add column if not exists ai_summary_edited boolean not null default false;
alter table users add column if not exists section_visibility jsonb not null default '{
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
alter table users add column if not exists social_links jsonb not null default '[]'::jsonb;
-- social_links format: [{ "platform": "instagram", "url": "https://..." }, ...]
-- supported platforms: instagram, linkedin, tiktok, youtube, x, facebook, website


-- ═══════════════════════════════════════════════════════════
-- 9. HELPER FUNCTION: Compute sea time for a user
-- ═══════════════════════════════════════════════════════════

create or replace function get_sea_time(p_user_id uuid)
returns jsonb
language sql stable
as $$
  select coalesce(
    jsonb_build_object(
      'total_days', sum(
        extract(day from (coalesce(ended_at::timestamptz, now()) - started_at::timestamptz))
      )::int,
      'yacht_count', count(distinct yacht_id)
    ),
    '{"total_days": 0, "yacht_count": 0}'::jsonb
  )
  from attachments
  where user_id = p_user_id
    and deleted_at is null
$$;
```

### Storage buckets

Create via Supabase dashboard or CLI:

```bash
# Profile photos gallery (separate from the single profile_photo_url)
supabase storage create user-photos --public
# Policy: authenticated users can upload to their own folder (user_id/*)
# Policy: public read access

# Work gallery portfolio
supabase storage create user-gallery --public
# Same policies as user-photos
```

**Storage policies (apply via SQL or dashboard):**
```sql
-- user-photos bucket
create policy "Users can upload own photos"
  on storage.objects for insert
  with check (bucket_id = 'user-photos' and auth.uid()::text = (storage.foldername(name))[1]);

create policy "Users can delete own photos"
  on storage.objects for delete
  using (bucket_id = 'user-photos' and auth.uid()::text = (storage.foldername(name))[1]);

create policy "Public read access for user-photos"
  on storage.objects for select
  using (bucket_id = 'user-photos');

-- user-gallery bucket (same pattern)
create policy "Users can upload own gallery"
  on storage.objects for insert
  with check (bucket_id = 'user-gallery' and auth.uid()::text = (storage.foldername(name))[1]);

create policy "Users can delete own gallery"
  on storage.objects for delete
  using (bucket_id = 'user-gallery' and auth.uid()::text = (storage.foldername(name))[1]);

create policy "Public read access for user-gallery"
  on storage.objects for select
  using (bucket_id = 'user-gallery');
```

---

## Part 2: Zod Validation Schemas

**File to modify:** `lib/validation/schemas.ts`

Add these schemas:

```ts
// ── Profile Photos ───────────────────────────────────────────────────────────
export const userPhotoSchema = z.object({
  photo_url: z.string().url(),
  sort_order: z.number().int().min(0).max(20),
})

export const reorderPhotosSchema = z.object({
  photo_ids: z.array(z.string().uuid()).min(1).max(9),
})

// ── User Gallery ─────────────────────────────────────────────────────────────
export const userGallerySchema = z.object({
  image_url: z.string().url(),
  caption: z.string().max(300).optional(),
  yacht_id: z.string().uuid().optional().nullable(),
  sort_order: z.number().int().min(0).max(50),
})

export const reorderGallerySchema = z.object({
  item_ids: z.array(z.string().uuid()).min(1).max(30),
})

// ── Saved Profiles ───────────────────────────────────────────────────────────
export const saveProfileSchema = z.object({
  saved_user_id: z.string().uuid(),
  folder_id: z.string().uuid().optional().nullable(),
})

export const moveToFolderSchema = z.object({
  folder_id: z.string().uuid().nullable(), // null = move to "All"
})

// ── Profile Folders ──────────────────────────────────────────────────────────
export const profileFolderSchema = z.object({
  name: z.string().min(1).max(50).trim(),
  emoji: z.string().max(10).optional(),
})

// ── Hobbies ──────────────────────────────────────────────────────────────────
export const userHobbySchema = z.object({
  name: z.string().min(1).max(100).trim(),
  emoji: z.string().max(10).optional(),
})

export const bulkHobbiesSchema = z.object({
  hobbies: z.array(z.object({
    name: z.string().min(1).max(100).trim(),
    emoji: z.string().max(10).optional(),
  })).min(0).max(10),
})

// ── Education ────────────────────────────────────────────────────────────────
export const userEducationSchema = z.object({
  institution: z.string().min(1).max(200).trim(),
  qualification: z.string().max(200).trim().optional(),
  field_of_study: z.string().max(200).trim().optional(),
  started_at: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().nullable(),
  ended_at: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().nullable(),
})

// ── Skills ───────────────────────────────────────────────────────────────────
export const userSkillSchema = z.object({
  name: z.string().min(1).max(100).trim(),
  category: z.enum(['technical', 'certifiable', 'language', 'software', 'other']).optional(),
})

export const bulkSkillsSchema = z.object({
  skills: z.array(z.object({
    name: z.string().min(1).max(100).trim(),
    category: z.enum(['technical', 'certifiable', 'language', 'software', 'other']).optional(),
  })).min(0).max(20),
})

// ── Social Links ─────────────────────────────────────────────────────────────
const socialPlatform = z.enum(['instagram', 'linkedin', 'tiktok', 'youtube', 'x', 'facebook', 'website'])

export const socialLinkSchema = z.object({
  platform: socialPlatform,
  url: z.string().url(),
})

export const socialLinksSchema = z.object({
  links: z.array(socialLinkSchema).max(7),
})

// ── Section Visibility ───────────────────────────────────────────────────────
const sectionKey = z.enum(['about', 'experience', 'endorsements', 'certifications', 'hobbies', 'education', 'skills', 'photos', 'gallery'])

export const sectionVisibilitySchema = z.object({
  section: sectionKey,
  visible: z.boolean(),
})

// ── AI Summary ───────────────────────────────────────────────────────────────
export const aiSummaryEditSchema = z.object({
  summary: z.string().min(10).max(500).trim(),
})
```

---

## Part 3: API Routes

### 3a. User Photos — `app/api/user-photos/route.ts`

**GET** — List user's photos
- Auth required
- Returns: `user_photos[]` ordered by `sort_order`

**POST** — Upload photo record (after client uploads to Supabase Storage)
- Auth required
- Body: `userPhotoSchema`
- Limit check: Free = 6, Pro = 9. Return 403 if at limit.
- PostHog: `photo.uploaded`

**PUT** — Reorder photos
- Auth required
- Body: `reorderPhotosSchema`
- Updates `sort_order` for each photo ID in the array order
- If first photo changed: update `users.profile_photo_url` to match the new first photo's URL

**DELETE** — `app/api/user-photos/[id]/route.ts`
- Auth required, verify ownership
- Delete storage object + DB row
- If deleted photo was first (sort_order = 0): update `users.profile_photo_url` to next photo or null

### 3b. User Gallery — `app/api/user-gallery/route.ts`

Same pattern as user-photos. Differences:
- Limit: Free = 12, Pro = 30
- Body includes `caption` and `yacht_id` fields
- Storage bucket: `user-gallery`
- PostHog: `gallery.uploaded`

**Additional route:** `app/api/user-gallery/[id]/route.ts` for PUT (update caption/yacht) and DELETE

### 3c. Saved Profiles — `app/api/saved-profiles/route.ts`

**GET** — List saved profiles
- Auth required
- Query params: `folder_id` (optional, filter by folder), `page` (default 1), `limit` (default 20)
- Join to `users` table for display_name, profile_photo_url, primary_role, handle
- Returns: `{ results: SavedProfile[], total: number, page: number, pages: number }`

**POST** — Save a profile
- Auth required
- Body: `saveProfileSchema`
- Upsert on unique(user_id, saved_user_id) — if already saved, update folder_id
- PostHog: `profile.saved`

**DELETE** — `app/api/saved-profiles/[id]/route.ts`
- Auth required, verify ownership
- PostHog: `profile.unsaved`

**PATCH** — `app/api/saved-profiles/[id]/route.ts`
- Auth required
- Body: `moveToFolderSchema`
- Updates `folder_id`

### 3d. Profile Folders — `app/api/profile-folders/route.ts`

**GET** — List user's folders
- Auth required
- Returns: `profile_folders[]` with count of saved profiles per folder

**POST** — Create folder
- Auth required
- Body: `profileFolderSchema`
- Max 20 folders per user

**PATCH** — `app/api/profile-folders/[id]/route.ts`
- Auth required
- Body: `profileFolderSchema`

**DELETE** — `app/api/profile-folders/[id]/route.ts`
- Auth required
- On delete: saved_profiles.folder_id → null (handled by ON DELETE SET NULL)

### 3e. Hobbies — `app/api/user-hobbies/route.ts`

**GET** — List user's hobbies (by user_id query param for public, or auth for own)
- Returns: `user_hobbies[]` ordered by `sort_order`

**PUT** — Bulk replace hobbies (replaces all hobbies for the user)
- Auth required
- Body: `bulkHobbiesSchema`
- Delete all existing hobbies, insert new ones with sort_order from array index
- PostHog: `hobbies.updated`

### 3f. Education — `app/api/user-education/route.ts`

**GET** — List user's education (by user_id query param or auth)
- Returns: `user_education[]` ordered by `ended_at desc nulls first`

**POST** — Add education entry
- Auth required
- Body: `userEducationSchema`
- Max 10 entries per user
- PostHog: `education.added`

**PATCH** — `app/api/user-education/[id]/route.ts`
- Auth required
- Body: `userEducationSchema`

**DELETE** — `app/api/user-education/[id]/route.ts`
- Auth required

### 3g. Skills — `app/api/user-skills/route.ts`

**GET** — List user's skills
- Returns: `user_skills[]` ordered by `category, sort_order`

**PUT** — Bulk replace skills
- Auth required
- Body: `bulkSkillsSchema`
- Delete all, insert new with sort_order from array index
- PostHog: `skills.updated`

### 3h. Social Links — `app/api/profile/social-links/route.ts`

**PUT** — Update social links
- Auth required
- Body: `socialLinksSchema`
- Validates each URL matches expected platform domain:
  - instagram: must contain `instagram.com`
  - linkedin: must contain `linkedin.com`
  - tiktok: must contain `tiktok.com`
  - youtube: must contain `youtube.com` or `youtu.be`
  - x: must contain `x.com` or `twitter.com`
  - facebook: must contain `facebook.com`
  - website: any valid URL
- Updates `users.social_links` JSONB column
- PostHog: `social_links.updated`

### 3i. Section Visibility — `app/api/profile/section-visibility/route.ts`

**PATCH** — Toggle a section's visibility
- Auth required
- Body: `sectionVisibilitySchema`
- Reads current `section_visibility` JSONB, updates the key, writes back
- PostHog: `section_visibility.toggled` with `{ section, visible }`

### 3j. AI Summary — `app/api/profile/ai-summary/route.ts`

**POST** — Generate AI summary
- Auth required
- Rate limit: 5/hour
- Gathers: bio, top 3 endorsement excerpts, primary_role, sea time (via `get_sea_time` RPC)
- Calls GPT-4o-mini with prompt:

```
You are writing a 2-3 sentence professional summary for a yacht crew member's profile.

Name: {display_name}
Role: {primary_role}
Sea time: {years}y {months}m on {yacht_count} yachts
Bio: {bio}
Top endorsements: {excerpts}

Write a warm, professional summary in third person. Do not mention AI.
Do not use exclamation marks. Keep it under 300 characters.
```

- Saves result to `users.ai_summary`, sets `ai_summary_edited = false`
- PostHog: `ai_summary.generated`

**PUT** — Save user-edited summary
- Auth required
- Body: `aiSummaryEditSchema`
- Updates `users.ai_summary` and sets `users.ai_summary_edited = true`
- PostHog: `ai_summary.edited`

---

## Part 4: Updated Profile Queries

**File to modify:** `lib/queries/profile.ts`

### Add to `getUserById` select:
```
ai_summary, ai_summary_edited, section_visibility, social_links
```

### Add to `getUserByHandle` select:
```
ai_summary, section_visibility, social_links,
subscription_status, founding_member
```

### New function: `getProfileSectionsExtended`
```ts
export async function getProfileSectionsExtended(userId: string) {
  const supabase = await createClient()
  const [attRes, certRes, endRes, photoRes, galleryRes, hobbyRes, eduRes, skillRes, seaTimeRes] = await Promise.all([
    supabase
      .from('attachments')
      .select('id, role_label, started_at, ended_at, yachts(id, name, yacht_type, flag_state, length_meters)')
      .eq('user_id', userId)
      .is('deleted_at', null)
      .order('started_at', { ascending: false }),
    supabase
      .from('certifications')
      .select('id, custom_cert_name, issued_at, expires_at, document_url, certification_types(name, short_name, category)')
      .eq('user_id', userId)
      .order('created_at', { ascending: false }),
    supabase
      .from('endorsements')
      .select('id, content, created_at, yacht_id, endorser:endorser_id(id, display_name, full_name, handle, profile_photo_url), yachts(name)')
      .eq('recipient_id', userId)
      .is('deleted_at', null)
      .order('created_at', { ascending: false }),
    supabase
      .from('user_photos')
      .select('id, photo_url, sort_order')
      .eq('user_id', userId)
      .order('sort_order', { ascending: true }),
    supabase
      .from('user_gallery')
      .select('id, image_url, caption, yacht_id, sort_order, yachts(name)')
      .eq('user_id', userId)
      .order('sort_order', { ascending: true }),
    supabase
      .from('user_hobbies')
      .select('id, name, emoji, sort_order')
      .eq('user_id', userId)
      .order('sort_order', { ascending: true }),
    supabase
      .from('user_education')
      .select('id, institution, qualification, field_of_study, started_at, ended_at')
      .eq('user_id', userId)
      .order('ended_at', { ascending: false, nullsFirst: true }),
    supabase
      .from('user_skills')
      .select('id, name, category, sort_order')
      .eq('user_id', userId)
      .order('category', { ascending: true })
      .order('sort_order', { ascending: true }),
    supabase.rpc('get_sea_time', { p_user_id: userId }),
  ])

  return {
    attachments: attRes.data ?? [],
    certifications: certRes.data ?? [],
    endorsements: endRes.data ?? [],
    photos: photoRes.data ?? [],
    gallery: galleryRes.data ?? [],
    hobbies: hobbyRes.data ?? [],
    education: eduRes.data ?? [],
    skills: skillRes.data ?? [],
    seaTime: seaTimeRes.data as { total_days: number; yacht_count: number } | null,
  }
}
```

### New function: `isSavedProfile`
```ts
export async function isSavedProfile(userId: string, targetUserId: string) {
  const supabase = await createClient()
  const { data } = await supabase
    .from('saved_profiles')
    .select('id, folder_id')
    .eq('user_id', userId)
    .eq('saved_user_id', targetUserId)
    .maybeSingle()
  return data
}
```

---

## Part 5: Core UI Components

### 5a. ProfileAccordion — `components/profile/ProfileAccordion.tsx`

```tsx
'use client'

import { useState, type ReactNode } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronRight } from 'lucide-react'

interface ProfileAccordionProps {
  title: string
  summary: string           // e.g. "4y 9m · 5 yachts"
  children: ReactNode       // expanded content
  defaultOpen?: boolean
  editHref?: string         // show edit button if provided (own profile only)
  sectionColor?: 'teal' | 'coral' | 'navy' | 'amber'  // optional accent
}

export function ProfileAccordion({
  title,
  summary,
  children,
  defaultOpen = false,
  editHref,
  sectionColor,
}: ProfileAccordionProps) {
  const [open, setOpen] = useState(defaultOpen)

  return (
    <div className="bg-[var(--color-surface)] rounded-2xl shadow-sm overflow-hidden">
      <button
        onClick={() => setOpen(v => !v)}
        className="w-full flex items-center justify-between p-4 text-left hover:bg-[var(--color-surface-raised)] transition-colors"
        aria-expanded={open}
      >
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-base text-[var(--color-text-primary)]">
            {title}
          </h3>
          <p className="text-sm text-[var(--color-text-secondary)] truncate mt-0.5">
            {summary}
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0 ml-3">
          {editHref && (
            <a
              href={editHref}
              onClick={e => e.stopPropagation()}
              className="text-xs text-[var(--color-interactive)] hover:underline"
            >
              Edit
            </a>
          )}
          <motion.div
            animate={{ rotate: open ? 90 : 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
          >
            <ChevronRight className="w-4 h-4 text-[var(--color-text-tertiary)]" />
          </motion.div>
        </div>
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4">
              {children}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
```

### 5b. PhotoGallery — `components/profile/PhotoGallery.tsx`

```tsx
'use client'

import { useState, useRef, useCallback } from 'react'
import Image from 'next/image'
import { motion, useMotionValue, useTransform, animate } from 'framer-motion'

interface Photo {
  id: string
  photo_url: string
  sort_order: number
}

interface PhotoGalleryProps {
  photos: Photo[]
  profilePhotoUrl?: string | null  // fallback if no user_photos
  displayName: string
  editable?: boolean               // show "+" button for own profile
}

export function PhotoGallery({ photos, profilePhotoUrl, displayName, editable }: PhotoGalleryProps) {
  // Build photo list: user_photos if any, else fallback to profile_photo_url
  const allPhotos = photos.length > 0
    ? photos
    : profilePhotoUrl
      ? [{ id: 'main', photo_url: profilePhotoUrl, sort_order: 0 }]
      : []

  const [currentIndex, setCurrentIndex] = useState(0)
  const containerRef = useRef<HTMLDivElement>(null)

  // Swipe handling via touch events
  const touchStartX = useRef(0)
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX
  }, [])

  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    const diff = touchStartX.current - e.changedTouches[0].clientX
    if (Math.abs(diff) > 50) {
      if (diff > 0 && currentIndex < allPhotos.length - 1) {
        setCurrentIndex(i => i + 1)
      } else if (diff < 0 && currentIndex > 0) {
        setCurrentIndex(i => i - 1)
      }
    }
  }, [currentIndex, allPhotos.length])

  if (allPhotos.length === 0) {
    // No photos: show placeholder
    return (
      <div className="w-full h-[65vh] bg-[var(--color-surface-raised)] flex items-center justify-center">
        <div className="text-center">
          <div className="w-24 h-24 rounded-full bg-[var(--color-surface-overlay)] flex items-center justify-center mx-auto mb-3">
            <span className="text-4xl text-[var(--color-text-secondary)]">
              {displayName.charAt(0).toUpperCase()}
            </span>
          </div>
          {editable && (
            <a href="/app/profile/photos" className="text-sm text-[var(--color-interactive)] hover:underline">
              Add photos
            </a>
          )}
        </div>
      </div>
    )
  }

  return (
    <div
      ref={containerRef}
      className="relative w-full h-[65vh] overflow-hidden"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* Photo slides */}
      <motion.div
        className="flex h-full"
        animate={{ x: `-${currentIndex * 100}%` }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      >
        {allPhotos.map((photo, i) => (
          <div key={photo.id} className="w-full h-full shrink-0 relative">
            <Image
              src={photo.photo_url}
              alt={`${displayName} photo ${i + 1}`}
              fill
              className="object-cover"
              sizes="100vw"
              priority={i === 0}
              unoptimized
            />
          </div>
        ))}
      </motion.div>

      {/* Dot indicators */}
      {allPhotos.length > 1 && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1.5">
          {allPhotos.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrentIndex(i)}
              className={`w-2 h-2 rounded-full transition-colors ${
                i === currentIndex ? 'bg-white' : 'bg-white/50'
              }`}
              aria-label={`Photo ${i + 1}`}
            />
          ))}
        </div>
      )}

      {/* Desktop arrows */}
      {allPhotos.length > 1 && (
        <>
          {currentIndex > 0 && (
            <button
              onClick={() => setCurrentIndex(i => i - 1)}
              className="hidden md:flex absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/30 hover:bg-black/50 text-white items-center justify-center"
              aria-label="Previous photo"
            >
              ‹
            </button>
          )}
          {currentIndex < allPhotos.length - 1 && (
            <button
              onClick={() => setCurrentIndex(i => i + 1)}
              className="hidden md:flex absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/30 hover:bg-black/50 text-white items-center justify-center"
              aria-label="Next photo"
            >
              ›
            </button>
          )}
        </>
      )}

      {/* Editable overlay */}
      {editable && (
        <a
          href="/app/profile/photos"
          className="absolute bottom-4 right-4 bg-black/50 hover:bg-black/70 text-white text-xs px-3 py-1.5 rounded-full transition-colors"
        >
          {allPhotos.length === 0 ? 'Add photos' : `${allPhotos.length} photos · Edit`}
        </a>
      )}
    </div>
  )
}
```

### 5c. SocialLinksRow — `components/profile/SocialLinksRow.tsx`

```tsx
import { Globe, Instagram, Linkedin, Youtube, Facebook } from 'lucide-react'

interface SocialLink {
  platform: string
  url: string
}

interface SocialLinksRowProps {
  links: SocialLink[]
}

const platformConfig: Record<string, { icon: typeof Globe; hoverColor: string; label: string }> = {
  instagram:  { icon: Instagram, hoverColor: 'hover:text-[#E4405F]', label: 'Instagram' },
  linkedin:   { icon: Linkedin,  hoverColor: 'hover:text-[#0A66C2]', label: 'LinkedIn' },
  youtube:    { icon: Youtube,   hoverColor: 'hover:text-[#FF0000]', label: 'YouTube' },
  facebook:   { icon: Facebook,  hoverColor: 'hover:text-[#1877F2]', label: 'Facebook' },
  website:    { icon: Globe,     hoverColor: 'hover:text-[var(--color-interactive)]', label: 'Website' },
  // TikTok and X don't have lucide icons — use custom SVGs or fallback to Globe
  tiktok:     { icon: Globe,     hoverColor: 'hover:text-[#000000]', label: 'TikTok' },
  x:          { icon: Globe,     hoverColor: 'hover:text-[#000000]', label: 'X' },
}

export function SocialLinksRow({ links }: SocialLinksRowProps) {
  if (!links || links.length === 0) return null

  return (
    <div className="flex items-center gap-3">
      {links.map(link => {
        const config = platformConfig[link.platform] ?? platformConfig.website
        const Icon = config.icon
        return (
          <a
            key={link.platform}
            href={link.url}
            target="_blank"
            rel="noopener noreferrer"
            className={`text-[var(--color-text-tertiary)] transition-colors ${config.hoverColor}`}
            aria-label={config.label}
          >
            <Icon className="w-5 h-5" />
          </a>
        )
      })}
    </div>
  )
}
```

### 5d. SectionManager — `components/profile/SectionManager.tsx`

```tsx
'use client'

import { useState, useOptimistic } from 'react'
import Link from 'next/link'

interface SectionConfig {
  key: string
  label: string
  hasData: boolean
  editHref?: string
  addHref?: string
}

interface SectionManagerProps {
  visibility: Record<string, boolean>
  sections: SectionConfig[]
}

export function SectionManager({ visibility, sections }: SectionManagerProps) {
  const [vis, setVis] = useState(visibility)

  async function toggleSection(sectionKey: string, visible: boolean) {
    // Optimistic update
    setVis(prev => ({ ...prev, [sectionKey]: visible }))

    // API call
    await fetch('/api/profile/section-visibility', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ section: sectionKey, visible }),
    })
  }

  return (
    <div className="bg-[var(--color-surface)] rounded-2xl p-4 shadow-sm">
      <h3 className="font-semibold text-sm text-[var(--color-text-primary)] mb-3">
        Profile sections
      </h3>
      <p className="text-xs text-[var(--color-text-secondary)] mb-4">
        Toggle which sections show on your public profile
      </p>

      <div className="flex flex-col gap-2">
        {sections.map(section => (
          <div key={section.key} className="flex items-center justify-between py-1.5">
            <label className="flex items-center gap-3 flex-1 cursor-pointer">
              <input
                type="checkbox"
                checked={vis[section.key] ?? true}
                onChange={e => toggleSection(section.key, e.target.checked)}
                className="w-4 h-4 rounded border-[var(--color-border)] text-[var(--color-interactive)] focus:ring-[var(--color-interactive)]"
              />
              <span className={`text-sm ${section.hasData ? 'text-[var(--color-text-primary)]' : 'text-[var(--color-text-tertiary)]'}`}>
                {section.label}
              </span>
            </label>

            {section.hasData && section.editHref && (
              <Link href={section.editHref} className="text-xs text-[var(--color-interactive)] hover:underline">
                Edit
              </Link>
            )}
            {!section.hasData && section.addHref && (
              <Link href={section.addHref} className="text-xs text-[var(--color-interactive)] hover:underline">
                Add
              </Link>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
```

### 5e. SaveProfileButton — `components/profile/SaveProfileButton.tsx`

```tsx
'use client'

import { useState } from 'react'
import { Bookmark, BookmarkCheck } from 'lucide-react'
import { useToast } from '@/components/ui/Toast'

interface SaveProfileButtonProps {
  targetUserId: string
  initialSaved: boolean
  initialSaveId?: string | null
}

export function SaveProfileButton({ targetUserId, initialSaved, initialSaveId }: SaveProfileButtonProps) {
  const [saved, setSaved] = useState(initialSaved)
  const [saveId, setSaveId] = useState(initialSaveId)
  const { toast } = useToast()

  async function toggleSave() {
    if (saved && saveId) {
      // Unsave
      setSaved(false)
      const res = await fetch(`/api/saved-profiles/${saveId}`, { method: 'DELETE' })
      if (!res.ok) {
        setSaved(true) // revert
        toast({ type: 'error', message: 'Failed to unsave profile' })
      }
    } else {
      // Save
      setSaved(true)
      const res = await fetch('/api/saved-profiles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ saved_user_id: targetUserId }),
      })
      if (res.ok) {
        const data = await res.json()
        setSaveId(data.id)
        toast({ type: 'success', message: 'Profile saved' })
      } else {
        setSaved(false) // revert
        toast({ type: 'error', message: 'Failed to save profile' })
      }
    }
  }

  const Icon = saved ? BookmarkCheck : Bookmark

  return (
    <button
      onClick={toggleSave}
      className={`p-2 rounded-full transition-colors ${
        saved
          ? 'text-[var(--color-interactive)] bg-[var(--color-interactive)]/10'
          : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-surface-raised)]'
      }`}
      aria-pressed={saved}
      aria-label={saved ? 'Unsave profile' : 'Save profile'}
    >
      <Icon className="w-5 h-5" />
    </button>
  )
}
```

### 5f. ProfileStrength — `components/profile/ProfileStrength.tsx`

Replaces WheelACard. Same ProgressWheel component but with new labels.

```tsx
'use client'

import Link from 'next/link'
import { ProgressWheel } from '@/components/ui/ProgressWheel'

interface ProfileStrengthProps {
  milestones: {
    roleSet: boolean
    hasYacht: boolean
    bioSet: boolean
    hasCert: boolean
    hasPhoto: boolean
    hasHobbies: boolean
    hasEducation: boolean
    hasSkills: boolean
    hasGallery: boolean
    hasSocialLinks: boolean
  }
  nextAction?: { label: string; href: string } | null
}

function getStrengthLabel(pct: number): string {
  if (pct <= 30) return 'Getting started'
  if (pct <= 60) return 'Looking good'
  if (pct <= 85) return 'Standing out'
  return 'All squared away'
}

export function ProfileStrength({ milestones, nextAction }: ProfileStrengthProps) {
  const completed = Object.values(milestones).filter(Boolean).length
  const total = Object.keys(milestones).length
  const pct = Math.round((completed / total) * 100)
  const label = getStrengthLabel(pct)

  return (
    <div className="bg-[var(--color-surface)] rounded-2xl p-4 shadow-sm flex items-center gap-4">
      <ProgressWheel percentage={pct} size={56} />
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-sm text-[var(--color-text-primary)]">
          {label}
        </p>
        <p className="text-xs text-[var(--color-text-secondary)]">
          Profile strength {pct}%
        </p>
        {nextAction && (
          <Link
            href={nextAction.href}
            className="text-xs text-[var(--color-interactive)] hover:underline mt-1 inline-block"
          >
            {nextAction.label} →
          </Link>
        )}
      </div>
    </div>
  )
}
```

### 5g. Summary Line Computation — `lib/profile-summaries.ts`

```ts
export function computeSeaTimeSummary(totalDays: number, yachtCount: number): string {
  const years = Math.floor(totalDays / 365)
  const months = Math.floor((totalDays % 365) / 30)
  const parts: string[] = []
  if (years > 0) parts.push(`${years}y`)
  if (months > 0) parts.push(`${months}m`)
  if (parts.length === 0) parts.push('< 1m')
  return `${parts.join(' ')} sea time · ${yachtCount} yacht${yachtCount !== 1 ? 's' : ''}`
}

export function computeEndorsementSummary(
  totalCount: number,
  mutualCount: number
): string {
  let s = `${totalCount} endorsement${totalCount !== 1 ? 's' : ''}`
  if (mutualCount > 0) {
    s += ` · ${mutualCount} from people you know`
  }
  return s
}

export function computeCertSummary(
  totalCount: number,
  expiringCount: number
): string {
  let s = `${totalCount} cert${totalCount !== 1 ? 's' : ''}`
  if (expiringCount > 0) {
    s += ` · ${expiringCount} expiring soon`
  }
  return s
}

export function computeAboutSummary(
  aiSummary: string | null,
  bio: string | null
): string {
  const text = aiSummary || bio || ''
  if (text.length <= 80) return text
  return text.slice(0, 80).trimEnd() + '…'
}

export function computeEducationSummary(
  education: Array<{ qualification?: string | null; institution: string }>
): string {
  if (education.length === 0) return ''
  const latest = education[0]
  return [latest.qualification, latest.institution].filter(Boolean).join(', ')
}

export function computeHobbiesSummary(
  hobbies: Array<{ name: string; emoji?: string | null }>
): string {
  return hobbies.slice(0, 3).map(h => h.emoji ? `${h.emoji} ${h.name}` : h.name).join(' · ')
}

export function computeSkillsSummary(
  skills: Array<{ name: string }>
): string {
  return skills.slice(0, 3).map(s => s.name).join(' · ')
}
```

---

## Part 6: Public Profile Page Rewrite

**File:** `app/(public)/u/[handle]/page.tsx`

The server component needs to:
1. Fetch profile via `getUserByHandle`
2. Fetch all sections via `getProfileSectionsExtended`
3. If viewer is logged in: check `isSavedProfile` and compute mutual colleagues
4. Pass all data to `PublicProfileContent`

**File:** `components/public/PublicProfileContent.tsx`

Full rewrite. New structure:
1. `PhotoGallery` — hero section (65vh on mobile)
2. Identity block — name, role, departments, location, social links, connection badges
3. Accordion sections (only rendered if `section_visibility[key] === true` AND section has data):
   - About (with AI summary)
   - Experience (with sea time summary)
   - Endorsements (with mutual colleague count)
   - Certifications (with expiry count)
   - Education
   - Hobbies
   - Skills
   - Gallery (work portfolio)
4. Bottom CTAs — Share, Request Endorsement
5. `SaveProfileButton` in sticky header

**Hidden sections logic:**
```ts
function shouldShowSection(
  sectionKey: string,
  visibility: Record<string, boolean>,
  hasData: boolean
): boolean {
  return visibility[sectionKey] !== false && hasData
}
```

**Desktop layout (≥768px):**
- CSS Grid: `grid-cols-[40%_1fr]`
- Left column: PhotoGallery, sticky
- Right column: scrollable content (identity + accordions)

---

## Part 7: Own Profile Page Rewrite

**File:** `app/(protected)/app/profile/page.tsx`

Replace current flat `ProfileCardList` with:
1. `PhotoGallery` with `editable={true}`
2. Identity block with edit links
3. `ProfileStrength` (replaces WheelACard)
4. Uplift prompt card (single, dismissible, most impactful first)
5. `SectionManager` — toggle visibility per section
6. Accordion sections with `editHref` prop on each

**Uplift prompt logic:**
```ts
function getNextUplift(profile, sections): { message: string; href: string } | null {
  if (!profile.profile_photo_url && sections.photos.length === 0)
    return { message: 'Add a photo to make it yours', href: '/app/profile/photos' }
  if (profile.ai_summary && !profile.ai_summary_edited)
    return { message: 'Your summary is ready — want to tweak it?', href: '/app/about/edit' }
  if (sections.hobbies.length === 0)
    return { message: 'Show your personality — add hobbies', href: '/app/hobbies/edit' }
  if (sections.endorsements.length === 0 && sections.attachments.length > 0)
    return { message: 'Request endorsements from shipmates', href: '/app/endorsement/request' }
  if (sections.photos.length <= 1 && profile.profile_photo_url)
    return { message: 'Add more photos to stand out', href: '/app/profile/photos' }
  return null
}
```

---

## Part 8: New Edit Pages

### 8a. Photo Gallery Manager — `app/(protected)/app/profile/photos/page.tsx`
- 3-column grid of thumbnails
- First photo marked with star (= profile photo)
- "+" button to add (triggers file input → upload to Supabase Storage `user-photos/{userId}/{uuid}.webp` → POST `/api/user-photos`)
- Drag-to-reorder (use `@hello-pangea/dnd` — already in similar pattern as cert manager)
- Long-press → delete confirmation
- Limit display: "3 of 6 photos" (or "3 of 9" for Pro)

### 8b. Work Gallery Manager — `app/(protected)/app/profile/gallery/page.tsx`
- Same 3-column grid but each item has caption + optional yacht link
- Tap to edit caption/yacht (bottom sheet)
- "+" to add photo with caption
- Limit: "8 of 12" (or "8 of 30" for Pro)

### 8c. Hobbies Editor — `app/(protected)/app/hobbies/edit/page.tsx`
- Pill input: text field + Enter to add pill
- Each pill: name + optional emoji + X to remove
- On save: PUT `/api/user-hobbies` with full array (bulk replace)
- Max 10 hobbies

### 8d. Education Editor — `app/(protected)/app/education/new/page.tsx` + `[id]/edit/page.tsx`
- Form fields: Institution (required), Qualification, Field of study, Start date, End date
- Save: POST or PATCH `/api/user-education`
- List view: most recent first, tap to edit, swipe to delete

### 8e. Skills Editor — `app/(protected)/app/skills/edit/page.tsx`
- Pill input with category dropdown (Technical, Certifiable, Language, Software, Other)
- On save: PUT `/api/user-skills` with full array (bulk replace)
- Max 20 skills

### 8f. Social Links Editor — in `app/(protected)/app/more/account/page.tsx` (add section)
- List of current links with platform icon + URL
- "Add link" button → dropdown picks platform → URL input
- Validate URL matches platform domain
- On save: PUT `/api/profile/social-links`

---

## Files to Create

```
supabase/migrations/20260317000021_sprint10_profile_robustness.sql
lib/validation/schemas.ts                     (add schemas — see Part 2)
lib/queries/profile.ts                        (add functions — see Part 4)
lib/profile-summaries.ts                      (new — see Part 5g)

components/profile/ProfileAccordion.tsx        (new — see Part 5a)
components/profile/PhotoGallery.tsx            (new — see Part 5b)
components/profile/SocialLinksRow.tsx          (new — see Part 5c)
components/profile/SectionManager.tsx          (new — see Part 5d)
components/profile/SaveProfileButton.tsx       (new — see Part 5e)
components/profile/ProfileStrength.tsx         (new — see Part 5f)

app/api/user-photos/route.ts                  (new — GET, POST, PUT)
app/api/user-photos/[id]/route.ts             (new — DELETE)
app/api/user-gallery/route.ts                 (new — GET, POST, PUT)
app/api/user-gallery/[id]/route.ts            (new — PUT, DELETE)
app/api/saved-profiles/route.ts               (new — GET, POST)
app/api/saved-profiles/[id]/route.ts          (new — PATCH, DELETE)
app/api/profile-folders/route.ts              (new — GET, POST)
app/api/profile-folders/[id]/route.ts         (new — PATCH, DELETE)
app/api/user-hobbies/route.ts                 (new — GET, PUT)
app/api/user-education/route.ts               (new — GET, POST)
app/api/user-education/[id]/route.ts          (new — PATCH, DELETE)
app/api/user-skills/route.ts                  (new — GET, PUT)
app/api/profile/social-links/route.ts         (new — PUT)
app/api/profile/section-visibility/route.ts   (new — PATCH)
app/api/profile/ai-summary/route.ts           (new — POST, PUT)

app/(protected)/app/profile/photos/page.tsx   (new)
app/(protected)/app/profile/gallery/page.tsx  (new)
app/(protected)/app/hobbies/edit/page.tsx      (new)
app/(protected)/app/education/new/page.tsx     (new)
app/(protected)/app/education/[id]/edit/page.tsx (new)
app/(protected)/app/skills/edit/page.tsx       (new)
```

## Files to Modify

```
lib/validation/schemas.ts                      (add new schemas)
lib/queries/profile.ts                         (add new query functions, extend selects)
app/(public)/u/[handle]/page.tsx               (rewrite — accordion layout)
components/public/PublicProfileContent.tsx      (rewrite — accordion layout)
app/(protected)/app/profile/page.tsx           (rewrite — section manager, strength, uplift)
app/(protected)/app/more/account/page.tsx      (add social links section)
components/nav/BottomTabBar.tsx                 (no changes needed)
yl_style_guide.md                              (already updated)
CHANGELOG.md                                   (update before commit)
```

---

## Decision Log

| ID | Decision | Rationale |
|----|----------|-----------|
| D-030 | Photos stored in separate `user_photos` table, not JSONB on users | Enables RLS per-photo, easy sort/delete, storage cleanup |
| D-031 | Work gallery separate from profile photos | Different purpose (personal vs professional), different limits, captions only on gallery |
| D-032 | Section visibility as JSONB on users, not separate table | Single column, no joins, simple read/write, flexible for new sections |
| D-033 | Social links as JSONB on users | Flexible for new platforms, no migration needed, max 7 links |
| D-034 | Hobbies/skills use bulk replace (PUT) not individual CRUD | Simpler client logic, no out-of-sync issues, small data sets |
| D-035 | AI summary stored on users table, not computed on every view | Cached result, only regenerated on data changes, user can edit |
| D-036 | Profile Strength labels instead of completion % | "Looking good" at 60% feels encouraging, "40% complete" feels discouraging |
| D-037 | Empty sections hidden by default on public profile | Clean presentation, no visual noise, user can override |

---

## Build Order

1. **Database migration** — run the SQL, create storage buckets, verify tables exist
2. **Zod schemas** — add to `lib/validation/schemas.ts`
3. **Profile queries** — extend `getUserById`, `getUserByHandle`, add `getProfileSectionsExtended`
4. **Summary helpers** — create `lib/profile-summaries.ts`
5. **Core components** — ProfileAccordion, PhotoGallery, SocialLinksRow, SectionManager, SaveProfileButton, ProfileStrength
6. **API routes** — all 15 endpoints (follow existing patterns: auth → rate limit → validate → logic → PostHog)
7. **Public profile rewrite** — `/u/[handle]` page + `PublicProfileContent`
8. **Own profile rewrite** — `/app/profile` page with section manager + strength + uplift
9. **Edit pages** — photos, gallery, hobbies, education, skills, social links
10. **AI summary** — generation endpoint + integration in About section
11. **Save/bookmark** — button component + saved profiles page + folders + Network tab
12. **Polish** — animations, dark mode, accessibility, empty states, skeleton loading

---

## Success Criteria

- [ ] Profile photos display as full-width swipeable hero (65vh mobile)
- [ ] Multiple photos upload, reorder, and delete correctly
- [ ] All profile sections are collapsible accordions with computed summary lines
- [ ] Sea time computes correctly from attachment date ranges
- [ ] Endorsement summary shows mutual colleague count for logged-in viewers
- [ ] Cert summary shows expiring count
- [ ] Empty sections are invisible on public profile
- [ ] Section visibility toggles work (optimistic update + API)
- [ ] Social links display as icon row, only filled platforms shown
- [ ] Social link URLs validate against platform domains
- [ ] Hobbies, education, skills sections display and edit correctly
- [ ] Work gallery displays in 3-column masonry with lightbox
- [ ] AI summary generates from bio + experience + endorsements
- [ ] AI summary is editable, stops auto-regen after manual edit
- [ ] Save/bookmark profiles with toast confirmation
- [ ] Folders create, rename, delete; profiles move between folders
- [ ] "Saved" tab appears in Network page
- [ ] Profile Strength shows "Getting started" / "Looking good" / "Standing out" / "All squared away"
- [ ] Uplift prompts appear one at a time after CV parse or on profile view
- [ ] Desktop layout: photo left 40% sticky, content right 60% scrolling
- [ ] Dark mode works on all new components
- [ ] All new API routes have Zod validation and rate limiting
- [ ] All user-generated text passes content moderation where applicable
- [ ] PostHog events fire for all key actions
- [ ] No TypeScript errors (`npm run build` passes)

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


-- ═══════════════════════════════════════════════════════════
-- 10. STORAGE BUCKET POLICIES
-- (Buckets must be created via dashboard first: user-photos, user-gallery)
-- ═══════════════════════════════════════════════════════════

-- user-photos bucket
create policy "Users can upload own photos"
  on storage.objects for insert
  with check (bucket_id = 'user-photos' and auth.uid()::text = (storage.foldername(name))[1]);

create policy "Users can delete own photos from storage"
  on storage.objects for delete
  using (bucket_id = 'user-photos' and auth.uid()::text = (storage.foldername(name))[1]);

create policy "Public read access for user-photos"
  on storage.objects for select
  using (bucket_id = 'user-photos');

-- user-gallery bucket
create policy "Users can upload own gallery"
  on storage.objects for insert
  with check (bucket_id = 'user-gallery' and auth.uid()::text = (storage.foldername(name))[1]);

create policy "Users can delete own gallery from storage"
  on storage.objects for delete
  using (bucket_id = 'user-gallery' and auth.uid()::text = (storage.foldername(name))[1]);

create policy "Public read access for user-gallery"
  on storage.objects for select
  using (bucket_id = 'user-gallery');

-- Migration 009: Supabase Storage Buckets
-- Creates profile-photos and cert-documents buckets with RLS policies.
-- Applied: 2026-03-14 (Sprint 3)

-- ─────────────────────────────────────────
-- profile-photos
-- Stores user avatar images.
-- Path convention: profile-photos/{user_id}/avatar.{ext}
-- ─────────────────────────────────────────
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'profile-photos',
  'profile-photos',
  true,                         -- public: avatars are visible on public profiles
  5242880,                      -- 5 MB limit
  array['image/jpeg', 'image/png', 'image/webp']
);

-- Anyone can read (public profiles need avatars without auth)
create policy "profile-photos: public read"
  on storage.objects for select
  using (bucket_id = 'profile-photos');

-- Owner can upload / replace their own avatar
create policy "profile-photos: own insert"
  on storage.objects for insert
  with check (
    bucket_id = 'profile-photos'
    and auth.uid()::text = (string_to_array(name, '/'))[1]
  );

-- Owner can update (replace) their own avatar
create policy "profile-photos: own update"
  on storage.objects for update
  using (
    bucket_id = 'profile-photos'
    and auth.uid()::text = (string_to_array(name, '/'))[1]
  );

-- Owner can delete their own avatar
create policy "profile-photos: own delete"
  on storage.objects for delete
  using (
    bucket_id = 'profile-photos'
    and auth.uid()::text = (string_to_array(name, '/'))[1]
  );

-- ─────────────────────────────────────────
-- cert-documents
-- Stores certification supporting documents.
-- Path convention: cert-documents/{user_id}/{cert_id}.{ext}
-- Private bucket — only the owner can read their own documents.
-- ─────────────────────────────────────────
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'cert-documents',
  'cert-documents',
  false,                        -- private: cert docs are not public
  10485760,                     -- 10 MB limit
  array['application/pdf', 'image/jpeg', 'image/png']
);

-- Only the owner can read their own cert documents
create policy "cert-documents: own read"
  on storage.objects for select
  using (
    bucket_id = 'cert-documents'
    and auth.uid()::text = (string_to_array(name, '/'))[1]
  );

-- Owner can upload cert documents
create policy "cert-documents: own insert"
  on storage.objects for insert
  with check (
    bucket_id = 'cert-documents'
    and auth.uid()::text = (string_to_array(name, '/'))[1]
  );

-- Owner can update (replace) a cert document
create policy "cert-documents: own update"
  on storage.objects for update
  using (
    bucket_id = 'cert-documents'
    and auth.uid()::text = (string_to_array(name, '/'))[1]
  );

-- Owner can delete their own cert documents
create policy "cert-documents: own delete"
  on storage.objects for delete
  using (
    bucket_id = 'cert-documents'
    and auth.uid()::text = (string_to_array(name, '/'))[1]
  );

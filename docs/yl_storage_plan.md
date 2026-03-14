# YachtieLink — Storage Plan

**Version:** 1.0
**Date:** 2026-03-14
**Status:** Active
**Applies to:** Phase 1A

Supabase Storage is used for user-generated file uploads. This document covers bucket definitions, path conventions, RLS policies, size/type limits, and future bucket planning.

---

## Supabase Storage overview

Supabase Storage provides S3-compatible object storage. Each bucket has:
- A **public or private** flag (controls whether objects are accessible without auth via CDN URL)
- **File size limit** enforced by the bucket
- **Allowed MIME types** enforced by the bucket
- **RLS policies** on the `storage.objects` table — these gate all reads/writes regardless of bucket visibility

The migration that creates buckets is `supabase/migrations/20260314000009_storage_buckets.sql`.

---

## Buckets

### `profile-photos`

| Property | Value |
|----------|-------|
| Visibility | **Public** |
| Max file size | 5 MB |
| Allowed types | `image/jpeg`, `image/png`, `image/webp` |
| Path pattern | `profile-photos/{user_id}/avatar.{ext}` |
| Sprint added | Sprint 3 |

**Why public?** Profile photos are shown on public profiles (`/u/:handle`) and are served to unauthenticated visitors. Making the bucket public means the CDN URL (`{project}.supabase.co/storage/v1/object/public/profile-photos/...`) works without an auth token — no signed URL needed.

**Path convention:** Always `{user_id}/avatar.{ext}` — one file per user, upload overwrites the previous. The `ext` matches the uploaded MIME type (`jpeg`, `png`, `webp`). The filename `avatar` is constant to make invalidation easy.

**Client-side pre-processing (mandatory before upload):**
- Validate MIME type client-side before sending to storage
- Resize to max **800 × 800 px** using a canvas (preserves aspect ratio)
- Convert to `image/webp` where browser supports it (reduces file size ~30%)
- Use `react-image-crop` for the crop UI before resize

**RLS summary:**
- Anyone can **read** (public profiles need avatars without auth tokens)
- Only the owner (`auth.uid() = path[0]`) can insert / update / delete

**After upload:** Save the public CDN URL to `users.profile_photo_url`. Format:
```
https://{project_ref}.supabase.co/storage/v1/object/public/profile-photos/{user_id}/avatar.webp
```

**Cache-busting:** Append a `?t={timestamp}` query param to the saved URL on upload so browsers don't serve stale avatars from cache.

---

### `cert-documents`

| Property | Value |
|----------|-------|
| Visibility | **Private** |
| Max file size | 10 MB |
| Allowed types | `application/pdf`, `image/jpeg`, `image/png` |
| Path pattern | `cert-documents/{user_id}/{cert_id}.{ext}` |
| Sprint added | Sprint 3 |

**Why private?** Certification documents (STCW, MCA, ENG1, etc.) may contain personal data (dates of birth, certificate numbers, medical information). They should only be accessible to the owner.

**Path convention:** `{user_id}/{cert_id}.{ext}`. One file per certification record. If the user replaces a document, the old file should be deleted first (or overwritten with the same path).

**Signed URLs:** Because the bucket is private, documents must be accessed via a signed URL. Generate with:
```ts
const { data } = await supabase.storage
  .from('cert-documents')
  .createSignedUrl(`${userId}/${certId}.pdf`, 3600); // 1-hour expiry
```
Never store signed URLs in the database — they expire. Store only the raw path and generate signed URLs on demand.

**RLS summary:**
- Only the owner can read, insert, update, or delete their own files

**After upload:** Save the storage path (not the URL) to `certifications.document_url`. Format: `{user_id}/{cert_id}.{ext}`. Generate a signed URL at render time.

---

## Future buckets (planned)

| Bucket | Sprint | Visibility | Notes |
|--------|--------|------------|-------|
| `cv-uploads` | Sprint 6 | Private | Raw CV files (PDF/DOCX) uploaded for parsing. Retained for audit, not shown publicly. Path: `{user_id}/cv.{ext}` |
| `pdf-exports` | Sprint 6 | Private | Generated PDF snapshots. Path: `{user_id}/cv-{timestamp}.pdf`. Signed URLs for download. |
| `yacht-photos` | Sprint 4 | Public | Single cover photo per yacht. Upload gated to users with an active or past attachment to that yacht. Path: `yacht-photos/{yacht_id}/cover.{ext}`. Full multi-photo gallery (multiple images, contributor attribution, ordering, deletion) promoted to Phase 1B Sprint 11. |

---

## Env vars

No additional env vars needed for storage — Supabase Storage uses the same project URL and anon/service keys already in `.env.local`:

```
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...   # server-side only, never expose to client
```

---

## Applying the storage migration

Supabase Storage bucket creation and RLS policies are defined in `supabase/migrations/20260314000009_storage_buckets.sql`. Apply to production via:

```bash
~/bin/supabase db push --db-url "postgresql://postgres:[password]@db.[project_ref].supabase.co:5432/postgres"
```

Or apply directly in the Supabase SQL Editor (copy the migration file contents and run).

**Verify in dashboard:** Storage → Buckets — you should see `profile-photos` (public) and `cert-documents` (private).

---

## Security notes

- The `profile-photos` bucket is public intentionally — avatars are part of the public profile. Do not store anything sensitive here.
- The `cert-documents` bucket is private intentionally — never change it to public.
- RLS policies use `(string_to_array(name, '/'))[1]` to extract the `user_id` from the path. This means the path structure is load-bearing — do not change it without updating the policies.
- `service_role` key bypasses RLS — only use it server-side for admin operations (Sprint 8 GDPR export/deletion).

---

*Updated when new buckets are added or policies change. Current buckets: 2. Next update: Sprint 4 (yacht-photos), Sprint 6 (cv-uploads, pdf-exports).*

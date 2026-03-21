# YachtieLink — Storage Plan

**Version:** 2.0
**Date:** 2026-03-21 (updated from 2026-03-14)
**Status:** Active
**Applies to:** Phase 1A + 1B

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

### `cv-uploads`

| Property | Value |
|----------|-------|
| Visibility | **Private** |
| Max file size | 10 MB |
| Allowed types | `application/pdf`, `application/vnd.openxmlformats-officedocument.wordprocessingml.document` |
| Path pattern | `cv-uploads/{user_id}/cv.{ext}` |
| Sprint added | Sprint 6 |

**Why private?** Raw CV files may contain personal data (addresses, phone numbers, dates of birth). They are retained for audit purposes, not shown publicly.

**Path convention:** `{user_id}/cv.{ext}` — one file per user, upload overwrites the previous.

**Signed URLs:** Private bucket — generate signed URLs at render time (1-hour expiry). Store only the raw path on `users.cv_storage_path`.

**RLS summary:**
- Only the owner can read, insert, update, or delete their own files

---

### `pdf-exports`

| Property | Value |
|----------|-------|
| Visibility | **Private** |
| Max file size | 10 MB |
| Allowed types | `application/pdf` |
| Path pattern | `pdf-exports/{user_id}/profile-{timestamp}.pdf` |
| Sprint added | Sprint 6 |

**Why private?** Generated PDFs contain the user's full profile data. Download requires authentication via signed URL.

**Path convention:** `{user_id}/profile-{timestamp}.pdf` — versioned, latest path stored on `users.latest_pdf_path`.

**Signed URLs:** Private bucket — generate signed URLs at render time (1-hour expiry). Store only the raw path on `users.latest_pdf_path`.

**RLS summary:**
- Only the owner can read, insert, update, or delete their own files

---

### `yacht-photos`

| Property | Value |
|----------|-------|
| Visibility | **Public** |
| Max file size | 5 MB |
| Allowed types | `image/jpeg`, `image/png`, `image/webp` |
| Path pattern | `yacht-photos/{yacht_id}/cover.{ext}` |
| Sprint added | Sprint 4 |
| Migration | `20260314000011_yacht_sprint4.sql` |

**Why public?** Yacht cover photos are shown on public profiles and yacht detail pages.

**Path convention:** `{yacht_id}/cover.{ext}` — one cover photo per yacht, upload overwrites.

**RLS summary:**
- Anyone can read
- INSERT/UPDATE/DELETE gated to authenticated users with an `attachments` record for that yacht
- ⚠️ **Known issue:** RLS does not filter `deleted_at IS NULL` — ex-crew with soft-deleted attachments can still write. Fix planned for Sprint 10.1.

---

### `user-photos`

| Property | Value |
|----------|-------|
| Visibility | **Public** |
| Max file size | **⚠️ NOT SET — needs 5 MB limit in migration** |
| Allowed types | **⚠️ NOT RESTRICTED — needs `image/jpeg`, `image/png`, `image/webp`** |
| Path pattern | `user-photos/{user_id}/{uuid}.{ext}` |
| Sprint added | Sprint 10 |
| Migration | `20260317000021_profile_robustness.sql` (RLS policies only — **bucket not created in SQL**) |

**Why public?** Profile photos are displayed on public profiles.

**Path convention:** `{user_id}/{uuid}.{ext}` — multiple files per user. Free: 6 max, Pro: 9 max (enforced in API route).

**RLS summary:**
- Anyone can read
- Only owner can INSERT/DELETE

**⚠️ Known issues (fix in Sprint 10.1):**
1. Bucket is not created in migration SQL — relies on manual dashboard creation. Must add `INSERT INTO storage.buckets`.
2. No `file_size_limit` or `allowed_mime_types` set — any file type up to 50 MB accepted.
3. No client-side compression — raw phone photos uploaded directly (5-8 MB each).
4. **Not included in account deletion cleanup** — `POST /api/account/delete` misses this bucket.

---

### `user-gallery`

| Property | Value |
|----------|-------|
| Visibility | **Public** |
| Max file size | **⚠️ NOT SET — needs 5 MB limit in migration** |
| Allowed types | **⚠️ NOT RESTRICTED — needs `image/jpeg`, `image/png`, `image/webp`** |
| Path pattern | `user-gallery/{user_id}/{uuid}.{ext}` |
| Sprint added | Sprint 10 |
| Migration | `20260317000021_profile_robustness.sql` (RLS policies only — **bucket not created in SQL**) |

**Why public?** Gallery work samples are shown on public profiles.

**Path convention:** `{user_id}/{uuid}.{ext}` — multiple files per user. Free: 12 max, Pro: 30 max (enforced in API route).

**RLS summary:**
- Anyone can read
- Only owner can INSERT/DELETE

**⚠️ Known issues (fix in Sprint 10.1):** Same as `user-photos` above — no bucket creation in SQL, no limits, no compression, missing from account delete.

---

## Storage Cost Estimate

**Provider:** Supabase (Pro plan, $25/mo base)
- 100 GB storage included, $0.021/GB overage
- 250 GB bandwidth included, $0.09/GB overage

| Users | Est. Storage | Monthly Cost (over $25 base) |
|-------|-------------|------------------------------|
| 100 | ~5 GB | $0 |
| 500 | ~25 GB | $0 |
| 1,000 | ~55 GB | $0 |
| 2,000 | ~110 GB | ~$23 (mostly bandwidth) |
| 5,000 | ~275 GB | ~$94 |
| 10,000 | ~550 GB | ~$212 |

Assumes ~55 MB/user average with compression. Without compression (current state), multiply by 2-3x.

**Bandwidth is the bigger cost driver at scale.** Public bucket CDN hits from profile views accumulate faster than storage.

---

## Provider Migration Strategy

> **Decision (2026-03-21):** Continue with Supabase Storage for MVP. The abstraction layer in `lib/storage/` must be completed so we can migrate to another provider (Vercel Blob, AWS S3, Cloudflare R2) if costs or performance require it.

**Current state:** Partial abstraction. `lib/storage/upload.ts` covers profile-photos, cert-documents, cv-uploads, pdf-exports. `lib/storage/yacht.ts` covers yacht-photos. But `user-photos` and `user-gallery` bypass the abstraction — pages call `supabase.storage` directly.

**Sprint 10.1 action items:**
1. Add `uploadUserPhoto()`, `deleteUserPhoto()`, `uploadGalleryItem()`, `deleteGalleryItem()` to `lib/storage/upload.ts`
2. Refactor `profile/photos/page.tsx` and `profile/gallery/page.tsx` to use the helpers
3. Refactor `DELETE /api/user-photos/[id]` and `DELETE /api/user-gallery/[id]` to use deletion helpers
4. Add `user-photos` and `user-gallery` cleanup to `POST /api/account/delete`

**Future (post-launch if needed):** Extract `lib/storage/` into a provider-agnostic interface:
```ts
interface StorageProvider {
  upload(bucket: string, path: string, file: File, opts?: UploadOpts): Promise<string>
  delete(bucket: string, path: string): Promise<void>
  getPublicUrl(bucket: string, path: string): string
  getSignedUrl(bucket: string, path: string, expiresIn: number): Promise<string>
}
```
Swap implementation from Supabase to Vercel Blob / S3 / R2 without touching any page or API code. Not needed now — all calls already go through `lib/storage/`, just need to finish wiring the last two buckets.

---

## Cleanup & Garbage Collection

| Bucket | On replace | On record delete | On account delete |
|--------|-----------|-----------------|-------------------|
| `profile-photos` | Overwrite (same path) | N/A | ✅ Cleaned |
| `cert-documents` | Overwrite (same path) | ⚠️ Orphaned (cert row soft-deleted, file persists) | ✅ Cleaned |
| `cv-uploads` | Overwrite (same path) | N/A | ✅ Cleaned |
| `pdf-exports` | **⚠️ Accumulates** (new timestamped file each time) | N/A | ✅ Cleaned |
| `yacht-photos` | Overwrite (same path) | N/A (yacht not deletable) | ⚠️ Never cleaned (shared resource) |
| `user-photos` | N/A (unique paths) | ✅ Storage object deleted | ❌ **Missing from account delete** |
| `user-gallery` | N/A (unique paths) | ✅ Storage object deleted | ❌ **Missing from account delete** |

**Sprint 10.1 fixes:**
- Add `user-photos` + `user-gallery` to account delete cleanup
- Delete previous PDF before writing new one in `generate-pdf` route
- Add client-side image compression for `user-photos` and `user-gallery` uploads (Canvas resize to max 1200px, WebP 0.85 — same pattern as profile avatar)

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

*Updated when new buckets are added or policies change. Current buckets: 7 (profile-photos, cert-documents, cv-uploads, pdf-exports, yacht-photos, user-photos, user-gallery). Next update: Sprint 10.1 (fix bucket creation, limits, compression, cleanup).*

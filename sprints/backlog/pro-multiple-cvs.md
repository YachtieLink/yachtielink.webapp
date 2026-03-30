# Pro Feature: Multiple CV Documents

**Created:** 2026-03-30
**Priority:** Medium
**Scope:** Pro-only feature
**Effort:** Medium (migration + CV routes + management UI)

## Problem

Users can only have one CV on file. Pro users (captains, senior crew) often have tailored CVs for different roles or yacht types — e.g., a charter-focused CV and a private-focused CV. Currently they must overwrite their CV each time.

## Proposed Solution

### Schema
- New `cv_documents` table: `id`, `user_id`, `label` (user-defined name), `storage_path`, `is_primary` (boolean), `parsed_at`, `created_at`
- Migrate existing `users.cv_storage_path` data into the new table
- `is_primary` determines which CV is served on public download and PDF generation

### Storage
- Change path from `cv-uploads/{userId}/cv.{ext}` to `cv-uploads/{userId}/{cv_document_id}.{ext}`
- Keep one-CV-per-user limit for Free users (enforce in upload route)

### UI
- Pro users get a CV management page (accessible from CV tab)
- List of uploaded CVs with labels, dates, primary badge
- Upload new CV, rename, set as primary, delete
- Parse/import wizard operates on a specific CV document

### Routes to update
- `/api/cv/upload` — accept optional `cv_document_id`, create new record if none
- `/api/cv/parse` and `/api/cv/parse-personal` — accept `cv_document_id` instead of raw `storagePath`
- `/api/cv/download-pdf` — serve the primary CV
- `/api/cv/public-download/[handle]` — serve the primary CV
- `/api/cv/generate-pdf` — generate from primary CV data

### Gate
- Free: 1 CV (current behaviour)
- Pro: up to 5 CVs

## Dependencies
- None — can be built independently

## Notes
- The CV review wizard and import flow don't change — they just receive a `cv_document_id` context
- SessionStorage cache key should include `cv_document_id` to avoid cross-CV cache collision
- Consider: should each CV have its own parsed data, or does parsing always update the single user profile?

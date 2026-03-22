# Feature: CV & Sharing page rework

**Started:** 2026-03-22
**Status:** ⚡ Planned
**Complexity:** High — significant page restructure, new share modal, CV download toggle

---

## Overview

Full rework of the CV & Sharing page. Current layout is a flat list of actions. New layout surfaces more value: always-on QR, viewable CVs, smart download toggle, and a proper share experience.

---

## New Structure

### 1. QR Code — always visible

Remove the QR Code button/toggle. Render the branded QR card directly on the page at all times — no tap required to reveal it.

Add a note: "Customisable QR coming soon" (future sprint).

### 2. Share Profile — full screen modal

Tapping "Share Profile" opens a full-screen overlay showing:
- Profile photo (large, centered or left-aligned)
- Name (DM Serif Display)
- Role + Department
- Large QR code (the branded YL QR)
- Native share button (icon) → triggers `navigator.share` with profile URL, falls back to copy

This is the primary "hand your phone to someone" sharing experience.

### 3. CV section — generated + uploaded, both viewable

**Generated CV:**
- Show a preview/link to the generated PDF (current `latest_pdf_path`)
- "Download" button
- "Regenerate" button with last-generated date (fix the date bug — see debug-cv-regenerate-date)

**Uploaded CV:**
- Show the uploaded CV filename or a "No CV uploaded yet" empty state
- "View" button (opens in new tab from signed URL)
- "Replace" button → triggers file upload (replaces existing, single file only)
- Pro note: "Multiple CV versions coming with Pro" (future)

### 4. Public download toggle

A toggle row below both CVs:

```
Make CV downloadable from my public profile   [toggle]
```

Sub-options (only visible when toggle is on):
```
Which CV to share?
  ○ Generated PDF
  ○ Uploaded CV
```

Default: on. Saves to `users` table (new columns: `cv_public`, `cv_public_source` enum: `generated | uploaded`).

When a visitor views the public profile and CV download is enabled, they see a download button for the chosen CV. When disabled, no download button shown.

---

## Data / Schema

New columns on `users`:
- `cv_public boolean DEFAULT true`
- `cv_public_source text DEFAULT 'generated'` — `'generated' | 'uploaded'`

API: `PATCH /api/user/cv-settings` — updates both fields.

Public profile: check `cv_public` before showing download button. Serve the appropriate file via a signed URL (never expose raw storage paths).

---

## Out of Scope

- CV versioning (multiple uploads) — Pro feature, future sprint
- QR customisation — future sprint
- CV template switching — already on this page, untouched

---

## Files Affected

- `app/(protected)/app/cv/page.tsx` — full restructure
- `components/public/PublicProfileContent.tsx` — add CV download button (conditional)
- `app/api/user/cv-settings/route.ts` — new route
- `supabase/migrations/` — new columns on users

---

## Verification Checklist

- [ ] QR code always visible on CV page without tapping
- [ ] Share Profile opens full-screen modal with photo, name, role, QR, share icon
- [ ] Native share works; copy fallback works
- [ ] Generated PDF viewable and downloadable
- [ ] Uploaded CV viewable; Replace button works (single file)
- [ ] Toggle saves to DB and persists on reload
- [ ] Sub-option (generated vs uploaded) visible only when toggle is on
- [ ] Public profile shows download button only when `cv_public = true`
- [ ] Date updates after regenerate (see debug-cv-regenerate-date)

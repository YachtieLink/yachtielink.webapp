# Bug Report — Screenshot Upload

**Source:** Founder feedback during QA (2026-04-03)
**Priority:** Medium
**Module:** trust (bug reports)

## Problem

The bug report form (`/app/more/report-bug`) only accepts text description. Users can't attach a screenshot of what they're seeing, which makes bug triage much harder.

## Suggested Implementation

- Add an image upload field to the bug report form
- Store images in Supabase Storage (e.g. `bug-reports/` bucket)
- Include the image URL in the DB record and founder email notification
- Consider using the device camera or screenshot picker on mobile
- Max file size: 5MB, accepted types: PNG/JPG/WEBP

## Files Likely Involved

- `app/(protected)/app/more/report-bug/page.tsx` — add upload field
- `app/api/bug-reports/route.ts` — accept image_url
- Supabase Storage bucket config

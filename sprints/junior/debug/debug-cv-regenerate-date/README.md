# Debug: Regenerate PDF — date not updating after regeneration

**Started:** 2026-03-22
**Status:** 🐛 In Progress
**Severity:** Low

## Problem

After tapping "Regenerate PDF" on the CV & Sharing page, the displayed date next to the button (e.g. "· 21 Mar 2026") does not update to reflect the new generation time. It shows the stale date from the previous generation.

## Location

`app/(protected)/app/cv/page.tsx` — the `latest_pdf_generated_at` value is likely fetched once on load and not refreshed after the regenerate action completes.

## Fix

After a successful regenerate API call, re-fetch or locally update the `latest_pdf_generated_at` state to `new Date().toISOString()` so the displayed date reflects the new generation time.

## Verification

- Hit "Regenerate PDF"
- Date next to the button updates to today's date immediately on success

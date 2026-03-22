# Sprint 11.1 — Bug fixes + UI polish

**Started:** 2026-03-22
**Status:** 🐛 Ready to build
**Parent:** Sprint 11 (CV-first onboarding, section colours, profile polish)

---

## Scope

Quick fixes surfaced during Sprint 11 QA. All low-risk, focused, and shippable in one session.

---

## Tasks

### 1. CV parse extraction failure
**File:** `app/api/cv/parse/route.ts`
**Issue:** `{ PDFParse }` named import is likely wrong — `pdf-parse` is a CJS default export. Same potential issue with mammoth.
**Fix:** Correct the dynamic import. Test with a real PDF and DOCX.
**Ref:** `sprints/junior/debug/debug-cv-parse-extraction/`

### 2. Photo upload — wrong limit for free users
**File:** `app/(protected)/app/profile/photos/page.tsx`
**Issue:** Page uses `MAX_PHOTOS_PRO` (9) for all users. Free users see wrong remaining count, add button stays visible past their limit.
**Fix:** Fetch `subscription_status` on load. Derive `maxPhotos` from isPro. Use `remaining > 0` for add button visibility.
**Ref:** `sprints/junior/debug/debug-photo-upload-limit/`

### 3. CV regenerate date not updating
**File:** `app/(protected)/app/cv/page.tsx`
**Issue:** After "Regenerate PDF" succeeds, the displayed date stays stale.
**Fix:** Update the local `latest_pdf_generated_at` state to `new Date().toISOString()` after successful API call.
**Ref:** `sprints/junior/debug/debug-cv-regenerate-date/`

### 4. Public profile — top buttons need margin
**File:** `components/public/PublicProfileContent.tsx`
**Issue:** Back/edit/share buttons sit flush against the screen edge on mobile.
**Fix:** Add top padding using `env(safe-area-inset-top)` or increase the fixed top offset.
**Ref:** `sprints/junior/ui-ux/ui-public-profile-button-margin/`

---

## Exit Criteria

- [ ] CV upload parses a real PDF and DOCX successfully
- [ ] Free user photo page shows correct limit (3), add button hides at 3
- [ ] Pro user photo page shows correct limit (9)
- [ ] Regenerate PDF updates the displayed date immediately
- [ ] Public profile top buttons have breathing room from screen edge on mobile
- [ ] No regressions — build passes, existing features unaffected

---

## Follow-on Junior Sprints

| Sprint | Scope |
|--------|-------|
| 11.2 | CV & Sharing page rework — always-on QR, share modal, download toggle |
| 11.3 | Saved profiles rework — notes, availability watch, relationship context |
| 11.4 | Pro subdomain link (`{handle}.yachtie.link`) + reserved upsell page |

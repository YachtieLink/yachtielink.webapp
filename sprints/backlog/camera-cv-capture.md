---
title: Document Capture — Camera CV + Certificate Photos
status: ready
source: founder (2026-03-30, grilled 2026-04-03)
priority: medium
modules: [cv, profile, infrastructure]
estimated_effort: 5-6 hours (Opus, high effort — reusable component + two integration points)
grill_me_date: 2026-04-03
---

# Document Capture — Camera CV + Certificate Photos

## Problem

1. **CVs:** Some crew only have a printed CV. Current upload only accepts PDF/DOCX. These users have to photograph, convert externally, or skip import entirely.
2. **Certificates:** No way to photograph and store cert documents. Crew carry physical certs and have no digital backup on the platform.

## Grill-me Decisions (2026-04-03)

| # | Question | Decision |
|---|----------|----------|
| 1 | OCR approach | **(a)** Send photo directly to LLM (gpt-4o-mini or Claude vision). No separate OCR layer. LLM reads the image and extracts structured data in one pass. Simpler, one system to maintain. |
| 2 | Quality check | **(c)** Phased. Ship with client-side blur detection only (Laplacian variance on canvas). Instant, free, "This looks blurry, try again." LLM fails gracefully on unreadable images anyway. Add LLM pre-check later if needed. |
| 3 | Cert photo handling | **(b)** Store photo AND run LLM extraction. Photo is proof ("show me your STCW"). Extraction auto-fills cert name, issuing body, cert number, expiry. Fuzzy-matches against cert registry (Lane 1) for green/amber/blue matching. |
| 4 | Where it surfaces | **(c)** Reusable `DocumentCapture` component with `mode` prop. CV tab for CV capture, cert section on profile for individual cert capture. Same component, different contexts. |
| 5 | Multi-page | **(b)** for CVs: continuous capture mode — camera stays open, shutter per page, page count badge, "Done" when finished. **(a)** for certs: single capture, review, done — with optional "Add back side" for two-sided certs. Mode prop controls behavior. |

## Spec

### Task 1: DocumentCapture component

**File:** `components/ui/DocumentCapture.tsx` (new)

Reusable camera capture component:

```typescript
interface DocumentCaptureProps {
  mode: 'cv' | 'certificate'
  onCapture: (images: File[]) => void
  onCancel: () => void
}
```

**States:**
1. **Trigger** — "Take a photo" button with camera icon (sits alongside existing file upload)
2. **Camera active** — full-screen camera view using `navigator.mediaDevices.getUserMedia`
   - CV mode: shutter button + page count badge ("3 pages") + "Done" button
   - Cert mode: shutter button + "Capture" label. After first capture, shows "Add back side" option
3. **Preview/Review** — shows captured page(s) as thumbnails. Each page:
   - Large preview on tap
   - Blur quality indicator (green check / orange warning)
   - "Retake" button per page
   - "Remove" button per page
4. **Submit** — "Use these photos" button, disabled if any page flagged as too blurry

**Blur detection:**
- Run Laplacian variance on captured image via canvas API
- Threshold TBD (test with real cert photos). Below threshold → orange warning "This looks blurry — try retaking with better lighting"
- Warning is advisory, not blocking (user can override)

**Guidance copy (shown during camera):**
- CV: "Lay your CV flat on a surface. Capture one page at a time. Ensure good lighting."
- Cert: "Photograph the full certificate. Ensure all text is visible and in focus."

### Task 2: CV camera capture integration

**File:** `components/cv/CvImportCard.tsx` or wherever the upload trigger lives

- Add "Take a photo" option alongside "Upload PDF/DOCX"
- On capture complete: upload images to Supabase storage (temp bucket or `cv-documents`)
- Send image(s) to the LLM parse endpoint — same prompt as text CV, but with image input
- Parse API needs to accept image input (check if existing endpoint supports this, or create a variant)
- Results flow into the same wizard (StepPersonal → StepExperience → StepQualifications → etc.)

**Parse endpoint change:**
**File:** `app/api/cv/parse/route.ts` (modify) or `app/api/cv/parse-image/route.ts` (new)

- Accept image file(s) instead of text
- Send to gpt-4o-mini with vision: same structured extraction prompt, image as input
- For multi-page: concatenate pages into a single prompt or send as multiple images in one request
- Return same `ParsedCvData` shape — downstream wizard is unchanged

### Task 3: Certificate capture integration

**File:** profile cert section (find the "add certification" flow)

- Add "Photograph certificate" option alongside manual entry
- On capture: upload photo to `cert-documents` bucket (already exists, uses signed URLs)
- Send image to LLM: extract cert name, issuing body, cert number, issue date, expiry date
- Run extracted cert name through `matchCertification()` from `lib/cv/cert-matching.ts` — green/amber/blue matching against the registry
- Present results on a confirmation card (same pattern as StepQualifications):
  - Green: "Matched: STCW Basic Safety Training (MCA)" with auto-filled fields
  - Amber: "Did you mean?" with alternatives
  - Blue: manual entry with extracted text pre-filled
- User confirms → cert saved to `certifications` table with `cert_document_path` linking to the stored photo
- Photo viewable in cert manager (existing `cert-documents` bucket with signed URLs)

**LLM prompt for cert extraction:**
```
Extract the following from this certificate photograph:
- Certificate name (full official name)
- Abbreviation (if visible)
- Issuing authority/body
- Certificate number (if visible)
- Issue date
- Expiry date (if visible)
- Holder name

Return as JSON. If a field is not visible or readable, return null.
```

### Task 4: Mobile-only gating

- Camera capture is mobile-only — hide the "Take a photo" option on desktop (no webcam CV capture)
- Detect with `navigator.mediaDevices` availability + screen width heuristic
- Desktop users see file upload only

## Edge Cases

- **Camera permission denied** — show "Camera access needed to photograph your document. Check your browser settings." Fall back to file upload.
- **Very poor quality photo** — blur check warns, LLM returns sparse/empty data. Show: "We couldn't read much from this photo. Try retaking with better lighting, or upload a PDF instead."
- **Multi-page CV with mixed quality** — one page blurry, others fine. Allow retaking individual pages without losing the good ones.
- **Large images** — compress before upload. Phone cameras produce 4-12MB images. Resize to max 2048px on longest edge (sufficient for LLM reading) before upload.
- **Two-sided cert** — front has the main info, back may have terms/conditions. LLM should handle both in one extraction pass.
- **Cert already exists** — after extraction + registry match, check for duplicates in user's existing certs before saving (same dedup logic as CV import in `save-parsed-cv-data.ts`).
- **Storage costs** — cert photos are small (compressed <500KB each). CV photos are temporary (can be deleted after successful parse). Budget-friendly.

## Dependencies

- `lib/cv/cert-matching.ts` — cert registry fuzzy matching (Lane 1 of current session)
- `cert-documents` bucket — already exists with signed URL pattern
- LLM vision support — gpt-4o-mini supports image input. Check existing LLM abstraction layer for image support.
- Camera API — standard browser API, works on iOS Safari and Chrome mobile

## Not in scope

- Video capture (e.g., scanning a document by moving the camera)
- Edge detection / perspective correction (auto-crop the document from the photo)
- Batch cert scanning (photograph a stack of certs at once)
- Desktop webcam capture

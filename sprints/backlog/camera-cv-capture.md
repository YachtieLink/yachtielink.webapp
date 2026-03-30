# Camera CV Capture

**Created:** 2026-03-30
**Priority:** Medium
**Scope:** All users (especially those without digital CV files)
**Effort:** Medium

## Problem

Some crew members only have a physical printed CV. The current upload flow only accepts PDF/DOCX files. These users have to photograph their CV, convert to PDF externally, then upload — or skip the import entirely and enter details manually.

## Proposed Solution

Add a "Take a photo" option alongside the file upload. The user takes a photo of their CV pages using their phone camera. We run OCR to extract text, then feed it into the same parse pipeline.

### Flow

1. User taps "Take a photo of your CV" (alongside the existing file upload)
2. Camera opens — user photographs each page
3. Pages are uploaded and OCR'd (Tesseract.js client-side, or server-side OCR service)
4. Extracted text is sent to the same gpt-5.4-mini parse pipeline
5. User reviews results in the same wizard

### Technical Options for OCR

- **Tesseract.js** — client-side, free, decent quality on clear photos
- **Google Cloud Vision API** — server-side, excellent quality, ~$1.50/1000 pages
- **OpenAI Vision** — send the image directly to gpt-5.4-mini (supports image input). Most expensive but simplest — no separate OCR step.

### Considerations

- Photo quality matters — need guidance copy ("Lay your CV flat, ensure good lighting, capture one page at a time")
- Multi-page support — user may need to photograph 2-4 pages
- Processing time — OCR + parse will be slower than PDF upload. Need clear loading state.
- This is a mobile-only feature — camera capture on desktop is unusual

## Dependencies

- Existing parse pipeline (prompts, routes, wizard)
- Camera API access (standard browser API)

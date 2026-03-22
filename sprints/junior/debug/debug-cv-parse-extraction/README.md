# Debug: CV parse — text extraction failure

**Started:** 2026-03-22
**Status:** 🐛 In Progress
**Severity:** High

## Problem

CV upload fails with toast: "Could not extract text from your CV. Try entering your details manually."

Tested from the in-app CV upload page (`/app/cv/upload`). File type unknown — needs confirmation from founder.

## Reproduction Steps

1. Log in
2. Go to CV page → Upload CV
3. Drop or browse a PDF or DOCX file
4. Error toast appears: "Could not extract text from your CV. Try entering your details manually."

## Suspected Causes

The error originates in `app/api/cv/parse/route.ts` in the text extraction block:

```ts
if (storagePath.endsWith('.pdf')) {
  const { PDFParse } = await import('pdf-parse')
  ...
} else if (storagePath.endsWith('.docx')) {
  const mammoth = await import('mammoth')
  ...
}
```

Possible causes (in order of likelihood):
1. **Scanned/image-based PDF** — no text layer, `pdf-parse` returns empty string (caught by the empty text check below the extraction block — but this would give a different error message)
2. **`pdf-parse` import issue** — the `{ PDFParse }` named import may be wrong; the package exports a default function, not a named export
3. **`mammoth` import issue** — similar named vs default import mismatch
4. **File not reaching storage** — upload succeeds in UI but file is corrupt or zero-byte in storage
5. **MIME type mismatch** — file extension doesn't match actual content

The most likely culprit is **#2** — `pdf-parse` is a CommonJS module that exports a default function, not a named `PDFParse` export. The dynamic import `{ PDFParse }` would resolve to `undefined`, causing a throw.

## Root Cause (once known)

TBD — needs investigation.

## Fix

TBD

## Verification

Upload a known good PDF CV and confirm parsed data is returned and profile is populated.

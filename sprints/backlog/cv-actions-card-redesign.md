# CV Actions Card Redesign

**Status:** backlog
**Priority:** high — visible UX issue on profile page
**Scope:** `components/cv/CvActions.tsx`

## Problem

The "Your CVs" section on the profile page has poor layout and copy:
- Generated PDF and Uploaded CV are in separate boxes — should be one unified card
- Copy is generic ("CV uploaded", "Generated PDF") — doesn't explain what each is
- Date format is absolute (23 Mar 2026) — should be relative (now, 1h, 2h, yesterday, then date)
- Uploaded CV has no preview/view option — user can't see their own uploaded file
- Uploaded CV preview should show ALL pages, not just page 1

## Design

### Single unified card: "Your CVs"

**Generated CV section:**
- Preview button (links to /app/cv/preview)
- Download button
- Regenerate button
- Relative timestamp: "just now", "1h ago", "2h ago", "yesterday", then "15 Mar 2026"

**Uploaded CV section:**
- Clear label: "Your uploaded CV" or "Original CV"
- Preview button — opens the uploaded PDF in a viewer that supports all pages
- Replace button
- Copy explaining this is the document they uploaded vs the one YachtieLink generates

### Relative time helper

```ts
function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}h ago`
  if (hours < 48) return 'yesterday'
  return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
}
```

## Notes

- Multi-page PDF viewer for uploaded CV needs investigation — current preview might use pdf.js or an iframe. Check what's cheapest to implement.
- Keep all existing functionality (share, template selector, public toggle) — just restructure the CV card itself.

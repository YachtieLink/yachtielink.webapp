# CV & Sharing Page — Full Rework

## Problem
The current CV & Sharing page layout is cluttered and poorly structured. QR code, share button, CV management, template selection, and public download settings are all stacked with no visual hierarchy. Needs re-presenting.

## Current Issues
- QR code dominates the page — should be secondary
- "Share Profile" button sits between QR and CVs — odd placement
- "Preview your CV" / "Generated PDF" / "Uploaded CV" all look the same — unclear primary action
- Template selector (Standard / Classic Navy / Modern Minimal) has no visual previews
- "Public CV Download" toggle + radio buttons at the bottom feel hidden
- No clear flow: what does a new user do first?

## Proposed Structure
1. **CV Preview** — hero of the page. Show a live preview or thumbnail of their current CV
2. **Actions row** — Download / Share / Regenerate as clear buttons
3. **Template picker** — visual thumbnails of each template, not just text labels
4. **Upload section** — upload/replace their own CV, clear status
5. **Public sharing settings** — toggle + which CV to share, clear explanation
6. **QR + Share** — moved to a secondary section or integrated into the share button modal (see share-button-qr-code backlog)

## Notes
- This page is the second tab in the app — it gets a lot of traffic
- The CV is a key conversion feature — captains want to download CVs
- Template previews would significantly help users choose
- Consider: should CV generation be on-demand (design spec decision) rather than a manual "Generate" step?

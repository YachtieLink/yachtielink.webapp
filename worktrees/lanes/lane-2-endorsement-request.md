---
lane: 2
branch: feat/endorsement-request-redesign
worker: opus
priority: high
status: pending
---

# Lane 2 — Endorsement Request Redesign

## Scope
Restructure endorsement request page to colleague-first yacht-grouped view.

## Tasks
1. Yacht-grouped colleagues with expandable accordions
2. Inline ghost suggestions within yacht groups
3. Per-yacht invite CTA
4. Generic external invite section
5. Reminder logic (1 after 7 days)

## Allowed Files
- `app/(protected)/app/endorsement/request/RequestEndorsementClient.tsx` — rewrite
- `app/(protected)/app/endorsement/request/page.tsx` — modify
- `components/endorsement/` — new components

## Forbidden Files
- `supabase/migrations/*`
- Network tab components

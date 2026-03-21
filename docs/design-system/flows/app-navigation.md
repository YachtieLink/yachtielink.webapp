# App Navigation

> Routes marked `⬜ NOT BUILT` exist in the design but don't have a page.tsx yet. Update this when you build them.

## Tab Structure

Five main tabs, fixed at bottom (mobile) or left sidebar (desktop):

```
Profile (/app/profile)     — own profile, edit access
CV (/app/cv)               — CV upload, review, PDF export
Insights (/app/insights)   — analytics, pro features
Network (/app/network)     — colleagues, saved profiles, requests
More (/app/more)           — settings, account, appearance, links
```

Network tab shows a badge dot when there are pending endorsement requests.

## Full Route Map

```
Auth (unauthenticated)
  /welcome              → login/signup gateway
  /signup               → create account
  /login                → email/password
  /reset-password       → request reset
  /update-password      → set new password
  /auth/callback        → OAuth/PKCE code exchange → redirect

Onboarding (authenticated, not complete)
  /onboarding           → wizard: role → CV upload → profile basics → done

App (authenticated, onboarding complete)
  /app/profile                    ← Profile tab
  /app/profile/photos             edit photos (3-col grid)
  /app/profile/photo              single photo edit
  /app/profile/gallery            work gallery
  /app/profile/settings           contact visibility toggles
  /app/about/edit                 bio textarea
  /app/hobbies/edit               hobby pills
  /app/skills/edit                skill pills + categories
  /app/social-links/edit          7 platform fields
  /app/education/new              add education
  /app/education/[id]/edit        edit education                    ⬜ NOT BUILT
  /app/attachment/new             add yacht/experience
  /app/attachment/[id]/edit       edit yacht
  /app/certification/new          add cert
  /app/certification/[id]/edit    edit cert
  /app/endorsement/request        request endorsement
  /app/endorsement/[id]/edit      edit endorsement
  /app/certs                      certs list view
  /app/yacht/[id]                 yacht detail
  /app/yacht/[id]/photo           yacht photo upload

  /app/cv                         ← CV tab
  /app/cv/upload                  upload CV (PDF/DOCX)
  /app/cv/review                  review parsed CV

  /app/insights                   ← Insights tab
  /app/network                    ← Network tab
  /app/audience                   (alias for network)

  /app/more                       ← More tab
  /app/more/account               edit name, role, handle
  /app/more/delete-account        account deletion

Public (no auth required)
  /u/[handle]           → public profile (the shareable link)
  /r/[token]            → endorsement deep link
  /invite-only          → invite-only landing
  /terms                → ToS
  /privacy              → privacy policy
```

## Navigation Patterns

**Edit pages** — always have `← Back` link (top left) that returns to the parent. Uses `router.back()` or explicit href to `/app/profile`.

**Tab switches** — instant (prefetched on mount). Stale RSC payloads served immediately, refresh in background.

**Auth redirects** — no auth → `/welcome`. Auth but no onboarding → `/onboarding`. Already authed hitting `/welcome` → `/app/profile`.

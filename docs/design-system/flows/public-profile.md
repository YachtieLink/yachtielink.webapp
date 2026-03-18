# Public Profile Flow

## Journey

The public profile is the most important page in the app. It's what gets shared — the "aha moment."

```
External link (yachtie.link/u/james) or QR code
  │
  └─→ /u/[handle] (public profile)
        │
        ├─ Not logged in:
        │    ├─ "Build your own profile" → /signup
        │    └─ "Sign in to see how you know [Name]" → /login
        │
        ├─ Logged in, own profile:
        │    └─ "Back to dashboard" → /app/profile
        │
        └─ Logged in, someone else:
             ├─ Save/bookmark profile
             ├─ See mutual connections badge
             └─ "Back to my profile" → /app/profile
```

## Page Layout

**Mobile:** single column, full-width photo at top.

**Desktop:** split layout — photo sticky left (40%), content scrolling right (60%).

```
Desktop:
┌──────────────┬─────────────────────────────┐
│              │  Name, Role                  │
│   Photo      │  Social links               │
│   (sticky)   │  About                      │
│   40%        │  Experience (accordion)      │
│              │  Certifications (accordion)  │
│              │  Endorsements                │
│              │  Education, Hobbies, Skills  │
│              │  Gallery                     │
│              │  CTA buttons                 │
└──────────────┴─────────────────────────────┘
```

## What Shows and What Doesn't

- `section_visibility` JSONB controls which sections are visible
- Empty sections don't render (hidden-by-default rule)
- AI summary shows if available
- Mutual connections badge shows if viewer is logged in and shares yacht history
- Save button shows for logged-in viewers (not on own profile)

## CTAs

The bottom CTA adapts based on auth state — this is critical for conversion. Never show a generic CTA. Always personalise:

- Not logged in → dual buttons (signup + login), mention the profile owner's name
- Own profile → dashboard link
- Someone else → "Back to my profile"

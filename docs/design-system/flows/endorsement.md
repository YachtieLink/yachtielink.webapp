# Endorsement Flow

## Journey

Endorsements are the trust layer. They can only come from verified coworkers — people who shared a yacht.

```
Requester:
  /app/endorsement/request
    → picks a colleague (must share yacht)
    → sends request (email + in-app)
    → request appears in colleague's Network tab

Endorser (via deep link):
  /r/[token]
    → lands on DeepLinkFlow component
    ├─ Not logged in → signup/login prompt → redirect back to /r/[token]
    ├─ Already endorsed → "already endorsed" state with checkmark
    └─ Can endorse → write form → submit → confirmation

Endorser (via app):
  /app/network (pending requests section)
    → tap request → endorsement form → submit

Edit:
  /app/endorsement/[id]/edit → edit text → save
```

## Trust Mechanics

- Coworker verification: `are_coworkers_on_yacht()` RPC checks both users have overlapping attachments on the same yacht
- Yacht must be "established" (60+ days, crew threshold) before endorsements for it are available
- Rate limited: 5 endorsement creates per 24 hours
- Content moderated via OpenAI moderation API — flagged content returns 422
- Endorsement text has a 2000 char limit

## UI States in DeepLinkFlow

| State | What shows |
|-------|-----------|
| Loading | Spinner |
| Not logged in | Profile preview + "Sign in to endorse" |
| Already endorsed | Checkmark + "You've already endorsed [Name]" |
| Not a coworker | "You can only endorse people you've worked with" |
| Can endorse | Write form: textarea + yacht selector + submit |
| Submitted | Confirmation + "Back to [Name]'s profile" |

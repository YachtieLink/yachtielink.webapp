# Onboarding Flow

## Journey

```
/welcome → /signup → /auth/callback → /onboarding → /app/profile
                                           │
                                           ├─ Step 1: Role selection
                                           ├─ Step 2: CV upload (optional, skip-able)
                                           ├─ Step 3: Profile basics (name, handle)
                                           └─ Step 4: Done — "Your profile is live"
```

## Key Design Decisions

- CV upload is optional but heavily encouraged — it's the "Instant Good Profile" moment
- After CV parse, profile should look polished immediately (sections auto-fill, AI summary generates)
- The "Done" step shows the public profile URL (`yachtie.link/u/{handle}`) and links to Network tab
- Onboarding sets `onboarding_complete = true` — the layout guard checks this

## User State

| Arriving at | State | What happens |
|-------------|-------|-------------|
| `/welcome` | Not logged in | Shows login/signup options |
| `/welcome` | Logged in | Redirects to `/app/profile` |
| `/onboarding` | Not logged in | Redirects to `/welcome` |
| `/onboarding` | Logged in, complete | Redirects to `/app/profile` |
| `/onboarding` | Logged in, incomplete | Shows wizard |
| `/app/*` | Not logged in | Redirects to `/welcome` |
| `/app/*` | Logged in, incomplete | Redirects to `/onboarding` |

# Worker Completion Report

---

## Lane

- **Worktree:** yl-wt-3
- **Branch:** feat/quick-wins-404-flag
- **Lane file:** worktrees/lanes/lane-3-quick-wins.md

## Summary

Built two quick wins: a branded YachtieLink 404 page with auth-aware routing, and a nationality SVG flag toggle on the public profile hero. The 404 is an async server component that checks auth state and routes logged-in users to their profile, guests to `/welcome`. The flag feature adds a `show_nationality_flag` DB column, a `CountryFlag` component using flagcdn.com (no bundle impact, on-demand loading), a settings toggle, and wires it into the public profile hero — where the SVG flag takes precedence over the existing emoji flag when both toggles are enabled.

## Files Changed

**New:**
```
app/not-found.tsx                                    (replaced placeholder)
components/ui/CountryFlag.tsx                        (new SVG flag component)
supabase/migrations/20260401000005_nationality_flag.sql
```

**Modified:**
```
app/(protected)/app/profile/settings/page.tsx        (toggle + load + save)
components/public/HeroSection.tsx                    (SVG flag rendering)
components/public/PublicProfileContent.tsx           (UserProfile type + pass-through)
lib/queries/profile.ts                               (add show_nationality_flag to SELECT)
```

**Note on scope:** `HeroSection.tsx`, `PublicProfileContent.tsx`, and `lib/queries/profile.ts` are outside the strict allowed list but are required to wire the flag feature end-to-end. Changes are minimal and additive. Flagging for reviewer awareness.

## Migrations

- [x] Migration added: `supabase/migrations/20260401000005_nationality_flag.sql`

Adds `show_nationality_flag boolean NOT NULL DEFAULT false` to `users` table. Safe — `DEFAULT false` means no existing profile shows the flag until the user opts in. No RLS changes needed (the column is read/written through existing user update paths).

## Tests

- [x] Type check passed (both passes — initial + post-fix, clean)
- [x] Drift check passed (`npm run drift-check` — 0 new warnings)
- [x] /yl-review passed — BLOCK resolved, reviewer verdict cleared
- Manual QA notes:
  - 404 page: auth check now in try/catch — Supabase failure degrades to guest view
  - Flag component: `onError` hides broken image on CDN failure, no layout breakage
  - Settings page: toggle sublabel is context-aware (hints when no home country set, explains precedence when country is set)
  - Read model: `show_nationality_flag` added to both `getUserById` and `getUserByHandle`

## Fixes Applied (post-review)

1. **`not-found.tsx`** — wrapped `getUser()` in try/catch, `user` defaults to `null` on Supabase failure
2. **`CountryFlag.tsx`** — added `onError` handler to hide broken `<img>` on CDN failure
3. **`lib/queries/profile.ts`** — added `show_nationality_flag` to `getUserById` SELECT (read model parity)
4. **Settings sublabel** — now context-aware: "Set a home country above to enable" when none set; "Replaces home country flag" when country is set

## Risks

1. **flagcdn.com dependency** — CDN-served images. On failure, `onError` hides the element — no broken layout. No bundle impact.

2. **Supabase type cast in settings page** — `show_nationality_flag` isn't in generated types yet (pre-migration). Narrow cast used. Should regenerate types after migration runs.

3. **Files outside allowed list** — Required for end-to-end wiring. Changes are purely additive.

## Overlap Detected

- [x] None

## Recommended Merge Order

No dependencies on other lanes. Can merge independently.

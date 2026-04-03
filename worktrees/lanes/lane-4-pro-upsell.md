# Lane 4 — Pro Upsell Consistency

**Branch:** `chore/pro-upsell-consistency`
**Worktree:** `yl-wt-4`
**Model:** Sonnet | **Effort:** medium
**Sprint ref:** Rally 009 Session 6, Lane 4

---

## Objective

Create one standard upgrade CTA pattern and retrofit across the entire app. Every Pro upsell should use consistent copy, style, and CTA.

## Migration Note

**No migration for this lane.** No database changes needed.

## Tasks

### Task 1: Audit Current Upsells

Search codebase for all upgrade/upsell CTAs:
- Search for: "upgrade", "pro", "crew pro", "founding member", "upsell", "getProStatus", "subscription"
- Document each: location, copy, style, CTA action
- Note inconsistencies in copy, button text, styling

### Task 2: Standard Upsell Component

**File:** `components/ui/ProUpsellCard.tsx` (new)

```typescript
interface ProUpsellCardProps {
  variant: 'inline' | 'banner' | 'card';
  feature: string; // "detailed analytics" | "15 gallery photos" | etc.
  context?: 'insights' | 'photos' | 'network' | 'profile';
}
```

**Inline:** Single line — "Upgrade to Crew Pro for {feature}" with arrow link
**Banner:** Full-width card — feature benefit + price + CTA button
**Card:** Compact card for grids — icon + benefit + CTA

All variants:
- Consistent copy pattern: lead with benefit, not product name
- Same CTA text: "Upgrade to Crew Pro" (NOT "Go Pro", "Get Pro", "Upgrade now")
- Founding member pricing shown if applicable
- Links to `/app/more` billing section (or Stripe checkout)
- Respect section colors from context prop

### Task 3: Retrofit

Replace ALL existing upsell CTAs with `ProUpsellCard`:
- Insights tab (free tier teaser) — `variant="card"`
- Photo gallery (limit reached) — `variant="inline"`
- Profile (custom subdomain) — `variant="inline"`
- Network (if any Pro features gated) — `variant="banner"`
- CV generation (if Pro templates exist) — `variant="inline"`
- Any other locations found in the audit

### Task 4: Design System Documentation

Add upsell pattern note to `docs/design-system/patterns/page-layout.md` (append a section, don't rewrite):
- When to use each variant
- Copy formula: "{Benefit} with Crew Pro" not "Crew Pro gives you {feature}"
- Never use "Go Pro" (sounds like GoPro camera)

## Allowed Files

- `components/ui/ProUpsellCard.tsx` — new
- Any page/component that currently has an upsell CTA — modify
- `docs/design-system/patterns/page-layout.md` — append upsell pattern

## Forbidden Files

- `supabase/migrations/*`
- `lib/database.types.ts`
- `app/api/*` — no new endpoints
- CV wizard components (Lane 1)
- Report/bug report components (Lane 2)
- Experience transfer components (Lane 3)
- Core page layouts or navigation

## Patterns to Follow

- Read `docs/design-system/patterns/page-layout.md` for layout patterns
- Read `docs/design-system/style-guide.md` for colours and typography
- Read `lib/section-colors.ts` for section color mapping
- Check `lib/queries/profile.ts` or similar for `getProStatus()` usage
- Follow existing card/component patterns in `components/ui/`

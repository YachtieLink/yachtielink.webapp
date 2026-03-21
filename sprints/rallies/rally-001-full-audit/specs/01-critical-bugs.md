# Spec 01 — Critical Bugs

**Goal:** Fix 7 confirmed bugs that will cause user-visible failures at launch.

---

## Bug 1: Broken Legal Links on Welcome Page

**File:** `app/(auth)/welcome/page.tsx`
**Lines:** 46, 50

**Current:**
```tsx
<Link href="/legal/terms" className="underline underline-offset-2">
```
```tsx
<Link href="/legal/privacy" className="underline underline-offset-2">
```

**Change to:**
```tsx
<Link href="/terms" className="underline underline-offset-2">
```
```tsx
<Link href="/privacy" className="underline underline-offset-2">
```

**Why:** Routes are `/terms` and `/privacy`, not `/legal/terms` and `/legal/privacy`. Current links 404.

---

## Bug 2: Theme localStorage Key Mismatch

Two files read/write different keys, so dark mode preference doesn't persist.

### File 1: `app/layout.tsx` line 50
**Current:** `var stored = localStorage.getItem('yl-theme');`
**No change needed** — this is the canonical key.

### File 2: `app/(protected)/app/more/page.tsx`

**Line 67 — Current:**
```tsx
const stored = localStorage.getItem('theme') as Theme | null
```
**Change to:**
```tsx
const stored = localStorage.getItem('yl-theme') as Theme | null
```

**Line 95 — Current:**
```tsx
localStorage.setItem('theme', t)
```
**Change to:**
```tsx
localStorage.setItem('yl-theme', t)
```

---

## Bug 3: Dark Mode Teal Variable Bug

Components using `var(--teal-500)`, `var(--teal-600)`, `var(--teal-700)` etc. are not dark-mode-aware. The `.dark` block in `globals.css` overrides semantic variables but not the raw `--teal-*` palette.

### Fix approach: Replace raw teal vars with semantic vars in all affected components.

**The mapping:**
| Raw variable | Replace with |
|---|---|
| `var(--teal-500)` | `var(--color-interactive)` |
| `var(--teal-600)` | `var(--color-interactive-hover)` |
| `var(--teal-700)` | `var(--color-teal-700)` |
| `var(--card)` | `var(--color-surface)` |
| `var(--foreground)` | `var(--color-text-primary)` |
| `var(--muted)` | `var(--color-surface-raised)` |
| `var(--muted-foreground)` | `var(--color-text-secondary)` |
| `var(--border)` | `var(--color-border)` |

### Files to update (do find-and-replace within each file):

1. **`components/profile/IdentityCard.tsx`**
   - `var(--card)` → `var(--color-surface)`
   - `var(--border)` → `var(--color-border)`
   - `var(--muted)` → `var(--color-surface-raised)`
   - `var(--muted-foreground)` → `var(--color-text-secondary)`
   - `var(--foreground)` → `var(--color-text-primary)`
   - `var(--teal-500)` → `var(--color-interactive)`
   - `var(--teal-600)` → `var(--color-interactive-hover)`

2. **`app/(protected)/app/profile/page.tsx`** (floating CTA)
   - `bg-[var(--teal-500)]` → `bg-[var(--color-interactive)]`
   - `hover:bg-[var(--teal-600)]` → `hover:bg-[var(--color-interactive-hover)]`

3. **`app/(protected)/app/more/page.tsx`**
   - `var(--card)` → `var(--color-surface)`
   - `var(--border)` → `var(--color-border)`
   - `var(--muted)` → `var(--color-surface-raised)`
   - `var(--muted-foreground)` → `var(--color-text-secondary)`
   - `var(--foreground)` → `var(--color-text-primary)`
   - `var(--teal-500)` → `var(--color-interactive)`

4. **`components/insights/UpgradeCTA.tsx`**
   - `var(--card)` → `var(--color-surface)`
   - `var(--foreground)` → `var(--color-text-primary)`
   - `var(--muted)` → `var(--color-surface-raised)`
   - `var(--muted-foreground)` → `var(--color-text-secondary)`
   - `var(--teal-700)` → `var(--color-teal-700)`
   - `var(--teal-800)` → `var(--color-teal-800)`

**Important:** After replacing, verify that `globals.css` defines dark-mode values for all semantic vars used. The `.dark` block should already have overrides for `--color-interactive`, `--color-surface`, etc.

**Search for any remaining raw teal usage:** `grep -r "var(--teal-" components/ app/` — fix any remaining hits.

---

## Bug 4: Copy Bugs in Onboarding Done Step

**File:** `components/onboarding/Wizard.tsx`

Search for `yachtielink.com` and replace with `yachtie.link`.

Search for `Audience tab` (or `Audience`) in the done step and replace with `Network tab` (or `Network`).

---

## Bug 5: "checkmark" Literal Text in DeepLinkFlow

**File:** `components/endorsement/DeepLinkFlow.tsx`

Search for the string `checkmark` that renders as literal text in the already-endorsed state.

**Replace with:**
```tsx
<span className="text-2xl text-[var(--color-success)]">✓</span>
```

Or use an SVG checkmark icon consistent with the rest of the app.

---

## Bug 6: CookieBanner Overlaps BottomTabBar

**File:** `components/CookieBanner.tsx` line 18

**Current:**
```tsx
<div className="fixed bottom-0 left-0 right-0 p-4 bg-[var(--card)] border-t border-[var(--border)] z-50">
```

**Change to:**
```tsx
<div className="fixed bottom-[calc(var(--tab-bar-height,4rem)+env(safe-area-inset-bottom,0px))] left-0 right-0 p-4 bg-[var(--color-surface)] border-t border-[var(--color-border)] z-50">
```

This positions the banner above the tab bar. Also fixes the raw `--card` and `--border` vars while we're here.

---

## Bug 7: Stripe Webhook Always Returns 200

**File:** `app/api/stripe/webhook/route.ts`

The handler returns `{ received: true }` (200) at line 132 regardless of whether DB updates succeeded. If the Supabase `.update()` fails, the subscription change is silently lost.

### Fix:

For the `customer.subscription.created` / `customer.subscription.updated` case (line 58-64), capture the result:

**Current (line 58-64):**
```tsx
await supabase.from('users').update({
  subscription_status: isActive ? 'pro' : 'free',
  subscription_plan: isActive ? plan : null,
  subscription_ends_at: subscriptionEndsAt,
  show_watermark: !isActive,
  ...(isActive && isFoundingMember ? { founding_member: true } : {}),
}).eq('id', userId);
```

**Change to:**
```tsx
const { error: updateError } = await supabase.from('users').update({
  subscription_status: isActive ? 'pro' : 'free',
  subscription_plan: isActive ? plan : null,
  subscription_ends_at: subscriptionEndsAt,
  show_watermark: !isActive,
  ...(isActive && isFoundingMember ? { founding_member: true } : {}),
}).eq('id', userId);

if (updateError) {
  console.error('Webhook: failed to update user subscription', updateError);
  return NextResponse.json({ error: 'DB update failed' }, { status: 500 });
}
```

Do the same for the `customer.subscription.deleted` case (line 95-102):

```tsx
const { error: deleteError } = await supabase.from('users').update({
  subscription_status: 'free',
  subscription_plan: null,
  subscription_ends_at: null,
  show_watermark: true,
  custom_subdomain: null,
  template_id: null,
}).eq('id', userId);

if (deleteError) {
  console.error('Webhook: failed to downgrade user', deleteError);
  return NextResponse.json({ error: 'DB update failed' }, { status: 500 });
}
```

---

## Verification

1. `npm run build` — must pass with no type errors
2. Visit `/welcome` — "Terms" and "Privacy Policy" links must not 404
3. Toggle dark mode in More page, reload — theme must persist
4. Check all components in dark mode — no light-teal on dark backgrounds
5. Complete onboarding wizard to done step — URL shows `yachtie.link`, text says "Network"
6. Cookie banner should appear above the tab bar on first visit

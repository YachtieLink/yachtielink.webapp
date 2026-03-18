# Spec 07 — Animation System (Framer Motion)

**Goal:** Install framer-motion and add 6 core animations that transform the app from "instant DOM swaps" to "feels like a native app."

---

## Dependencies to install

```bash
npm install framer-motion
```

---

## Files to modify

- `components/ui/BottomSheet.tsx` — slide-up animation
- `components/ui/Toast.tsx` — entrance/exit animation
- `app/(protected)/app/profile/page.tsx` — card stagger (via wrapper)
- `components/profile/IdentityCard.tsx` — QR reveal animation

## Files to create

- `components/ui/AnimatedCard.tsx` — reusable stagger-in wrapper
- `components/ui/PageTransition.tsx` — tab content fade transition

---

## Step 1: Create AnimatedCard Wrapper

**Create `components/ui/AnimatedCard.tsx`:**

```tsx
'use client'

import { motion } from 'framer-motion'

interface AnimatedCardProps {
  children: React.ReactNode
  index?: number
  className?: string
}

export function AnimatedCard({ children, index = 0, className }: AnimatedCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: 0.3,
        delay: index * 0.06,
        ease: 'easeOut',
      }}
      className={className}
    >
      {children}
    </motion.div>
  )
}
```

---

## Step 2: Add Card Stagger to Profile Page

**File:** `app/(protected)/app/profile/page.tsx`

Wrap each section card in `<AnimatedCard>` with incrementing index.

The profile page is a server component, so we need a client wrapper. Create a thin client component:

**Create `components/profile/ProfileCardList.tsx`:**

```tsx
'use client'

import { AnimatedCard } from '@/components/ui/AnimatedCard'

export function ProfileCardList({ children }: { children: React.ReactNode[] }) {
  return (
    <>
      {children.map((child, i) => (
        <AnimatedCard key={i} index={i}>
          {child}
        </AnimatedCard>
      ))}
    </>
  )
}
```

Then in `profile/page.tsx`, wrap the cards:

```tsx
import { ProfileCardList } from '@/components/profile/ProfileCardList'

// In the return, replace the flat list of cards with:
return (
  <div className="flex flex-col gap-4 pb-24">
    <ProfileCardList>
      {[
        <IdentityCard key="id" ... />,
        <WheelACard key="wheel" ... />,
        <AboutSection key="about" ... />,
        <YachtsSection key="yachts" ... />,
        <CertsSection key="certs" ... />,
        <EndorsementsSection key="end" ... />,
      ]}
    </ProfileCardList>

    {/* Floating CTA stays outside the animated list */}
    {nextStep ? ( ... ) : ...}
  </div>
)
```

---

## Step 3: Bottom Sheet Slide Animation

**File:** `components/ui/BottomSheet.tsx`

Read the existing file first. It likely uses conditional rendering (`if (!open) return null`).

Replace with framer-motion's `AnimatePresence`:

```tsx
'use client'

import { AnimatePresence, motion } from 'framer-motion'

// Wrap the entire return in AnimatePresence:
export function BottomSheet({ open, onClose, title, children }: Props) {
  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-50 bg-black/40"
            onClick={onClose}
          />

          {/* Sheet */}
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed bottom-0 left-0 right-0 z-50 rounded-t-2xl bg-[var(--color-surface)] shadow-xl"
            role="dialog"
            aria-modal="true"
            aria-label={title}
          >
            {/* Handle bar */}
            <div className="flex justify-center pt-3 pb-1">
              <div className="h-1 w-8 rounded-full bg-[var(--color-border)]" />
            </div>

            {/* Title */}
            {title && (
              <div className="px-4 pb-2">
                <h2 className="text-lg font-semibold text-[var(--color-text-primary)]">{title}</h2>
              </div>
            )}

            {/* Content */}
            <div className="overflow-y-auto px-4 pb-6 max-h-[70vh]">
              {children}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
```

**Note:** Read the existing BottomSheet first and adapt this pattern to its current props/structure. The key additions are the `AnimatePresence` wrapper, `motion.div` with initial/animate/exit, and the spring transition.

---

## Step 4: QR Code Reveal Animation

**File:** `components/profile/IdentityCard.tsx`

Replace the conditional QR section with an animated version.

**Current (lines 140-157):**
```tsx
{showQR && (
  <div className="flex flex-col items-center gap-3 pt-1">
    ...
  </div>
)}
```

**Change to:**
```tsx
import { AnimatePresence, motion } from 'framer-motion'

// In the return:
<AnimatePresence>
  {showQR && (
    <motion.div
      initial={{ height: 0, opacity: 0 }}
      animate={{ height: 'auto', opacity: 1 }}
      exit={{ height: 0, opacity: 0 }}
      transition={{ duration: 0.25, ease: 'easeOut' }}
      className="overflow-hidden"
    >
      <div className="flex flex-col items-center gap-3 pt-1">
        <div className="bg-white p-3 rounded-xl">
          <QRCode
            id="profile-qr-svg"
            value={profileUrl}
            size={160}
            level="M"
          />
        </div>
        <button
          onClick={downloadQR}
          className="text-xs text-[var(--color-interactive)] hover:underline"
        >
          Download QR code
        </button>
      </div>
    </motion.div>
  )}
</AnimatePresence>
```

---

## Step 5: Toast Entrance/Exit Animation

**File:** `components/ui/Toast.tsx`

Read the existing file. Wrap individual toast items in `motion.div` with `AnimatePresence`:

```tsx
import { AnimatePresence, motion } from 'framer-motion'

// For each toast item:
<AnimatePresence>
  {toasts.map((toast) => (
    <motion.div
      key={toast.id}
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ type: 'spring', damping: 20, stiffness: 300 }}
    >
      {/* existing toast content */}
    </motion.div>
  ))}
</AnimatePresence>
```

---

## Step 6: Touch Feedback on Interactive Elements

This doesn't require framer-motion — just Tailwind classes.

Add `active:scale-[0.98] transition-transform` to:

1. **All `<Button>` components** — `components/ui/Button.tsx`, add to the base className
2. **Tab bar items** — `components/nav/BottomTabBar.tsx`, add to the Link className
3. **Cards that are clickable** — any card with onClick or wrapped in Link

For the `Button` component, find the base classes and add:
```
active:scale-[0.98] transition-transform
```

---

## Verification

1. `npm run build` — no type errors
2. Open profile page — cards should cascade in with staggered fade
3. Open bottom sheet (e.g., WheelACard checklist) — should slide up from bottom with spring physics
4. Toggle QR code — should expand/collapse smoothly
5. Trigger a toast (e.g., copy profile link) — should slide in with spring
6. Tap any button — should slightly shrink on press

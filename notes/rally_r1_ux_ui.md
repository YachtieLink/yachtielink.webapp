# Rally R1 — UX/UI Deep Analysis

**Agent:** 1 (UX/UI, Intuitiveness, Layout, Flow, Delight)
**Date:** 2026-03-16
**Scope:** Full codebase read of all user-facing components, routes, styles, and flows.

---

## 1. First Impressions & Onboarding

### Welcome Page (`app/(auth)/welcome/page.tsx`)

**Strengths:**
- Clean, centered layout. Value prop subtitle "Your professional identity on the water" is concise.
- Two clear CTAs (Sign in / Create account) with good visual hierarchy (filled primary vs outlined secondary).

**Issues & Opportunities:**
- **No hero image, illustration, or social proof.** The page is text-only with a plain `<h1>`. For a product where first impression = conversion, this is a missed opportunity. A yacht crew member landing here from a WhatsApp link sees zero evidence that this is worth their time.
  - **Recommendation:** Add a single compelling visual (a sample profile card mockup, or a photo of crew on deck) and 1-2 lines of social proof ("Used by 500+ crew in Antibes" or a quote). Even a subtle background gradient or the brand teal wash would help.
- **No "preview before signup" flow.** Users who receive a shared profile link and want to see what their own would look like have no way to preview without committing. A "See a sample profile" link would reduce signup anxiety.
- **"Phase 1A" note in comments says OAuth is disabled.** This is fine for launch, but the welcome page should feel complete -- consider adding a subtle divider "or" section below the buttons as a placeholder that won't look empty.
- **Legal links point to `/legal/terms` and `/legal/privacy`** but the actual routes are `/terms` and `/privacy`. This is a **broken link bug** that will 404.

### Signup Page (`app/(auth)/signup/page.tsx`)

**Strengths:**
- Confirmation email screen is well-designed with the teal circle + envelope icon.
- "Build your portable yachting profile" subtitle reinforces value.
- `returnTo` parameter is preserved through the flow -- good for deep link endorsement flow.

**Issues:**
- **No password strength indicator.** Only `minLength={8}` constraint. Crew are not tech-savvy -- a visible strength bar would reduce "I forgot my password" support load.
- **No "show password" toggle.** Standard UX expectation on mobile, especially when typing on a phone screen.

### Login Page (`app/(auth)/login/page.tsx`)

**Strengths:**
- "Forgot password?" link is properly placed.
- Error display with `role="alert"` is accessible.

**Issues:**
- **Same missing "show password" toggle.**
- The error message displays Supabase's raw error text (e.g., "Invalid login credentials"). These should be friendlier: "Email or password is incorrect. Need to reset?"

### Onboarding Wizard (`components/onboarding/Wizard.tsx`)

**Strengths:**
- **Segmented progress bar** with transition animation is clean and feels fast.
- **Step counter** ("Step 1 of 5") provides clear context.
- **Handle step** has real-time availability checking with debounce (450ms), suggestions on conflict, and live format validation. This is well-executed.
- **Role step** has search + department chips + custom role fallback. Thorough.
- **Yacht step** has search/create toggle, carries query into "create" if search fails. Smart.
- **Enter key support** on input fields advances to next step. Good keyboard UX.
- **Skip option** on yacht and endorsement steps respects user autonomy.
- **Auto-advances to profile** on "Done" step with a 2.2s delay + spinner.

**Issues & Opportunities:**
- **No back button.** The wizard has no way to return to the previous step. If a user enters their name wrong and advances, they can only fix it from the account settings after completing onboarding. This is a significant UX gap.
  - `getStartingStep()` calculates where to resume but there is no `setStepIndex(stepIndex - 1)` anywhere. Add a back button to the StepShell or progress bar area.
- **No animation between steps.** The content just swaps instantly. A simple slide or fade transition (e.g., Framer Motion `AnimatePresence`) would make the wizard feel polished rather than utilitarian.
- **StepDone shows "yachtielink.com/u/{handle}"** but the actual domain is `yachtie.link`. This is a **copy bug** on line 965.
- **StepDone references "Audience tab"** but the tab is labeled "Network" in the bottom bar. This is a **terminology mismatch** that will confuse new users (line 967).
- **StepEndorsements email validation** uses a basic regex. Users who type "john@gmail" (missing TLD) will get no feedback -- the send button just stays disabled. Add inline validation feedback.
- **StepRole loading state** shows a bare spinner with no text. "Loading roles..." would reduce uncertainty.
- **No progress persistence indicator.** If the user closes the browser mid-wizard and returns, they resume from the right step (good) but there's no "Welcome back, you left off at step 3" message.

---

## 2. Navigation & Information Architecture

### Bottom Tab Bar (`components/nav/BottomTabBar.tsx`)

**Strengths:**
- 5 tabs with outline/filled icon pairs. Clean implementation.
- `aria-label="Main navigation"` on the `<nav>` element.
- Active state uses `pathname.startsWith(tab.href)` which correctly highlights nested routes.
- Safe area handling via CSS custom properties (`--safe-area-bottom`, `--tab-bar-height`).

**Issues & Opportunities:**
- **Tab label "Network" vs page title inconsistency.** The Network page component (`AudienceTabs`) uses the term "Audience" in its code, while the tab says "Network". The onboarding done step calls it "Audience tab". Pick one and be consistent everywhere.
- **No badge/notification dot** on Network tab for pending endorsement requests. When someone requests an endorsement from you, there's no visual indicator on the tab bar. This is a major engagement miss -- crew check their requests tab only if they know something is waiting.
- **No haptic feedback on tab tap.** On mobile Safari, `navigator.vibrate()` is not supported, but a subtle scale animation on press (`active:scale-95`) would give tactile feedback.
- **Tab bar has no safe area background extension.** The `bottom-tab-bar` class handles padding but the background color stops at the tab bar edge. On iPhones with home indicators, the area below the tab bar should have the same background color. The CSS does `padding-bottom: var(--safe-area-bottom)` which should handle this, but verify on device.
- **Icon size is fixed at 24x24 (`h-6 w-6`).** On larger phones, these feel small. Consider `h-6 w-6 sm:h-7 sm:w-7`.
- **Label font size is 10px.** This is at the minimum readable threshold. On small phones (iPhone SE), this will be strained.
- **No transition animation** when switching between tabs. The content simply swaps. A cross-fade would feel more app-like.

### Information Architecture Assessment

The 5-tab structure is appropriate:
1. **My Profile** -- Hub, identity, sharing. Correct as the home/default tab.
2. **CV** -- PDF generation + preview. Logically distinct from profile.
3. **Insights** -- Pro analytics. Good separation from profile.
4. **Network** -- Colleagues + endorsements. Makes sense as a social tab.
5. **More** -- Settings grab bag. Standard pattern.

**Potential confusion points:**
- **Where do I edit my profile?** The profile page has section-level "Edit" / "Add" links, but there's no single "Edit Profile" button. Users may look for it and not find it immediately. The floating CTA helps guide new users, but after setup is complete, the CTA becomes "Share profile" and editing becomes less discoverable.
- **CV tab shows a preview of the public profile.** This is slightly confusing -- "is this my profile or my CV?" The framing could be clearer: "This is how your profile looks when exported as a PDF."
- **Endorsements live in Network tab but also show on Profile page.** This is fine (read vs. manage), but the "Request endorsements" CTA appears in both places, which could be confusing.
- **Cert management is split**: Add/view on Profile page (CertsSection), detailed manager linked from Insights (Pro feature). This split is not obvious.

---

## 3. Profile Experience (Private & Public)

### Private Profile Page (`app/(protected)/app/profile/page.tsx`)

**Strengths:**
- **Identity Card at the top** with photo, name, role, departments, share/copy/QR buttons. Prominent and well-positioned.
- **Progress Wheel (WheelACard)** with bottom sheet checklist. Clear progress tracking.
- **Floating CTA** that adapts based on completion state (next setup step -> request endorsements -> share profile). Smart progressive disclosure.
- **Section cards** (About, Yachts, Certs, Endorsements) with consistent rounded-2xl styling.
- All sections have empty states with helpful CTAs.

**Issues & Opportunities:**
- **No page-level padding/margin at the top.** The `flex flex-col gap-4 pb-24` starts content right at the top with no breathing room. On iOS, content will be pressed against the status bar. Add `pt-4 px-4` to the container.
  - Looking more carefully: the layout provides `<main className="flex-1 pb-tab-bar">` but no horizontal padding. Each card must handle its own padding. The IdentityCard has `p-5` but the entire page has no `px-4` wrapper. **This means cards extend edge-to-edge with no margin**, which is intentional (card-based layout), but the gap between cards (gap-4 = 16px) with no side margins creates an unusual visual pattern. Most apps use `mx-4` for card layouts.
- **IdentityCard uses different CSS variable naming** than the rest of the app. It uses `var(--card)`, `var(--border)`, `var(--muted)`, `var(--foreground)`, `var(--teal-500)` -- the shadcn/ui shorthand variables. Other components use `var(--color-surface)`, `var(--color-border)`, etc. This inconsistency won't cause visual bugs (both resolve correctly) but creates maintenance confusion.
- **QR code panel has no animation.** It appears/disappears instantly via conditional rendering. A slide-down or fade would feel premium.
- **The "edit badge" on the photo** (line 87-89 of IdentityCard) uses a text character "pencil" (`✎`) in a tiny 20x20 circle. This is hard to see and the icon rendering varies by OS. Use an SVG icon.
- **Photo placeholder** shows just the first letter initial in a plain circle. Consider a more inviting empty state: a tinted silhouette or "Add photo" text.
- **Share button is small** (text-xs, px-3 py-1.5). For the most important action in the app (sharing your profile), this should be more prominent. The Share button should be the largest, most visually distinct button on the card.
- **The Copy and QR buttons use `var(--muted)` background.** These look disabled/secondary. The three action buttons (Share/Copy/QR) should have clearer visual hierarchy: Share = primary teal, Copy = outlined, QR = icon-only.
- **No skeleton/loading state** for the profile page. Since it's server-rendered, there's no flash, but navigating between tabs shows a blank page until the server responds. Consider `loading.tsx` files with skeleton screens.

### Public Profile Page (`app/(public)/u/[handle]/page.tsx` + `PublicProfileContent.tsx`)

**Strengths:**
- **SEO metadata** is well-implemented: OpenGraph + Twitter cards with profile photo, name, role.
- **Colleague / 2nd connection badges** are a powerful social feature. When a logged-in viewer sees "Colleague - 2 yachts in common" or "2nd connection - Sarah worked with James on MY Lady Tara", it creates trust and engagement.
- **"You worked here" indicator** on shared yachts in employment history. Nice touch.
- **Contact visibility toggles** are respected (show_phone, show_whatsapp, etc.).
- **Cert expiry status** shown with color-coded labels (Valid/Expiring/Expired).

**Issues & Opportunities:**
- **No YachtieLink branding on the public profile.** When a captain receives this link, they see the person's profile but no clear indicator of what platform this is. Add a subtle "Powered by YachtieLink" footer or a small logo in the header.
- **No CTA for non-logged-in viewers** to create their own profile. The most viral moment is when someone views a colleague's impressive profile and thinks "I need one of these." The page should have a subtle "Create your own profile" nudge at the bottom.
  - The endorsement deep link flow does this well (offers signup/login), but the regular public profile view does not.
- **Share button on public profile** (`ShareButton.tsx`) is a single pill button. Consider adding specific share targets: "Copy link", "Share via WhatsApp" (most common in this audience), "QR Code". WhatsApp deep link: `https://wa.me/?text=...`.
- **No "endorse this person" action** on the public profile for logged-in viewers. If I'm viewing a colleague's profile, I should be able to endorse them directly from here.
- **Employment history uses a tiny dot bullet** (h-2 w-2). The timeline could be more visually rich -- a vertical line connecting dots, yacht type icons, etc.
- **Photo is 96x96 (h-24 w-24).** For the hero section of a profile meant to impress, this feels small. Consider 120px or larger.
- **QR code on public profile** (`showQrCode` prop) defaults to false and is rendered left-aligned at the bottom. This seems like a PDF-only feature that leaked into the web view. The implementation uses `fgColor="var(--color-text-tertiary)"` which renders a CSS variable name as a string -- this may not work as expected with the QR code library, which likely expects a hex color.

---

## 4. Micro-interactions & Polish

### Loading States

- **Wizard role step**: Shows a spinner. Good.
- **Wizard yacht search**: Shows a spinner. Good.
- **Handle availability check**: Shows "Checking availability..." text. Good.
- **Profile page**: No loading state. Server-rendered, so it's either fully loaded or shows nothing during navigation.
- **Network page**: No loading state (server-rendered).
- **Deep link flow**: Shows bare "Loading..." text (line 212 of DeepLinkFlow.tsx). Should be a proper skeleton or branded spinner.

**Missing loading states:**
- **No `loading.tsx` files in any route.** Next.js supports route-level loading files that show during navigation. Without these, navigating between tabs shows no feedback until the server responds. This is the biggest perceived-speed issue in the app.
- **No skeleton screens anywhere.** The `Skeleton` component exists in `ui/skeleton.tsx` but is never imported or used in any component. It should be used in loading.tsx files for each tab.
- **Button loading states** are well-implemented (the Button component has a `loading` prop with a spinner), but not all buttons use it. For example, the sign-in button on `login/page.tsx` manually toggles text ("Signing in...") rather than using the Button component.

### Transitions & Animations

- **Present:** Progress bar segments have `transition-all duration-300`. Progress wheel has `transition-all duration-500`. Tab bar active state has `transition-colors`.
- **Missing:**
  - No page transitions between tab views.
  - No entry animations for cards on the profile page (staggered fade-in would feel premium).
  - No expand/collapse animation for yacht section accordion (just instant show/hide).
  - No QR code reveal animation.
  - No toast entrance/exit animation. Toasts appear and disappear instantly.
  - Bottom sheet has no slide-up animation -- it just appears via conditional rendering.
  - No animation on the endorsement success checkmark.
  - Onboarding wizard step transitions are instant swaps.

### Optimistic Updates

- **Not implemented anywhere.** When a user sends an endorsement request, cancels a request, or declines a request, the UI waits for the server response before updating. Given the audience (crew on spotty marina WiFi), optimistic updates would significantly improve perceived responsiveness.

---

## 5. Emotional Design & Delight

### What Creates the "Wow" Moment?

Currently, the app is **competent but emotionally flat**. It does what it says but doesn't create moments of delight. Specific observations:

- **The IdentityCard is the best candidate for a "wow" moment** but it's styled as a plain card. It should feel like holding a premium business card -- perhaps a subtle gradient, a border glow, or a shadow that makes it feel elevated.
- **The progress wheel** is functional but generic. When you complete all 5 steps, there's no celebration. A confetti animation, a badge reveal, or even a color change would mark the achievement.
- **Endorsement receipt** has no notification or celebration. When someone endorses you, the next time you open the app, the endorsement just... appears in the list. A "New endorsement from Sarah!" notification or modal would create dopamine.
- **The "Welcome aboard" message** in the onboarding done step uses an emoji party popper. This is the closest the app gets to delight, but it's followed by a bare spinner. The transition to the profile should feel more like an arrival.

### What Would Make Someone Show Their Captain?

The public profile needs to look **more impressive** when shared. Currently it's a clean list of information. Consider:
- A hero banner area (even a subtle gradient with the teal brand).
- Endorsement count or a "trust score" metric.
- A visual timeline for employment history.
- A professional "verified" indicator for certs that are in good standing.

### Personality

The app has almost no personality or voice. The copy is functional ("What's your name?", "Continue") but never charming. Compare:
- Current: "Add your certifications to complete your profile."
- Better: "Add your certs -- STCW, ENG1, PYA... captains check these first."

The copy should speak the language of yacht crew. Industry terms like "aboard", "crew", "season", "rotation" should appear naturally.

---

## 6. Mobile-First Considerations

### Thumb Zones

- **Bottom tab bar** is correctly positioned for thumb reach.
- **Floating CTA** is `bottom-20` (80px above bottom), which sits just above the tab bar. This is in the natural thumb zone.
- **Share/Copy/QR buttons** on the IdentityCard are small (text-xs, ~32px height) and positioned in the upper area of the screen. On taller phones, these require a stretch.
- **"Add" links** on profile sections (Yachts, Certs) are right-aligned and small (text-sm). These are touch targets that should be at least 44x44px per Apple's HIG.

### Touch Targets

- **Tab bar items** are full flex-1 width, which is good, but the height is only 64px (h-16). With the 10px label text, the actual tap target area is fine.
- **Endorsement "Read more" button** is `text-xs` with no padding. Touch target is approximately 12px tall. Too small.
- **"Edit attachment" link** in the yacht section expanded state is `text-sm` with no padding. ~14px tall. Too small.
- **Email remove button ("X")** in the onboarding endorsement step is a bare character with no explicit size. Should have a minimum 44x44px tap area.
- **Department chips** in onboarding are `px-3.5 py-1.5 text-sm` which is borderline acceptable (~36px tall).

### Scroll Behavior

- **No pull-to-refresh** implemented anywhere. Server-rendered pages would benefit from this (e.g., profile page to see new endorsements).
- **No scroll-to-top** behavior when tapping the active tab (standard iOS pattern).
- **`overscroll-behavior: none`** is set globally, which prevents the rubber-band scroll on iOS. This is a deliberate choice but may feel "un-native" to users who expect the bounce.

### Safe Areas

- CSS handles `env(safe-area-inset-bottom)` correctly for the tab bar.
- **No safe-area-inset-top handling.** On iPhones with Dynamic Island/notch, content may overlap the status bar. The profile page has no top padding, so the IdentityCard could collide with the status bar.
- The viewport meta tag sets `maximumScale: 1` which prevents pinch-to-zoom. This is standard for web apps but should be noted for accessibility.

---

## 7. Sharing & Virality Mechanics

### Share Flow (Private Profile -> IdentityCard)

**Current flow:**
1. User taps "Share" button on IdentityCard.
2. If `navigator.share` is available (mobile), triggers native share sheet.
3. Otherwise, copies link to clipboard.

**Issues:**
- The "Share" and "Copy" buttons are separate but the Share button falls back to Copy. So on desktop, both buttons do the same thing.
- **No share analytics tracking.** The share action doesn't record an event, so the "Link Shares" insight metric may not track shares from the profile page itself (only from the CV actions page, which uses a separate copyLink function).
- **No pre-formatted message.** The share text is generic: "Check out {name}'s profile on YachtieLink". For WhatsApp sharing (the primary channel), a more specific message would convert better: "Hey, check out my crew profile -- I've been building it on YachtieLink: {url}".

### Share Flow (Public Profile -> Viewer)

- The public profile has a `ShareButton` with the same share/copy logic.
- **Missing:** No "Create your own profile" CTA on the public profile. This is the single most important viral conversion point. Someone views a colleague's profile, is impressed, and should immediately see a way to create their own.

### QR Code UX

- QR code is hidden behind a toggle button ("QR") on the IdentityCard.
- The QR is 160px, which is adequate for close-range scanning.
- **Download option** generates an SVG. Good for printing on business cards.
- **Missing:** No full-screen QR mode for networking events. At a boat show or crew gathering, you want to flash a large QR from your phone. The current implementation is a small toggle in a card -- not prominent enough for event use.
  - **Recommendation:** Add a "Show full screen" option that displays the QR code on a white/dark background covering the full screen, with the user's name and handle below. Tap anywhere to dismiss.

### Endorsement Request -> Signup Funnel

This is well-designed:
1. Requester sends endorsement request with email.
2. Recipient receives email with a link to `/r/{token}`.
3. If not logged in, sees context card (who requested, which yacht) + sign in/create account.
4. `returnTo` parameter preserved through auth flow.
5. After auth, flows into DeepLinkFlow with mini-onboard if needed.
6. After endorsing, CTA says "Want endorsements too? Request yours."

**This is the best viral loop in the app.** The deep link flow is thoughtfully built with progressive disclosure (mini-onboard only if needed, yacht confirmation only if not already attached).

**Issues:**
- **The "already endorsed" state** (line 218 of DeepLinkFlow.tsx) shows "checkmark" as literal text instead of a checkmark icon. This is a **bug** -- it should be a styled SVG or emoji.
- The success message after endorsing says "Endorsement sent. {name} will be notified." -- does the notification actually work? Verify that the email/push notification is implemented.

---

## 8. Dark Mode Quality

### Implementation

Dark mode is implemented via a `.dark` class on `<html>`, toggled from localStorage with a system-preference fallback. The inline `<script>` in the head prevents flash-of-wrong-theme.

### Theme Variables

Both light and dark modes have comprehensive variable definitions in `globals.css`. The dark palette uses:
- Background: Slate 900 (#0f172a)
- Cards: Slate 800 (#1e293b)
- Primary: Teal 400 (#11BABB) -- brighter than light mode's Teal 700
- Muted foreground: Slate 400 (#94a3b8)

### Issues

- **Inconsistent variable usage.** The More page, Insights page, and several profile sections use the shorthand shadcn variables (`var(--card)`, `var(--foreground)`, `var(--teal-500)`, `var(--teal-700)`), while other components use the semantic variables (`var(--color-surface)`, `var(--color-text-primary)`, `var(--color-interactive)`). Both resolve correctly in light mode, but in dark mode:
  - `var(--teal-500)` resolves to `#11BABB` (a light theme variable that's NOT redefined in `.dark`). This means components using `var(--teal-500)` will show the **light mode teal** in dark mode. **This is a theming bug.** The `@theme` block defines `--color-teal-500` but `.dark` only overrides the shadcn shorthand variables, not the `--color-teal-*` variables.
  - Components using `text-[var(--teal-500)]` or `bg-[var(--teal-700)]` directly are not dark-mode-aware. They should use `text-[var(--color-interactive)]` or the shadcn `text-primary` instead.
  - Affected components: IdentityCard, WheelACard, AboutSection, YachtsSection, CertsSection, EndorsementsSection, AudienceTabs, InsightsPage, MorePage, UpgradeCTA.
- **The MorePage theme toggle** stores to `localStorage.getItem('theme')` but the root layout script reads `localStorage.getItem('yl-theme')`. **This is a bug** -- the theme preference won't persist across page reloads because the key names don't match.
- **Cookie banner** uses `bg-[var(--card)]` which works in dark mode but `border-t border-[var(--border)]` should also be fine.
- **The error alert on login/signup** uses `bg-red-50 dark:bg-red-900/20 dark:text-red-400` -- properly dual-themed. Good.

---

## 9. Accessibility

### Screen Reader Support

**Good:**
- Bottom tab bar has `aria-label="Main navigation"`.
- ProgressWheel has `role="progressbar"` with `aria-valuenow`, `aria-valuemin`, `aria-valuemax`.
- BottomSheet has `role="dialog"`, `aria-modal="true"`, `aria-label`.
- Toast container has `aria-live="polite"`.
- Input component has `aria-describedby` linking to error/hint text, `aria-invalid` on error.
- Error messages use `role="alert"`.

**Missing:**
- **No `<h1>` on the profile page.** The IdentityCard uses `<h1>` for the user's name, but semantically the page heading should be "My Profile" or similar, with the user's name as a subsection.
- **Yacht section accordion** uses a `<button>` with `aria-expanded` -- good. But the expandable content has no `id` or `aria-controls` linking button to content.
- **Tab bar icons** have no `aria-label` on the individual links. Screen readers will announce the label text ("My Profile") which is fine, but the icon `<span>` should have `aria-hidden="true"`.
- **QR code** has no alt text or screen reader description.
- **The IdentityCard photo edit badge** (the pencil icon) is a text character with no `aria-label`. The entire link goes to `/app/profile/photo` but a screen reader user won't know what the pencil means.
- **Endorsement "Read more" / "Show less"** button doesn't announce state change to screen readers.

### Color Contrast

- Primary text (#1a1a2e) on white (#ffffff): ratio ~14:1. Excellent.
- Secondary text (#64748b) on white: ratio ~4.7:1. Passes AA for body text.
- Tertiary text (#94a3b8) on white: ratio ~3:1. **Fails WCAG AA for body text** (requires 4.5:1). This affects hints, timestamps, and metadata throughout the app.
  - In dark mode: Tertiary (#64748b) on dark background (#0f172a): ratio ~3.4:1. Also fails AA.
- Teal interactive (#0D7377) on white: ratio ~5.4:1. Passes AA. Good.
- White text on teal (#0D7377): ratio ~5.4:1. Passes AA. Good.
- Cert status "Expiring soon" amber text on white: Should be checked -- amber-600 (#D97706) on white is ~3.5:1, which **fails AA**.
- **Green "available" text** in handle step: `text-green-600` (#16A34A) on white is ~3.3:1. **Fails AA.**

### Focus Management

- **No focus trap in the BottomSheet.** When the bottom sheet opens, focus should move into it and be trapped until closed. Currently, a keyboard user can Tab out of the sheet into the page behind it.
- **No focus restoration** when the BottomSheet closes. Focus should return to the triggering element.
- **Button focus-visible ring** is implemented via `focus-visible:ring-2 focus-visible:ring-ring/50`. Good.
- **Input focus ring** uses `focus:ring-2` (not `focus-visible`), which means it shows on mouse click too. Consider `focus-visible` for a cleaner mouse experience.

### Reduced Motion

- **Not supported.** The app has `animate-spin`, `transition-all`, `transition-colors` throughout but no `@media (prefers-reduced-motion: reduce)` overrides. Users with motion sensitivity will see spinners and transitions.
- **Recommendation:** Add `@media (prefers-reduced-motion: reduce) { *, *::before, *::after { animation-duration: 0.01ms !important; transition-duration: 0.01ms !important; } }` to globals.css.

---

## 10. Psychology of Making It Adorable

### Current State

The app is clean, professional, and functional. It is NOT adorable, memorable, or emotionally engaging. It feels like a well-built utility. For an app targeting creative, social professionals (yacht crew are highly social), this is a missed opportunity.

### Specific Recommendations for Delight

1. **Profile completion celebration.** When all 5 milestones are complete, the WheelACard should transform -- maybe the wheel fills with a gold ring, or the card background shifts to the brand gradient. A one-time confetti burst (use `canvas-confetti` package) on completion would be memorable.

2. **New endorsement celebration.** When a user opens the app and has a new endorsement, show a brief toast or modal: "Sarah endorsed your work on MY Lady Tara!" with a button to read it. This is the core engagement loop.

3. **Share count on IdentityCard.** Show "Shared 12 times" or "Profile viewed 47 times" (for Pro users) directly on the identity card. This creates a "my profile is alive" feeling and motivates further sharing.

4. **Personalized empty states.** Instead of "Add your certifications to complete your profile", try "Captains check STCW and ENG1 first -- add yours to stand out." Use industry knowledge to make empty states feel helpful, not generic.

5. **Seasonal/contextual touches.** The app knows what yachts users work on. During the Med summer season, a subtle "Med season is here" banner could create a sense of community. After the Antibes crew show, a "1,200 new profiles created this week" stat would show momentum.

6. **Micro-copy with personality.** The handle step says "Your unique @username on YachtieLink." This could be: "This is your URL -- share it like you share your number at the crew house." The voice should feel like a savvy crew friend, not a corporate platform.

7. **Endorsement quality coaching.** When writing an endorsement, provide prompts: "What was their biggest strength on board? How did they handle pressure? Would you work with them again?" This improves endorsement quality AND makes writing easier.

8. **"Your profile is ready to share" milestone.** After onboarding, instead of immediately showing the profile, show a card: "Your profile is live at yachtie.link/u/{handle}. Share it now!" with large WhatsApp/Copy/QR buttons. Make the first share the immediate next step.

9. **Streak/engagement counter.** "Profile updated 3 days ago" on the identity card. If stale: "Your profile hasn't been updated in 30 days -- agents notice fresh profiles." This creates habitual engagement without being a social network.

10. **The QR code should be brandable.** Allow users to add their photo to the center of the QR code. This makes it a recognizable personal brand asset for crew events.

---

## 11. Additional Code-Level Findings

### CSS Variable Naming Inconsistency

The codebase uses THREE different variable naming conventions:
1. **Semantic:** `var(--color-surface)`, `var(--color-text-primary)`, `var(--color-interactive)` -- used in newer components.
2. **shadcn shorthand:** `var(--card)`, `var(--foreground)`, `var(--muted)`, `var(--border)` -- used in older/profile components.
3. **Brand palette:** `var(--teal-500)`, `var(--teal-700)` -- used directly in many components.

This triple-system creates dark mode bugs (as noted in section 8) and maintenance headaches. **Recommendation:** Standardize on the semantic system and alias the shadcn variables. Create lint rules to catch direct palette variable usage.

### Missing Error Boundaries

The app has a root `error.tsx` but no route-level error boundaries. If the Insights page fails (e.g., Stripe API error), the entire app shows the error page. Each major route should have its own error.tsx.

### Missing `loading.tsx` Files

None of the route groups have `loading.tsx` files. This means:
- Navigating between tabs shows no feedback.
- The browser tab spinner is the only indication that something is loading.
- For server-rendered pages making multiple Supabase queries (Profile page makes 4, Network page makes 5+), the wait can be noticeable.

### CookieBanner Overlap

The CookieBanner renders `fixed bottom-0 z-50` which overlaps with the BottomTabBar (also `fixed bottom-0 z-50`). On first visit, the cookie banner will cover the tab bar. The banner should be positioned above the tab bar (`bottom-16` or `bottom-[calc(var(--tab-bar-height)+var(--safe-area-bottom))]`).

### The `pb-tab-bar` Double Usage

In the BottomSheet (line 77), the scrollable content has `className="overflow-y-auto pb-tab-bar px-4 pb-6"`. The `pb-tab-bar` and `pb-6` conflict -- both set padding-bottom. The last one in the cascade wins (pb-6), which means bottom sheet content may be clipped behind the tab bar when the sheet is open. Since the sheet covers the tab bar, `pb-tab-bar` is unnecessary here.

### The `"Audience"` Page vs `"Network"` Tab Naming

The route is `/app/network` and the tab says "Network", but the server page file imports `AudienceTabs` and the component is called `AudiencePage`. Multiple PR comments and the onboarding done step still reference "Audience". This should be unified to "Network" throughout.

---

## Priority Summary

### Critical (Fix Before Launch)
1. **Broken legal links** on welcome page (`/legal/terms` should be `/terms`).
2. **Theme localStorage key mismatch** (`yl-theme` vs `theme`) -- dark mode won't persist.
3. **Dark mode teal variable bug** -- components using `var(--teal-500)` etc. not dark-mode-aware.
4. **"yachtielink.com" typo** in onboarding done step (should be "yachtie.link").
5. **"Audience tab" terminology** in onboarding done step (should be "Network").
6. **"checkmark" literal text** in DeepLinkFlow already-endorsed state.
7. **CookieBanner overlaps BottomTabBar** on first visit.

### High Priority (Major UX Impact)
1. Add `loading.tsx` with skeleton screens for all tab routes.
2. Add a back button to the onboarding wizard.
3. Add step transitions/animations to the onboarding wizard.
4. Add badge/notification dot on Network tab for pending requests.
5. Add "Create your own profile" CTA to public profile page.
6. Make share buttons larger and more prominent on IdentityCard.
7. Add WhatsApp-specific share option (primary sharing channel for this audience).
8. Fix color contrast for tertiary text and status indicators.

### Medium Priority (Polish & Delight)
1. Full-screen QR code mode for events.
2. Profile completion celebration animation.
3. New endorsement notification/toast on app open.
4. Toast entrance/exit animations.
5. Bottom sheet slide-up animation.
6. Staggered card entry animations on profile page.
7. Pull-to-refresh on profile and network pages.
8. Show password toggle on auth pages.
9. Personalized, industry-specific empty state copy.
10. Reduced motion support.

### Low Priority (Nice to Have)
1. Page transitions between tabs.
2. Haptic feedback simulation (scale animation on tap).
3. Endorsement writing prompts.
4. Seasonal/contextual community touches.
5. QR code with embedded photo.
6. Profile staleness indicator.
7. Scroll-to-top on active tab re-tap.

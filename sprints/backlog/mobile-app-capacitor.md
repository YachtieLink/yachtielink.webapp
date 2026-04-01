# Mobile App — Capacitor Wrapper (iOS + Android)

**Status:** idea
**Priority guess:** P2 (post-launch polish — get the webapp stable first, then wrap it)
**Date captured:** 2026-04-02

## Summary
Wrap the existing Next.js webapp in Capacitor to ship native iOS and Android apps. Single codebase, no rewrite. The webapp is already mobile-first at 375px with proper safe areas — most of the hard layout work is done.

## Estimated effort: ~10-15 sessions

| Phase | What | Sessions |
|-------|------|----------|
| 1 | Basic wrapper — Capacitor setup, native builds, icons, splash screens | 2-3 |
| 2 | Native polish — push notifications, camera, biometric auth, safe areas | 3-4 |
| 3 | App store prep — signing, screenshots, store listings, review guidelines | 2-3 |
| 4 | Platform quirks — iOS Safari, Android back button, keyboard, deep links | 2-3 |
| 5 | Submit + iterate — first submission, handle rejections, fix feedback | 1-2 |

## Native feel gap closers (Phase 2)
- Page transition animations (framer-motion)
- Haptic feedback on taps (Capacitor Haptics plugin)
- Proper keyboard avoidance
- Pull-to-refresh component
- Status bar + safe area tuning per page
- Splash screen matching brand

## Key Capacitor plugins needed
- `@capacitor/push-notifications` — native push
- `@capacitor/camera` — photo upload from camera
- `@capacitor/haptics` — tactile feedback
- `@capacitor/share` — native share sheet
- `@capacitor/browser` — in-app browser for OAuth
- `@capacitor/splash-screen` — branded launch screen
- `@capacitor/status-bar` — status bar styling

## Prerequisites
- Webapp stable and launched (invite mode at minimum)
- Apple Developer account ($99/year)
- Google Play Developer account ($25 one-time)
- App icons and splash screens designed

## Future upgrade path
If Capacitor feel isn't enough long-term → Expo (React Native) rewrite of UI layer only. Same Supabase backend, same types, same queries. Phase 3+ conversation.

## Notes
- Founder tested Sworkit (Capacitor app) and confirmed the native feel is acceptable
- Yacht crew are primarily on iPhones — iOS is the priority platform
- The app in the App Store is a massive credibility boost for the brand
- Push notifications alone justify the native app — drive engagement, cert expiry reminders, endorsement requests, weekly digest

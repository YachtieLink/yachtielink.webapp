# Phone & WhatsApp Separate Fields

**Status:** idea
**Priority guess:** P2 (important)
**Date captured:** 2026-03-31

## Summary
Many yacht crew use WhatsApp as their primary contact method, often on a different number than their phone. Currently there's a single phone field. Split into Phone and WhatsApp fields so crew agents and captains can reach people on the right channel.

## Scope
- Add `whatsapp` column to profiles table (migration)
- Update StepPersonal edit form with separate Phone and WhatsApp fields
- Update profile settings page
- Update CV parse to try to extract WhatsApp if mentioned
- Update public profile display — show WhatsApp with its own icon
- WhatsApp defaults to phone number, overridable by the user (founder confirmed 2026-03-31)

## Files Likely Affected
- New migration for `whatsapp` column
- `components/cv/steps/StepPersonal.tsx`
- `app/(protected)/app/profile/settings/page.tsx`
- `lib/cv/types.ts` (ParsedPersonal)
- Public profile components
- PDF templates (if WhatsApp should appear on CV)

## Notes
- Founder raised this during CV wizard walkthrough (2026-03-31)
- Common pattern in yachting: crew have a local SIM for calls and a separate WhatsApp number
- Default behavior: WhatsApp = phone unless user overrides. Could be a "Different WhatsApp number?" link that expands a second field

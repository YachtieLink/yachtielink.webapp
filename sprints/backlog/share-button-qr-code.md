# Share Button — QR Code + Full Share Options

## Problem
Current share button only copies the profile URL. Users need richer sharing options, especially for in-person scenarios (hand phone to captain, "scan this").

## Proposed Solution
Enhance the share button to open a share sheet/modal with:
- **QR code** of the profile URL (generated client-side)
- **Native share** (Web Share API on mobile)
- **WhatsApp** share link
- **Email** share link
- **Copy link** (current behaviour)
- **SMS** share link

QR code is the hero of the sheet — large, centered, scannable. Share options below.

## Notes
- QR code can be generated with `qrcode` npm package or similar
- Should work on both the profile owner's view ("share my profile") and viewer's view ("share this profile")
- Consider: should the QR code include UTM params for tracking?
- The share sheet should work on all three view modes (Profile, Portfolio, Rich Portfolio)

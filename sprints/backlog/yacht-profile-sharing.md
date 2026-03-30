# Yacht Profile Sharing

**Created:** 2026-03-30
**Priority:** Medium
**Scope:** All users
**Effort:** Small

## Problem

Yacht profile pages (`/app/yacht/[id]`) don't have a share button. Users can't share a yacht's profile with crew mates or on social media. Every other shareable entity (user profile, CV) has share functionality.

## Proposed Solution

Add a ShareButton to the yacht profile page. Same pattern as the user profile share — native Web Share API with clipboard fallback. Share URL should be the yacht's page path.

Track `link_share` event against the yacht (may need to extend the analytics schema to support yacht-level events, or just track against the sharing user).

## Dependencies

- ShareButton component already exists and handles native share + clipboard fallback
- May need `userId` prop for analytics (already established pattern)

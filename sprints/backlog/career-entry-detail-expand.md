---
title: Expandable Career Entry Details
status: idea
source: founder (QA session, 2026-04-03)
priority: medium
modules: [profile, cv, public-profile]
---

# Expandable Career Entry Details

## Problem
Career timeline entries (both yacht and shore-side) are currently minimal when expanded — they show yacht type + "View yacht page" + "Edit" for yacht entries, and even less for shore-side. Users can't see what someone actually *did* in each role without leaving the page.

## Vision
Each career entry should be expandable (or clickable) to reveal the CV context — the description of what the person did in that role. This data already exists in the DB from CV import (attachment descriptions for yacht roles, land_experience descriptions for shore-side roles).

## Example
Krista Lee Graham → Career → "Chateau Rigaud — Patisserie Chef" → expand → shows the description she wrote about her pastry work there, key responsibilities, achievements, etc.

## UX Pattern (founder direction)
- **Inline accordion expand** — discreet chevron/dropdown on each card, no page navigation
- User taps a card → it expands in-place to show role description, responsibilities, achievements
- If no description is populated, the card just looks clean (no empty state ugliness)
- **Yacht name in the card header is itself a link** to the yacht entity page — users can jump to the yacht graph without expanding first
- **Expanded state** also includes the role description/context + any additional yacht details
- Must work on both private profile career timeline AND public profile experience page (`/u/{handle}/experience`)
- Key principle: expand = preview inline, link = explore the graph. Two levels of depth without forced page switches.

## Prerequisite: Role Description Field (DB)
**The `attachments` table currently has no description/write-up field.** Only `role_label` (title), dates, and a private `notes` field (500 char cap). There's no place for "what I actually did in this role."

**Migration needed:** Add a `description` column to `attachments` (text, nullable, ~2000 char cap). Also verify `land_experience` has an equivalent field.

This field is the foundation for three features:
1. **Expandable career entries** — the content that shows when you expand
2. **Endorsement writing assist** — LLM context for generating endorsements ("what did this person do here?")
3. **CV output** — detailed role descriptions on the generated CV

**Population:** CV import parser should extract role descriptions. Users should also be able to write/edit descriptions manually via the attachment edit page.

## Scope
- **DB:** Add `description` text column to `attachments` table
- **CV parser:** Extract role descriptions during import, save to `description` field
- **Attachment edit page:** Allow users to write/edit their role description
- **Private profile:** Expand career timeline entries to show role description
- **Public profile:** Same expandable detail on the experience list
- **Endorsement assist:** Feed `description` to the LLM as context for generating endorsements
- Consistent expand pattern for both yacht and shore-side entries

## Notes
- This is the same data that would appear on the CV output
- The expand affordance should be discreet — don't clutter the card if there's nothing to show
- The `notes` field on attachments is private (not shown publicly) — `description` is the public-facing write-up
- Consider using the same accordion pattern as the yacht groups on the Network tab

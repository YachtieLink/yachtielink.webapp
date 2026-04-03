---
title: Role Context Data Layer — Foundation for Rich Endorsements
status: idea
source: founder (QA session, 2026-04-03)
priority: high
modules: [employment, endorsement, cv, profile, public-profile]
---

# Role Context Data Layer

## The Insight
When someone uploads a CV, they've written context about each role — what they did, responsibilities, achievements. We should be capturing that and attaching it to each specific role record. This is alpha data. It's good for us, good for the user, and it unlocks a chain of features.

## What we need in the DB

**`attachments` table** — add `description` (text, nullable, ~2000 chars). Populated from CV parse, editable by user.

**`land_experience` table** — already has `description`. Verify it's populated during CV parse.

## Where this data flows

### 1. CV Import (capture)
The CV parser extracts role descriptions. Today it saves title + dates + yacht match. It should ALSO save the description text the user wrote about that role. This is the primary population path.

### 2. Career Entries (display)
Expandable career entries on private profile and public profile show the role description inline. See `career-entry-detail-expand.md`.

### 3. Endorsement Writing Assist (LLM context)
The LLM gets rich context from BOTH sides:

**Endorsee context (the person being endorsed):**
- Their role on this yacht (`role_label`)
- Their description/write-up for this role (`description`)
- Their time period on this yacht (`started_at` – `ended_at`)

**Endorser context (the person writing):**
- Their role on this yacht (`role_label`)
- Their description/write-up for this role (`description`)
- Their time period on this yacht

**Crossover period:**
- Calculate the actual overlap between endorser and endorsee on this yacht
- "They worked together for X months" — gives the LLM a sense of how well they know each other

**Partial text (if "Help me finish this"):**
- Whatever the endorser has started writing

With all of this, the LLM can write a much more specific, credible endorsement that references actual responsibilities and shared time.

### 4. CV Output (display)
The generated YachtieLink CV should include role descriptions for each position, not just titles and dates.

## Implementation Order
1. **Migration:** Add `description` to `attachments`
2. **CV parser:** Extract and save role descriptions during import
3. **Attachment edit page:** Let users write/edit descriptions manually
4. **Endorsement assist:** Pull both endorser + endorsee descriptions, calculate crossover period
5. **Expandable career entries:** Display descriptions inline
6. **CV output:** Include descriptions

## Notes
- The private `notes` field (500 chars) on attachments is separate — that's for personal notes, not public-facing descriptions
- This is a data foundation play — get the data in the DB first, features build on top
- Even if description is empty for some roles, the LLM gracefully handles missing context
- The deeper we go with context (crossover time, shared responsibilities), the more credible the endorsement assist output becomes

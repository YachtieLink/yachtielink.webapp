# Overlapping Yacht Date Handling

**Status:** partially shipped
**Created:** 2026-03-30
**Priority:** Medium
**Shipped:** Client-side calculation + overlap detection (Rally 009 Session 2, Lane 2 — 2026-04-03)
**Remaining:** `get_sea_time()` SQL RPC still uses naive sum. See `sea-time-sql-rpc-overlap.md`.
**Scope:** CV import + profile display + sea service calculation
**Effort:** Medium (remaining: S — SQL migration only)

## Problem

Yacht crew frequently have overlapping employment dates — relief work, seasonal stints, transitions between vessels. Currently:

1. **Sea service calculation double-counts overlaps.** If someone was on Yacht A (Jan-Jun) and Yacht B (Apr-Aug), we count 6+5=11 months instead of the actual 8 months of sea time.
2. **No validation or warning** during CV import if dates overlap.
3. **Profile timeline** would show conflicting entries without visual indication.

## Scenarios

- **Relief work:** 2 weeks on a yacht while the regular crew is on leave — overlaps with their "permanent" position
- **Seasonal transition:** Leave one yacht mid-May, start next yacht early May (1-2 week overlap during handover)
- **Freelance:** Working multiple vessels in the same period
- **Genuine error:** Parser got dates wrong, user needs to correct

## Proposed Solution

### Sea Service Calculation
- Merge overlapping date ranges before summing total months
- Union of all date ranges, not sum of individual durations

### CV Import — Smart Overlap Detection
- **Short overlap (< 4 weeks):** Normal for relief/handover. Show gentle note: "These dates overlap slightly — common during crew transitions."
- **Long overlap (> 4 weeks):** Likely a parse error. Flag prominently: "These two yachts overlap by 3 months — check the dates are correct." Highlight both entries with an amber warning and make the date fields easy to edit.
- Don't block either way — let the user decide. But make long overlaps very visible so parse errors get caught before import.

### Profile Display
- Show all entries chronologically regardless of overlap
- Optional: subtle visual indicator when two entries overlap (e.g. a small "overlap" badge)

## Dependencies
- Sea service calculation in `StepExperience.tsx`
- Future: profile experience timeline view

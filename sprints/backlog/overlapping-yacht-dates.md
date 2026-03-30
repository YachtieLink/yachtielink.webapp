# Overlapping Yacht Date Handling

**Created:** 2026-03-30
**Priority:** Medium
**Scope:** CV import + profile display + sea service calculation
**Effort:** Medium

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

### CV Import
- Detect overlapping dates and show a gentle note: "These dates overlap — that's common for relief work. Your total sea service is calculated correctly."
- Don't block — overlaps are normal in yachting

### Profile Display
- Show all entries chronologically regardless of overlap
- Optional: subtle visual indicator when two entries overlap (e.g. a small "overlap" badge)

## Dependencies
- Sea service calculation in `StepExperience.tsx`
- Future: profile experience timeline view

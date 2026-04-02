/**
 * Sea time utilities.
 * Used on: profile page (summary card), sea time breakdown page, public profile stat line,
 * CV import wizard (overlap detection), profile summaries accordion.
 * Single source of truth — do not duplicate this logic.
 */

export interface DateRange {
  start: Date
  end: Date
}

/**
 * Merge overlapping date ranges into a minimal union set.
 * Returns non-overlapping ranges sorted by start date.
 */
export function mergeOverlappingRanges(ranges: DateRange[]): DateRange[] {
  if (ranges.length === 0) return []
  const valid = ranges.filter(r => r.start.getTime() <= r.end.getTime())
  if (valid.length === 0) return []
  const sorted = [...valid].sort((a, b) => a.start.getTime() - b.start.getTime())
  const merged: DateRange[] = [{ start: new Date(sorted[0].start), end: new Date(sorted[0].end) }]
  for (let i = 1; i < sorted.length; i++) {
    const current = sorted[i]
    const last = merged[merged.length - 1]
    if (current.start.getTime() <= last.end.getTime()) {
      if (current.end.getTime() > last.end.getTime()) {
        last.end = new Date(current.end)
      }
    } else {
      merged.push({ start: new Date(current.start), end: new Date(current.end) })
    }
  }
  return merged
}

/**
 * Calculate total sea time days from potentially overlapping date ranges.
 * Uses union-based calculation to avoid double-counting overlapping periods.
 */
export function calculateSeaTimeDays(ranges: DateRange[]): number {
  const merged = mergeOverlappingRanges(ranges)
  return merged.reduce((total, r) => {
    return total + Math.max(0, Math.floor((r.end.getTime() - r.start.getTime()) / 86_400_000))
  }, 0)
}

/**
 * Detect overlapping date range pairs.
 * Returns each overlapping pair with the duration of the overlap in days.
 * Generic so that subtypes (e.g. IndexedDateRange with cardIndex) are preserved in results.
 */
export function detectOverlaps<T extends DateRange>(ranges: T[]): Array<{
  rangeA: T
  rangeB: T
  overlapDays: number
}> {
  const result: Array<{ rangeA: T; rangeB: T; overlapDays: number }> = []
  for (let i = 0; i < ranges.length; i++) {
    for (let j = i + 1; j < ranges.length; j++) {
      const a = ranges[i]
      const b = ranges[j]
      const overlapStart = Math.max(a.start.getTime(), b.start.getTime())
      const overlapEnd = Math.min(a.end.getTime(), b.end.getTime())
      if (overlapStart < overlapEnd) {
        const overlapDays = Math.floor((overlapEnd - overlapStart) / 86_400_000)
        if (overlapDays > 0) {
          result.push({ rangeA: a, rangeB: b, overlapDays })
        }
      }
    }
  }
  return result
}

/**
 * Sea time formatting utility.
 */

export interface SeaTimeFormatted {
  years: number
  months: number
  /** "4y 3mo" or "3mo" */
  displayShort: string
  /** "4 years, 3 months" or "Less than a month" */
  displayLong: string
  /** "4 years, 3 months (1,553 days)" */
  displayFull: string
}

export function formatSeaTime(totalDays: number): SeaTimeFormatted {
  const years = Math.floor(totalDays / 365.25)
  const months = Math.floor((totalDays % 365.25) / 30.44)

  const longParts = [
    years > 0 ? `${years} ${years === 1 ? 'year' : 'years'}` : null,
    months > 0 ? `${months} ${months === 1 ? 'month' : 'months'}` : null,
  ].filter(Boolean)

  const displayLong = longParts.length > 0
    ? longParts.join(', ')
    : totalDays > 0
      ? 'Less than a month'
      : '0 days'

  return {
    years,
    months,
    displayShort: years > 0
      ? `${years}y ${months}mo`
      : months > 0
        ? `${months}mo`
        : totalDays > 0
          ? '<1mo'
          : '0d',
    displayLong,
    displayFull: `${displayLong} (${totalDays.toLocaleString()} days)`,
  }
}

/**
 * Format average tenure in days to a human-readable string.
 * Used on yacht detail page stats row.
 */
export function formatTenure(days: number): string {
  if (days < 30) return `${days}d`
  const months = Math.round(days / 30.44)
  if (months < 12) return `~${months} mo`
  const years = Math.floor(months / 12)
  const remainingMonths = months % 12
  return remainingMonths > 0 ? `~${years}y ${remainingMonths}mo` : `~${years}y`
}

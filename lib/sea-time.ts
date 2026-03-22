/**
 * Sea time formatting utility.
 * Used on: profile page (summary card), sea time breakdown page, public profile stat line.
 * Single source of truth — do not duplicate this logic.
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

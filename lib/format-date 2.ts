/**
 * Shared date formatter — en-GB short month + year.
 * e.g. "Jan 2024", "Mar 2025"
 *
 * Used across public profile sections, bento tiles, and detail pages.
 */

export function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return ''
  return new Date(dateStr).toLocaleDateString('en-GB', { month: 'short', year: 'numeric' })
}

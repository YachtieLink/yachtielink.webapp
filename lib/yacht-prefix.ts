/** Convert yacht_type to a display prefix like "M/Y" */
const TYPE_PREFIX: Record<string, string> = {
  'Motor Yacht': 'M/Y',
  'Sailing Yacht': 'S/Y',
  'Expedition Vessel': 'E/V',
  'Fishing Vessel': 'F/V',
  'Research Vessel': 'R/V',
  'Support Vessel': 'SV',
  'Catamaran': 'Cat',
  'Gulet': 'Gulet',
}

const KNOWN_PREFIXES = ['M/Y', 'S/Y', 'E/V', 'F/V', 'R/V', 'SV', 'MY', 'SY', 'CAT', 'GULET', 'TS']

export function yachtTypePrefix(yachtType: string | null | undefined): string {
  if (!yachtType) return 'M/Y'
  return TYPE_PREFIX[yachtType] ?? 'M/Y'
}

/** Prefix a yacht name with its type if not already prefixed */
export function prefixedYachtName(name: string, yachtType: string | null | undefined): string {
  if (!name.trim()) return name
  const prefix = yachtTypePrefix(yachtType)
  const upper = name.trimStart().toUpperCase()
  for (const p of KNOWN_PREFIXES) {
    if (upper.startsWith(p + ' ')) return name
  }
  return `${prefix} ${name}`
}

import { ALL_COUNTRIES } from '@/lib/constants/countries'
import { COUNTRY_TO_ISO } from '@/lib/constants/country-iso'

function normalizeCountryKey(input: string): string {
  return input
    .trim()
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[.'’]/g, '')
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

const NORMALIZED_NAME_TO_ISO = new Map(
  Object.entries(COUNTRY_TO_ISO).map(([name, iso]) => [normalizeCountryKey(name), iso]),
)

// Yacht flag states sometimes use common maritime jurisdictions that are not in ALL_COUNTRIES.
const ISO_FALLBACK_NAMES: Record<string, string> = {
  GI: 'Gibraltar',
  KY: 'Cayman Islands',
  VG: 'British Virgin Islands',
}

const ALPHA3_TO_ALPHA2: Record<string, string> = {
  ARE: 'AE',
  ARG: 'AR',
  AUS: 'AU',
  AUT: 'AT',
  BEL: 'BE',
  BHS: 'BS',
  BMU: 'BM',
  BRA: 'BR',
  CAN: 'CA',
  CHE: 'CH',
  CYM: 'KY',
  CYP: 'CY',
  DEU: 'DE',
  DNK: 'DK',
  EGY: 'EG',
  ESP: 'ES',
  FRA: 'FR',
  GBR: 'GB',
  GIB: 'GI',
  GRC: 'GR',
  HRV: 'HR',
  IDN: 'ID',
  IND: 'IN',
  IRL: 'IE',
  ITA: 'IT',
  JEY: 'JE',
  MCO: 'MC',
  MEX: 'MX',
  MHL: 'MH',
  MLT: 'MT',
  MAR: 'MA',
  NLD: 'NL',
  NOR: 'NO',
  NZL: 'NZ',
  PAN: 'PA',
  PHL: 'PH',
  PRT: 'PT',
  SWE: 'SE',
  THA: 'TH',
  TUR: 'TR',
  UAE: 'AE',
  USA: 'US',
  VCT: 'VC',
  VGB: 'VG',
  ZAF: 'ZA',
}

const COMMON_ALIASES: Record<string, string> = {
  uk: 'GB',
  uae: 'AE',
}

function buildCountryLookup(): Map<string, string> {
  const preferredNameByIso = new Map<string, string>()
  const lookup = new Map<string, string>()

  for (const country of ALL_COUNTRIES) {
    const iso2 = NORMALIZED_NAME_TO_ISO.get(normalizeCountryKey(country))
    if (!iso2) continue
    preferredNameByIso.set(iso2, country)
    lookup.set(normalizeCountryKey(country), country)
  }

  for (const [iso2, name] of Object.entries(ISO_FALLBACK_NAMES)) {
    if (!preferredNameByIso.has(iso2)) preferredNameByIso.set(iso2, name)
  }

  for (const [name, iso2] of Object.entries(COUNTRY_TO_ISO)) {
    const preferredName = preferredNameByIso.get(iso2)
    if (preferredName) lookup.set(normalizeCountryKey(name), preferredName)
  }

  for (const [iso2, preferredName] of preferredNameByIso) {
    lookup.set(normalizeCountryKey(iso2), preferredName)
  }

  for (const [alpha3, alpha2] of Object.entries(ALPHA3_TO_ALPHA2)) {
    const preferredName = preferredNameByIso.get(alpha2)
    if (preferredName) lookup.set(normalizeCountryKey(alpha3), preferredName)
  }

  for (const [alias, iso2] of Object.entries(COMMON_ALIASES)) {
    const preferredName = preferredNameByIso.get(iso2)
    if (preferredName) lookup.set(normalizeCountryKey(alias), preferredName)
  }

  return lookup
}

const COUNTRY_LOOKUP = buildCountryLookup()

export function normalizeCountry(input: string | null | undefined): string | null {
  if (typeof input !== 'string') return null

  const key = normalizeCountryKey(input)
  if (!key) return null

  return COUNTRY_LOOKUP.get(key) ?? null
}

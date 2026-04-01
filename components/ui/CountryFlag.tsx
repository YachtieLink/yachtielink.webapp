'use client'

import { COUNTRY_TO_ISO } from '@/lib/constants/country-iso'

interface CountryFlagProps {
  /** Full country name (e.g. "United Kingdom") */
  country: string
  /** Height in pixels. Width is auto (flags are ~4:3). Defaults to 16. */
  size?: number
  className?: string
}

/**
 * Renders a country flag SVG inline.
 * Loads on-demand from flagcdn.com — no bundle impact.
 * Returns null if no ISO code is found for the country.
 */
export function CountryFlag({ country, size = 16, className }: CountryFlagProps) {
  const code = COUNTRY_TO_ISO[country.toLowerCase()]
  if (!code) return null

  const width = Math.round(size * (4 / 3))

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={`https://flagcdn.com/w${width}/${code.toLowerCase()}.png`}
      srcSet={`https://flagcdn.com/w${width * 2}/${code.toLowerCase()}.png 2x`}
      alt={`${country} flag`}
      width={width}
      height={size}
      loading="lazy"
      className={className}
      style={{ display: 'inline-block', verticalAlign: 'middle', borderRadius: 2 }}
      onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none' }}
    />
  )
}

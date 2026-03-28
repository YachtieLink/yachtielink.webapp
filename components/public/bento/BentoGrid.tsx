'use client'

import { useId, useMemo } from 'react'
import type { BentoTemplateVariant, BentoTile } from '@/lib/bento/types'

interface BentoGridProps {
  variant: BentoTemplateVariant
  tiles: BentoTile[]
  gap?: number
  accentColor?: string
}

/** Extract all unique area names from a grid-template-areas string */
function extractAreaNames(areas: string): Set<string> {
  const names = new Set<string>()
  for (const match of areas.matchAll(/[a-zA-Z]\w*/g)) {
    names.add(match[0])
  }
  return names
}

export function BentoGrid({ variant, tiles, gap = 12, accentColor }: BentoGridProps) {
  const scopeId = useId().replace(/:/g, '')
  const scopeClass = `bento-${scopeId}`

  // Find all area names defined in the template that have no corresponding tile
  const tileAreas = useMemo(() => new Set(tiles.map((t) => t.areaName)), [tiles])
  const allAreas = useMemo(() => {
    const desktop = extractAreaNames(variant.areas.desktop)
    const mobile = extractAreaNames(variant.areas.mobile)
    return new Set([...desktop, ...mobile])
  }, [variant])

  const emptyAreas = useMemo(
    () => [...allAreas].filter((a) => !tileAreas.has(a)),
    [allAreas, tileAreas],
  )

  return (
    <>
      <style>{`
        .${scopeClass} {
          display: grid;
          grid-template-areas: ${variant.areas.desktop.split('\n').join(' ')};
          grid-template-columns: repeat(4, 1fr);
          grid-auto-rows: 160px;
          gap: ${gap}px;
          width: 100%;
        }
        @media (max-width: 767px) {
          .${scopeClass} {
            grid-template-areas: ${variant.areas.mobile.split('\n').join(' ')};
            grid-template-columns: repeat(2, 1fr);
            grid-auto-rows: 140px;
          }
        }
        .${scopeClass} > div {
          overflow: hidden;
          border-radius: 16px;
        }
      `}</style>
      <div
        className={scopeClass}
        style={{ '--accent-tile': accentColor ?? 'var(--accent-500, #14b8a6)' } as React.CSSProperties}
      >
        {tiles.map((tile) => (
          <div
            key={tile.areaName}
            style={{ gridArea: tile.areaName }}
            className="min-w-0 min-h-0"
          >
            {tile.content}
          </div>
        ))}
        {/* Spacer divs for unused grid areas — prevents CSS grid layout holes */}
        {emptyAreas.map((area) => (
          <div key={area} style={{ gridArea: area }} className="min-w-0 min-h-0" />
        ))}
      </div>
    </>
  )
}

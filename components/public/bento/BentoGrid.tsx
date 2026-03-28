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

/**
 * Filter out rows from grid-template-areas where ALL area names in that row
 * have no corresponding tile. This collapses empty rows (e.g. contact+cv row
 * when user has neither).
 */
function filterEmptyRows(areasStr: string, tileAreas: Set<string>): string {
  const rows = areasStr.split('\n')
  const filtered = rows.filter((row) => {
    const names = [...row.matchAll(/[a-zA-Z]\w*/g)].map((m) => m[0])
    // Keep the row if at least one area name has a tile
    return names.some((name) => tileAreas.has(name))
  })
  // If all rows were filtered out (shouldn't happen), return original
  return filtered.length > 0 ? filtered.join('\n') : areasStr
}

export function BentoGrid({ variant, tiles, gap = 12, accentColor }: BentoGridProps) {
  const scopeId = useId().replace(/:/g, '')
  const scopeClass = `bento-${scopeId}`

  const tileAreas = useMemo(() => new Set(tiles.map((t) => t.areaName)), [tiles])

  // Filter out rows where all tiles are empty
  const desktopAreas = useMemo(
    () => filterEmptyRows(variant.areas.desktop, tileAreas),
    [variant.areas.desktop, tileAreas],
  )
  const mobileAreas = useMemo(
    () => filterEmptyRows(variant.areas.mobile, tileAreas),
    [variant.areas.mobile, tileAreas],
  )

  return (
    <>
      <style>{`
        .${scopeClass} {
          display: grid;
          grid-template-areas: ${desktopAreas.split('\n').join(' ')};
          grid-template-columns: repeat(4, 1fr);
          grid-auto-rows: 160px;
          gap: ${gap}px;
          width: 100%;
        }
        @media (max-width: 767px) {
          .${scopeClass} {
            grid-template-areas: ${mobileAreas.split('\n').join(' ')};
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
      </div>
    </>
  )
}

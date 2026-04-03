'use client'

interface PhotoFormatPreviewProps {
  photoUrl: string
  focalX: number
  focalY: number
}

export function PhotoFormatPreview({ photoUrl, focalX, focalY }: PhotoFormatPreviewProps) {
  const objectPosition = `${focalX}% ${focalY}%`

  return (
    <div className="flex items-end gap-3">
      {/* Circle — avatar use */}
      <div className="flex flex-col items-center gap-1">
        <div className="w-16 h-16 rounded-full overflow-hidden bg-[var(--color-surface-raised)]">
          <img
            src={photoUrl}
            alt="Avatar preview"
            className="w-full h-full object-cover"
            style={{ objectPosition }}
            draggable={false}
          />
        </div>
        <span className="text-[10px] text-[var(--color-text-tertiary)]">Avatar</span>
      </div>

      {/* 16:9 rectangle — hero/OG use */}
      <div className="flex flex-col items-center gap-1">
        <div className="w-40 h-[90px] rounded-lg overflow-hidden bg-[var(--color-surface-raised)]">
          <img
            src={photoUrl}
            alt="Hero preview"
            className="w-full h-full object-cover"
            style={{ objectPosition }}
            draggable={false}
          />
        </div>
        <span className="text-[10px] text-[var(--color-text-tertiary)]">Hero</span>
      </div>

      {/* Square — CV/PDF use */}
      <div className="flex flex-col items-center gap-1">
        <div className="w-[90px] h-[90px] rounded-lg overflow-hidden bg-[var(--color-surface-raised)]">
          <img
            src={photoUrl}
            alt="CV preview"
            className="w-full h-full object-cover"
            style={{ objectPosition }}
            draggable={false}
          />
        </div>
        <span className="text-[10px] text-[var(--color-text-tertiary)]">CV</span>
      </div>
    </div>
  )
}

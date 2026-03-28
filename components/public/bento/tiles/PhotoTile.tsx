'use client'

interface PhotoTileProps {
  url: string
  focalX: number
  focalY: number
  onClick: () => void
}

export function PhotoTile({ url, focalX, focalY, onClick }: PhotoTileProps) {
  return (
    <button
      onClick={onClick}
      className="relative w-full h-full rounded-xl overflow-hidden group cursor-pointer"
    >
      <img
        src={url}
        alt=""
        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
        style={{ objectPosition: `${focalX}% ${focalY}%` }}
        loading="lazy"
      />
      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
    </button>
  )
}

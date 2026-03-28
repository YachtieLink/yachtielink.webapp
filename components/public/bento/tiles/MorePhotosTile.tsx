'use client'

import Link from 'next/link'
import { Camera } from 'lucide-react'

interface MorePhotosTileProps {
  handle: string
  backgroundUrl?: string
  totalCount: number
}

export function MorePhotosTile({ handle, backgroundUrl, totalCount }: MorePhotosTileProps) {
  return (
    <Link
      href={`/u/${handle}/gallery`}
      className="relative h-full rounded-xl overflow-hidden flex items-center justify-center group"
    >
      {backgroundUrl && (
        <img
          src={backgroundUrl}
          alt=""
          className="absolute inset-0 w-full h-full object-cover blur-sm scale-110"
          loading="lazy"
        />
      )}
      <div className="absolute inset-0 bg-black/40 group-hover:bg-black/50 transition-colors" />
      <div className="relative flex flex-col items-center gap-2 text-white">
        <Camera size={20} />
        <span className="text-sm font-semibold">
          {totalCount} photos &rarr;
        </span>
      </div>
    </Link>
  )
}

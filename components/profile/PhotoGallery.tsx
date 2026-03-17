'use client'

import { useState, useRef } from 'react'
import Image from 'next/image'
import Link from 'next/link'

interface Photo {
  id: string
  photo_url: string
}

interface PhotoGalleryProps {
  photos: Photo[]
  /** main profile photo — shown as first if photos array is empty */
  profilePhotoUrl?: string | null
  displayName: string
  /** If true, show "+ Add photos" button over the last slot */
  editable?: boolean
  /** If true, fill parent container height instead of self-sizing */
  fillContainer?: boolean
}

export function PhotoGallery({ photos, profilePhotoUrl, displayName, editable, fillContainer }: PhotoGalleryProps) {
  const [current, setCurrent] = useState(0)
  const touchStartX = useRef<number | null>(null)

  // Build the ordered list: gallery photos, then fallback to profile_photo_url
  const allPhotos: string[] = photos.length > 0
    ? photos.map((p) => p.photo_url)
    : profilePhotoUrl ? [profilePhotoUrl] : []

  if (allPhotos.length === 0) {
    return (
      <div className={`relative w-full bg-[var(--color-surface-raised)] flex items-center justify-center ${fillContainer ? 'h-full' : 'aspect-[3/4]'}`}>
        <div className="flex flex-col items-center gap-2 text-[var(--color-text-secondary)]">
          <span className="text-5xl">👤</span>
          {editable && (
            <Link
              href="/app/profile/photos"
              className="text-sm font-medium text-[var(--color-interactive)] hover:underline"
            >
              + Add photos
            </Link>
          )}
        </div>
      </div>
    )
  }

  function handleTouchStart(e: React.TouchEvent) {
    touchStartX.current = e.touches[0].clientX
  }

  function handleTouchEnd(e: React.TouchEvent) {
    if (touchStartX.current === null) return
    const dx = e.changedTouches[0].clientX - touchStartX.current
    if (dx < -50 && current < allPhotos.length - 1) setCurrent((v) => v + 1)
    if (dx > 50 && current > 0) setCurrent((v) => v - 1)
    touchStartX.current = null
  }

  return (
    <div
      className={`relative w-full ${fillContainer ? 'h-full' : ''}`}
      style={fillContainer ? undefined : { height: 'clamp(320px, 65vh, 600px)' }}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      <Image
        src={allPhotos[current]}
        alt={displayName}
        fill
        className="object-cover"
        priority={current === 0}
        unoptimized
      />

      {/* Gradient overlay for dots legibility */}
      <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-black/40 to-transparent pointer-events-none" />

      {/* Dot indicators */}
      {allPhotos.length > 1 && (
        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
          {allPhotos.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrent(i)}
              aria-label={`Photo ${i + 1}`}
              className={`w-1.5 h-1.5 rounded-full transition-all ${
                i === current ? 'bg-white scale-125' : 'bg-white/50'
              }`}
            />
          ))}
        </div>
      )}

      {/* Desktop arrow navigation */}
      {allPhotos.length > 1 && (
        <>
          {current > 0 && (
            <button
              onClick={() => setCurrent((v) => v - 1)}
              className="hidden md:flex absolute left-3 top-1/2 -translate-y-1/2 w-8 h-8 bg-black/40 hover:bg-black/60 rounded-full items-center justify-center text-white transition-colors"
              aria-label="Previous photo"
            >
              ‹
            </button>
          )}
          {current < allPhotos.length - 1 && (
            <button
              onClick={() => setCurrent((v) => v + 1)}
              className="hidden md:flex absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 bg-black/40 hover:bg-black/60 rounded-full items-center justify-center text-white transition-colors"
              aria-label="Next photo"
            >
              ›
            </button>
          )}
        </>
      )}

      {/* Editable: add photos button */}
      {editable && (
        <Link
          href="/app/profile/photos"
          className="absolute top-3 right-3 bg-black/40 hover:bg-black/60 text-white text-xs px-3 py-1.5 rounded-full backdrop-blur-sm transition-colors"
        >
          + Photos
        </Link>
      )}
    </div>
  )
}

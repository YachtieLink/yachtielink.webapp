'use client'

import { useState } from 'react'
import Link from 'next/link'
import dynamic from 'next/dynamic'
import { Camera } from 'lucide-react'
import { ScrollReveal } from '@/components/ui/ScrollReveal'

const PhotoLightbox = dynamic(
  () => import('./PhotoLightbox').then((m) => m.PhotoLightbox),
  { ssr: false }
)

interface MiniBentoGalleryProps {
  photos: Array<{ id: string; url: string; focal_x: number; focal_y: number; alt?: string }>
  handle: string
  totalPhotoCount: number
}

export function MiniBentoGallery({ photos, handle, totalPhotoCount }: MiniBentoGalleryProps) {
  const [lightboxOpen, setLightboxOpen] = useState(false)
  const [lightboxIndex, setLightboxIndex] = useState(0)

  if (photos.length === 0) return null

  function openLightbox(idx: number) {
    setLightboxIndex(idx)
    setLightboxOpen(true)
  }

  const lightboxPhotos = photos.map((p) => ({ url: p.url, alt: p.alt }))

  return (
    <ScrollReveal>
      <div className="rounded-xl bg-white/80 p-6">
        <div className="flex items-center gap-2 mb-4">
          <span className="text-[var(--color-text-tertiary)]">
            <Camera size={16} />
          </span>
          <h2 className="text-xs font-semibold uppercase tracking-wide text-[var(--color-text-tertiary)]">
            Gallery
          </h2>
        </div>

        {/* Layout varies by photo count */}
        {photos.length === 1 && (
          <button onClick={() => openLightbox(0)} className="w-full">
            <img
              src={photos[0].url}
              alt={photos[0].alt ?? ''}
              className="w-full max-h-[300px] object-cover rounded-lg cursor-pointer hover:opacity-95 transition-opacity"
              style={{ objectPosition: `${photos[0].focal_x}% ${photos[0].focal_y}%` }}
            />
          </button>
        )}

        {photos.length === 2 && (
          <div className="grid grid-cols-2 gap-2">
            {photos.map((photo, i) => (
              <button key={photo.id} onClick={() => openLightbox(i)} className="aspect-square overflow-hidden rounded-lg">
                <img
                  src={photo.url}
                  alt={photo.alt ?? ''}
                  className="h-full w-full object-cover cursor-pointer hover:opacity-95 transition-opacity"
                  style={{ objectPosition: `${photo.focal_x}% ${photo.focal_y}%` }}
                />
              </button>
            ))}
          </div>
        )}

        {photos.length >= 3 && (
          <div className="grid grid-cols-[3fr_2fr] grid-rows-2 gap-2 h-[280px]">
            {/* Photo 1 — large, spans 2 rows */}
            <button
              onClick={() => openLightbox(0)}
              className="row-span-2 overflow-hidden rounded-lg"
            >
              <img
                src={photos[0].url}
                alt={photos[0].alt ?? ''}
                className="h-full w-full object-cover cursor-pointer hover:opacity-95 transition-opacity"
                style={{ objectPosition: `${photos[0].focal_x}% ${photos[0].focal_y}%` }}
              />
            </button>
            {/* Photo 2 — top right */}
            <button
              onClick={() => openLightbox(1)}
              className="overflow-hidden rounded-lg"
            >
              <img
                src={photos[1].url}
                alt={photos[1].alt ?? ''}
                className="h-full w-full object-cover cursor-pointer hover:opacity-95 transition-opacity"
                style={{ objectPosition: `${photos[1].focal_x}% ${photos[1].focal_y}%` }}
              />
            </button>
            {/* Photo 3 — bottom right */}
            <button
              onClick={() => openLightbox(2)}
              className="overflow-hidden rounded-lg"
            >
              <img
                src={photos[2].url}
                alt={photos[2].alt ?? ''}
                className="h-full w-full object-cover cursor-pointer hover:opacity-95 transition-opacity"
                style={{ objectPosition: `${photos[2].focal_x}% ${photos[2].focal_y}%` }}
              />
            </button>
          </div>
        )}

        {totalPhotoCount > 3 && (
          <Link
            href={`/u/${handle}/gallery`}
            className="mt-3 block text-xs font-medium text-[var(--accent-500,var(--color-interactive))] hover:underline"
          >
            See all {totalPhotoCount} photos &rarr;
          </Link>
        )}
      </div>

      {lightboxOpen && (
        <PhotoLightbox
          photos={lightboxPhotos}
          initialIndex={lightboxIndex}
          open={lightboxOpen}
          onClose={() => setLightboxOpen(false)}
        />
      )}
    </ScrollReveal>
  )
}

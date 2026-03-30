'use client'

import { useState, useEffect, useCallback } from 'react'
import { X, ChevronLeft, ChevronRight } from 'lucide-react'

interface PhotoLightboxProps {
  photos: Array<{ url: string; alt?: string }>
  initialIndex: number
  open: boolean
  onClose: () => void
  onViewAll?: () => void
}

export function PhotoLightbox({ photos, initialIndex, open, onClose, onViewAll }: PhotoLightboxProps) {
  const [index, setIndex] = useState(initialIndex)
  const [touchStart, setTouchStart] = useState<{ x: number; y: number } | null>(null)

  useEffect(() => {
    if (open) setIndex(initialIndex)
  }, [open, initialIndex])

  const prev = useCallback(() => setIndex((i) => (i > 0 ? i - 1 : photos.length - 1)), [photos.length])
  const next = useCallback(() => setIndex((i) => (i < photos.length - 1 ? i + 1 : 0)), [photos.length])

  useEffect(() => {
    if (!open) return
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
      if (e.key === 'ArrowLeft') prev()
      if (e.key === 'ArrowRight') next()
    }
    document.addEventListener('keydown', onKey)
    // Prevent body scroll
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [open, onClose, prev, next])

  if (!open || photos.length === 0) return null

  const photo = photos[index]

  return (
    <div
      className="fixed inset-0 z-50 bg-black flex items-center justify-center"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Photo lightbox"
    >
      {/* Close button */}
      <button
        onClick={onClose}
        className="absolute top-4 right-4 z-10 flex items-center justify-center w-10 h-10 rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors"
        aria-label="Close"
      >
        <X size={20} />
      </button>

      {/* Navigation arrows */}
      {photos.length > 1 && (
        <>
          <button
            onClick={(e) => { e.stopPropagation(); prev() }}
            className="absolute left-4 top-1/2 -translate-y-1/2 z-10 flex items-center justify-center w-10 h-10 rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors"
            aria-label="Previous photo"
          >
            <ChevronLeft size={20} />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); next() }}
            className="absolute right-4 top-1/2 -translate-y-1/2 z-10 flex items-center justify-center w-10 h-10 rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors"
            aria-label="Next photo"
          >
            <ChevronRight size={20} />
          </button>
        </>
      )}

      {/* Photo */}
      <div
        className="max-w-[90vw] max-h-[85vh] flex items-center justify-center"
        onClick={(e) => e.stopPropagation()}
        onTouchStart={(e) => {
          const touch = e.touches[0]
          setTouchStart({ x: touch.clientX, y: touch.clientY })
        }}
        onTouchEnd={(e) => {
          if (!touchStart) return
          const touch = e.changedTouches[0]
          const dx = touch.clientX - touchStart.x
          const dy = touch.clientY - touchStart.y
          setTouchStart(null)
          // Swipe horizontal — navigate
          if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy)) {
            if (dx > 0) prev()
            else next()
          }
          // Swipe down — close
          if (dy > 80 && Math.abs(dy) > Math.abs(dx)) {
            onClose()
          }
        }}
      >
        <img
          src={photo.url}
          alt={photo.alt ?? ''}
          className="max-w-full max-h-[85vh] object-contain rounded-lg select-none"
          draggable={false}
        />
      </div>

      {/* Bottom bar — view all + counter, stacked vertically in thumb zone */}
      <div className="absolute bottom-[20vh] left-0 right-0 flex flex-col items-center gap-2 px-6">
        {onViewAll && (
          <button
            onClick={(e) => { e.stopPropagation(); onViewAll() }}
            className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-white/15 backdrop-blur-md text-white text-xs font-semibold hover:bg-white/25 transition-colors"
          >
            View all
          </button>
        )}
        {photos.length > 1 && (
          <p className="text-white/50 text-xs font-medium">
            {index + 1} / {photos.length}
          </p>
        )}
      </div>
    </div>
  )
}

'use client'

import { useRef, useState, useCallback } from 'react'

interface FocalPointPickerProps {
  imageUrl: string
  focalX: number
  focalY: number
  onChange: (x: number, y: number) => void
}

export function FocalPointPicker({ imageUrl, focalX, focalY, onChange }: FocalPointPickerProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [dragging, setDragging] = useState(false)

  const updatePosition = useCallback((clientX: number, clientY: number) => {
    const el = containerRef.current
    if (!el) return
    const rect = el.getBoundingClientRect()
    const x = Math.min(100, Math.max(0, ((clientX - rect.left) / rect.width) * 100))
    const y = Math.min(100, Math.max(0, ((clientY - rect.top) / rect.height) * 100))
    onChange(Math.round(x), Math.round(y))
  }, [onChange])

  const handlePointerDown = (e: React.PointerEvent) => {
    setDragging(true)
    ;(e.target as HTMLElement).setPointerCapture(e.pointerId)
    updatePosition(e.clientX, e.clientY)
  }

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!dragging) return
    updatePosition(e.clientX, e.clientY)
  }

  const handlePointerUp = () => {
    setDragging(false)
  }

  return (
    <div className="flex flex-col gap-3">
      {/* Drag area */}
      <div
        ref={containerRef}
        className="relative w-full aspect-[3/4] rounded-xl overflow-hidden cursor-crosshair select-none touch-none"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
      >
        <img
          src={imageUrl}
          alt="Set focal point"
          className="w-full h-full object-cover pointer-events-none"
          draggable={false}
        />
        {/* Crosshair indicator */}
        <div
          className="absolute w-8 h-8 -translate-x-1/2 -translate-y-1/2 pointer-events-none"
          style={{ left: `${focalX}%`, top: `${focalY}%` }}
        >
          <div className="w-full h-full rounded-full border-2 border-white shadow-lg bg-white/20" />
          <div className="absolute top-1/2 left-1/2 w-1.5 h-1.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white shadow" />
        </div>
      </div>

      {/* Hero crop preview */}
      <div className="flex flex-col gap-1">
        <p className="text-xs text-[var(--color-text-tertiary)]">Hero preview</p>
        <div className="w-full aspect-[16/9] rounded-lg overflow-hidden bg-[var(--color-surface-raised)]">
          <img
            src={imageUrl}
            alt="Hero crop preview"
            className="w-full h-full object-cover"
            style={{ objectPosition: `${focalX}% ${focalY}%` }}
            draggable={false}
          />
        </div>
      </div>
    </div>
  )
}

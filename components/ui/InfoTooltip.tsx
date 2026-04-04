'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { Info } from 'lucide-react'

interface InfoTooltipProps {
  text: string
  children?: React.ReactNode
}

/**
 * Tap-friendly info tooltip with viewport-aware positioning.
 * On desktop: shows on hover.
 * On mobile: shows on tap, dismisses on tap outside.
 * Always stays within viewport bounds.
 */
export function InfoTooltip({ text, children }: InfoTooltipProps) {
  const [open, setOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const tooltipRef = useRef<HTMLDivElement>(null)
  const [offset, setOffset] = useState(0)

  const adjustPosition = useCallback(() => {
    if (!tooltipRef.current || !containerRef.current) return
    const tip = tooltipRef.current.getBoundingClientRect()
    const pad = 12 // min distance from viewport edge

    let shift = 0
    if (tip.right > window.innerWidth - pad) {
      shift = window.innerWidth - pad - tip.right
    } else if (tip.left < pad) {
      shift = pad - tip.left
    }
    setOffset(shift)
  }, [])

  useEffect(() => {
    if (!open) { setOffset(0); return }

    // Adjust on next frame so the tooltip is rendered
    requestAnimationFrame(adjustPosition)

    function handleOutside(e: MouseEvent | TouchEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleOutside)
    document.addEventListener('touchstart', handleOutside)
    return () => {
      document.removeEventListener('mousedown', handleOutside)
      document.removeEventListener('touchstart', handleOutside)
    }
  }, [open, adjustPosition])

  return (
    <div ref={containerRef} className="relative inline-flex items-center">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        onMouseEnter={() => setOpen(true)}
        onMouseLeave={() => setOpen(false)}
        className="inline-flex items-center text-[var(--color-text-tertiary)] hover:text-[var(--color-text-secondary)] transition-colors"
        aria-label="More info"
      >
        {children ?? <Info size={13} />}
      </button>
      {open && (
        <div
          ref={tooltipRef}
          style={{ transform: `translateX(calc(-50% + ${offset}px))` }}
          className="absolute bottom-full left-1/2 mb-2 z-50 w-max max-w-[220px] px-3 py-2 rounded-lg bg-[var(--color-text-primary)] text-[var(--color-surface)] text-xs leading-relaxed shadow-lg"
        >
          {text}
          <div
            style={{ transform: `translateX(calc(-50% + ${-offset}px)) rotate(45deg)` }}
            className="absolute top-full left-1/2 w-2 h-2 -mt-1 bg-[var(--color-text-primary)]"
          />
        </div>
      )}
    </div>
  )
}

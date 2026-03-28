'use client'

import { useState, useEffect, useRef } from 'react'
import Image from 'next/image'
import { MessageSquareQuote } from 'lucide-react'
import type { PublicEndorsement } from '@/lib/queries/types'

interface EndorsementsTileProps {
  endorsements: PublicEndorsement[]
  handle: string
}

export function EndorsementsTile({ endorsements, handle }: EndorsementsTileProps) {
  const shown = endorsements.slice(0, 3)
  const [activeIndex, setActiveIndex] = useState(0)
  const touchStart = useRef<number | null>(null)

  useEffect(() => {
    if (shown.length <= 1) return
    const timer = setInterval(() => {
      setActiveIndex((i) => (i + 1) % shown.length)
    }, 9000)
    return () => clearInterval(timer)
  }, [shown.length])

  function handleTouchStart(e: React.TouchEvent) {
    touchStart.current = e.touches[0].clientX
  }
  function handleTouchEnd(e: React.TouchEvent) {
    if (touchStart.current === null) return
    const dx = e.changedTouches[0].clientX - touchStart.current
    touchStart.current = null
    if (Math.abs(dx) > 40) {
      setActiveIndex((i) => dx > 0 ? (i - 1 + shown.length) % shown.length : (i + 1) % shown.length)
    }
  }

  const current = shown[activeIndex]
  if (!current) return null

  const endorserName = current.endorser?.display_name || current.endorser?.full_name || 'Anonymous'
  const endorserAvatar = current.endorser?.profile_photo_url
  const yachtName = current.yacht?.name

  return (
    <div className="h-full rounded-xl bg-[var(--color-sand-100)]/50 p-5 flex flex-col justify-between" onTouchStart={handleTouchStart} onTouchEnd={handleTouchEnd}>
      {/* Header */}
      <div className="flex items-center gap-2 mb-3">
        <MessageSquareQuote size={14} className="text-[#F08080]" />
        <span className="text-xs font-semibold uppercase tracking-wide text-[var(--color-text-tertiary)]">Endorsements</span>
        {shown.length > 1 && (
          <div className="flex gap-1 ml-auto">
            {shown.map((_, i) => (
              <button
                key={i}
                onClick={(e) => { e.stopPropagation(); setActiveIndex(i) }}
                className={`w-1.5 h-1.5 rounded-full transition-colors ${i === activeIndex ? 'bg-[var(--accent-500,#14b8a6)]' : 'bg-gray-300'}`}
              />
            ))}
          </div>
        )}
      </div>

      {/* Quote — centred horizontally and vertically, truncates */}
      <p className="text-sm text-[var(--color-text-primary)] italic leading-relaxed flex-1 text-center line-clamp-5 flex items-center justify-center">
        &ldquo;{current.content}&rdquo;
      </p>

      {/* Endorser — centred, pinned to bottom */}
      <div className="flex flex-col items-center gap-1.5 mt-3 pt-3 border-t border-[var(--color-border-subtle)]">
        {endorserAvatar ? (
          <Image
            src={endorserAvatar}
            alt={endorserName}
            width={32}
            height={32}
            className="rounded-full object-cover"
          />
        ) : (
          <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-xs font-semibold text-gray-500">
            {endorserName.charAt(0)}
          </div>
        )}
        <div className="text-center">
          <p className="text-xs font-semibold text-[var(--color-text-primary)]">{endorserName}</p>
          {(current.endorser_role_label || yachtName) && (
            <p className="text-[10px] text-[var(--color-text-secondary)]">
              {current.endorser_role_label}{current.endorser_role_label && yachtName ? ' · ' : ''}{yachtName}
            </p>
          )}
        </div>
      </div>
    </div>
  )
}

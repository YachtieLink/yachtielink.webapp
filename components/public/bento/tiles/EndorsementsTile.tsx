'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
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

  // Auto-cycle every 5 seconds if multiple endorsements
  useEffect(() => {
    if (shown.length <= 1) return
    const timer = setInterval(() => {
      setActiveIndex((i) => (i + 1) % shown.length)
    }, 5000)
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
  const endorserHandle = current.endorser?.handle
  const endorserAvatar = current.endorser?.profile_photo_url
  const yachtName = current.yacht?.name

  return (
    <div className="h-full rounded-xl bg-white/80 p-5 flex flex-col" onTouchStart={handleTouchStart} onTouchEnd={handleTouchEnd}>
      <div className="flex items-center gap-2 mb-3">
        <MessageSquareQuote size={14} className="text-rose-500" />
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
      <div className="flex-1">
        <p className="text-sm text-[var(--color-text-primary)] italic line-clamp-3">
          &ldquo;{current.content}&rdquo;
        </p>
        <div className="flex items-center gap-2 mt-3">
          {endorserAvatar ? (
            <Image
              src={endorserAvatar}
              alt={endorserName}
              width={24}
              height={24}
              className="rounded-full object-cover"
            />
          ) : (
            <div className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center text-xs font-medium text-gray-500">
              {endorserName.charAt(0)}
            </div>
          )}
          <div className="min-w-0">
            {endorserHandle ? (
              <Link href={`/u/${endorserHandle}`} onClick={(e) => e.stopPropagation()} className="text-xs font-medium text-[var(--color-text-primary)] hover:underline truncate block">
                {endorserName}
              </Link>
            ) : (
              <span className="text-xs font-medium text-[var(--color-text-primary)] truncate block">{endorserName}</span>
            )}
            {(current.endorser_role_label || yachtName) && (
              <p className="text-[10px] text-[var(--color-text-secondary)] truncate">
                {current.endorser_role_label}{current.endorser_role_label && yachtName ? ' · ' : ''}{yachtName}
              </p>
            )}
          </div>
        </div>
      </div>
      <span className="mt-2 text-xs font-medium text-[var(--accent-500,#14b8a6)]">
        See all &rarr;
      </span>
    </div>
  )
}

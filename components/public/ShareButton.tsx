'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'

interface ShareButtonProps {
  url: string
  name: string
  /** Profile owner's user ID — used to record the link_share analytics event */
  userId: string
  /** 'default' = teal pill for inline use, 'compact' = frosted glass for overlays */
  variant?: 'default' | 'compact'
}

export function ShareButton({ url, name, userId, variant = 'default' }: ShareButtonProps) {
  const [copied, setCopied] = useState(false)

  function trackShare() {
    const supabase = createClient()
    void supabase.rpc('record_profile_event', {
      p_user_id: userId,
      p_event_type: 'link_share',
    })
  }

  async function handleShare() {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${name} — YachtieLink`,
          text: `Check out ${name}'s profile on YachtieLink`,
          url,
        })
        trackShare()
        return
      } catch {
        /* user cancelled */
      }
    }
    // Fallback: copy to clipboard
    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
      trackShare()
    } catch {
      // ignore
    }
  }

  const compactClass = "flex items-center justify-center w-10 h-10 rounded-full bg-black/25 backdrop-blur-md text-white hover:bg-black/40 transition-colors"
  const defaultClass = "mt-3 inline-flex items-center gap-1.5 rounded-full bg-[var(--color-interactive)] px-5 py-2 text-sm font-medium text-white hover:bg-[var(--color-interactive-hover)] transition-colors"

  const iconSize = variant === 'compact' ? 17 : 16

  return (
    <button
      onClick={handleShare}
      className={variant === 'compact' ? compactClass : defaultClass}
      aria-label={copied ? 'Link copied' : 'Share profile'}
    >
      <svg className={`h-[${iconSize}px] w-[${iconSize}px]`} style={{ width: iconSize, height: iconSize }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M7.217 10.907a2.25 2.25 0 1 0 0 2.186m0-2.186c.18.324.283.696.283 1.093s-.103.77-.283 1.093m0-2.186 9.566-5.314m-9.566 7.5 9.566 5.314m0 0a2.25 2.25 0 1 0 3.935 2.186 2.25 2.25 0 0 0-3.935-2.186Zm0-12.814a2.25 2.25 0 1 0 3.935-2.186 2.25 2.25 0 0 0-3.935 2.186Z" />
      </svg>
      {variant !== 'compact' && (copied ? 'Copied!' : 'Share')}
    </button>
  )
}

'use client'

import { useEffect } from 'react'
import Image from 'next/image'
import dynamic from 'next/dynamic'
import { X, Share2 } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { useToast } from '@/components/ui/Toast'

const QRCode = dynamic(() => import('react-qr-code').then((m) => m.default), { ssr: false })

interface ShareModalProps {
  handle: string
  displayName: string
  primaryRole?: string | null
  departments?: string[] | null
  profilePhotoUrl?: string | null
  onClose: () => void
}

export function ShareModal({
  handle,
  displayName,
  primaryRole,
  departments,
  profilePhotoUrl,
  onClose,
}: ShareModalProps) {
  const { toast } = useToast()
  const profileUrl = `https://yachtie.link/u/${handle}`
  const subtitle = [primaryRole, departments?.join(' · ')].filter(Boolean).join(' · ')

  // Lock body scroll while modal is open
  useEffect(() => {
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = '' }
  }, [])

  // Close on Escape
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [onClose])

  async function handleShare() {
    if (navigator.share) {
      try {
        await navigator.share({ url: profileUrl, title: `${displayName} on YachtieLink` })
        return
      } catch {
        // User cancelled or share failed — fall through to clipboard
      }
    }
    try {
      await navigator.clipboard.writeText(profileUrl)
      toast('Link copied', 'success')
    } catch {
      toast('Could not copy link', 'error')
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm"
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="relative w-full max-w-sm mx-4 bg-[var(--color-surface)] rounded-2xl p-8 flex flex-col items-center gap-5 text-center">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 w-8 h-8 flex items-center justify-center rounded-full text-[var(--color-text-tertiary)] hover:bg-[var(--color-surface-overlay)] transition-colors"
          aria-label="Close"
        >
          <X size={18} />
        </button>

        {/* Profile photo */}
        {profilePhotoUrl ? (
          <div className="relative w-28 h-28 rounded-full overflow-hidden border-2 border-[var(--color-border)]">
            <Image
              src={profilePhotoUrl}
              alt={displayName}
              fill
              className="object-cover"
              unoptimized
            />
          </div>
        ) : (
          <div className="w-28 h-28 rounded-full bg-[var(--color-surface-overlay)] flex items-center justify-center text-3xl text-[var(--color-text-tertiary)]">
            {displayName.charAt(0)}
          </div>
        )}

        {/* Name */}
        <div>
          <h2 className="text-2xl font-bold text-[var(--color-text-primary)]" style={{ fontFamily: 'var(--font-display, serif)' }}>
            {displayName}
          </h2>
          {subtitle && (
            <p className="text-sm text-[var(--color-text-secondary)] mt-1">{subtitle}</p>
          )}
        </div>

        {/* QR Code */}
        <div className="p-4 bg-white rounded-xl">
          <QRCode
            value={profileUrl}
            size={200}
            level="M"
            bgColor="#ffffff"
            fgColor="#000000"
          />
        </div>

        {/* Profile URL */}
        <p className="text-xs text-[var(--color-text-tertiary)] font-mono">
          yachtie.link/u/{handle}
        </p>

        {/* Share button */}
        <Button onClick={handleShare} className="w-full gap-2">
          <Share2 size={16} />
          Share Profile
        </Button>
      </div>
    </div>
  )
}

'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import dynamic from 'next/dynamic'
import { AnimatePresence, motion } from 'framer-motion'
import { easeGentle } from '@/lib/motion'

const QRCode = dynamic(() => import('react-qr-code').then(m => m.default), { ssr: false })

interface IdentityCardProps {
  displayName: string
  fullName: string
  handle: string
  primaryRole?: string | null
  departments?: string[] | null
  photoUrl?: string | null
}

export function IdentityCard({
  displayName,
  fullName,
  handle,
  primaryRole,
  departments,
  photoUrl,
}: IdentityCardProps) {
  const [copied, setCopied] = useState(false)
  const [showQR, setShowQR]   = useState(false)
  const profileUrl = `https://yachtie.link/u/${handle}`

  async function shareProfile() {
    const shareData = {
      title: `${displayName} — YachtieLink`,
      text: `Check out ${displayName}'s profile on YachtieLink`,
      url: profileUrl,
    }
    if (navigator.share) {
      try { await navigator.share(shareData) } catch { /* user cancelled */ }
    } else {
      await copyLink()
    }
  }

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(profileUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // fallback: select + execCommand for older browsers
    }
  }

  function downloadQR() {
    const svg  = document.getElementById('profile-qr-svg')
    if (!svg) return
    const data = new XMLSerializer().serializeToString(svg)
    const blob = new Blob([data], { type: 'image/svg+xml' })
    const url  = URL.createObjectURL(blob)
    const a    = document.createElement('a')
    a.href     = url
    a.download = `${handle}-qr.svg`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="bg-[var(--color-surface)] rounded-2xl p-5 flex flex-col gap-4">
      {/* Photo + name row */}
      <div className="flex items-center gap-4">
        <Link href="/app/profile/photo" className="relative shrink-0">
          {photoUrl ? (
            <Image
              src={photoUrl}
              alt={displayName}
              width={72}
              height={72}
              className="w-18 h-18 rounded-full object-cover ring-2 ring-[var(--color-border)]"
              unoptimized // CDN URL; next/image optimisation would re-fetch
            />
          ) : (
            <div className="w-[72px] h-[72px] rounded-full bg-[var(--color-surface-raised)] flex items-center justify-center ring-2 ring-[var(--color-border)]">
              <span className="text-2xl text-[var(--color-text-secondary)]">
                {(displayName || fullName).charAt(0).toUpperCase()}
              </span>
            </div>
          )}
          {/* Edit badge */}
          <span className="absolute -bottom-1 -right-1 bg-[var(--color-interactive)] text-white text-[10px] rounded-full w-5 h-5 flex items-center justify-center shadow">
            ✎
          </span>
        </Link>

        <div className="min-w-0 flex-1">
          <h1 className="font-semibold text-lg leading-tight text-[var(--color-text-primary)] truncate">
            {displayName || fullName}
          </h1>
          {primaryRole && (
            <p className="text-sm text-[var(--color-text-secondary)] truncate">{primaryRole}</p>
          )}
          {departments && departments.length > 0 && (
            <p className="text-xs text-[var(--color-text-secondary)] truncate">
              {departments.join(' · ')}
            </p>
          )}
        </div>
      </div>

      {/* Profile link row */}
      <div className="flex items-center gap-2">
        <Link
          href={`/u/${handle}`}
          className="flex-1 text-sm text-[var(--color-interactive)] truncate hover:underline"
        >
          yachtie.link/u/{handle}
        </Link>

        <button
          onClick={shareProfile}
          className="shrink-0 text-xs px-3 py-1.5 rounded-lg bg-[var(--color-interactive)] text-white hover:bg-[var(--color-interactive-hover)] transition-colors font-medium"
        >
          Share
        </button>

        <button
          onClick={copyLink}
          className="shrink-0 text-xs px-3 py-1.5 rounded-lg bg-[var(--color-surface-raised)] text-[var(--color-text-primary)] hover:bg-[var(--color-text-secondary)]/10 transition-colors"
        >
          {copied ? 'Copied!' : 'Copy'}
        </button>

        <button
          onClick={() => setShowQR((v) => !v)}
          className="shrink-0 text-xs px-3 py-1.5 rounded-lg bg-[var(--color-surface-raised)] text-[var(--color-text-primary)] hover:bg-[var(--color-text-secondary)]/10 transition-colors"
          aria-label="Show QR code"
        >
          QR
        </button>
      </div>

      {/* QR panel (toggle) */}
      <AnimatePresence>
        {showQR && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={easeGentle}
            className="overflow-hidden"
          >
            <div className="flex flex-col items-center gap-3 pt-1">
              <div className="bg-white p-3 rounded-xl">
                <QRCode
                  id="profile-qr-svg"
                  value={profileUrl}
                  size={160}
                  level="M"
                />
              </div>
              <button
                onClick={downloadQR}
                className="text-xs text-[var(--color-interactive)] hover:underline"
              >
                Download QR code
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import QRCode from 'react-qr-code'

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
    <div className="bg-[var(--card)] rounded-2xl p-5 flex flex-col gap-4">
      {/* Photo + name row */}
      <div className="flex items-center gap-4">
        <Link href="/app/profile/photo" className="relative shrink-0">
          {photoUrl ? (
            <Image
              src={photoUrl}
              alt={displayName}
              width={72}
              height={72}
              className="w-18 h-18 rounded-full object-cover ring-2 ring-[var(--border)]"
              unoptimized // CDN URL; next/image optimisation would re-fetch
            />
          ) : (
            <div className="w-[72px] h-[72px] rounded-full bg-[var(--muted)] flex items-center justify-center ring-2 ring-[var(--border)]">
              <span className="text-2xl text-[var(--muted-foreground)]">
                {(displayName || fullName).charAt(0).toUpperCase()}
              </span>
            </div>
          )}
          {/* Edit badge */}
          <span className="absolute -bottom-1 -right-1 bg-[var(--ocean-500)] text-white text-[10px] rounded-full w-5 h-5 flex items-center justify-center shadow">
            ✎
          </span>
        </Link>

        <div className="min-w-0 flex-1">
          <h1 className="font-semibold text-lg leading-tight text-[var(--foreground)] truncate">
            {displayName || fullName}
          </h1>
          {primaryRole && (
            <p className="text-sm text-[var(--muted-foreground)] truncate">{primaryRole}</p>
          )}
          {departments && departments.length > 0 && (
            <p className="text-xs text-[var(--muted-foreground)] truncate">
              {departments.join(' · ')}
            </p>
          )}
        </div>
      </div>

      {/* Profile link row */}
      <div className="flex items-center gap-2">
        <Link
          href={`/u/${handle}`}
          className="flex-1 text-sm text-[var(--ocean-500)] truncate hover:underline"
        >
          yachtie.link/u/{handle}
        </Link>

        <button
          onClick={copyLink}
          className="shrink-0 text-xs px-3 py-1.5 rounded-lg bg-[var(--muted)] text-[var(--foreground)] hover:bg-[var(--muted-foreground)]/10 transition-colors"
        >
          {copied ? 'Copied!' : 'Copy'}
        </button>

        <button
          onClick={() => setShowQR((v) => !v)}
          className="shrink-0 text-xs px-3 py-1.5 rounded-lg bg-[var(--muted)] text-[var(--foreground)] hover:bg-[var(--muted-foreground)]/10 transition-colors"
          aria-label="Show QR code"
        >
          QR
        </button>
      </div>

      {/* QR panel (toggle) */}
      {showQR && (
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
            className="text-xs text-[var(--ocean-500)] hover:underline"
          >
            Download QR code
          </button>
        </div>
      )}
    </div>
  )
}

'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Pencil, Copy, Share2, Check } from 'lucide-react'
import { Button, IconButton } from '@/components/ui'
import { useToast } from '@/components/ui/Toast'

interface ProfileHeroCardProps {
  displayName: string
  handle: string | null
  primaryRole: string | null
  departments: string[]
  profilePhotoUrl: string | null
}

export function ProfileHeroCard({
  displayName,
  handle,
  primaryRole,
  departments,
  profilePhotoUrl,
}: ProfileHeroCardProps) {
  const { toast } = useToast()
  const [copied, setCopied] = useState(false)

  const profileUrl = handle ? `yachtie.link/u/${handle}` : null

  async function copyUrl() {
    if (!handle) return
    await navigator.clipboard.writeText(`https://yachtie.link/u/${handle}`)
    setCopied(true)
    toast('Profile link copied!', 'success')
    setTimeout(() => setCopied(false), 2000)
  }

  async function shareProfile() {
    if (!handle) return
    const url = `https://yachtie.link/u/${handle}`
    if (navigator.share) {
      try {
        await navigator.share({ title: `${displayName} on YachtieLink`, url })
      } catch {
        // User cancelled share — ignore
      }
    } else {
      await navigator.clipboard.writeText(url)
      toast('Profile link copied!', 'success')
    }
  }

  return (
    <div className="bg-[var(--color-surface)] rounded-2xl p-4 flex flex-col gap-3">
      <div className="flex items-start gap-3">
        <div className="w-14 h-14 rounded-full overflow-hidden shrink-0 bg-[var(--color-surface-raised)]">
          {profilePhotoUrl ? (
            <Image
              src={profilePhotoUrl}
              alt={displayName}
              width={56}
              height={56}
              className="object-cover w-full h-full"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-lg font-semibold text-[var(--color-text-secondary)]">
              {displayName[0]?.toUpperCase()}
            </div>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-lg font-bold text-[var(--color-text-primary)] truncate">
            {displayName}
          </p>
          {primaryRole && (
            <p className="text-sm text-[var(--color-text-secondary)]">{primaryRole}</p>
          )}
          {departments.length > 0 && (
            <p className="text-xs text-[var(--color-text-tertiary)]">
              {departments.join(' \u00b7 ')}
            </p>
          )}
        </div>
        <Link href="/app/more/account" className="shrink-0">
          <IconButton icon={<Pencil size={16} />} label="Edit profile info" />
        </Link>
      </div>

      {profileUrl && (
        <div className="flex items-center gap-2">
          <p className="text-sm text-[var(--color-interactive)] truncate">{profileUrl}</p>
          <button
            onClick={copyUrl}
            className="shrink-0 text-[var(--color-text-tertiary)] hover:text-[var(--color-text-primary)] transition-colors p-1"
          >
            {copied ? <Check size={14} /> : <Copy size={14} />}
          </button>
        </div>
      )}

      <div className="flex gap-2">
        {handle && (
          <Link href={`/u/${handle}`} className="flex-1">
            <Button variant="outline" className="w-full">
              Preview
            </Button>
          </Link>
        )}
        <Button onClick={shareProfile} className="flex-1">
          Share Profile
        </Button>
      </div>
    </div>
  )
}

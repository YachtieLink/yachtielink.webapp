'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Pencil, Copy, Share2, Check } from 'lucide-react'
import { Button, IconButton } from '@/components/ui'
import { useToast } from '@/components/ui/Toast'
import { countryToFlag } from '@/lib/constants/country-iso'
import { formatSeaTime } from '@/lib/sea-time'
import { createClient } from '@/lib/supabase/client'

interface ProfileHeroCardProps {
  displayName: string
  handle: string | null
  /** Profile owner's user ID — used to record link_share analytics events */
  userId: string
  primaryRole: string | null
  departments: string[]
  profilePhotoUrl: string | null
  home_country?: string | null
  seaTimeTotalDays?: number
  seaTimeYachtCount?: number
  isPro?: boolean
}

export function ProfileHeroCard({
  displayName,
  handle,
  userId,
  primaryRole,
  departments,
  profilePhotoUrl,
  home_country,
  seaTimeTotalDays,
  seaTimeYachtCount,
  isPro = false,
}: ProfileHeroCardProps) {
  const { toast } = useToast()
  const [copied, setCopied] = useState(false)
  const [copiedPro, setCopiedPro] = useState(false)

  const profileUrl = handle ? `yachtie.link/u/${handle}` : null
  const proUrl = handle ? `${handle}.yachtie.link` : null

  function trackShare() {
    const supabase = createClient()
    void supabase.rpc('record_profile_event', {
      p_user_id: userId,
      p_event_type: 'link_share',
    })
  }

  async function copyUrl() {
    if (!handle) return
    await navigator.clipboard.writeText(`https://yachtie.link/u/${handle}`)
    setCopied(true)
    toast('Profile link copied!', 'success')
    setTimeout(() => setCopied(false), 2000)
    trackShare()
  }

  async function copyProUrl() {
    if (!handle) return
    await navigator.clipboard.writeText(`https://${handle}.yachtie.link`)
    setCopiedPro(true)
    toast(isPro ? 'Pro link copied!' : 'Link copied — upgrade to Pro to activate', isPro ? 'success' : 'info')
    setTimeout(() => setCopiedPro(false), 2000)
  }

  async function shareProfile() {
    if (!handle) return
    const url = `https://yachtie.link/u/${handle}`
    if (navigator.share) {
      try {
        await navigator.share({ title: `${displayName} on YachtieLink`, url })
        trackShare()
      } catch {
        // User cancelled share — ignore
      }
    } else {
      await navigator.clipboard.writeText(url)
      toast('Profile link copied!', 'success')
      trackShare()
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
            <p className="text-sm text-[var(--color-text-secondary)]">
              {primaryRole}{home_country ? ` · ${countryToFlag(home_country)}` : ''}
            </p>
          )}
          {departments.length > 0 && (
            <p className="text-xs text-[var(--color-text-tertiary)]">
              {departments.join(' \u00b7 ')}
            </p>
          )}
          {(seaTimeTotalDays ?? 0) > 0 && (
            <p className="text-xs text-[var(--color-text-tertiary)]">
              {formatSeaTime(seaTimeTotalDays!).displayShort} at sea · {seaTimeYachtCount} yacht{seaTimeYachtCount === 1 ? '' : 's'}
            </p>
          )}
        </div>
        <Link href="/app/profile/settings" className="shrink-0">
          <IconButton icon={<Pencil size={16} />} label="Edit profile info" />
        </Link>
      </div>

      {profileUrl && (
        <div className="flex flex-col gap-1.5">
          {/* Free link */}
          <div className="flex items-center gap-2">
            <span className="shrink-0 w-8" />
            <p className="text-sm text-[var(--color-interactive)] truncate flex-1">{profileUrl}</p>
            <button
              onClick={copyUrl}
              className="shrink-0 text-[var(--color-text-tertiary)] hover:text-[var(--color-text-primary)] transition-colors p-1"
            >
              {copied ? <Check size={14} /> : <Copy size={14} />}
            </button>
          </div>
          {/* Pro subdomain link */}
          {proUrl && (
            <div className="flex items-center gap-2">
              <Link href="/app/settings/plan" className="shrink-0 w-8 flex items-center justify-center">
                <span className="text-[9px] font-bold tracking-wider uppercase px-1.5 py-0.5 rounded bg-[var(--color-teal-100)] text-[var(--color-teal-700)] hover:bg-[var(--color-teal-200)] transition-colors cursor-pointer">
                  Pro
                </span>
              </Link>
              <a
                href={`https://${proUrl}`}
                target="_blank"
                rel="noopener noreferrer"
                className={`text-sm truncate flex-1 ${isPro ? 'text-[var(--color-interactive)] hover:underline' : 'text-[var(--color-text-tertiary)]'}`}
              >
                {proUrl}
              </a>
              <button
                onClick={copyProUrl}
                className="shrink-0 text-[var(--color-text-tertiary)] hover:text-[var(--color-text-primary)] transition-colors p-1"
              >
                {copiedPro ? <Check size={14} /> : <Copy size={14} />}
              </button>
              {!isPro && (
                <Link
                  href="/app/settings/plan"
                  className="shrink-0 text-[10px] font-medium text-[var(--color-interactive)] hover:underline"
                >
                  Upgrade
                </Link>
              )}
            </div>
          )}
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

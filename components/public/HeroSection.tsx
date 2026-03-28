'use client'

import { useScroll, useTransform, motion } from 'framer-motion'
import Image from 'next/image'
import Link from 'next/link'
import { MapPin, ChevronLeft, Pencil } from 'lucide-react'
import { SocialLinksRow } from '@/components/profile/SocialLinksRow'
import { ShareButton } from './ShareButton'
import { SaveProfileButton } from '@/components/profile/SaveProfileButton'
import { scrimPresets, type ScrimPreset } from '@/lib/scrim-presets'

interface HeroSectionProps {
  displayName: string
  primaryRole?: string | null
  departments?: string[] | null
  location?: string
  showLocation?: boolean
  availableForWork?: boolean
  isFoundingMember?: boolean
  isOwnProfile: boolean
  isLoggedIn?: boolean
  isColleague: boolean
  sharedYachtCount: number
  showMutual: boolean
  firstMutualName?: string
  socialLinks?: Array<{ platform: string; url: string }> | null
  profilePhotos: Array<{ id: string; photo_url: string; sort_order: number }>
  profilePhotoUrl?: string | null
  profileUrl: string
  savedUserId: string
  savedStatus?: { id: string; folder_id: string | null } | null
  heroStats?: string[]
  homeCountryFlag?: string
  viewModeToggle?: React.ReactNode
  scrimPreset?: ScrimPreset
  focalX?: number
  focalY?: number
}

export function HeroSection({
  displayName,
  primaryRole,
  departments,
  location,
  showLocation,
  availableForWork,
  isFoundingMember,
  isOwnProfile,
  isLoggedIn,
  isColleague,
  sharedYachtCount,
  showMutual,
  firstMutualName,
  socialLinks,
  profilePhotos,
  profilePhotoUrl,
  profileUrl,
  savedUserId,
  savedStatus,
  heroStats = [],
  homeCountryFlag,
  viewModeToggle,
  scrimPreset: scrimPresetKey,
  focalX = 50,
  focalY = 30,
}: HeroSectionProps) {
  const scrim = scrimPresets[scrimPresetKey ?? 'dark']
  const { scrollY } = useScroll()
  const heroHeight = useTransform(scrollY, [0, 200], ['70vh', '50vh'])
  const marginInline = useTransform(scrollY, [0, 200], ['12px', '16px'])
  const borderRadius = useTransform(scrollY, [0, 200], ['20px', '16px'])

  return (
    // Animated hero — renders on all breakpoints (single-column layout)
    <motion.div
      className="relative shrink-0 overflow-hidden"
      style={{ height: heroHeight, marginLeft: marginInline, marginRight: marginInline, borderRadius }}
    >
      {/* Single hero photo — primary profile photo only */}
      <div className="absolute inset-0">
        {(profilePhotoUrl || profilePhotos[0]?.photo_url) ? (
          <Image
            src={profilePhotos[0]?.photo_url || profilePhotoUrl!}
            alt={displayName}
            fill
            priority
            sizes="100vw"
            className="object-cover"
            style={{ objectPosition: `${focalX}% ${focalY}%` }}
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-gray-300 to-gray-500" />
        )}
      </div>

      {/* Scrim gradient — smooth four-stop: subtle at top, clear in middle, darker at bottom for text */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{ background: scrim.gradient }}
      />

      {/* Top bar — icon-only buttons over photo */}
      <div className="absolute top-0 left-0 right-0 flex items-center justify-between px-4 pt-[max(env(safe-area-inset-top,0px),1rem)] z-10">
        <button
          onClick={() => {
            const isSameOrigin = document.referrer && new URL(document.referrer).origin === window.location.origin
            if (isSameOrigin) window.history.back()
            else window.location.assign('/')
          }}
          className="flex items-center justify-center w-10 h-10 rounded-full bg-black/25 backdrop-blur-md text-white hover:bg-black/40 transition-colors"
          aria-label="Go back"
        >
          <ChevronLeft size={20} />
        </button>
        <div className="flex items-center gap-2">
          {isOwnProfile ? (
            <Link
              href="/app/profile"
              className="flex items-center justify-center w-10 h-10 rounded-full bg-black/25 backdrop-blur-md text-white hover:bg-black/40 transition-colors"
              aria-label="Edit profile"
            >
              <Pencil size={16} />
            </Link>
          ) : isLoggedIn ? (
            <SaveProfileButton
              savedUserId={savedUserId}
              initialSaved={!!savedStatus}
              initialFolderId={savedStatus?.folder_id}
            />
          ) : null}
          <ShareButton url={profileUrl} name={displayName} variant="compact" />
        </div>
      </div>

      {/* Identity — overlaid at bottom of photo */}
      <div className="absolute bottom-0 left-0 right-0 px-5 pb-6 z-10 flex flex-col gap-3">
        {/* Availability badge — top of identity block */}
        {availableForWork && (
          <span className={`self-start flex items-center gap-1.5 ${scrim.badgeBg} backdrop-blur-md border border-green-400/40 rounded-full px-3 py-1 text-xs font-semibold text-green-300 tracking-wide uppercase`}>
            <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
            Available for work
          </span>
        )}

        {/* Name — large, confident, serif */}
        <h1 className={`${scrim.textColor} font-serif text-3xl sm:text-4xl leading-[1.1] tracking-tight`} style={{ textShadow: scrim.textShadow === 'none' ? 'none' : '0 2px 12px rgba(0,0,0,0.6), 0 1px 3px rgba(0,0,0,0.4)' }}>
          <span className="inline-flex items-baseline gap-2 flex-wrap">
            <span>{displayName}</span>
            {homeCountryFlag && <span className="text-2xl sm:text-3xl">{homeCountryFlag}</span>}
          </span>
        </h1>

        {/* Role + Department — unified line */}
        {(primaryRole || (departments && departments.length > 0)) && (
          <p className={`${scrim.subtextColor} text-base font-medium`} style={{ textShadow: scrim.textShadow === 'none' ? 'none' : '0 1px 6px rgba(0,0,0,0.5)' }}>
            {primaryRole}
            {primaryRole && departments && departments.length > 0 && (
              <span className="opacity-50 mx-2">·</span>
            )}
            {departments && departments.length > 0 && (
              <span className="opacity-70">{departments.join(', ')}</span>
            )}
          </p>
        )}

        {/* Hero stats: age, sea time */}
        {heroStats.length > 0 && (
          <p className={`${scrim.subtextColor} ${scrim.variant === 'dark' ? 'opacity-70' : ''} text-sm font-medium`}>
            {heroStats.join(' · ')}
          </p>
        )}

        {/* Location */}
        {showLocation && location && (
          <p className={`${scrim.subtextColor} ${scrim.variant === 'dark' ? 'opacity-60' : ''} text-sm flex items-center gap-1.5 font-medium`}>
            <MapPin size={13} className={scrim.variant === 'dark' ? 'opacity-50' : ''} />{location}
          </p>
        )}

        {/* View Mode Toggle */}
        {viewModeToggle}

        {/* Social links row (white variant on dark bg) */}
        {socialLinks && socialLinks.length > 0 && (
          <SocialLinksRow links={socialLinks as any} variant="light" />
        )}

        {/* Badges */}
        <div className="flex flex-wrap gap-2">
          {isFoundingMember && (
            <span className="inline-flex items-center gap-1 rounded-full bg-amber-400/20 backdrop-blur-sm border border-amber-400/30 px-2.5 py-0.5 text-xs font-semibold text-amber-300">
              ⚓ Founding Member
            </span>
          )}
          {isColleague && (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-teal-400/20 backdrop-blur-sm border border-teal-400/30 px-2.5 py-0.5 text-xs font-medium text-teal-300">
              🤝 Colleague{sharedYachtCount > 1 ? ` · ${sharedYachtCount} yachts` : ''}
            </span>
          )}
          {showMutual && firstMutualName && (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 px-2.5 py-0.5 text-xs font-medium text-white/70">
              2nd connection · via {firstMutualName}
            </span>
          )}
        </div>
      </div>
    </motion.div>
  )
}

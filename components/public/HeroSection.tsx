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
  isPro?: boolean
  viewerIsPro?: boolean
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
  isPro,
  viewerIsPro,
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
    <>
    <style>{`
      @keyframes availPulse {
        0%, 85%, 100% { opacity: 0.6; box-shadow: 0 0 6px rgba(74,222,128,0.25); }
        90% { opacity: 1; box-shadow: 0 0 8px rgba(74,222,128,0.5); }
      }
    `}</style>
    {/* Animated hero — renders on all breakpoints (single-column layout) */}
    <motion.div
      className="relative shrink-0 overflow-hidden"
      style={{ height: heroHeight, marginTop: 12, marginLeft: marginInline, marginRight: marginInline, borderRadius }}
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

      {/* Identity — overlaid at bottom-left, stacked vertically */}
      <div className="absolute bottom-14 left-0 right-0 px-5 z-10 flex flex-col gap-1.5">
        <h1 className={`${scrim.textColor} font-serif text-3xl sm:text-4xl leading-[1.1] tracking-tight`} style={{ textShadow: scrim.textShadow === 'none' ? 'none' : '0 2px 12px rgba(0,0,0,0.6), 0 1px 3px rgba(0,0,0,0.4)' }}>
          {displayName}{homeCountryFlag ? <span className="ml-2 text-2xl sm:text-3xl align-middle">{homeCountryFlag}</span> : null}
        </h1>
        {primaryRole && (
          <p className={`${scrim.subtextColor} text-sm font-medium flex items-center gap-1.5`} style={{ textShadow: scrim.textShadow === 'none' ? 'none' : '0 1px 6px rgba(0,0,0,0.5)' }}>
            {availableForWork && (
              <span className="w-2 h-2 rounded-full bg-green-400/60 shrink-0" style={{ boxShadow: '0 0 6px rgba(74,222,128,0.25)', animation: 'availPulse 5s ease-in-out infinite' }} title="Available for work" />
            )}
            {primaryRole}
          </p>
        )}
        {heroStats.length > 0 && (
          <p className={`${scrim.subtextColor} ${scrim.variant === 'dark' ? 'opacity-70' : ''} text-xs font-medium`} style={{ textShadow: scrim.textShadow === 'none' ? 'none' : '0 1px 4px rgba(0,0,0,0.4)' }}>
            {heroStats.join(' · ')}
          </p>
        )}
        {showLocation && location && (
          <p className={`${scrim.subtextColor} ${scrim.variant === 'dark' ? 'opacity-60' : ''} text-xs font-medium flex items-center gap-1.5`} style={{ textShadow: scrim.textShadow === 'none' ? 'none' : '0 1px 4px rgba(0,0,0,0.4)' }}>
            <MapPin size={12} />{location}
          </p>
        )}
      </div>

      {/* Bottom bar: Pro badge left, toggle + social links right */}
      <div className="absolute bottom-3 left-5 right-4 z-10 flex items-center justify-between">
        {/* Badges — left */}
        <div className="flex items-center gap-1.5">
          {isColleague && (
            <Link
              href="/app/network/relationship"
              className="inline-flex items-center rounded-full bg-white/15 backdrop-blur-sm border border-white/30 px-2 py-0.5 text-[10px] font-medium text-white/90 hover:bg-white/25 transition-colors"
              style={{ textShadow: '0 1px 3px rgba(0,0,0,0.3)' }}
            >
              Colleague
            </Link>
          )}
          {isPro && (
            isLoggedIn && !viewerIsPro && !isOwnProfile ? (
              <Link
                href="/app/billing"
                className="inline-flex items-center rounded-full bg-amber-400/20 backdrop-blur-sm border border-amber-400/30 px-2 py-0.5 text-[10px] font-medium text-amber-300 hover:bg-amber-400/30 transition-colors"
                style={{ textShadow: '0 1px 3px rgba(0,0,0,0.3)' }}
              >
                Pro
              </Link>
            ) : (
              <span className="inline-flex items-center rounded-full bg-amber-400/20 backdrop-blur-sm border border-amber-400/30 px-2 py-0.5 text-[10px] font-medium text-amber-300" style={{ textShadow: '0 1px 3px rgba(0,0,0,0.3)' }}>
                Pro
              </span>
            )
          )}
        </div>
        {/* Social links + toggle — right */}
        <div className="flex items-center gap-2">
          {socialLinks && socialLinks.length > 0 && (
            <SocialLinksRow links={socialLinks as any} variant="light" />
          )}
          {viewModeToggle}
        </div>
      </div>

      {/* Mutual badge — top-left below back button (colleague moved to bottom bar) */}
      {showMutual && firstMutualName && (
        <div className="absolute top-16 left-4 z-10">
          <span className="inline-flex items-center rounded-full bg-white/15 backdrop-blur-sm border border-white/30 px-2 py-0.5 text-[10px] font-medium text-white/70" style={{ textShadow: '0 1px 3px rgba(0,0,0,0.3)' }}>
            via {firstMutualName}
          </span>
        </div>
      )}
    </motion.div>
    </>
  )
}

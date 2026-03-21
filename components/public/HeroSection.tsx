'use client'

import { useScroll, useTransform, motion } from 'framer-motion'
import Link from 'next/link'
import { MapPin } from 'lucide-react'
import { PhotoGallery } from '@/components/profile/PhotoGallery'
import { SocialLinksRow } from '@/components/profile/SocialLinksRow'
import { ShareButton } from './ShareButton'
import { SaveProfileButton } from '@/components/profile/SaveProfileButton'

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
}: HeroSectionProps) {
  const { scrollY } = useScroll()
  const heroHeight = useTransform(scrollY, [0, 200], ['60vh', '34vh'])
  const marginInline = useTransform(scrollY, [0, 200], ['0px', '16px'])
  const borderRadius = useTransform(scrollY, [0, 200], ['0px', '16px'])

  return (
    // Mobile-only animated hero (md:hidden — desktop stays in PublicProfileContent)
    <motion.div
      className="relative md:hidden shrink-0 overflow-hidden"
      style={{ height: heroHeight, marginLeft: marginInline, marginRight: marginInline, borderRadius }}
    >
      {/* Photo fills this panel */}
      <div className="relative h-full w-full">
        <PhotoGallery
          photos={profilePhotos}
          profilePhotoUrl={profilePhotoUrl}
          displayName={displayName}
          fillContainer
        />
      </div>

      {/* Strong gradient — dark at top (for buttons) and bottom (for identity) */}
      <div className="absolute inset-0 pointer-events-none">
        {/* Top fade for nav readability */}
        <div className="h-28 bg-gradient-to-b from-black/50 to-transparent" />
        {/* Bottom fade for identity readability */}
        <div className="absolute bottom-0 left-0 right-0 h-2/3 bg-gradient-to-t from-black/85 via-black/40 to-transparent" />
      </div>

      {/* Top bar — absolutely positioned over photo */}
      <div className="absolute top-0 left-0 right-0 flex items-center justify-between px-4 pt-safe-top pt-4 z-10">
        <Link href="/" className="text-white/90 text-sm font-medium drop-shadow-sm">
          ← YachtieLink
        </Link>
        <div className="flex items-center gap-2">
          {isOwnProfile ? (
            <Link
              href="/app/profile"
              className="text-xs px-3 py-1.5 rounded-full bg-white/20 backdrop-blur-sm text-white font-medium hover:bg-white/30 transition-colors"
            >
              Edit profile
            </Link>
          ) : isLoggedIn ? (
            <SaveProfileButton
              savedUserId={savedUserId}
              initialSaved={!!savedStatus}
              initialFolderId={savedStatus?.folder_id}
            />
          ) : null}
          <ShareButton url={profileUrl} name={displayName} />
        </div>
      </div>

      {/* Identity — overlaid at bottom of photo */}
      <div className="absolute bottom-0 left-0 right-0 px-5 pb-6 z-10 flex flex-col gap-2">
        {/* Name + availability */}
        <div className="flex items-end justify-between gap-2">
          <div>
            <h1 className="text-white font-serif text-3xl leading-tight drop-shadow-md">{displayName}</h1>
            {primaryRole && (
              <p className="text-white/80 text-sm font-medium">{primaryRole}</p>
            )}
          </div>
          {availableForWork && (
            <span className="shrink-0 flex items-center gap-1 bg-green-500/20 backdrop-blur-sm border border-green-400/40 rounded-full px-2.5 py-1 text-xs font-semibold text-green-300">
              <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
              Available
            </span>
          )}
        </div>

        {/* Departments */}
        {departments && departments.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {departments.map((dept) => (
              <span key={dept} className="text-xs px-2.5 py-0.5 rounded-full bg-white/15 backdrop-blur-sm text-white/90">
                {dept}
              </span>
            ))}
          </div>
        )}

        {/* Location */}
        {showLocation && location && (
          <p className="text-white/70 text-sm flex items-center gap-1"><MapPin size={14} />{location}</p>
        )}

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

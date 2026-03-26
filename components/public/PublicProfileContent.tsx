/**
 * PublicProfileContent — Bumble-style hero photo with identity overlaid,
 * then scrollable accordion sections below.
 *
 * Section rendering is delegated to components/public/sections/ to keep this
 * file focused on layout and the desktop hero.
 */
import Link from 'next/link'
import { MapPin, ChevronLeft, Pencil, Download } from 'lucide-react'
import { ShareButton } from './ShareButton'
import { HeroSection } from './HeroSection'
import { ProfileAccordion } from '@/components/profile/ProfileAccordion'
import { PhotoGallery } from '@/components/profile/PhotoGallery'
import { SocialLinksRow } from '@/components/profile/SocialLinksRow'
import { formatSeaTime } from '@/lib/sea-time'
import { SaveProfileButton } from '@/components/profile/SaveProfileButton'
import { ScrollReveal } from '@/components/ui/ScrollReveal'
import { aboutSummary, hobbiesSummary, educationSummary } from '@/lib/profile-summaries'
import { ExperienceSection } from './sections/ExperienceSection'
import { EndorsementsSection } from './sections/EndorsementsSection'
import { CertificationsSection } from './sections/CertificationsSection'
import { SkillsSection } from './sections/SkillsSection'
import { GallerySection } from './sections/GallerySection'
import type {
  PublicAttachment, PublicCertification, PublicEndorsement,
  ProfilePhoto, Hobby, Education, Skill, GalleryItem,
  ViewerRelationship,
} from '@/lib/queries/types'

// ── Types ─────────────────────────────────────────────────────────────────────

interface UserProfile {
  id: string
  full_name: string
  display_name?: string | null
  handle: string
  primary_role?: string | null
  departments?: string[] | null
  bio?: string | null
  ai_summary?: string | null
  profile_photo_url?: string | null
  phone?: string | null
  whatsapp?: string | null
  email?: string | null
  location_country?: string | null
  location_city?: string | null
  show_phone?: boolean
  show_whatsapp?: boolean
  show_email?: boolean
  show_location?: boolean
  available_for_work?: boolean
  founding_member?: boolean
  social_links?: Array<{ platform: string; url: string }> | null
  cv_public?: boolean
  cv_public_source?: string
  latest_pdf_path?: string | null
  cv_storage_path?: string | null
}

export interface PublicProfileContentProps {
  user: UserProfile
  attachments: PublicAttachment[]
  certifications: PublicCertification[]
  endorsements: PublicEndorsement[]
  profilePhotos: ProfilePhoto[]
  hobbies: Hobby[]
  education: Education[]
  skills: Skill[]
  gallery: GalleryItem[]
  isFoundingMember?: boolean
  isLoggedIn?: boolean
  viewerRelationship?: ViewerRelationship
  sectionVisibility?: Record<string, boolean>
  savedStatus?: { id: string; folder_id: string | null } | null
  seaTimeTotalDays?: number
  seaTimeYachtCount?: number
  age?: number | null
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function sectionVisible(visibility: Record<string, boolean>, key: string, hasData: boolean): boolean {
  return visibility[key] !== false && hasData
}

// ── Component ─────────────────────────────────────────────────────────────────

export function PublicProfileContent({
  user,
  attachments,
  certifications,
  endorsements,
  profilePhotos,
  hobbies,
  education,
  skills,
  gallery,
  isFoundingMember = false,
  isLoggedIn,
  viewerRelationship,
  sectionVisibility = {},
  savedStatus,
  seaTimeTotalDays = 0,
  seaTimeYachtCount = 0,
  age,
}: PublicProfileContentProps) {
  const displayName = user.display_name ?? user.full_name
  const firstName = displayName.split(' ')[0]
  const isOwnProfile = viewerRelationship?.isOwnProfile ?? false
  const sharedYachtIdSet = new Set(viewerRelationship?.sharedYachtIds ?? [])
  const isColleague = sharedYachtIdSet.size > 0
  const mutualColleagues = viewerRelationship?.mutualColleagues ?? []
  const showMutual = !isColleague && mutualColleagues.length > 0
  const firstMutual = mutualColleagues[0]

  const profileUrl = `https://yachtie.link/u/${user.handle}`
  const mutualColleagueIds = new Set(mutualColleagues.map((c) => c.id))
  const mutualEndorserCount = endorsements.filter(
    (e) => e.endorser?.id && mutualColleagueIds.has(e.endorser.id)
  ).length

  const location = [user.location_city, user.location_country].filter(Boolean).join(', ')

  // Hero stat parts: age (server-computed) + sea time
  const heroStats: string[] = []
  if (age) heroStats.push(`${age} years old`)
  if (seaTimeTotalDays > 0) heroStats.push(`${formatSeaTime(seaTimeTotalDays).displayLong} at sea`)

  return (
    // ── Outer: stacked on mobile, side-by-side on desktop ────────────────────
    <div className="flex flex-col md:flex-row md:min-h-screen">

      {/* ── MOBILE: Animated hero (client component, md:hidden) ────────────── */}
      <HeroSection
        displayName={displayName}
        primaryRole={user.primary_role}
        departments={user.departments}
        location={location}
        showLocation={user.show_location}
        availableForWork={user.available_for_work}
        isFoundingMember={isFoundingMember}
        isOwnProfile={isOwnProfile}
        isLoggedIn={isLoggedIn}
        isColleague={isColleague}
        sharedYachtCount={sharedYachtIdSet.size}
        showMutual={showMutual}
        firstMutualName={firstMutual?.name}
        socialLinks={user.social_links}
        profilePhotos={profilePhotos}
        profilePhotoUrl={user.profile_photo_url}
        profileUrl={profileUrl}
        savedUserId={user.id}
        savedStatus={savedStatus}
        heroStats={heroStats}
      />

      {/* ── LEFT: Desktop hero photo panel (hidden on mobile) ─────────────── */}
      <div className="relative hidden md:block md:w-2/5 md:sticky md:top-0 md:h-screen shrink-0 overflow-hidden">

        {/* Photo fills this panel */}
        <div className="relative h-full w-full">
          <PhotoGallery
            photos={profilePhotos}
            profilePhotoUrl={user.profile_photo_url}
            displayName={displayName}
            fillContainer
          />
        </div>

        {/* Strong gradient — dark at top (for buttons) and bottom (for identity) */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="h-28 bg-gradient-to-b from-black/50 to-transparent" />
          <div className="absolute bottom-0 left-0 right-0 h-2/3 bg-gradient-to-t from-black/85 via-black/40 to-transparent" />
        </div>

        {/* Top bar — icon-only buttons over photo */}
        <div className="absolute top-0 left-0 right-0 flex items-center justify-between px-4 pt-[max(env(safe-area-inset-top,0px),1rem)] z-10">
          <Link
            href="/"
            className="flex items-center justify-center w-10 h-10 rounded-full bg-black/25 backdrop-blur-md text-white hover:bg-black/40 transition-colors"
            aria-label="Go back"
          >
            <ChevronLeft size={20} />
          </Link>
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
                savedUserId={user.id}
                initialSaved={!!savedStatus}
                initialFolderId={savedStatus?.folder_id}
              />
            ) : null}
            <ShareButton url={profileUrl} name={displayName} variant="compact" />
          </div>
        </div>

        {/* Identity — overlaid at bottom of photo */}
        <div className="absolute bottom-0 left-0 right-0 px-5 pb-6 z-10 flex flex-col gap-3">
          {user.available_for_work && (
            <span className="self-start flex items-center gap-1.5 bg-green-500/25 backdrop-blur-md border border-green-400/40 rounded-full px-3 py-1 text-xs font-semibold text-green-300 tracking-wide uppercase">
              <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
              Available for work
            </span>
          )}

          {/* Name — large, confident */}
          <h1 className="text-white font-serif text-4xl md:text-5xl leading-[1.1] tracking-tight" style={{ textShadow: '0 2px 12px rgba(0,0,0,0.6), 0 1px 3px rgba(0,0,0,0.4)' }}>{displayName}</h1>

          {(user.primary_role || (user.departments && user.departments.length > 0)) && (
            <p className="text-white/90 text-base font-medium" style={{ textShadow: '0 1px 6px rgba(0,0,0,0.5)' }}>
              {user.primary_role}
              {user.primary_role && user.departments && user.departments.length > 0 && (
                <span className="text-white/50 mx-2">·</span>
              )}
              {user.departments && user.departments.length > 0 && (
                <span className="text-white/70">{user.departments.join(', ')}</span>
              )}
            </p>
          )}

          {/* Hero stats: age, sea time */}
          {heroStats.length > 0 && (
            <p className="text-white/70 text-sm font-medium drop-shadow-sm">
              {heroStats.join(' · ')}
            </p>
          )}

          {user.show_location && location && (
            <p className="text-white/60 text-sm flex items-center gap-1.5 font-medium">
              <MapPin size={13} className="text-white/50" />{location}
            </p>
          )}

          {user.social_links && user.social_links.length > 0 && (
            <SocialLinksRow links={user.social_links as any} variant="light" />
          )}

          {/* Badges */}
          <div className="flex flex-wrap gap-2">
            {isFoundingMember && (
              <span className="inline-flex items-center gap-1 rounded-full bg-amber-400/20 backdrop-blur-sm border border-amber-400/30 px-2.5 py-0.5 text-xs font-semibold text-amber-300">
                Founding Member
              </span>
            )}
            {isColleague && (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-teal-400/20 backdrop-blur-sm border border-teal-400/30 px-2.5 py-0.5 text-xs font-medium text-teal-300">
                Colleague{sharedYachtIdSet.size > 1 ? ` · ${sharedYachtIdSet.size} yachts` : ''}
              </span>
            )}
            {showMutual && firstMutual && (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 px-2.5 py-0.5 text-xs font-medium text-white/70">
                2nd connection · via {firstMutual.name}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* ── RIGHT / BOTTOM: Scrollable content ────────────────────────────── */}
      <div className="flex-1 md:overflow-y-auto">
        <div className="flex flex-col gap-4 px-4 pt-4 pb-24">

          {/* Contact info — only shown when user has opted in */}
          {(
            (user.show_email && user.email) ||
            (user.show_phone && user.phone) ||
            (user.show_whatsapp && user.whatsapp)
          ) && (
            <div className="bg-[var(--color-surface)] rounded-2xl p-4 flex flex-col gap-1.5 border border-[var(--color-border-subtle)]">
              <p className="text-xs font-semibold uppercase tracking-wide text-[var(--color-text-secondary)] mb-1">Contact</p>
              {user.show_email && user.email && (
                <a href={`mailto:${user.email}?subject=${encodeURIComponent(`Hey ${firstName}`)}&body=${encodeURIComponent(`Hey ${firstName}, I saw your profile on YachtieLink.\n\n`)}`} className="text-sm text-[var(--color-interactive)] hover:underline">{user.email}</a>
              )}
              {user.show_phone && user.phone && (
                <a href={`tel:${user.phone}`} className="text-sm text-[var(--color-text-primary)]">{user.phone}</a>
              )}
              {user.show_whatsapp && user.whatsapp && (
                <a href={`https://wa.me/${user.whatsapp.replace(/\D/g, '')}?text=${encodeURIComponent(`Hey ${firstName}, I saw your profile on YachtieLink. `)}`} target="_blank" rel="noopener noreferrer" className="text-sm text-[var(--color-interactive)] hover:underline">
                  WhatsApp: {user.whatsapp}
                </a>
              )}
            </div>
          )}

          {/* CV — View + Download (cv_public defaults to true when null) */}
          {user.cv_public !== false && (
            (user.cv_public_source === 'uploaded' ? user.cv_storage_path : user.latest_pdf_path)
          ) && (
            <div className="bg-[var(--color-surface)] rounded-2xl p-4 border border-[var(--color-border-subtle)] flex items-center justify-between">
              <a
                href={`/u/${user.handle}/cv`}
                className="flex items-center gap-2 text-sm font-medium text-[var(--color-interactive)] hover:underline"
              >
                View CV
              </a>
              <a
                href={`/api/cv/public-download/${user.handle}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[var(--color-text-tertiary)] hover:text-[var(--color-text-primary)] transition-colors"
              >
                <Download size={16} />
              </a>
            </div>
          )}

          {/* About */}
          {sectionVisible(sectionVisibility, 'about', !!(user.ai_summary || user.bio)) && (
            <ScrollReveal>
            <ProfileAccordion
              title="About"
              summary={aboutSummary(user.ai_summary, user.bio)}
              accentColor="teal"
            >
              <p className="text-sm text-[var(--color-text-primary)] leading-relaxed whitespace-pre-line">
                {user.ai_summary || user.bio}
              </p>
            </ProfileAccordion>
            </ScrollReveal>
          )}

          {/* Sea Time Stat Line */}
          {seaTimeTotalDays > 0 && (
            <div className="px-1 py-2">
              <p className="text-sm text-[var(--color-text-secondary)]">
                {formatSeaTime(seaTimeTotalDays).displayLong} at sea · {seaTimeYachtCount} {seaTimeYachtCount === 1 ? 'yacht' : 'yachts'}
              </p>
            </div>
          )}

          {/* Experience */}
          {sectionVisible(sectionVisibility, 'experience', attachments.length > 0) && (
            <ExperienceSection attachments={attachments} sharedYachtIdSet={sharedYachtIdSet} />
          )}

          {/* Endorsements */}
          {sectionVisible(sectionVisibility, 'endorsements', endorsements.length > 0) && (
            <EndorsementsSection endorsements={endorsements} mutualEndorserCount={mutualEndorserCount} />
          )}

          {/* Certifications */}
          {sectionVisible(sectionVisibility, 'certifications', certifications.length > 0) && (
            <CertificationsSection certifications={certifications} />
          )}

          {/* Education */}
          {sectionVisible(sectionVisibility, 'education', education.length > 0) && (
            <ScrollReveal>
            <ProfileAccordion
              title="Education"
              summary={educationSummary(education)}
              accentColor="teal"
            >
              <div className="flex flex-col gap-3">
                {education.map((edu) => (
                  <div key={edu.id}>
                    <p className="text-sm font-medium text-[var(--color-text-primary)]">{edu.institution}</p>
                    {edu.qualification && <p className="text-sm text-[var(--color-text-secondary)]">{edu.qualification}</p>}
                    {edu.field_of_study && <p className="text-xs text-[var(--color-text-secondary)]">{edu.field_of_study}</p>}
                    {(edu.started_at || edu.ended_at) && (
                      <p className="text-xs text-[var(--color-text-secondary)]">
                        {edu.started_at ? new Date(edu.started_at).getFullYear() : ''}{edu.started_at && edu.ended_at ? ' – ' : ''}{edu.ended_at ? new Date(edu.ended_at).getFullYear() : ''}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </ProfileAccordion>
            </ScrollReveal>
          )}

          {/* Hobbies */}
          {sectionVisible(sectionVisibility, 'hobbies', hobbies.length > 0) && (
            <ScrollReveal>
            <ProfileAccordion
              title="Hobbies"
              summary={hobbiesSummary(hobbies)}
            >
              <div className="flex flex-wrap gap-2">
                {hobbies.map((h) => (
                  <span key={h.id} className="text-sm px-3 py-1.5 rounded-full bg-[var(--color-surface-raised)] text-[var(--color-text-primary)]">
                    {h.emoji ? `${h.emoji} ${h.name}` : h.name}
                  </span>
                ))}
              </div>
            </ProfileAccordion>
            </ScrollReveal>
          )}

          {/* Skills */}
          {sectionVisible(sectionVisibility, 'skills', skills.length > 0) && (
            <SkillsSection skills={skills} />
          )}

          {/* Gallery */}
          {sectionVisible(sectionVisibility, 'gallery', gallery.length > 0) && (
            <GallerySection gallery={gallery} />
          )}
        </div>

        {/* Fallback when all sections are hidden */}
        {!sectionVisible(sectionVisibility, 'about', !!(user.ai_summary || user.bio)) &&
         !sectionVisible(sectionVisibility, 'experience', attachments.length > 0) &&
         !sectionVisible(sectionVisibility, 'endorsements', endorsements.length > 0) &&
         !sectionVisible(sectionVisibility, 'certifications', certifications.length > 0) &&
         !sectionVisible(sectionVisibility, 'education', education.length > 0) &&
         !sectionVisible(sectionVisibility, 'hobbies', hobbies.length > 0) &&
         !sectionVisible(sectionVisibility, 'skills', skills.length > 0) &&
         !sectionVisible(sectionVisibility, 'gallery', gallery.length > 0) && (
          <div className="px-4 py-8 text-center">
            <p className="text-sm text-[var(--color-text-tertiary)]">
              This crew member hasn&apos;t shared their profile details yet.
            </p>
          </div>
        )}

        {/* Bottom CTAs */}
        <div className="px-4 pb-8 flex flex-col gap-3">
          {!isLoggedIn ? (
            <>
              <Link
                href="/signup"
                className="w-full flex items-center justify-center rounded-xl bg-[var(--color-interactive)] px-6 py-3 text-sm font-semibold text-white hover:bg-[var(--color-interactive-hover)] transition-colors"
              >
                Build your crew profile — it&apos;s free
              </Link>
              <Link
                href="/login"
                className="w-full flex items-center justify-center rounded-xl border border-[var(--color-border)] px-6 py-3 text-sm font-medium text-[var(--color-text-primary)] hover:bg-[var(--color-surface-raised)] transition-colors"
              >
                Sign in to see how you know {displayName}
              </Link>
            </>
          ) : isOwnProfile ? (
            <Link
              href="/app/profile"
              className="w-full flex items-center justify-center rounded-xl border border-[var(--color-border)] px-6 py-3 text-sm font-medium text-[var(--color-text-primary)] hover:bg-[var(--color-surface-raised)] transition-colors"
            >
              Back to my profile
            </Link>
          ) : (
            <Link
              href="/app/profile"
              className="w-full flex items-center justify-center rounded-xl border border-[var(--color-border)] px-6 py-3 text-sm font-medium text-[var(--color-text-primary)] hover:bg-[var(--color-surface-raised)] transition-colors"
            >
              Back to dashboard
            </Link>
          )}
        </div>

        <footer className="text-center pb-6">
          <p className="text-xs text-[var(--color-text-secondary)]">
            <Link href="/welcome" className="hover:underline">YachtieLink</Link> — Professional profiles for yacht crew
          </p>
        </footer>
      </div>

      {/* ── Sticky bottom CTA for non-logged-in viewers (mobile only) ───────── */}
      {!isLoggedIn && (
        <div className="fixed bottom-0 left-0 right-0 p-4 bg-[var(--color-surface)]/80 backdrop-blur-md border-t border-[var(--color-border-subtle)] z-40 md:hidden">
          <Link
            href="/welcome"
            className="w-full flex items-center justify-center rounded-xl bg-[var(--color-interactive)] px-6 py-3 text-sm font-semibold text-white hover:bg-[var(--color-interactive-hover)] transition-colors"
          >
            Build your crew profile
          </Link>
        </div>
      )}
    </div>
  )
}

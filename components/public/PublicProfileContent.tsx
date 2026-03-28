'use client'

/**
 * PublicProfileContent — Dual-mode layout (Profile / Portfolio).
 * Full-width hero, then centred content (max 680px).
 * View mode toggle switches between Profile (editorial) and Portfolio (card-based).
 *
 * Section rendering is delegated to components/public/sections/.
 */
import { useState } from 'react'
import Link from 'next/link'
import { FileText, User, GraduationCap, Heart, Mail, Phone, ExternalLink, Copy, Share2 } from 'lucide-react'
import { WhatsAppIcon } from '@/components/icons/WhatsAppIcon'
import { HeroSection } from './HeroSection'
import { ContactRow } from './ContactRow'
import { SectionModal } from './SectionModal'
import { SaveProfileButton } from '@/components/profile/SaveProfileButton'
import { ViewModeToggle } from './ViewModeToggle'
import { PortfolioLayout } from './layouts/PortfolioLayout'
import { RichPortfolioLayout } from './layouts/RichPortfolioLayout'
import { isProFromRecord } from '@/lib/stripe/pro-shared'
import { ProfileAccordion } from '@/components/profile/ProfileAccordion'
import { formatSeaTime } from '@/lib/sea-time'
import { countryToFlag } from '@/lib/constants/country-iso'
import { ScrollReveal } from '@/components/ui/ScrollReveal'
import { aboutSummary, hobbiesSummary, educationSummary } from '@/lib/profile-summaries'
import { ExperienceSection } from './sections/ExperienceSection'
import { EndorsementsSection } from './sections/EndorsementsSection'
import { CertificationsSection } from './sections/CertificationsSection'
import { SkillsSection } from './sections/SkillsSection'
import { GallerySection } from './sections/GallerySection'
import { accentColors, type AccentColor } from '@/lib/accent-colors'
import { scrimPresets, type ScrimPreset } from '@/lib/scrim-presets'
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
  home_country?: string | null
  show_home_country?: boolean
  available_for_work?: boolean
  founding_member?: boolean
  social_links?: Array<{ platform: string; url: string }> | null
  cv_public?: boolean
  cv_public_source?: string
  latest_pdf_path?: string | null
  cv_storage_path?: string | null
  profile_view_mode?: 'profile' | 'portfolio' | 'rich_portfolio'
  scrim_preset?: 'dark' | 'light' | 'teal' | 'warm'
  accent_color?: string
  profile_template?: string
  subscription_status?: string | null
  subscription_ends_at?: string | null
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
  colleagueCount?: number
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
  colleagueCount = 0,
  age,
}: PublicProfileContentProps) {
  // Pro fallback: rich_portfolio requires Pro subscription
  const isPro = isProFromRecord({
    subscription_status: user.subscription_status ?? null,
    subscription_ends_at: user.subscription_ends_at ?? null,
  })
  const rawDefault = user.profile_view_mode ?? 'portfolio'
  const ownerDefault = rawDefault === 'rich_portfolio' && !isPro ? 'portfolio' : rawDefault
  const [activeMode, setActiveMode] = useState<'profile' | 'portfolio' | 'rich_portfolio'>(ownerDefault)

  // Resolve accent color — fall back to teal for unknown values
  const resolvedAccent = accentColors[(user.accent_color as AccentColor)] ?? accentColors.teal
  const resolvedScrim = scrimPresets[(user.scrim_preset as ScrimPreset)] ?? scrimPresets.dark

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

  // View mode toggle — only show if owner's default is portfolio or rich_portfolio
  const viewModeToggle = (ownerDefault === 'portfolio' || ownerDefault === 'rich_portfolio') ? (
    <ViewModeToggle
      ownerDefault={ownerDefault}
      activeMode={activeMode}
      onChange={setActiveMode}
      scrimVariant={resolvedScrim.variant}
    />
  ) : null

  // Hero photo focal point
  const heroPhoto = profilePhotos.find((p) => p.sort_order === 0) ?? profilePhotos[0]
  const heroFocalX = heroPhoto?.focal_x ?? 50
  const heroFocalY = heroPhoto?.focal_y ?? 50

  // Hero stat parts: age (server-computed) + sea time
  const heroStats: string[] = []
  if (seaTimeTotalDays > 0) heroStats.push(`${formatSeaTime(seaTimeTotalDays).displayLong} at sea`)

  const flag = user.home_country ? countryToFlag(user.home_country) : ''
  const homeCountryFlag = user.show_home_country !== false && flag ? flag : undefined

  return (
    // ── Dual-mode layout with accent CSS vars ────────────────────────────
    <div
      className="flex flex-col"
      style={{
        '--accent-500': resolvedAccent[500],
        '--accent-600': resolvedAccent[600],
        '--accent-100': resolvedAccent[100],
      } as React.CSSProperties}
    >

      {/* ── Hero — full-width on all breakpoints ─────────────────────────── */}
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
        homeCountryFlag={homeCountryFlag}
        viewModeToggle={viewModeToggle}
        scrimPreset={user.scrim_preset as ScrimPreset}
        focalX={heroFocalX}
        focalY={heroFocalY}
      />

      {/* ── Content — switches based on active view mode ─────────────── */}
      {activeMode === 'rich_portfolio' ? (
        <div className="flex-1">
          <RichPortfolioLayout
            user={user}
            attachments={attachments}
            certifications={certifications}
            endorsements={endorsements}
            education={education}
            skills={skills}
            hobbies={hobbies}
            gallery={gallery}
            seaTimeTotalDays={seaTimeTotalDays}
            colleagueCount={colleagueCount}
            accentColor={resolvedAccent[500]}
            handle={user.handle}
            displayName={displayName}
            templateId={user.profile_template ?? 'classic'}
          />
        </div>
      ) : activeMode === 'portfolio' ? (
        <div className="flex-1">
          <PortfolioLayout
            user={user}
            attachments={attachments}
            certifications={certifications}
            endorsements={endorsements}
            education={education}
            skills={skills}
            hobbies={hobbies}
            gallery={gallery}
            accentColor={resolvedAccent[500]}
            handle={user.handle}
            isLoggedIn={isLoggedIn}
            sectionVisibility={sectionVisibility}
          />
        </div>
      ) : (
      <ProfileModeContent
        user={user}
        attachments={attachments}
        certifications={certifications}
        endorsements={endorsements}
        hobbies={hobbies}
        education={education}
        skills={skills}
        gallery={gallery}
        sectionVisibility={sectionVisibility}
        isLoggedIn={isLoggedIn}
        isOwnProfile={isOwnProfile}
        displayName={displayName}
        firstName={firstName}
        sharedYachtIdSet={sharedYachtIdSet}
        mutualEndorserCount={mutualEndorserCount}
        seaTimeTotalDays={seaTimeTotalDays}
        seaTimeYachtCount={seaTimeYachtCount}
        colleagueCount={colleagueCount}
        profileUrl={profileUrl}
        savedStatus={savedStatus}
      />
      )}

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

// ── Profile Mode (extracted for modal state) ──────────────────────────────────

function ProfileModeContent({
  user, attachments, certifications, endorsements, hobbies, education, skills, gallery,
  sectionVisibility, isLoggedIn, isOwnProfile, displayName, firstName,
  sharedYachtIdSet, mutualEndorserCount, seaTimeTotalDays, seaTimeYachtCount,
  colleagueCount, profileUrl, savedStatus,
}: {
  user: PublicProfileContentProps['user']
  attachments: PublicAttachment[]
  certifications: PublicCertification[]
  endorsements: PublicEndorsement[]
  hobbies: Hobby[]
  education: Education[]
  skills: Skill[]
  gallery: GalleryItem[]
  sectionVisibility: Record<string, boolean>
  isLoggedIn?: boolean
  isOwnProfile: boolean
  displayName: string
  firstName: string
  sharedYachtIdSet: Set<string>
  mutualEndorserCount: number
  seaTimeTotalDays: number
  seaTimeYachtCount: number
  colleagueCount: number
  profileUrl: string
  savedStatus?: { id: string; folder_id: string | null } | null
}) {
  const [profileModal, setProfileModal] = useState<string | null>(null)
  const handle = user.handle

  return (
    <>
      <div className="flex-1">
        <div className="flex flex-col gap-4 px-4 pt-4 pb-24 max-w-[680px] mx-auto w-full">

          {/* Contact + CV row — tappable to open modals */}
          <div className="flex items-center justify-between">
            <ContactRow
              email={user.email}
              phone={user.phone}
              whatsapp={user.whatsapp}
              showEmail={user.show_email}
              showPhone={user.show_phone}
              showWhatsapp={user.show_whatsapp}
              firstName={firstName}
              onTap={() => setProfileModal('contact')}
            />
            {user.cv_public !== false && (
              (user.cv_public_source === 'uploaded' ? user.cv_storage_path : user.latest_pdf_path)
            ) && (
              <button
                onClick={() => setProfileModal('cv')}
                className="inline-flex items-center gap-2 rounded-xl border border-[var(--color-border)] px-4 py-2.5 text-sm font-medium text-[var(--color-text-primary)] hover:bg-[var(--color-surface-raised)] transition-colors"
              >
                <FileText size={16} className="text-[var(--color-text-secondary)]" />
                View CV
              </button>
            )}
          </div>

          {/* Stats — conversational introduction with clickable stats */}
          {(seaTimeTotalDays > 0 || seaTimeYachtCount > 0) && (
            <div className="text-center italic text-sm text-[var(--color-text-secondary)] leading-relaxed px-2">
              {(() => {
                const scrollToSection = (id: string) => {
                  const el = document.getElementById(id)
                  if (!el) return
                  // Position heading ~25% from top of viewport
                  const rect = el.getBoundingClientRect()
                  const offset = window.scrollY + rect.top - (window.innerHeight * 0.25)
                  window.scrollTo({ top: offset, behavior: 'smooth' })
                  // Open the accordion by clicking its header button
                  setTimeout(() => {
                    const btn = el.querySelector('button[aria-expanded]') as HTMLButtonElement | null
                    if (btn && btn.getAttribute('aria-expanded') === 'false') btn.click()
                  }, 400)
                }

                const parts: React.ReactNode[] = []

                if (seaTimeTotalDays > 0) {
                  const seaTimeStr = formatSeaTime(seaTimeTotalDays).displayLong
                  parts.push(<span key="sea">I&apos;ve spent <button type="button" onClick={() => scrollToSection('section-experience')} className="font-semibold text-[var(--color-text-primary)] hover:text-[var(--accent-500,#14b8a6)] transition-colors">{seaTimeStr}</button> working at sea</span>)
                }
                if (seaTimeYachtCount > 0) {
                  parts.push(<span key="yacht"> across <button type="button" onClick={() => scrollToSection('section-experience')} className="font-semibold text-[var(--color-text-primary)] hover:text-[var(--accent-500,#14b8a6)] transition-colors">{seaTimeYachtCount} {seaTimeYachtCount === 1 ? 'yacht' : 'yachts'}</button></span>)
                }
                if (certifications.length > 0) {
                  parts.push(<span key="cert">, hold <button type="button" onClick={() => scrollToSection('section-certifications')} className="font-semibold text-[var(--color-text-primary)] hover:text-[var(--accent-500,#14b8a6)] transition-colors">{certifications.length} {certifications.length === 1 ? 'certification' : 'certifications'}</button></span>)
                }
                if (colleagueCount > 0) {
                  parts.push(<span key="col"> and have worked with <strong className="font-semibold text-[var(--color-text-primary)]">{colleagueCount} {colleagueCount === 1 ? 'colleague' : 'colleagues'}</strong></span>)
                }
                if (endorsements.length > 0) {
                  parts.push(<span key="end">, of which <button type="button" onClick={() => scrollToSection('section-endorsements')} className="font-semibold text-[var(--color-text-primary)] hover:text-[var(--accent-500,#14b8a6)] transition-colors">{endorsements.length} endorsed</button></span>)
                }
                return <>{parts}.</>
              })()}
            </div>
          )}

          {/* About Me */}
          {sectionVisible(sectionVisibility, 'about', !!(user.ai_summary || user.bio)) && (
            <ScrollReveal>
            <ProfileAccordion
              title="About Me"
              summary={aboutSummary(user.ai_summary, user.bio)}
              accentColor="sand"
              icon={<User size={16} />}
            >
              <p className="text-sm text-[var(--color-text-primary)] leading-relaxed whitespace-pre-line">
                {user.ai_summary || user.bio}
              </p>
            </ProfileAccordion>
            </ScrollReveal>
          )}

          {/* My Experience */}
          {sectionVisible(sectionVisibility, 'experience', attachments.length > 0) && (
            <div id="section-experience">
              <ExperienceSection attachments={attachments} sharedYachtIdSet={sharedYachtIdSet} seaTimeTotalDays={seaTimeTotalDays} seaTimeYachtCount={seaTimeYachtCount} />
            </div>
          )}

          {/* My Endorsements */}
          {sectionVisible(sectionVisibility, 'endorsements', endorsements.length > 0) && (
            <div id="section-endorsements">
              <EndorsementsSection endorsements={endorsements} mutualEndorserCount={mutualEndorserCount} handle={user.handle} />
            </div>
          )}

          {/* My Certifications */}
          {sectionVisible(sectionVisibility, 'certifications', certifications.length > 0) && (
            <div id="section-certifications">
              <CertificationsSection certifications={certifications} />
            </div>
          )}

          {/* My Education */}
          {sectionVisible(sectionVisibility, 'education', education.length > 0) && (
            <ScrollReveal>
            <ProfileAccordion
              title="My Education"
              summary={educationSummary(education)}
              accentColor="teal"
              icon={<GraduationCap size={16} />}
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

          {/* My Interests */}
          {sectionVisible(sectionVisibility, 'hobbies', hobbies.length > 0) && (
            <ScrollReveal>
            <ProfileAccordion
              title="My Interests"
              summary={hobbiesSummary(hobbies)}
              accentColor="sand"
              icon={<Heart size={16} />}
            >
              <div className="flex flex-wrap gap-2">
                {hobbies.map((h) => (
                  <span key={h.id} className="text-sm px-3 py-1.5 rounded-full bg-transparent border border-[var(--color-border)] text-[var(--color-text-primary)]">
                    {h.emoji ? `${h.emoji} ${h.name}` : h.name}
                  </span>
                ))}
              </div>
            </ProfileAccordion>
            </ScrollReveal>
          )}

          {/* My Skills */}
          {sectionVisible(sectionVisibility, 'skills', skills.length > 0) && (
            <SkillsSection skills={skills} />
          )}

          {/* My Gallery */}
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
        <div className="px-4 pb-8 flex flex-col gap-3 max-w-[680px] mx-auto w-full">
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

      {/* ── Contact modal ──────────────────────────────────────────── */}
      <SectionModal
        title="Contact"
        open={profileModal === 'contact'}
        onClose={() => setProfileModal(null)}
        footer={
          <div className="flex gap-3">
            {isLoggedIn && !isOwnProfile && (
              <SaveProfileButton
                savedUserId={user.id}
                initialSaved={!!savedStatus}
                initialFolderId={savedStatus?.folder_id}
              />
            )}
            <button
              onClick={() => { navigator.clipboard.writeText(profileUrl); }}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-[var(--accent-500,#14b8a6)] text-white text-sm font-semibold hover:opacity-90 transition-opacity"
            >
              <Share2 size={14} />
              Share
            </button>
            <button
              onClick={() => { navigator.clipboard.writeText(profileUrl); }}
              className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-[var(--color-border)] text-sm font-medium text-[var(--color-text-primary)] hover:bg-[var(--color-surface-raised)] transition-colors"
            >
              <Copy size={14} />
              Copy
            </button>
          </div>
        }
      >
        <div className="flex flex-col gap-3">
          {user.show_email !== false && user.email && (
            <a href={`mailto:${user.email}`} className="flex items-center gap-3 p-3 rounded-xl hover:bg-[var(--color-surface-raised)] transition-colors">
              <span className="flex items-center justify-center w-10 h-10 rounded-full bg-[var(--color-surface-raised)]"><Mail size={18} className="text-[var(--color-text-secondary)]" /></span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-[var(--color-text-primary)]">Email</p>
                <p className="text-xs text-[var(--color-text-secondary)] truncate">{user.email}</p>
              </div>
              <ExternalLink size={14} className="text-[var(--color-text-tertiary)]" />
            </a>
          )}
          {user.show_phone !== false && user.phone && (
            <div className="rounded-xl border border-[var(--color-border-subtle)] overflow-hidden">
              <div className="flex items-center gap-3 p-3">
                <span className="flex items-center justify-center w-10 h-10 rounded-full bg-[var(--color-surface-raised)]"><Phone size={18} className="text-[var(--color-text-secondary)]" /></span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-[var(--color-text-primary)]">Phone</p>
                  <p className="text-xs text-[var(--color-text-secondary)] truncate">{user.phone}</p>
                </div>
              </div>
              <div className="flex border-t border-[var(--color-border-subtle)] divide-x divide-[var(--color-border-subtle)]">
                <a href={`tel:${user.phone}`} className="flex-1 py-2.5 text-center text-xs font-medium text-[var(--accent-500,#14b8a6)] hover:bg-[var(--color-surface-raised)] transition-colors">Call</a>
                <a href={`sms:${user.phone}`} className="flex-1 py-2.5 text-center text-xs font-medium text-[var(--accent-500,#14b8a6)] hover:bg-[var(--color-surface-raised)] transition-colors">Message</a>
                <button onClick={() => { navigator.clipboard.writeText(user.phone!) }} className="flex-1 py-2.5 text-center text-xs font-medium text-[var(--color-text-tertiary)] hover:bg-[var(--color-surface-raised)] transition-colors">Copy</button>
              </div>
            </div>
          )}
          {user.show_whatsapp !== false && user.whatsapp && (
            <div className="rounded-xl border border-[var(--color-border-subtle)] overflow-hidden">
              <div className="flex items-center gap-3 p-3">
                <span className="flex items-center justify-center w-10 h-10 rounded-full bg-[var(--color-surface-raised)]"><WhatsAppIcon size={18} className="text-green-600" /></span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-[var(--color-text-primary)]">WhatsApp</p>
                  <p className="text-xs text-[var(--color-text-secondary)] truncate">{user.whatsapp}</p>
                </div>
              </div>
              <div className="flex border-t border-[var(--color-border-subtle)] divide-x divide-[var(--color-border-subtle)]">
                <a href={`https://wa.me/${user.whatsapp.replace(/\D/g, '')}`} target="_blank" rel="noopener noreferrer" className="flex-1 py-2.5 text-center text-xs font-medium text-green-600 hover:bg-[var(--color-surface-raised)] transition-colors">Call</a>
                <a href={`https://wa.me/${user.whatsapp.replace(/\D/g, '')}`} target="_blank" rel="noopener noreferrer" className="flex-1 py-2.5 text-center text-xs font-medium text-green-600 hover:bg-[var(--color-surface-raised)] transition-colors">Message</a>
                <button onClick={() => { navigator.clipboard.writeText(user.whatsapp!) }} className="flex-1 py-2.5 text-center text-xs font-medium text-[var(--color-text-tertiary)] hover:bg-[var(--color-surface-raised)] transition-colors">Copy</button>
              </div>
            </div>
          )}
        </div>
      </SectionModal>

      {/* ── CV preview modal ──────────────────────────────────────── */}
      <SectionModal
        title="CV Preview"
        open={profileModal === 'cv'}
        onClose={() => setProfileModal(null)}
        footer={
          <div className="flex gap-3">
            <a
              href={`/api/cv/public-download/${handle}`}
              download
              className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-[var(--accent-500,#14b8a6)] text-white text-sm font-semibold hover:opacity-90 transition-opacity"
            >
              Download CV
            </a>
            <button
              onClick={() => { navigator.clipboard.writeText(`https://yachtie.link/u/${handle}/cv`); }}
              className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-[var(--color-border)] text-sm font-medium text-[var(--color-text-primary)] hover:bg-[var(--color-surface-raised)] transition-colors"
            >
              <Share2 size={14} />
              Share
            </button>
          </div>
        }
      >
        <div className="h-[60vh] rounded-xl overflow-hidden bg-gray-100">
          <iframe src={`/api/cv/public-download/${handle}`} className="w-full h-full border-0" title="CV Preview" />
        </div>
      </SectionModal>
    </>
  )
}

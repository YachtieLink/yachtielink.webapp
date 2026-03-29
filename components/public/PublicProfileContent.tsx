'use client'

/**
 * PublicProfileContent — Dual-mode layout (Profile / Portfolio).
 * Full-width hero, then centred content (max 680px).
 * View mode toggle switches between Profile (editorial) and Portfolio (card-based).
 *
 * Section rendering is delegated to components/public/sections/.
 */
import { useState } from 'react'
import { FileText, User, GraduationCap, Heart } from 'lucide-react'
import { HeroSection } from './HeroSection'
import { ContactRow } from './ContactRow'
import { ContactModal } from './ContactModal'
import { CvPreviewModal } from './CvPreviewModal'
import { BottomCTA } from './BottomCTA'
import { ViewModeToggle } from './ViewModeToggle'
import { PortfolioLayout } from './layouts/PortfolioLayout'
import { RichPortfolioLayout } from './layouts/RichPortfolioLayout'
import { isProFromRecord } from '@/lib/stripe/pro-shared'
import { ProfileAccordion } from '@/components/profile/ProfileAccordion'
import { formatSeaTime } from '@/lib/sea-time'
import { countryToFlag } from '@/lib/constants/country-iso'
import { ScrollReveal } from '@/components/ui/ScrollReveal'
import { MutualColleagues } from '@/components/profile/MutualColleagues'
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
  isLoggedIn?: boolean
  viewerRelationship?: ViewerRelationship
  sectionVisibility?: Record<string, boolean>
  savedStatus?: { id: string; folder_id: string | null } | null
  seaTimeTotalDays?: number
  seaTimeYachtCount?: number
  colleagueCount?: number
  age?: number | null
  viewerIsPro?: boolean
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
  isLoggedIn,
  viewerRelationship,
  sectionVisibility = {},
  savedStatus,
  seaTimeTotalDays = 0,
  seaTimeYachtCount = 0,
  colleagueCount = 0,
  age,
  viewerIsPro = false,
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
        isPro={isPro}
        viewerIsPro={viewerIsPro}
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

      {/* ── Mutual Colleagues (2nd-degree social proof) ─────────────── */}
      {isLoggedIn && !isOwnProfile && mutualColleagues.length > 0 && (
        <MutualColleagues
          profileFirstName={firstName}
          mutuals={mutualColleagues}
        />
      )}

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
            isLoggedIn={isLoggedIn}
            isOwnProfile={isOwnProfile}
            savedStatus={savedStatus}
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
            displayName={displayName}
            isLoggedIn={isLoggedIn}
            isOwnProfile={isOwnProfile}
            sectionVisibility={sectionVisibility}
            seaTimeTotalDays={seaTimeTotalDays}
            seaTimeYachtCount={seaTimeYachtCount}
            colleagueCount={colleagueCount}
            savedStatus={savedStatus}
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

      {/* No sticky CTA on profiles — this is the user's presentation, not our ad space */}
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
  const [pendingNav, setPendingNav] = useState<{ url: string; label: string } | null>(null)
  const handle = user.handle

  return (
    <>
      <div className="flex-1">
        <div className="flex flex-col gap-4 px-4 pt-4 pb-24 max-w-[680px] mx-auto w-full">

          {/* Contact + CV row — matches Rich Portfolio exactly */}
          <div className="flex items-center justify-between ml-1 mr-1">
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
                View my CV
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
                  parts.push(<span key="sea">I&apos;ve spent <button type="button" onClick={() => scrollToSection('section-experience')} className="font-semibold text-[var(--color-text-primary)] hover:text-[var(--accent-500,#0f9b8e)] transition-colors">{seaTimeStr}</button> working at sea</span>)
                }
                if (seaTimeYachtCount > 0) {
                  parts.push(<span key="yacht"> across <button type="button" onClick={() => scrollToSection('section-experience')} className="font-semibold text-[var(--color-text-primary)] hover:text-[var(--accent-500,#0f9b8e)] transition-colors">{seaTimeYachtCount} {seaTimeYachtCount === 1 ? 'yacht' : 'yachts'}</button></span>)
                }
                if (certifications.length > 0) {
                  parts.push(<span key="cert">, hold <button type="button" onClick={() => scrollToSection('section-certifications')} className="font-semibold text-[var(--color-text-primary)] hover:text-[var(--accent-500,#0f9b8e)] transition-colors">{certifications.length} {certifications.length === 1 ? 'certification' : 'certifications'}</button></span>)
                }
                if (colleagueCount > 0) {
                  const includingYou = sharedYachtIdSet.size > 0 ? ' including you' : ''
                  parts.push(<span key="col"> and have worked with <strong className="font-semibold text-[var(--color-text-primary)]">{colleagueCount} {colleagueCount === 1 ? 'colleague' : 'colleagues'}{includingYou}</strong></span>)
                }
                if (endorsements.length > 0) {
                  parts.push(<span key="end">, of which <button type="button" onClick={() => scrollToSection('section-endorsements')} className="font-semibold text-[var(--color-text-primary)] hover:text-[var(--accent-500,#0f9b8e)] transition-colors">{endorsements.length} endorsed</button></span>)
                }
                return <>{parts}.</>
              })()}
            </div>
          )}

          {/* Shared yacht context — only for colleagues */}
          {sharedYachtIdSet.size > 0 && (() => {
            const sharedYachtNames = attachments
              .filter(a => a.yachts?.id && sharedYachtIdSet.has(a.yachts.id))
              .map(a => a.yachts?.name)
              .filter(Boolean) as string[]
            const unique = [...new Set(sharedYachtNames)]
            if (unique.length === 0) return null
            return (
              <p className="text-center text-xs text-[var(--color-text-tertiary)]">
                You&apos;ve worked together on {unique.join(', ')}
              </p>
            )
          })()}

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
              <ExperienceSection attachments={attachments} sharedYachtIdSet={sharedYachtIdSet} seaTimeTotalDays={seaTimeTotalDays} seaTimeYachtCount={seaTimeYachtCount} onNavigate={(url, label) => setPendingNav({ url, label })} />
            </div>
          )}

          {/* My Endorsements */}
          {sectionVisible(sectionVisibility, 'endorsements', endorsements.length > 0) && (
            <div id="section-endorsements">
              <EndorsementsSection endorsements={endorsements} mutualEndorserCount={mutualEndorserCount} handle={user.handle} onNavigate={(url, label) => setPendingNav({ url, label })} />
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
        <div className="px-4 pb-8">
          <BottomCTA isLoggedIn={isLoggedIn} isOwnProfile={isOwnProfile} displayName={displayName} />
        </div>
      </div>

      {/* ── Contact modal ──────────────────────────────────────────── */}
      <ContactModal
        open={profileModal === 'contact'}
        onClose={() => setProfileModal(null)}
        user={user}
        displayName={displayName}
        firstName={firstName}
        profileUrl={profileUrl}
        isLoggedIn={isLoggedIn}
        isOwnProfile={isOwnProfile}
        savedStatus={savedStatus}
      />

      {/* ── CV preview modal ──────────────────────────────────────── */}
      <CvPreviewModal open={profileModal === 'cv'} onClose={() => setProfileModal(null)} handle={handle} />

      {/* Navigation confirmation — "leaving this profile" */}
      {pendingNav && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-6">
          <div className="bg-[var(--color-surface)] rounded-2xl p-6 max-w-[320px] w-full flex flex-col gap-4 text-center">
            <p className="text-sm text-[var(--color-text-primary)]">
              You&apos;re about to leave this profile to view <span className="font-semibold">{pendingNav.label}</span>
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setPendingNav(null)}
                className="flex-1 py-2.5 rounded-xl border border-[var(--color-border)] text-sm font-medium text-[var(--color-text-primary)] hover:bg-[var(--color-surface-raised)] transition-colors"
              >
                Stay here
              </button>
              <a
                href={pendingNav.url}
                className="flex-1 py-2.5 rounded-xl bg-[var(--accent-500,#0f9b8e)] text-white text-sm font-semibold text-center hover:opacity-90 transition-opacity"
              >
                Continue
              </a>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

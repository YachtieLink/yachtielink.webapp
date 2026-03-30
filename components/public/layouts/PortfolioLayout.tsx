'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
  User, Anchor, Shield, GraduationCap, Heart, Wrench, FileText,
  MessageSquareQuote, ChevronDown, ChevronUp,
} from 'lucide-react'
import { ScrollReveal } from '@/components/ui/ScrollReveal'
import { ContactRow } from '../ContactRow'
import { ContactModal } from '../ContactModal'
import { CvPreviewModal } from '../CvPreviewModal'
import { BottomCTA } from '../BottomCTA'
import { MiniBentoGallery } from '../MiniBentoGallery'
import { formatSeaTime } from '@/lib/sea-time'
import { formatDate } from '@/lib/format-date'
import type {
  PublicAttachment, PublicCertification, PublicEndorsement,
  GalleryItem, Hobby, Education, Skill,
} from '@/lib/queries/types'

interface PortfolioLayoutProps {
  user: {
    id: string
    handle: string
    bio?: string | null
    ai_summary?: string | null
    email?: string | null
    phone?: string | null
    whatsapp?: string | null
    show_email?: boolean
    show_phone?: boolean
    show_whatsapp?: boolean
    cv_public?: boolean
    cv_public_source?: string
    latest_pdf_path?: string | null
    cv_storage_path?: string | null
    primary_role?: string | null
  }
  attachments: PublicAttachment[]
  certifications: PublicCertification[]
  endorsements: PublicEndorsement[]
  education: Education[]
  skills: Skill[]
  hobbies: Hobby[]
  gallery: GalleryItem[]
  accentColor: string
  handle: string
  displayName?: string
  isLoggedIn?: boolean
  isOwnProfile?: boolean
  sectionVisibility: Record<string, boolean>
  seaTimeTotalDays?: number
  seaTimeYachtCount?: number
  colleagueCount?: number
  savedStatus?: { id: string; folder_id: string | null } | null
}

function sectionVisible(visibility: Record<string, boolean>, key: string, hasData: boolean): boolean {
  return visibility[key] !== false && hasData
}

const sectionTints = ['bg-[var(--yl-sand)]/20', 'bg-[var(--yl-teal)]/5'] as const

function SectionCard({ title, icon, children, accentColor, index = 0 }: {
  title: string
  icon: React.ReactNode
  children: React.ReactNode
  accentColor?: string
  index?: number
}) {
  const tint = sectionTints[index % 2]
  return (
    <ScrollReveal>
      <div className={`rounded-xl ${tint} p-6`}>
        <div className="flex items-center gap-2 mb-4">
          <span className="text-[var(--color-text-tertiary)]" style={accentColor ? { color: `var(--accent-500, ${accentColor})` } : undefined}>
            {icon}
          </span>
          <h2 className="text-xs font-semibold uppercase tracking-wide text-[var(--color-text-tertiary)]">
            {title}
          </h2>
        </div>
        {children}
      </div>
    </ScrollReveal>
  )
}

function AboutSection({ text }: { text: string }) {
  const [expanded, setExpanded] = useState(false)

  return (
    <div>
      <p className={`text-sm text-[var(--color-text-primary)] leading-relaxed whitespace-pre-line ${!expanded ? 'line-clamp-3' : ''}`}>
        {text}
      </p>
      {text.split('\n').length >= 3 || text.length > 200 ? (
        <button
          onClick={() => setExpanded(!expanded)}
          className="mt-2 text-xs font-medium text-[var(--accent-500,var(--color-interactive))] hover:underline flex items-center gap-1"
        >
          {expanded ? (
            <>Show less <ChevronUp size={12} /></>
          ) : (
            <>Read more <ChevronDown size={12} /></>
          )}
        </button>
      ) : null}
    </div>
  )
}

export function PortfolioLayout({
  user,
  attachments,
  certifications,
  endorsements,
  education,
  skills,
  hobbies,
  gallery,
  accentColor,
  handle,
  displayName,
  isLoggedIn,
  isOwnProfile,
  sectionVisibility,
  seaTimeTotalDays = 0,
  seaTimeYachtCount = 0,
  colleagueCount = 0,
  savedStatus,
}: PortfolioLayoutProps) {
  const [activeModal, setActiveModal] = useState<string | null>(null)
  const [pendingNav, setPendingNav] = useState<{ url: string; label: string } | null>(null)
  const aboutText = user.ai_summary || user.bio
  const firstName = (displayName ?? user.handle).split(' ')[0]
  const profileUrl = `https://yachtie.link/u/${handle}`

  // Gallery photos from user_gallery (work portfolio), take first 3 for mini bento
  const galleryPhotos = gallery
    .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0))
    .slice(0, 3)

  let sectionIndex = 0

  return (
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
          onTap={() => setActiveModal('contact')}
        />
        {user.cv_public !== false && (
          (user.cv_public_source === 'uploaded' ? user.cv_storage_path : user.latest_pdf_path)
        ) && (
          <button
            onClick={() => setActiveModal('cv')}
            className="inline-flex items-center gap-2 rounded-xl border border-[var(--color-border)] px-4 py-2.5 text-sm font-medium text-[var(--color-text-primary)] hover:bg-[var(--color-surface-raised)] transition-colors"
          >
            <FileText size={16} className="text-[var(--color-text-secondary)]" />
            View my CV
          </button>
        )}
      </div>

      {/* Stats — conversational introduction */}
      {(seaTimeTotalDays > 0 || seaTimeYachtCount > 0) && (
        <div className="text-center italic text-sm text-[var(--color-text-secondary)] leading-relaxed px-2">
          I&apos;ve spent {seaTimeTotalDays > 0 && <strong className="font-semibold text-[var(--color-text-primary)]">{formatSeaTime(seaTimeTotalDays).displayLong}</strong>} working at sea
          {seaTimeYachtCount > 0 && <> across <strong className="font-semibold text-[var(--color-text-primary)]">{seaTimeYachtCount} {seaTimeYachtCount === 1 ? 'yacht' : 'yachts'}</strong></>}
          {certifications.length > 0 && <>, hold <strong className="font-semibold text-[var(--color-text-primary)]">{certifications.length} {certifications.length === 1 ? 'certification' : 'certifications'}</strong></>}
          {colleagueCount > 0 && <> and have worked with <strong className="font-semibold text-[var(--color-text-primary)]">{colleagueCount} {colleagueCount === 1 ? 'colleague' : 'colleagues'}</strong></>}
          {endorsements.length > 0 && <>, of which <strong className="font-semibold text-[var(--color-text-primary)]">{endorsements.length} endorsed</strong></>}
          .
        </div>
      )}

      {/* About Me */}
      {sectionVisible(sectionVisibility, 'about', !!aboutText) && (
        <SectionCard title="About Me" icon={<User size={16} />} index={sectionIndex++}>
          <AboutSection text={aboutText!} />
        </SectionCard>
      )}

      {/* My Experience */}
      {sectionVisible(sectionVisibility, 'experience', attachments.length > 0) && (
        <SectionCard title="My Experience" icon={<Anchor size={16} />} index={sectionIndex++}>
          <div className="flex flex-col gap-3">
            {attachments.slice(0, 3).map((att) => (
              <div key={att.id} className="flex gap-3">
                <div className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-[var(--accent-500,var(--color-interactive))]" />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-[var(--color-text-primary)]">
                    {att.yachts?.name ?? 'Unknown Yacht'}
                    {att.role_label && <span className="font-normal text-[var(--color-text-secondary)]"> — {att.role_label}</span>}
                  </p>
                  {(att.started_at || att.ended_at) && (
                    <p className="text-xs text-[var(--color-text-secondary)]">
                      {formatDate(att.started_at)}{att.started_at && ' – '}{att.ended_at ? formatDate(att.ended_at) : 'Present'}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
          {attachments.length > 3 && (
            <Link
              href={`/u/${handle}/experience`}
              className="mt-3 block text-xs font-medium text-[var(--accent-500,var(--color-interactive))] hover:underline"
            >
              See all {attachments.length} positions &rarr;
            </Link>
          )}
        </SectionCard>
      )}

      {/* My Endorsements */}
      {sectionVisible(sectionVisibility, 'endorsements', endorsements.length > 0) && (
        <SectionCard title="My Endorsements" icon={<MessageSquareQuote size={16} />} accentColor="#f97066" index={sectionIndex++}>
          <div className="flex flex-col gap-4">
            {endorsements.slice(0, 3).map((end) => {
              const endorserName = end.endorser?.display_name || end.endorser?.full_name || 'Anonymous'
              const endorserHandle = end.endorser?.handle
              return (
                <div key={end.id}>
                  <p className="text-sm text-[var(--color-text-primary)] italic line-clamp-3">
                    &ldquo;{end.content}&rdquo;
                  </p>
                  <div className="flex items-center gap-2 mt-2">
                    {end.endorser?.profile_photo_url ? (
                      <img src={end.endorser.profile_photo_url} alt={endorserName} className="w-6 h-6 rounded-full object-cover object-top" />
                    ) : (
                      <div className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center text-xs font-medium text-gray-500">
                        {endorserName.charAt(0)}
                      </div>
                    )}
                    <div className="min-w-0">
                      {endorserHandle ? (
                        <button onClick={() => setPendingNav({ url: `/u/${endorserHandle}`, label: endorserName })} className="text-xs font-medium text-[var(--color-text-primary)] hover:text-[var(--accent-500,#0f9b8e)] truncate block text-left transition-colors">
                          {endorserName}
                        </button>
                      ) : (
                        <span className="text-xs font-medium text-[var(--color-text-primary)] truncate block">{endorserName}</span>
                      )}
                      {(end.endorser_role_label || end.yacht?.name) && (
                        <p className="text-[10px] text-[var(--color-text-secondary)] truncate">
                          {end.endorser_role_label}{end.endorser_role_label && end.yacht?.name ? ' · ' : ''}
                          {end.yacht?.id && isLoggedIn ? (
                            <button onClick={() => setPendingNav({ url: `/app/yacht/${end.yacht!.id}`, label: end.yacht!.name ?? 'Yacht' })} className="hover:text-[var(--accent-500,#0f9b8e)] transition-colors">
                              {end.yacht.name}
                            </button>
                          ) : end.yacht?.name}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
          <Link
            href={`/u/${handle}/endorsements`}
            className="mt-3 block text-xs font-medium text-[var(--accent-500,var(--color-interactive))] hover:underline"
          >
            See all {endorsements.length} {endorsements.length === 1 ? 'endorsement' : 'endorsements'} &rarr;
          </Link>
        </SectionCard>
      )}

      {/* My Certifications */}
      {sectionVisible(sectionVisibility, 'certifications', certifications.length > 0) && (
        <SectionCard title="My Certifications" icon={<Shield size={16} />} index={sectionIndex++}>
          <div className="flex flex-wrap gap-2">
            {certifications.map((cert) => {
              const name = cert.certification_types?.name ?? cert.custom_cert_name ?? 'Certificate'
              return (
                <span
                  key={cert.id}
                  className="text-xs px-3 py-1.5 rounded-full bg-transparent border border-[var(--color-border)] text-[var(--color-text-primary)]"
                >
                  {name}
                </span>
              )
            })}
          </div>
          <Link
            href={`/u/${handle}/certifications`}
            className="mt-3 block text-xs font-medium text-[var(--accent-500,var(--color-interactive))] hover:underline"
          >
            See all certifications &rarr;
          </Link>
        </SectionCard>
      )}

      {/* My Education */}
      {sectionVisible(sectionVisibility, 'education', education.length > 0) && (
        <SectionCard title="My Education" icon={<GraduationCap size={16} />} index={sectionIndex++}>
          <div className="flex flex-col gap-3">
            {education.slice(0, 3).map((edu) => (
              <div key={edu.id}>
                <p className="text-sm font-medium text-[var(--color-text-primary)]">{edu.institution}</p>
                {edu.qualification && <p className="text-sm text-[var(--color-text-secondary)]">{edu.qualification}</p>}
                {edu.field_of_study && <p className="text-xs text-[var(--color-text-secondary)]">{edu.field_of_study}</p>}
                {(edu.started_at || edu.ended_at) && (
                  <p className="text-xs text-[var(--color-text-secondary)]">
                    {edu.started_at ? new Date(edu.started_at).getFullYear() : ''}
                    {edu.started_at && edu.ended_at ? ' – ' : ''}
                    {edu.ended_at ? new Date(edu.ended_at).getFullYear() : ''}
                  </p>
                )}
              </div>
            ))}
          </div>
          {education.length > 3 && (
            <Link
              href={`/u/${handle}/education`}
              className="mt-3 block text-xs font-medium text-[var(--accent-500,var(--color-interactive))] hover:underline"
            >
              See all {education.length} entries &rarr;
            </Link>
          )}
        </SectionCard>
      )}

      {/* My Skills */}
      {sectionVisible(sectionVisibility, 'skills', skills.length > 0) && (
        <SectionCard title="My Skills" icon={<Wrench size={16} />} index={sectionIndex++}>
          <div className="flex flex-wrap gap-2">
            {skills.map((s) => (
              <span
                key={s.id}
                className="text-xs px-3 py-1.5 rounded-full bg-transparent border border-[var(--color-border)] text-[var(--color-text-primary)]"
              >
                {s.name}
              </span>
            ))}
          </div>
        </SectionCard>
      )}

      {/* My Interests */}
      {sectionVisible(sectionVisibility, 'hobbies', hobbies.length > 0) && (
        <SectionCard title="My Interests" icon={<Heart size={16} />} index={sectionIndex++}>
          <div className="flex flex-wrap gap-2">
            {hobbies.map((h) => (
              <span
                key={h.id}
                className="text-sm px-3 py-1.5 rounded-full bg-transparent border border-[var(--color-border)] text-[var(--color-text-primary)]"
              >
                {h.emoji ? `${h.emoji} ${h.name}` : h.name}
              </span>
            ))}
          </div>
        </SectionCard>
      )}

      {/* Mini Bento Gallery */}
      {sectionVisible(sectionVisibility, 'photos', galleryPhotos.length > 0) && (
        <MiniBentoGallery
          photos={galleryPhotos.map((p) => ({
            id: p.id,
            url: p.image_url,
            focal_x: 50,
            focal_y: 50,
          }))}
          handle={handle}
          totalPhotoCount={gallery.length}
        />
      )}

      {/* Bottom CTAs */}
      <BottomCTA isLoggedIn={isLoggedIn} isOwnProfile={isOwnProfile} displayName={displayName ?? handle} />

      {/* ── Contact modal ──────────────────────────────────────────── */}
      <ContactModal
        open={activeModal === 'contact'}
        onClose={() => setActiveModal(null)}
        user={user}
        displayName={displayName ?? handle}
        firstName={firstName}
        profileUrl={profileUrl}
        isLoggedIn={isLoggedIn}
        isOwnProfile={isOwnProfile}
        savedStatus={savedStatus}
      />

      {/* ── CV preview modal ──────────────────────────────────────── */}
      <CvPreviewModal open={activeModal === 'cv'} onClose={() => setActiveModal(null)} handle={handle} />

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
    </div>
  )
}

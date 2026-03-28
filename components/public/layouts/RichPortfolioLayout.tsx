'use client'

import { useState } from 'react'
import dynamic from 'next/dynamic'
import { X, Mail, Phone, MessageCircle, Copy, Share2, ExternalLink } from 'lucide-react'
import { BentoGrid } from '../bento/BentoGrid'
import { SectionModal } from '../SectionModal'
import { PhotoTile } from '../bento/tiles/PhotoTile'
import { AboutTile } from '../bento/tiles/AboutTile'
import { ExperienceTile } from '../bento/tiles/ExperienceTile'
import { EndorsementsTile } from '../bento/tiles/EndorsementsTile'
import { CertsTile } from '../bento/tiles/CertsTile'
import { ContactTile } from '../bento/tiles/ContactTile'
import { CvTile } from '../bento/tiles/CvTile'
import { StatsTile } from '../bento/tiles/StatsTile'
import { EducationTile } from '../bento/tiles/EducationTile'
import { SkillsTile } from '../bento/tiles/SkillsTile'
import { MorePhotosTile } from '../bento/tiles/MorePhotosTile'
import { detectDensity } from '@/lib/bento/density'
import { getTemplateVariant } from '@/lib/bento/templates'
import { formatSeaTime } from '@/lib/sea-time'
import type { BentoTile, BentoTemplateSlot } from '@/lib/bento/types'
import type {
  PublicAttachment, PublicCertification, PublicEndorsement,
  GalleryItem, Hobby, Education, Skill,
} from '@/lib/queries/types'

const PhotoLightbox = dynamic(() => import('../PhotoLightbox').then(m => ({ default: m.PhotoLightbox })), { ssr: false })

interface RichPortfolioLayoutProps {
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
    available_for_work?: boolean
  }
  attachments: PublicAttachment[]
  certifications: PublicCertification[]
  endorsements: PublicEndorsement[]
  education: Education[]
  skills: Skill[]
  hobbies: Hobby[]
  gallery: GalleryItem[]
  seaTimeTotalDays: number
  accentColor: string
  handle: string
  templateId?: string
}

export function RichPortfolioLayout({
  user,
  attachments,
  certifications,
  endorsements,
  education,
  skills,
  hobbies,
  gallery,
  seaTimeTotalDays,
  accentColor,
  handle,
  templateId = 'classic',
}: RichPortfolioLayoutProps) {
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null)
  const [showGalleryModal, setShowGalleryModal] = useState(false)
  const [activeModal, setActiveModal] = useState<string | null>(null)

  // Gallery photos from user_gallery (work portfolio, not profile headshots)
  const galleryPhotos = gallery.sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0))

  const aboutText = user.ai_summary || user.bio
  const seaTimeFormatted = seaTimeTotalDays > 0 ? formatSeaTime(seaTimeTotalDays).displayShort : ''

  // Detect density
  const density = detectDensity({
    photoCount: galleryPhotos.length,
    hasAbout: !!aboutText,
    experienceCount: attachments.length,
    certCount: certifications.length,
    endorsementCount: endorsements.length,
    educationCount: education.length,
    hasSkills: skills.length > 0,
  })

  const variant = getTemplateVariant(templateId, density)

  // Determine how many photo slots the template has
  const photoSlots = variant.slots.filter((s) => s.type === 'photo')
  const hasMorePhotos = galleryPhotos.length > photoSlots.length

  // Check if CV is available
  const hasCv = user.cv_public !== false && !!(
    user.cv_public_source === 'uploaded' ? user.cv_storage_path : user.latest_pdf_path
  )

  // Build tiles from template slots
  const tiles: BentoTile[] = []
  let photoIndex = 0

  for (const slot of variant.slots) {
    const tile = buildTile(slot, photoIndex)
    if (tile) {
      tiles.push(tile)
      if (slot.type === 'photo') photoIndex++
    }
  }

  // Photos that didn't fit in bento slots — shown in carousel below
  const overflowPhotos = galleryPhotos.slice(photoSlots.length)

  function buildTile(slot: BentoTemplateSlot, currentPhotoIndex: number): BentoTile | null {
    switch (slot.type) {
      case 'photo': {
        const photo = galleryPhotos[currentPhotoIndex]
        if (!photo) return null
        return {
          areaName: slot.areaName,
          type: 'photo',
          content: (
            <PhotoTile
              url={photo.image_url}
              focalX={50}
              focalY={50}
              onClick={() => setLightboxIndex(currentPhotoIndex)}
            />
          ),
        }
      }
      case 'about':
        if (!aboutText) return null
        return {
          areaName: slot.areaName,
          type: 'about',
          onClick: () => setActiveModal('about'),
          content: <AboutTile bio={aboutText} accentColor={accentColor} />,
        }
      case 'experience':
        if (attachments.length === 0) return null
        return {
          areaName: slot.areaName,
          type: 'experience',
          onClick: () => setActiveModal('experience'),
          content: <ExperienceTile attachments={attachments} handle={handle} />,
        }
      case 'endorsements':
        if (endorsements.length === 0) return null
        return {
          areaName: slot.areaName,
          type: 'endorsements',
          onClick: () => setActiveModal('endorsements'),
          content: <EndorsementsTile endorsements={endorsements} handle={handle} />,
        }
      case 'certifications':
        if (certifications.length === 0) return null
        return {
          areaName: slot.areaName,
          type: 'certifications',
          onClick: () => setActiveModal('certifications'),
          content: <CertsTile certifications={certifications} handle={handle} />,
        }
      case 'contact': {
        const hasContact = (user.show_email !== false && user.email) ||
          (user.show_phone !== false && user.phone) ||
          (user.show_whatsapp !== false && user.whatsapp)
        if (!hasContact) return null
        return {
          areaName: slot.areaName,
          type: 'contact',
          onClick: () => setActiveModal('contact'),
          content: (
            <ContactTile
              email={user.email}
              phone={user.phone}
              whatsapp={user.whatsapp}
              showEmail={user.show_email}
              showPhone={user.show_phone}
              showWhatsapp={user.show_whatsapp}
            />
          ),
        }
      }
      case 'cv':
        if (!hasCv) return null
        return {
          areaName: slot.areaName,
          type: 'cv',
          onClick: () => setActiveModal('cv'),
          content: <CvTile handle={handle} />,
        }
      case 'stats': {
        if (seaTimeTotalDays === 0 && attachments.length === 0 && certifications.length === 0) return null
        return {
          areaName: slot.areaName,
          type: 'stats',
          content: (
            <StatsTile
              seaTime={seaTimeFormatted}
              yachtCount={attachments.length}
              certCount={certifications.length}
            />
          ),
        }
      }
      case 'education':
        if (education.length === 0) return null
        return {
          areaName: slot.areaName,
          type: 'education',
          onClick: () => setActiveModal('education'),
          content: <EducationTile education={education} handle={handle} />,
        }
      case 'skills': {
        const skillNames = skills.map((s) => s.name)
        const hobbyNames = hobbies.map((h) => h.emoji ? `${h.emoji} ${h.name}` : h.name)
        if (skillNames.length === 0 && hobbyNames.length === 0) return null
        return {
          areaName: slot.areaName,
          type: 'skills',
          onClick: () => setActiveModal('skills'),
          content: <SkillsTile skills={skillNames} hobbies={hobbyNames} />,
        }
      }
      default:
        return null
    }
  }

  return (
    <div className="px-4 pt-4 pb-24 max-w-[960px] mx-auto w-full">
      <BentoGrid
        variant={variant}
        tiles={tiles}
        gap={12}
        accentColor={accentColor}
      />

      {/* Gallery carousel — overflow photos not in bento */}
      {overflowPhotos.length > 0 && (
        <div className="mt-4">
          <div className="flex items-center gap-2 mb-3 px-1">
            <span className="text-xs font-semibold uppercase tracking-wide text-[var(--color-text-tertiary)]">Gallery</span>
            <span className="text-xs text-[var(--color-text-tertiary)]">· {galleryPhotos.length} photos</span>
          </div>
          <div className="flex gap-3 overflow-x-auto pb-3 snap-x snap-mandatory scrollbar-hide">
            {overflowPhotos.map((photo, i) => (
              <button
                key={photo.id}
                onClick={() => setLightboxIndex(photoSlots.length + i)}
                className="shrink-0 snap-start rounded-2xl overflow-hidden group cursor-pointer"
                style={{ width: 160, height: 200 }}
              >
                <img
                  src={photo.image_url}
                  alt={photo.caption || ''}
                  className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
                  loading="lazy"
                />
              </button>
            ))}
            <button
              onClick={() => setShowGalleryModal(true)}
              className="shrink-0 snap-start rounded-2xl overflow-hidden flex items-center justify-center bg-[var(--color-surface-raised)] hover:bg-[var(--color-border)] transition-colors cursor-pointer"
              style={{ width: 160, height: 200 }}
            >
              <span className="text-sm font-medium text-[var(--accent-500,#14b8a6)]">
                See all &rarr;
              </span>
            </button>
          </div>
        </div>
      )}

      {/* Gallery modal — full photo grid overlay (z-40, below lightbox z-50) */}
      {showGalleryModal && (
        <div className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm flex items-stretch justify-center p-4 pb-[20vh]">
          <div className="relative w-full max-w-[960px] bg-[var(--color-surface)] rounded-2xl overflow-hidden flex flex-col">
            {/* Header */}
            <div className="sticky top-0 z-10 flex items-center justify-between px-5 py-4 bg-[var(--color-surface)] border-b border-[var(--color-border-subtle)]">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-[var(--color-text-primary)]">
                Gallery · {galleryPhotos.length} photos
              </h2>
              <button
                onClick={() => setShowGalleryModal(false)}
                className="flex items-center justify-center w-8 h-8 rounded-full hover:bg-[var(--color-surface-raised)] transition-colors"
                aria-label="Close gallery"
              >
                <X size={18} />
              </button>
            </div>
            {/* Photo grid */}
            <div className="flex-1 overflow-y-auto grid grid-cols-2 sm:grid-cols-3 gap-2 p-4 content-start">
              {galleryPhotos.map((photo, i) => (
                <button
                  key={photo.id}
                  onClick={() => setLightboxIndex(i)}
                  className="aspect-square rounded-xl overflow-hidden group cursor-pointer"
                >
                  <img
                    src={photo.image_url}
                    alt={photo.caption || ''}
                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
                    loading="lazy"
                  />
                </button>
              ))}
            </div>
          </div>
          {/* Click outside to close */}
          <div className="absolute inset-0 -z-10" onClick={() => setShowGalleryModal(false)} />
        </div>
      )}

      {/* Section modals — full content overlays */}
      <SectionModal title="CV Preview" open={activeModal === 'cv'} onClose={() => setActiveModal(null)}>
        <div className="flex flex-col gap-4 h-full">
          <div className="flex-1 rounded-xl overflow-hidden bg-gray-100 min-h-0">
            <iframe src={`/api/cv/public-download/${handle}`} className="w-full h-full border-0" title="CV Preview" />
          </div>
          <div className="flex gap-3 shrink-0">
            <a
              href={`/api/cv/public-download/${handle}`}
              download
              onClick={(e) => e.stopPropagation()}
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
        </div>
      </SectionModal>

      <SectionModal title="Contact" open={activeModal === 'contact'} onClose={() => setActiveModal(null)}>
        <div className="flex flex-col gap-4">
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
            <a href={`tel:${user.phone}`} className="flex items-center gap-3 p-3 rounded-xl hover:bg-[var(--color-surface-raised)] transition-colors">
              <span className="flex items-center justify-center w-10 h-10 rounded-full bg-[var(--color-surface-raised)]"><Phone size={18} className="text-[var(--color-text-secondary)]" /></span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-[var(--color-text-primary)]">Call</p>
                <p className="text-xs text-[var(--color-text-secondary)] truncate">{user.phone}</p>
              </div>
              <ExternalLink size={14} className="text-[var(--color-text-tertiary)]" />
            </a>
          )}
          {user.show_whatsapp !== false && user.whatsapp && (
            <a href={`https://wa.me/${user.whatsapp.replace(/\D/g, '')}`} className="flex items-center gap-3 p-3 rounded-xl hover:bg-[var(--color-surface-raised)] transition-colors">
              <span className="flex items-center justify-center w-10 h-10 rounded-full bg-[var(--color-surface-raised)]"><MessageCircle size={18} className="text-[var(--color-text-secondary)]" /></span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-[var(--color-text-primary)]">WhatsApp</p>
                <p className="text-xs text-[var(--color-text-secondary)] truncate">{user.whatsapp}</p>
              </div>
              <ExternalLink size={14} className="text-[var(--color-text-tertiary)]" />
            </a>
          )}
          <hr className="border-[var(--color-border-subtle)]" />
          <button
            onClick={() => { navigator.clipboard.writeText(`https://yachtie.link/u/${handle}`); }}
            className="flex items-center gap-3 p-3 rounded-xl hover:bg-[var(--color-surface-raised)] transition-colors"
          >
            <span className="flex items-center justify-center w-10 h-10 rounded-full bg-[var(--color-surface-raised)]"><Share2 size={18} className="text-[var(--color-text-secondary)]" /></span>
            <div className="flex-1 min-w-0 text-left">
              <p className="text-sm font-medium text-[var(--color-text-primary)]">Share Profile</p>
              <p className="text-xs text-[var(--color-text-secondary)]">Copy profile link</p>
            </div>
            <Copy size={14} className="text-[var(--color-text-tertiary)]" />
          </button>
        </div>
      </SectionModal>

      <SectionModal title="About" open={activeModal === 'about'} onClose={() => setActiveModal(null)}>
        <p className="text-sm text-[var(--color-text-primary)] leading-relaxed whitespace-pre-line">{aboutText}</p>
      </SectionModal>

      <SectionModal title="Experience" open={activeModal === 'experience'} onClose={() => setActiveModal(null)}>
        <div className="flex flex-col gap-4">
          {attachments.map((att) => (
            <div key={att.id} className="flex gap-3">
              <div className="mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full bg-[var(--accent-500,#14b8a6)]" />
              <div>
                <p className="text-sm font-medium text-[var(--color-text-primary)]">{att.yachts?.name ?? 'Unknown Yacht'}</p>
                {att.role_label && <p className="text-sm text-[var(--color-text-secondary)]">{att.role_label}</p>}
                {(att.started_at || att.ended_at) && (
                  <p className="text-xs text-[var(--color-text-tertiary)] mt-0.5">
                    {att.started_at ? new Date(att.started_at).toLocaleDateString('en-GB', { month: 'short', year: 'numeric' }) : ''}
                    {att.started_at && ' – '}
                    {att.ended_at ? new Date(att.ended_at).toLocaleDateString('en-GB', { month: 'short', year: 'numeric' }) : 'Present'}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      </SectionModal>

      <SectionModal title="Endorsements" open={activeModal === 'endorsements'} onClose={() => setActiveModal(null)}>
        <div className="flex flex-col gap-5">
          {endorsements.map((end) => (
            <div key={end.id}>
              <p className="text-sm text-[var(--color-text-primary)] italic">&ldquo;{end.content}&rdquo;</p>
              <div className="flex items-center gap-2 mt-2">
                {end.endorser?.profile_photo_url ? (
                  <img src={end.endorser.profile_photo_url} alt="" className="w-7 h-7 rounded-full object-cover" />
                ) : (
                  <div className="w-7 h-7 rounded-full bg-gray-200 flex items-center justify-center text-xs font-medium text-gray-500">
                    {(end.endorser?.display_name || end.endorser?.full_name || '?').charAt(0)}
                  </div>
                )}
                <div>
                  <p className="text-xs font-medium text-[var(--color-text-primary)]">{end.endorser?.display_name || end.endorser?.full_name || 'Anonymous'}</p>
                  {(end.endorser_role_label || end.yacht?.name) && (
                    <p className="text-[10px] text-[var(--color-text-secondary)]">{end.endorser_role_label}{end.endorser_role_label && end.yacht?.name ? ' · ' : ''}{end.yacht?.name}</p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </SectionModal>

      <SectionModal title="Certifications" open={activeModal === 'certifications'} onClose={() => setActiveModal(null)}>
        <div className="flex flex-wrap gap-2">
          {certifications.map((cert) => (
            <span key={cert.id} className="text-sm px-3 py-1.5 rounded-full bg-[var(--color-surface-raised)] text-[var(--color-text-primary)]">
              {cert.certification_types?.name || cert.custom_cert_name}
            </span>
          ))}
        </div>
      </SectionModal>

      <SectionModal title="Education" open={activeModal === 'education'} onClose={() => setActiveModal(null)}>
        <div className="flex flex-col gap-4">
          {education.map((edu) => (
            <div key={edu.id}>
              <p className="text-sm font-medium text-[var(--color-text-primary)]">{edu.institution}</p>
              {edu.qualification && <p className="text-sm text-[var(--color-text-secondary)]">{edu.qualification}</p>}
              {edu.field_of_study && <p className="text-xs text-[var(--color-text-tertiary)]">{edu.field_of_study}</p>}
              {(edu.started_at || edu.ended_at) && (
                <p className="text-xs text-[var(--color-text-tertiary)] mt-0.5">
                  {edu.started_at ? new Date(edu.started_at).getFullYear() : ''}{edu.started_at && edu.ended_at ? ' – ' : ''}{edu.ended_at ? new Date(edu.ended_at).getFullYear() : ''}
                </p>
              )}
            </div>
          ))}
        </div>
      </SectionModal>

      <SectionModal title="Skills & Interests" open={activeModal === 'skills'} onClose={() => setActiveModal(null)}>
        <div className="flex flex-col gap-4">
          {skills.length > 0 && (
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-[var(--color-text-tertiary)] mb-2">Skills</p>
              <div className="flex flex-wrap gap-2">
                {skills.map((s) => (
                  <span key={s.id} className="text-sm px-3 py-1.5 rounded-full bg-[var(--color-surface-raised)] text-[var(--color-text-primary)]">{s.name}</span>
                ))}
              </div>
            </div>
          )}
          {hobbies.length > 0 && (
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-[var(--color-text-tertiary)] mb-2">Interests</p>
              <div className="flex flex-wrap gap-2">
                {hobbies.map((h) => (
                  <span key={h.id} className="text-sm px-3 py-1.5 rounded-full bg-[var(--color-surface-raised)] text-[var(--color-text-secondary)]">{h.emoji ? `${h.emoji} ${h.name}` : h.name}</span>
                ))}
              </div>
            </div>
          )}
        </div>
      </SectionModal>

      {/* Lightbox */}
      {lightboxIndex !== null && (
        <PhotoLightbox
          photos={galleryPhotos.map((p) => ({
            url: p.image_url,
          }))}
          initialIndex={lightboxIndex}
          open={true}
          onClose={() => setLightboxIndex(null)}
        />
      )}
    </div>
  )
}

'use client'

import { useState } from 'react'
import dynamic from 'next/dynamic'
import { BentoGrid } from '../bento/BentoGrid'
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

  // Add "more" tile if template references it and there are overflow photos
  if (hasMorePhotos && (variant.areas.desktop.includes('more') || variant.areas.mobile.includes('more'))) {
    const overflowPhoto = galleryPhotos[photoSlots.length]
    tiles.push({
      areaName: 'more',
      type: 'spacer',
      content: (
        <MorePhotosTile
          handle={handle}
          backgroundUrl={overflowPhoto?.image_url}
          totalCount={galleryPhotos.length}
        />
      ),
    })
  }

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
          content: <AboutTile bio={aboutText} accentColor={accentColor} />,
        }
      case 'experience':
        if (attachments.length === 0) return null
        return {
          areaName: slot.areaName,
          type: 'experience',
          content: <ExperienceTile attachments={attachments} handle={handle} />,
        }
      case 'endorsements':
        if (endorsements.length === 0) return null
        return {
          areaName: slot.areaName,
          type: 'endorsements',
          content: <EndorsementsTile endorsements={endorsements} handle={handle} />,
        }
      case 'certifications':
        if (certifications.length === 0) return null
        return {
          areaName: slot.areaName,
          type: 'certifications',
          content: <CertsTile certifications={certifications} handle={handle} />,
        }
      case 'contact':
        return {
          areaName: slot.areaName,
          type: 'contact',
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
      case 'cv':
        if (!hasCv) return null
        return {
          areaName: slot.areaName,
          type: 'cv',
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
          content: <EducationTile education={education} handle={handle} />,
        }
      case 'skills': {
        const skillNames = skills.map((s) => s.name)
        const hobbyNames = hobbies.map((h) => h.emoji ? `${h.emoji} ${h.name}` : h.name)
        if (skillNames.length === 0 && hobbyNames.length === 0) return null
        return {
          areaName: slot.areaName,
          type: 'skills',
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

import Image from 'next/image'
import { Camera } from 'lucide-react'
import { ProfileAccordion } from '@/components/profile/ProfileAccordion'
import { ScrollReveal } from '@/components/ui/ScrollReveal'
import { ShowMoreButton } from '../ShowMoreButton'
import { gallerySummary } from '@/lib/profile-summaries'
import type { GalleryItem } from '@/lib/queries/types'

interface GallerySectionProps {
  gallery: GalleryItem[]
}

export function GallerySection({ gallery }: GallerySectionProps) {
  return (
    <ScrollReveal>
      <ProfileAccordion
        title="My Gallery"
        summary={gallerySummary(gallery.length)}
        accentColor="sand"
        icon={<Camera size={16} />}
      >
        <div className="grid grid-cols-3 gap-1.5">
          {gallery.slice(0, 9).map((item) => (
            <div key={item.id} className="relative aspect-square rounded-lg overflow-hidden bg-[var(--color-surface-raised)]">
              <Image
                src={item.image_url}
                alt={item.caption ?? 'Gallery photo'}
                fill
                className="object-cover"
              />
            </div>
          ))}
        </div>
        {gallery.length > 9 && (
          <ShowMoreButton label={`${gallery.length - 9} more photos`}>
            <div className="grid grid-cols-3 gap-1.5 pt-1.5">
              {gallery.slice(9).map((item) => (
                <div key={item.id} className="relative aspect-square rounded-lg overflow-hidden bg-[var(--color-surface-raised)]">
                  <Image
                    src={item.image_url}
                    alt={item.caption ?? 'Gallery photo'}
                    fill
                    className="object-cover"
                  />
                </div>
              ))}
            </div>
          </ShowMoreButton>
        )}
      </ProfileAccordion>
    </ScrollReveal>
  )
}

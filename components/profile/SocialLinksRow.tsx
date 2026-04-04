import Link from 'next/link'
import { Pencil } from 'lucide-react'
import { getPlatformIcon } from '@/components/ui/social-icons'
import { SOCIAL_PLATFORM_META } from '@/lib/social-platforms'
import type { SocialPlatform } from '@/lib/social-platforms'

interface SocialLink {
  platform: SocialPlatform
  url: string
}

interface SocialLinksRowProps {
  links: SocialLink[]
  /** light = white icons for use over dark/photo backgrounds */
  variant?: 'default' | 'light'
  /** Show edit button linking to social links editor */
  editable?: boolean
}

export function SocialLinksRow({ links, variant = 'default', editable = false }: SocialLinksRowProps) {
  if (!links || links.length === 0) return null

  const baseColor = variant === 'light'
    ? 'text-white/70'
    : 'text-[var(--color-text-secondary)]'

  return (
    <div className="flex items-center gap-3 flex-wrap">
      {links.map(({ platform, url }) => {
        const meta = SOCIAL_PLATFORM_META[platform]
        if (!meta) return null
        return (
          <Link
            key={platform}
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={meta.label}
            className={`${baseColor} transition-colors ${meta.hoverColor} leading-none`}
            title={meta.label}
          >
            {getPlatformIcon(platform, 18)}
          </Link>
        )
      })}
      {editable && (
        <Link
          href="/app/social-links/edit"
          className="ml-auto text-[var(--color-text-tertiary)] hover:text-[var(--color-text-secondary)] transition-colors p-0.5"
          aria-label="Edit social links"
        >
          <Pencil size={14} />
        </Link>
      )}
    </div>
  )
}

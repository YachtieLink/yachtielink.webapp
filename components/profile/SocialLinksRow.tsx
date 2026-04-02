import Link from 'next/link'
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
}

export function SocialLinksRow({ links, variant = 'default' }: SocialLinksRowProps) {
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
    </div>
  )
}

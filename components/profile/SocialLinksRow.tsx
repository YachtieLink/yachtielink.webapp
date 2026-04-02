import Link from 'next/link'
import { Instagram, Linkedin, Youtube, Facebook, Globe } from 'lucide-react'
import { TikTokIcon, XIcon } from '@/components/ui/social-icons'
import { SOCIAL_PLATFORM_META } from '@/lib/social-platforms'
import type React from 'react'
import type { SocialPlatform } from '@/lib/social-platforms'

interface SocialLink {
  platform: SocialPlatform
  url: string
}

const PLATFORM_CONFIG: Record<SocialPlatform, { label: string; icon: React.ReactNode; hoverColor: string }> = {
  instagram: { label: SOCIAL_PLATFORM_META.instagram.label, icon: <Instagram size={18} />, hoverColor: SOCIAL_PLATFORM_META.instagram.hoverColor },
  linkedin:  { label: SOCIAL_PLATFORM_META.linkedin.label,  icon: <Linkedin size={18} />,  hoverColor: SOCIAL_PLATFORM_META.linkedin.hoverColor },
  tiktok:    { label: SOCIAL_PLATFORM_META.tiktok.label,    icon: <TikTokIcon size={18} />, hoverColor: SOCIAL_PLATFORM_META.tiktok.hoverColor },
  youtube:   { label: SOCIAL_PLATFORM_META.youtube.label,   icon: <Youtube size={18} />,   hoverColor: SOCIAL_PLATFORM_META.youtube.hoverColor },
  x:         { label: SOCIAL_PLATFORM_META.x.label,         icon: <XIcon size={18} />,     hoverColor: SOCIAL_PLATFORM_META.x.hoverColor },
  facebook:  { label: SOCIAL_PLATFORM_META.facebook.label,  icon: <Facebook size={18} />,  hoverColor: SOCIAL_PLATFORM_META.facebook.hoverColor },
  website:   { label: SOCIAL_PLATFORM_META.website.label,   icon: <Globe size={18} />,     hoverColor: SOCIAL_PLATFORM_META.website.hoverColor },
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
        const config = PLATFORM_CONFIG[platform]
        if (!config) return null
        return (
          <Link
            key={platform}
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={config.label}
            className={`${baseColor} transition-colors ${config.hoverColor} leading-none`}
            title={config.label}
          >
            {config.icon}
          </Link>
        )
      })}
    </div>
  )
}

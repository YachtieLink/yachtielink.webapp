import Link from 'next/link'
import { Instagram, Linkedin, Youtube, Facebook, Globe } from 'lucide-react'
import type React from 'react'

type SocialPlatform = 'instagram' | 'linkedin' | 'tiktok' | 'youtube' | 'x' | 'facebook' | 'website'

interface SocialLink {
  platform: SocialPlatform
  url: string
}

// Custom minimal SVG for X (Twitter) — no Lucide equivalent
function XIcon({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.74l7.73-8.835L1.254 2.25H8.08l4.253 5.622 5.911-5.622Zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  )
}

// Custom minimal SVG for TikTok
function TikTokIcon({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 0 0-.79-.05 6.34 6.34 0 0 0-6.34 6.34 6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.33-6.34V8.69a8.18 8.18 0 0 0 4.78 1.52V6.76a4.85 4.85 0 0 1-1.01-.07Z" />
    </svg>
  )
}

const PLATFORM_CONFIG: Record<SocialPlatform, { label: string; icon: React.ReactNode; hoverColor: string }> = {
  instagram: { label: 'Instagram', icon: <Instagram size={18} />,  hoverColor: 'hover:text-[#E4405F]' },
  linkedin:  { label: 'LinkedIn',  icon: <Linkedin size={18} />,   hoverColor: 'hover:text-[#0A66C2]' },
  tiktok:    { label: 'TikTok',    icon: <TikTokIcon size={18} />, hoverColor: 'hover:text-black dark:hover:text-white' },
  youtube:   { label: 'YouTube',   icon: <Youtube size={18} />,    hoverColor: 'hover:text-[#FF0000]' },
  x:         { label: 'X',         icon: <XIcon size={18} />,      hoverColor: 'hover:text-black dark:hover:text-white' },
  facebook:  { label: 'Facebook',  icon: <Facebook size={18} />,   hoverColor: 'hover:text-[#1877F2]' },
  website:   { label: 'Website',   icon: <Globe size={18} />,      hoverColor: 'hover:text-[var(--color-interactive)]' },
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

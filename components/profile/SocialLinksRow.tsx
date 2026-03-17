import Link from 'next/link'

type SocialPlatform = 'instagram' | 'linkedin' | 'tiktok' | 'youtube' | 'x' | 'facebook' | 'website'

interface SocialLink {
  platform: SocialPlatform
  url: string
}

const PLATFORM_CONFIG: Record<SocialPlatform, { label: string; icon: string; hoverColor: string }> = {
  instagram: { label: 'Instagram',  icon: '📸', hoverColor: 'hover:text-[#E4405F]' },
  linkedin:  { label: 'LinkedIn',   icon: '💼', hoverColor: 'hover:text-[#0A66C2]' },
  tiktok:    { label: 'TikTok',     icon: '🎵', hoverColor: 'hover:text-black dark:hover:text-white' },
  youtube:   { label: 'YouTube',    icon: '▶️', hoverColor: 'hover:text-[#FF0000]' },
  x:         { label: 'X',          icon: '✕',  hoverColor: 'hover:text-black dark:hover:text-white' },
  facebook:  { label: 'Facebook',   icon: 'f',  hoverColor: 'hover:text-[#1877F2]' },
  website:   { label: 'Website',    icon: '🌐', hoverColor: 'hover:text-[var(--color-interactive)]' },
}

interface SocialLinksRowProps {
  links: SocialLink[]
}

export function SocialLinksRow({ links }: SocialLinksRowProps) {
  if (!links || links.length === 0) return null

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
            className={`text-[var(--color-text-secondary)] transition-colors ${config.hoverColor} text-lg leading-none`}
            title={config.label}
          >
            {config.icon}
          </Link>
        )
      })}
    </div>
  )
}

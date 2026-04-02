// Shared social platform metadata — labels, hover colours, add-link placeholders.
// Consumers build their own icon elements using TikTokIcon/XIcon from components/ui/social-icons.

export type SocialPlatform = 'instagram' | 'linkedin' | 'tiktok' | 'youtube' | 'x' | 'facebook' | 'website'

export const ALL_PLATFORMS: SocialPlatform[] = [
  'instagram', 'linkedin', 'tiktok', 'youtube', 'x', 'facebook', 'website',
]

export const SOCIAL_PLATFORM_META: Record<SocialPlatform, {
  label: string
  hoverColor: string
  placeholder: string
}> = {
  instagram: { label: 'Instagram', hoverColor: 'hover:text-[#E4405F]',                            placeholder: 'https://instagram.com/yourhandle' },
  linkedin:  { label: 'LinkedIn',  hoverColor: 'hover:text-[#0A66C2]',                            placeholder: 'https://linkedin.com/in/yourname' },
  tiktok:    { label: 'TikTok',    hoverColor: 'hover:text-black dark:hover:text-white',           placeholder: 'https://tiktok.com/@yourhandle' },
  youtube:   { label: 'YouTube',   hoverColor: 'hover:text-[#FF0000]',                            placeholder: 'https://youtube.com/@yourchannel' },
  x:         { label: 'X',         hoverColor: 'hover:text-black dark:hover:text-white',           placeholder: 'https://x.com/yourhandle' },
  facebook:  { label: 'Facebook',  hoverColor: 'hover:text-[#1877F2]',                            placeholder: 'https://facebook.com/yourprofile' },
  website:   { label: 'Website',   hoverColor: 'hover:text-[var(--color-interactive)]',           placeholder: 'https://yourwebsite.com' },
}

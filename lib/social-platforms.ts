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

/** Base URLs for extracting/rebuilding user handles from full URLs */
const PLATFORM_BASES: Record<SocialPlatform, { prefix: string; base: string } | null> = {
  instagram: { prefix: 'instagram.com/', base: 'https://instagram.com/' },
  linkedin:  { prefix: 'linkedin.com/in/', base: 'https://linkedin.com/in/' },
  tiktok:    { prefix: 'tiktok.com/@', base: 'https://tiktok.com/@' },
  youtube:   { prefix: 'youtube.com/@', base: 'https://youtube.com/@' },
  x:         { prefix: 'x.com/', base: 'https://x.com/' },
  facebook:  { prefix: 'facebook.com/', base: 'https://facebook.com/' },
  website:   null, // full URL editing
}

/** Extract the user-specific handle from a full social URL */
export function extractHandle(platform: SocialPlatform, url: string): string {
  const config = PLATFORM_BASES[platform]
  if (!config) return url
  // Try stripping known base patterns (with or without www, http/https)
  const pattern = new RegExp(`^https?://(www\\.)?${config.prefix.replace('.', '\\.')}`, 'i')
  const match = url.match(pattern)
  if (match) return url.slice(match[0].length).replace(/\/+$/, '')
  return url
}

/** Reconstruct a full URL from a handle. Normalises website URLs (www, http, bare domains). */
export function buildUrl(platform: SocialPlatform, handle: string): string {
  const config = PLATFORM_BASES[platform]
  if (!config) {
    // Website: normalise any format to https://
    let url = handle.trim()
    // Strip any existing protocol
    url = url.replace(/^(https?:\/\/)?(www\.)?/i, '')
    return `https://${url}`
  }
  // Strip the base URL if someone pasted a full URL into the handle field
  const stripped = handle.replace(new RegExp(`^(https?://)?(www\\.)?${config.prefix.replace('.', '\\.')}`, 'i'), '')
  return `${config.base}${stripped}`
}

/** Get the display prefix for a platform (e.g. "instagram.com/") */
export function getPlatformPrefix(platform: SocialPlatform): string | null {
  return PLATFORM_BASES[platform]?.prefix ?? null
}

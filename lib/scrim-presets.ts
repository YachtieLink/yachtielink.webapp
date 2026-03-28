export const scrimPresets = {
  dark: {
    gradient: 'linear-gradient(to bottom, rgba(0,0,0,0.25) 0%, rgba(0,0,0,0) 30%, rgba(0,0,0,0) 50%, rgba(0,0,0,0.45) 100%)',
    textColor: 'text-white',
    subtextColor: 'text-white/80',
    textShadow: '0 1px 3px rgba(0,0,0,0.6)',
    badgeBg: 'bg-green-500/25',
    variant: 'dark' as const,
  },
  light: {
    gradient: 'linear-gradient(to bottom, rgba(255,255,255,0.3) 0%, rgba(255,255,255,0) 30%, rgba(255,255,255,0) 50%, rgba(255,255,255,0.5) 100%)',
    textColor: 'text-gray-900',
    subtextColor: 'text-gray-700',
    textShadow: 'none',
    badgeBg: 'bg-green-500/30',
    variant: 'light' as const,
  },
  teal: {
    gradient: 'linear-gradient(to bottom, rgba(19,78,74,0.25) 0%, rgba(19,78,74,0) 30%, rgba(19,78,74,0) 50%, rgba(19,78,74,0.45) 100%)',
    textColor: 'text-white',
    subtextColor: 'text-teal-100',
    textShadow: '0 1px 3px rgba(0,0,0,0.4)',
    badgeBg: 'bg-green-400/25',
    variant: 'dark' as const,
  },
  warm: {
    gradient: 'linear-gradient(to bottom, rgba(120,53,15,0.2) 0%, rgba(120,53,15,0) 30%, rgba(120,53,15,0) 50%, rgba(120,53,15,0.4) 100%)',
    textColor: 'text-white',
    subtextColor: 'text-amber-100',
    textShadow: '0 1px 3px rgba(0,0,0,0.4)',
    badgeBg: 'bg-green-400/25',
    variant: 'dark' as const,
  },
} as const

export type ScrimPreset = keyof typeof scrimPresets

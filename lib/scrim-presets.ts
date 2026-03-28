export const scrimPresets = {
  dark: {
    topGradient: 'from-black/50 to-transparent',
    bottomGradient: 'from-transparent to-black/70',
    textColor: 'text-white',
    subtextColor: 'text-white/80',
    textShadow: '0 1px 3px rgba(0,0,0,0.6)',
    badgeBg: 'bg-green-500/25',
    variant: 'dark' as const,
  },
  light: {
    topGradient: 'from-white/50 to-transparent',
    bottomGradient: 'from-transparent to-white/70',
    textColor: 'text-gray-900',
    subtextColor: 'text-gray-700',
    textShadow: 'none',
    badgeBg: 'bg-green-500/30',
    variant: 'light' as const,
  },
  teal: {
    topGradient: 'from-teal-900/50 to-transparent',
    bottomGradient: 'from-transparent to-teal-900/70',
    textColor: 'text-white',
    subtextColor: 'text-teal-100',
    textShadow: '0 1px 3px rgba(0,0,0,0.4)',
    badgeBg: 'bg-green-400/25',
    variant: 'dark' as const,
  },
  warm: {
    topGradient: 'from-amber-900/40 to-transparent',
    bottomGradient: 'from-transparent to-amber-900/60',
    textColor: 'text-white',
    subtextColor: 'text-amber-100',
    textShadow: '0 1px 3px rgba(0,0,0,0.4)',
    badgeBg: 'bg-green-400/25',
    variant: 'dark' as const,
  },
} as const

export type ScrimPreset = keyof typeof scrimPresets

'use client'

interface ViewModeToggleProps {
  ownerDefault: 'portfolio' | 'rich_portfolio'
  activeMode: 'profile' | 'portfolio' | 'rich_portfolio'
  onChange: (mode: 'profile' | 'portfolio' | 'rich_portfolio') => void
  scrimVariant?: 'dark' | 'light'
}

export function ViewModeToggle({
  ownerDefault,
  activeMode,
  onChange,
  scrimVariant = 'dark',
}: ViewModeToggleProps) {
  const isDark = scrimVariant === 'dark'
  const label = ownerDefault === 'rich_portfolio' ? 'Rich Portfolio' : 'Portfolio'

  const modes = [
    { id: 'profile' as const, label: 'Profile' },
    { id: ownerDefault, label },
  ]

  return (
    <div
      className={`inline-flex rounded-full p-0.5 backdrop-blur-md ${
        isDark ? 'bg-white/15' : 'bg-black/10'
      }`}
    >
      {modes.map((mode) => {
        const isActive = activeMode === mode.id
        return (
          <button
            key={mode.id}
            onClick={() => onChange(mode.id)}
            className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all ${
              isActive
                ? 'bg-[var(--accent-500,#14b8a6)] text-white shadow-sm'
                : isDark
                ? 'text-white/70 hover:text-white'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            {mode.label}
          </button>
        )
      })}
    </div>
  )
}

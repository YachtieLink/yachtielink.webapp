'use client'

import { List, LayoutGrid } from 'lucide-react'

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

  const modes = [
    { id: 'profile' as const, icon: <List size={14} />, label: 'Profile view' },
    { id: ownerDefault, icon: <LayoutGrid size={14} />, label: 'Portfolio view' },
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
            className={`p-1.5 rounded-full transition-all ${
              isActive
                ? 'bg-white/25 text-white shadow-sm'
                : isDark
                ? 'text-white/50 hover:text-white/80'
                : 'text-gray-400 hover:text-gray-700'
            }`}
            aria-label={mode.label}
            title={mode.label}
          >
            {mode.icon}
          </button>
        )
      })}
    </div>
  )
}

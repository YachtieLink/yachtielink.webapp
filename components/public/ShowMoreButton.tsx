'use client'

import { useState } from 'react'

interface ShowMoreButtonProps {
  label: string
  children: React.ReactNode
}

/**
 * A button that reveals hidden overflow content (e.g. additional endorsements or photos).
 * Renders the label as an interactive button; on click, replaces itself with `children`.
 */
export function ShowMoreButton({ label, children }: ShowMoreButtonProps) {
  const [expanded, setExpanded] = useState(false)

  if (expanded) {
    return <>{children}</>
  }

  return (
    <button
      onClick={() => setExpanded(true)}
      className="text-sm text-[var(--color-interactive)] text-center pt-1 w-full hover:underline cursor-pointer"
    >
      {label}
    </button>
  )
}

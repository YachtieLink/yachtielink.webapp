'use client'

import { useState } from 'react'

interface ChipSelectProps {
  items: string[]
  onChange: (items: string[]) => void
  /** Items already saved to profile — shown with a subtle ✓ but still removable */
  existingItems?: string[]
  label?: string
  hint?: string
  addLabel?: string
  maxItems?: number
}

export function ChipSelect({
  items,
  onChange,
  existingItems = [],
  label,
  hint,
  addLabel = '+ Add',
  maxItems = 20,
}: ChipSelectProps) {
  const [newItem, setNewItem] = useState('')
  const [showAll, setShowAll] = useState(false)

  function toggle(item: string) {
    if (items.includes(item)) {
      onChange(items.filter((i) => i !== item))
    } else {
      onChange([...items, item])
    }
  }

  function addItem() {
    const val = newItem.trim()
    if (!val || items.includes(val) || items.length >= maxItems) return
    onChange([...items, val])
    setNewItem('')
  }

  // Split into existing (already on profile) and new (from CV parse)
  const existingChips = items.filter((item) => existingItems.includes(item))
  const newChips = items.filter((item) => !existingItems.includes(item))

  // Collapse chips beyond threshold
  const CHIP_THRESHOLD = 6
  const visibleExisting = showAll ? existingChips : existingChips.slice(0, CHIP_THRESHOLD)
  const hiddenExistingCount = existingChips.length - visibleExisting.length
  const visibleNew = showAll ? newChips : newChips.slice(0, CHIP_THRESHOLD)
  const hiddenNewCount = newChips.length - visibleNew.length

  return (
    <div className="flex flex-col gap-2">
      {label && (
        <p className="text-base font-semibold text-[var(--color-text-primary)]">
          {label} <span className="text-[var(--color-text-tertiary)] font-normal text-sm">({items.length})</span>
        </p>
      )}
      {hint && (
        <p className="text-xs text-[var(--color-text-tertiary)]">{hint}</p>
      )}

      {/* Already on profile */}
      {existingChips.length > 0 && (
        <div className="flex flex-col gap-1.5">
          {newChips.length > 0 && (
            <p className="text-[11px] text-[var(--color-text-secondary)] uppercase tracking-wider font-medium">On your profile</p>
          )}
          <div className="flex flex-wrap gap-2">
            {visibleExisting.map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => toggle(item)}
                className="px-2.5 py-1 rounded-full text-xs border bg-[var(--color-surface-raised)] text-[var(--color-text-secondary)] border-[var(--color-border)] hover:border-[var(--color-error)]/50 hover:text-[var(--color-error)] transition-colors flex items-center gap-1 min-h-[28px] group"
              >
                {item}
                <span className="text-[var(--color-text-tertiary)] group-hover:text-[var(--color-error)] text-xs leading-none">×</span>
              </button>
            ))}
            {hiddenExistingCount > 0 && !showAll && (
              <button
                type="button"
                onClick={() => setShowAll(true)}
                className="px-2.5 py-1 rounded-full text-xs border border-dashed border-[var(--color-border)] text-[var(--color-text-tertiary)] hover:text-[var(--color-text-secondary)] transition-colors min-h-[28px]"
              >
                +{hiddenExistingCount} more
              </button>
            )}
          </div>
        </div>
      )}

      {/* New from CV */}
      {newChips.length > 0 && (
        <div className="flex flex-col gap-1.5">
          {existingChips.length > 0 && (
            <p className="text-[11px] text-[var(--color-text-secondary)] uppercase tracking-wider font-medium">From your CV</p>
          )}
          <div className="flex flex-wrap gap-2">
            {visibleNew.map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => toggle(item)}
                className="px-2.5 py-1 rounded-full text-xs border bg-[var(--color-interactive)]/10 text-[var(--color-interactive)] border-[var(--color-interactive)]/30 hover:bg-[var(--color-interactive)]/20 transition-colors min-h-[28px] flex items-center gap-1"
              >
                {item}
                <span className="text-[var(--color-interactive)]/50 text-xs leading-none">×</span>
              </button>
            ))}
            {hiddenNewCount > 0 && !showAll && (
              <button
                type="button"
                onClick={() => setShowAll(true)}
                className="px-2.5 py-1 rounded-full text-xs border border-dashed border-[var(--color-interactive)]/40 text-[var(--color-interactive)] hover:bg-[var(--color-interactive)]/5 transition-colors min-h-[28px]"
              >
                +{hiddenNewCount} more
              </button>
            )}
          </div>
        </div>
      )}

      {showAll && (existingChips.length > CHIP_THRESHOLD || newChips.length > CHIP_THRESHOLD) && (
        <button
          type="button"
          onClick={() => setShowAll(false)}
          className="text-xs text-[var(--color-text-tertiary)] hover:text-[var(--color-text-secondary)] self-start"
        >
          Show less
        </button>
      )}

      {items.length < maxItems && (
        <div className="flex gap-2">
          <input
            type="text"
            value={newItem}
            onChange={(e) => setNewItem(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addItem() } }}
            placeholder="Add..."
            className="flex-1 h-10 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-3 text-sm text-[var(--color-text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-interactive)]/20"
          />
          <button
            type="button"
            onClick={addItem}
            className="px-3 h-10 rounded-xl text-sm font-medium text-[var(--color-interactive)] border border-[var(--color-border)] hover:bg-[var(--color-surface-raised)]"
          >
            {addLabel}
          </button>
        </div>
      )}
    </div>
  )
}

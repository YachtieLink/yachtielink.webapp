'use client'

import { useState } from 'react'

interface ChipSelectProps {
  items: string[]
  onChange: (items: string[]) => void
  existingItems?: string[]
  label?: string
  addLabel?: string
  maxItems?: number
}

export function ChipSelect({
  items,
  onChange,
  existingItems = [],
  label,
  addLabel = '+ Add',
  maxItems = 20,
}: ChipSelectProps) {
  const [newItem, setNewItem] = useState('')

  function toggle(item: string) {
    if (existingItems.includes(item)) return // can't remove existing
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

  return (
    <div className="flex flex-col gap-2">
      {label && (
        <p className="text-sm font-medium text-[var(--color-text-primary)]">{label}</p>
      )}
      <div className="flex flex-wrap gap-1.5">
        {items.map((item) => {
          const isExisting = existingItems.includes(item)
          return (
            <button
              key={item}
              type="button"
              onClick={() => toggle(item)}
              className={`px-3 py-1.5 rounded-lg text-sm border transition-colors ${
                isExisting
                  ? 'bg-[var(--color-surface-raised)] text-[var(--color-text-secondary)] border-[var(--color-border)] cursor-default'
                  : 'bg-[var(--color-interactive)] text-white border-[var(--color-interactive)] hover:opacity-80'
              }`}
            >
              {item}{isExisting ? ' (saved)' : ''}
            </button>
          )
        })}
      </div>
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

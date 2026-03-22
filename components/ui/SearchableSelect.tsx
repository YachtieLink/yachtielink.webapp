'use client'

import { useState, useRef, useEffect, useId } from 'react'

interface Option {
  value: string
  label: string
}

interface SearchableSelectProps {
  label?: string
  value: string
  onChange: (value: string) => void
  options: Option[]
  pinnedOptions?: Option[]
  placeholder?: string
  className?: string
}

export function SearchableSelect({
  label,
  value,
  onChange,
  options,
  pinnedOptions = [],
  placeholder = 'Search...',
  className = '',
}: SearchableSelectProps) {
  const id = useId()
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')
  const containerRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Close on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
        setSearch('')
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  const selectedLabel = options.find((o) => o.value === value)?.label
    ?? pinnedOptions.find((o) => o.value === value)?.label
    ?? ''

  const query = search.toLowerCase()

  // Filter pinned and regular options
  const filteredPinned = pinnedOptions.filter((o) =>
    o.label.toLowerCase().includes(query)
  )
  const pinnedValues = new Set(pinnedOptions.map((o) => o.value))
  const filteredOptions = options
    .filter((o) => !pinnedValues.has(o.value))
    .filter((o) => o.label.toLowerCase().includes(query))

  function select(val: string) {
    onChange(val)
    setOpen(false)
    setSearch('')
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Escape') {
      setOpen(false)
      setSearch('')
      inputRef.current?.blur()
    }
  }

  return (
    <div ref={containerRef} className={`relative flex flex-col gap-1.5 ${className}`}>
      {label && (
        <label htmlFor={id} className="text-sm font-medium text-[var(--color-text-primary)]">
          {label}
        </label>
      )}

      <input
        ref={inputRef}
        id={id}
        type="text"
        value={open ? search : selectedLabel}
        placeholder={placeholder}
        onChange={(e) => {
          setSearch(e.target.value)
          if (!open) setOpen(true)
        }}
        onFocus={() => {
          setOpen(true)
          setSearch('')
        }}
        onKeyDown={handleKeyDown}
        autoComplete="off"
        className="h-12 w-full rounded-xl border px-4 text-sm bg-[var(--color-surface)] text-[var(--color-text-primary)] border-[var(--color-border)] focus-visible:outline-none focus-visible:ring-2 focus-visible:border-[var(--color-interactive)] focus-visible:ring-[var(--color-interactive)]/20 transition-colors"
      />

      {open && (filteredPinned.length > 0 || filteredOptions.length > 0) && (
        <ul className="absolute top-full left-0 right-0 mt-1 max-h-60 overflow-y-auto rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] shadow-lg z-50">
          {/* Pinned options */}
          {filteredPinned.map((o) => (
            <li key={`pinned-${o.value}`}>
              <button
                type="button"
                onClick={() => select(o.value)}
                className={`w-full text-left px-4 py-2.5 text-sm transition-colors hover:bg-[var(--color-surface-overlay)] ${
                  o.value === value
                    ? 'text-[var(--color-interactive)] font-medium'
                    : 'text-[var(--color-text-primary)]'
                }`}
              >
                {o.label}
              </button>
            </li>
          ))}

          {/* Divider between pinned and rest */}
          {filteredPinned.length > 0 && filteredOptions.length > 0 && (
            <li className="border-t border-[var(--color-border)] my-1" />
          )}

          {/* All other options */}
          {filteredOptions.map((o) => (
            <li key={o.value}>
              <button
                type="button"
                onClick={() => select(o.value)}
                className={`w-full text-left px-4 py-2.5 text-sm transition-colors hover:bg-[var(--color-surface-overlay)] ${
                  o.value === value
                    ? 'text-[var(--color-interactive)] font-medium'
                    : 'text-[var(--color-text-primary)]'
                }`}
              >
                {o.label}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

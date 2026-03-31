'use client'

import { useEffect, useRef, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

interface BuilderInputProps {
  value: string
  onChange: (value: string) => void
  onBlur?: () => void
  placeholder?: string
  /** Use compact inline styling (for YachtMatchCard blue state) */
  compact?: boolean
  className?: string
}

interface BuilderSuggestion {
  id: string
  name: string
}

export function BuilderInput({
  value,
  onChange,
  onBlur,
  placeholder = 'e.g. Feadship',
  compact = false,
  className = '',
}: BuilderInputProps) {
  const [suggestions, setSuggestions] = useState<BuilderSuggestion[]>([])
  const [open, setOpen] = useState(false)
  const [activeIndex, setActiveIndex] = useState(-1)
  const containerRef = useRef<HTMLDivElement>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const val = e.target.value
    onChange(val)
    setActiveIndex(-1)

    if (debounceRef.current) clearTimeout(debounceRef.current)

    if (!val.trim()) {
      setSuggestions([])
      setOpen(false)
      return
    }

    debounceRef.current = setTimeout(async () => {
      const supabase = createClient()
      const { data } = await supabase.rpc('search_builders', {
        p_query: val,
        p_limit: 5,
      })
      const results: BuilderSuggestion[] = data ?? []
      setSuggestions(results)
      setOpen(results.length > 0)
    }, 300)
  }

  const isSelectingRef = useRef(false)

  function handleSelect(name: string) {
    isSelectingRef.current = true
    onChange(name)
    setSuggestions([])
    setOpen(false)
    setActiveIndex(-1)
    // Notify parent of the confirmed selection
    onBlur?.()
    setTimeout(() => { isSelectingRef.current = false }, 200)
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (!open || suggestions.length === 0) return

    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setActiveIndex((i) => Math.min(i + 1, suggestions.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setActiveIndex((i) => Math.max(i - 1, 0))
    } else if (e.key === 'Enter' && activeIndex >= 0) {
      e.preventDefault()
      handleSelect(suggestions[activeIndex].name)
    } else if (e.key === 'Escape') {
      setOpen(false)
    }
  }

  function handleBlur() {
    // Delay so click on suggestion fires first; skip if user just picked from dropdown
    setTimeout(() => {
      if (!isSelectingRef.current) {
        onBlur?.()
      }
    }, 150)
  }

  const inputClass = compact
    ? `w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-sm text-[var(--color-text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-interactive)] ${className}`
    : `h-12 w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-4 text-sm text-[var(--color-text-primary)] placeholder:text-[var(--color-text-tertiary)] focus:outline-none focus:ring-2 focus:border-[var(--color-interactive)] focus:ring-[var(--color-interactive)]/20 transition-colors ${className}`

  return (
    <div ref={containerRef} className="relative w-full">
      <input
        type="text"
        value={value}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        onBlur={handleBlur}
        placeholder={placeholder}
        autoComplete="off"
        className={inputClass}
      />

      {open && suggestions.length > 0 && (
        <ul
          role="listbox"
          className="absolute z-50 mt-1 w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] shadow-lg overflow-hidden"
        >
          {suggestions.map((s, i) => (
            <li
              key={s.id}
              role="option"
              aria-selected={i === activeIndex}
              onMouseDown={() => handleSelect(s.name)}
              onMouseEnter={() => setActiveIndex(i)}
              className={`px-4 py-2.5 text-sm text-[var(--color-text-primary)] cursor-pointer transition-colors ${
                i === activeIndex
                  ? 'bg-[var(--color-surface-raised)]'
                  : 'hover:bg-[var(--color-surface-raised)]'
              }`}
            >
              {s.name}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

'use client'

import { useState, useRef, useEffect, useId } from 'react'

const MONTHS = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
] as const

const MONTH_FULL = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
] as const

interface DatePickerProps {
  value: string | null
  onChange: (value: string | null) => void
  label?: string
  placeholder?: string
  includeDay?: boolean
  /** When true, month is optional — user can select just a year and get "YYYY" */
  optionalMonth?: boolean
  minYear?: number
  maxYear?: number
  disabled?: boolean
  hint?: string
  error?: string
  /** Align dropdown to the right edge instead of left */
  alignRight?: boolean
}

function parseValue(value: string | null): { year: number | null; month: number | null; day: number | null } {
  if (!value) return { year: null, month: null, day: null }
  const parts = value.split('-')
  const year = parts[0] ? parseInt(parts[0], 10) : null
  const month = parts[1] ? parseInt(parts[1], 10) : null
  const day = parts[2] ? parseInt(parts[2], 10) : null
  return { year, month, day }
}

function formatDisplay(value: string | null, includeDay: boolean): string {
  if (!value) return ''
  const { year, month, day } = parseValue(value)
  if (!year) return ''
  if (!month) return `${year}`
  const monthLabel = MONTHS[month - 1]
  if (includeDay && day) return `${day} ${monthLabel} ${year}`
  return `${monthLabel} ${year}`
}

function buildValue(year: number | null, month: number | null, day: number | null, includeDay: boolean, optionalMonth: boolean): string | null {
  if (!year) return null
  if (!month) return optionalMonth ? `${year}` : null
  const m = String(month).padStart(2, '0')
  if (includeDay && day) {
    const d = String(day).padStart(2, '0')
    return `${year}-${m}-${d}`
  }
  return `${year}-${m}`
}

function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month, 0).getDate()
}

export function DatePicker({
  value,
  onChange,
  label,
  placeholder = 'Select date',
  includeDay = false,
  optionalMonth = false,
  minYear,
  maxYear,
  disabled = false,
  hint,
  error,
  alignRight = false,
}: DatePickerProps) {
  const reactId = useId()
  const [open, setOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  const currentYear = new Date().getFullYear()
  const resolvedMinYear = minYear ?? currentYear - 40
  const resolvedMaxYear = maxYear ?? currentYear + 10

  const parsed = parseValue(value)
  const [selYear, setSelYear] = useState<number | null>(parsed.year)
  const [selMonth, setSelMonth] = useState<number | null>(parsed.month)
  const [selDay, setSelDay] = useState<number | null>(parsed.day)

  // Sync internal state when value prop changes externally
  useEffect(() => {
    const p = parseValue(value)
    setSelYear(p.year)
    setSelMonth(p.month)
    setSelDay(p.day)
  }, [value])

  // Close on outside click
  useEffect(() => {
    if (!open) return
    function handleClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [open])

  const years: number[] = []
  for (let y = resolvedMaxYear; y >= resolvedMinYear; y--) {
    years.push(y)
  }

  const daysInMonth = selYear && selMonth ? getDaysInMonth(selYear, selMonth) : 31
  const days: number[] = []
  for (let d = 1; d <= daysInMonth; d++) {
    days.push(d)
  }

  function handleMonthSelect(month: number) {
    setSelMonth(month)
    const newVal = buildValue(selYear, month, selDay, includeDay, optionalMonth)
    if (newVal) onChange(newVal)
    if (!includeDay && selYear) setOpen(false)
  }

  function handleYearSelect(year: number) {
    setSelYear(year)
    const newVal = buildValue(year, selMonth, selDay, includeDay, optionalMonth)
    if (newVal) onChange(newVal)
    // If month is optional and not yet selected, close after year selection
    if (optionalMonth && !selMonth && !includeDay) setOpen(false)
    else if (!includeDay && selMonth) setOpen(false)
  }

  function handleDaySelect(day: number) {
    setSelDay(day)
    const newVal = buildValue(selYear, selMonth, day, includeDay, optionalMonth)
    if (newVal) {
      onChange(newVal)
      setOpen(false)
    }
  }

  function handleClear() {
    setSelYear(null)
    setSelMonth(null)
    setSelDay(null)
    onChange(null)
    setOpen(false)
  }

  const displayValue = formatDisplay(value, includeDay)

  return (
    <div className="flex flex-col gap-1.5" ref={containerRef}>
      {label && (
        <label
          htmlFor={reactId}
          className="text-sm font-medium text-[var(--color-text-primary)]"
        >
          {label}
        </label>
      )}

      <button
        id={reactId}
        type="button"
        disabled={disabled}
        onClick={() => setOpen(!open)}
        className={`
          h-12 w-full rounded-xl border px-4 text-sm text-left
          bg-[var(--color-surface)]
          focus:outline-none focus:ring-2
          transition-colors
          ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
          ${error
            ? 'border-[var(--color-error)] focus:border-[var(--color-error)] focus:ring-[var(--color-error)]/20'
            : 'border-[var(--color-border)] focus:border-[var(--color-interactive)] focus:ring-[var(--color-interactive)]/20'
          }
          ${displayValue ? 'text-[var(--color-text-primary)]' : 'text-[var(--color-text-tertiary)]'}
        `}
        aria-describedby={
          error ? `${reactId}-error` : hint ? `${reactId}-hint` : undefined
        }
        aria-invalid={error ? true : undefined}
      >
        {displayValue || placeholder}
      </button>

      {open && (
        <div className="relative z-50">
          <div className={`absolute top-1 ${alignRight ? 'right-0' : 'left-0'} min-w-[280px] bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl shadow-lg p-4 flex flex-col gap-3`}>
            {/* Month + Year row */}
            <div className={`grid gap-3 ${includeDay ? 'grid-cols-3' : 'grid-cols-2'}`}>
              {/* Day (optional) — first to match DD/MM/YYYY display */}
              {includeDay && (
                <div className="flex flex-col gap-1">
                  <span className="text-xs font-medium text-[var(--color-text-secondary)]">Day</span>
                  <select
                    value={selDay ?? ''}
                    onChange={(e) => handleDaySelect(Number(e.target.value))}
                    className="h-10 w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-2 text-sm text-[var(--color-text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-interactive)]/20"
                  >
                    <option value="" disabled>Day</option>
                    {days.map((d) => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>
                </div>
              )}

              {/* Month */}
              <div className="flex flex-col gap-1">
                <span className="text-xs font-medium text-[var(--color-text-secondary)]">Month</span>
                <select
                  value={selMonth ?? ''}
                  onChange={(e) => {
                    const val = e.target.value
                    if (val === '') {
                      // User cleared month (optionalMonth mode)
                      setSelMonth(null)
                      const newVal = buildValue(selYear, null, null, includeDay, optionalMonth)
                      if (newVal) onChange(newVal)
                    } else {
                      handleMonthSelect(Number(val))
                    }
                  }}
                  className="h-10 w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-2 text-sm text-[var(--color-text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-interactive)]/20"
                >
                  <option value="" disabled={!optionalMonth}>{optionalMonth ? '—' : 'Month'}</option>
                  {MONTH_FULL.map((m, i) => (
                    <option key={m} value={i + 1}>{m}</option>
                  ))}
                </select>
              </div>

              {/* Year */}
              <div className="flex flex-col gap-1">
                <span className="text-xs font-medium text-[var(--color-text-secondary)]">Year</span>
                <select
                  value={selYear ?? ''}
                  onChange={(e) => handleYearSelect(Number(e.target.value))}
                  className="h-10 w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-2 text-sm text-[var(--color-text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-interactive)]/20"
                >
                  <option value="" disabled>Year</option>
                  {years.map((y) => (
                    <option key={y} value={y}>{y}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Clear button */}
            {value && (
              <button
                type="button"
                onClick={handleClear}
                className="text-xs text-[var(--color-text-secondary)] hover:text-[var(--color-error)] transition-colors self-start"
              >
                Clear date
              </button>
            )}
          </div>
        </div>
      )}

      {error && (
        <p id={`${reactId}-error`} role="alert" className="text-xs text-[var(--color-error)]">
          {error}
        </p>
      )}

      {!error && hint && (
        <p id={`${reactId}-hint`} className="text-xs text-[var(--color-text-tertiary)]">
          {hint}
        </p>
      )}
    </div>
  )
}

'use client'

import { Input } from '@/components/ui'

interface ConflictInputProps {
  label: string
  value: string
  onChange: (v: string) => void
  oldValue?: string | null
  placeholder?: string
  type?: string
}

export function ConflictInput({
  label,
  value,
  onChange,
  oldValue,
  placeholder,
  type = 'text',
}: ConflictInputProps) {
  const hasConflict = oldValue && value !== oldValue

  return (
    <div>
      <Input
        label={label}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        type={type}
        className={hasConflict ? 'border-amber-300' : ''}
      />
      {hasConflict && (
        <p className="text-xs text-amber-600 mt-0.5">was: {oldValue}</p>
      )}
    </div>
  )
}

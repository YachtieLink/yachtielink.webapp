'use client'

import { useState, useRef, useEffect, useCallback } from 'react'

interface SavedProfileNoteEditorProps {
  initialNote: string | null
  onSave: (note: string) => void
}

export function SavedProfileNoteEditor({ initialNote, onSave }: SavedProfileNoteEditorProps) {
  const [value, setValue] = useState(initialNote ?? '')
  const [saved, setSaved] = useState(true)
  const timeoutRef = useRef<ReturnType<typeof setTimeout>>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // Auto-resize textarea
  useEffect(() => {
    const el = textareaRef.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = `${el.scrollHeight}px`
  }, [value])

  const debouncedSave = useCallback(
    (text: string) => {
      setSaved(false)
      if (timeoutRef.current) clearTimeout(timeoutRef.current)
      timeoutRef.current = setTimeout(() => {
        onSave(text)
        setSaved(true)
      }, 500)
    },
    [onSave],
  )

  function handleChange(e: React.ChangeEvent<HTMLTextAreaElement>) {
    const text = e.target.value
    setValue(text)
    debouncedSave(text)
  }

  function handleBlur() {
    if (timeoutRef.current) clearTimeout(timeoutRef.current)
    onSave(value)
    setSaved(true)
  }

  return (
    <div className="relative">
      <textarea
        ref={textareaRef}
        value={value}
        onChange={handleChange}
        onBlur={handleBlur}
        maxLength={2000}
        placeholder="Add a private note..."
        rows={2}
        className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-overlay)] p-2.5 text-xs text-[var(--color-text-primary)] placeholder:text-[var(--color-text-tertiary)] resize-none focus:outline-none focus:ring-1 focus:ring-[var(--color-interactive)]"
      />
      <div className="flex items-center justify-between mt-1">
        <span className="text-[10px] text-[var(--color-text-tertiary)]">
          {value.length}/2000
        </span>
        {!saved && (
          <span className="text-[10px] text-[var(--color-text-tertiary)]">Saving...</span>
        )}
      </div>
    </div>
  )
}

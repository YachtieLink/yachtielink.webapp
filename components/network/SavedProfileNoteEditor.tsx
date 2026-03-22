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
  // P2 fix: serialize saves — track the latest pending value and abort stale requests
  const latestValueRef = useRef(initialNote ?? '')
  const savingRef = useRef(false)

  // Auto-resize textarea
  useEffect(() => {
    const el = textareaRef.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = `${el.scrollHeight}px`
  }, [value])

  const doSave = useCallback(
    async (text: string) => {
      latestValueRef.current = text
      // If already saving, the in-flight save will check latestValueRef when done
      if (savingRef.current) return
      savingRef.current = true
      setSaved(false)

      let textToSave = text
      // Keep saving until latestValueRef matches what we just saved
      while (true) {
        onSave(textToSave)
        // Small yield to let any pending updates to latestValueRef land
        await new Promise((r) => setTimeout(r, 50))
        if (latestValueRef.current === textToSave) break
        textToSave = latestValueRef.current
      }

      savingRef.current = false
      setSaved(true)
    },
    [onSave],
  )

  const debouncedSave = useCallback(
    (text: string) => {
      latestValueRef.current = text
      setSaved(false)
      if (timeoutRef.current) clearTimeout(timeoutRef.current)
      timeoutRef.current = setTimeout(() => doSave(text), 500)
    },
    [doSave],
  )

  function handleChange(e: React.ChangeEvent<HTMLTextAreaElement>) {
    const text = e.target.value
    setValue(text)
    debouncedSave(text)
  }

  function handleBlur() {
    if (timeoutRef.current) clearTimeout(timeoutRef.current)
    doSave(value)
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

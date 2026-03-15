'use client'

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useToast } from '@/components/ui/Toast'
import { uploadCV } from '@/lib/storage/upload'

const ALLOWED_TYPES = [
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
]
const MAX_SIZE = 10 * 1024 * 1024

interface CvUploadClientProps {
  userId: string
}

export function CvUploadClient({ userId }: CvUploadClientProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [dragOver, setDragOver] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [parsing, setParsing] = useState(false)

  const processFile = useCallback(async (file: File) => {
    // Client-side validation
    if (!ALLOWED_TYPES.includes(file.type)) {
      toast('Only PDF or DOCX files are accepted', 'error')
      return
    }
    if (file.size > MAX_SIZE) {
      toast('File must be under 10 MB', 'error')
      return
    }

    // Upload to storage
    setUploading(true)
    const result = await uploadCV(userId, file)
    setUploading(false)

    if (!result.ok) {
      toast(result.error, 'error')
      return
    }

    // Parse via API
    setParsing(true)
    try {
      const res = await fetch('/api/cv/parse', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ storagePath: result.storagePath }),
      })

      if (res.status === 429) {
        toast('You can try again tomorrow.', 'error')
        setParsing(false)
        return
      }

      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        toast(body.error || 'Could not parse CV', 'error')
        setParsing(false)
        return
      }

      const { data } = await res.json()

      // Store parsed data in sessionStorage and navigate to review
      sessionStorage.setItem('cv_parsed_data', JSON.stringify(data))
      router.push('/app/cv/review')
    } catch {
      toast('Something went wrong. Try entering your details manually.', 'error')
      setParsing(false)
    }
  }, [userId, router, toast])

  function handleDrop(e: React.DragEvent) {
    e.preventDefault()
    setDragOver(false)
    const file = e.dataTransfer.files[0]
    if (file) processFile(file)
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) processFile(file)
  }

  const isProcessing = uploading || parsing

  return (
    <div className="p-4">
      <h1 className="text-xl font-semibold text-[var(--color-text-primary)] mb-2">
        Upload CV
      </h1>
      <p className="text-sm text-[var(--color-text-secondary)] mb-6">
        Upload your CV to automatically populate your profile. We accept PDF and DOCX files up to 10 MB.
      </p>

      {isProcessing ? (
        <div className="flex flex-col items-center justify-center gap-3 rounded-lg border-2 border-dashed border-[var(--color-border)] bg-[var(--color-surface-raised)] p-12">
          {/* Spinner */}
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-[var(--color-text-tertiary)] border-t-[var(--color-interactive)]" />
          <p className="text-sm font-medium text-[var(--color-text-primary)]">
            {uploading ? 'Uploading…' : 'Processing your CV…'}
          </p>
          <p className="text-xs text-[var(--color-text-tertiary)]">
            This may take a few seconds
          </p>
        </div>
      ) : (
        <label
          onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          className={`flex flex-col items-center justify-center gap-3 rounded-lg border-2 border-dashed p-12 cursor-pointer transition-colors ${
            dragOver
              ? 'border-[var(--color-interactive)] bg-[var(--color-surface-overlay)]'
              : 'border-[var(--color-border)] bg-[var(--color-surface-raised)] hover:border-[var(--color-interactive-muted)]'
          }`}
        >
          {/* Upload icon */}
          <svg className="h-10 w-10 text-[var(--color-text-tertiary)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
          </svg>
          <p className="text-sm font-medium text-[var(--color-text-primary)]">
            Drag & drop your CV here
          </p>
          <p className="text-xs text-[var(--color-text-tertiary)]">
            or tap to browse files
          </p>
          <p className="text-xs text-[var(--color-text-tertiary)]">
            PDF or DOCX · Max 10 MB
          </p>
          <input
            type="file"
            accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
            onChange={handleFileChange}
            className="hidden"
          />
        </label>
      )}

      <p className="mt-4 text-xs text-[var(--color-text-tertiary)] text-center">
        Prefer to enter your details manually?{' '}
        <a href="/app/profile" className="text-[var(--color-interactive)] hover:text-[var(--color-interactive-hover)]">
          Edit profile
        </a>
      </p>
    </div>
  )
}

'use client'

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui'
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

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export function CvUploadClient({ userId }: CvUploadClientProps) {
  const router = useRouter()
  const { toast } = useToast()
  const supabase = createClient()
  const [dragOver, setDragOver] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [uploaded, setUploaded] = useState<{ name: string; size: number; path: string } | null>(null)
  const [justUploading, setJustUploading] = useState(false)

  const processFile = useCallback(async (file: File) => {
    if (!ALLOWED_TYPES.includes(file.type)) {
      toast('Only PDF or DOCX files are accepted', 'error')
      return
    }
    if (file.size > MAX_SIZE) {
      toast('File must be under 10 MB', 'error')
      return
    }

    setUploading(true)
    const result = await uploadCV(userId, file)
    setUploading(false)

    if (!result.ok) {
      toast(result.error, 'error')
      return
    }

    setUploaded({ name: file.name, size: file.size, path: result.storagePath })
  }, [userId, toast])

  async function handleJustUpload() {
    if (!uploaded) return
    setJustUploading(true)
    await supabase.from('users').update({ cv_storage_path: uploaded.path }).eq('id', userId)
    toast('CV uploaded.', 'success')
    router.push('/app/cv')
  }

  function handleBuildProfile() {
    if (!uploaded) return
    router.push(`/app/cv/review?path=${encodeURIComponent(uploaded.path)}`)
  }

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

  // Post-upload: two-button split
  if (uploaded) {
    return (
      <div className="p-4 flex flex-col gap-4">
        <div className="flex items-center gap-3 bg-[var(--color-surface)] rounded-xl p-4 border border-green-200">
          <span className="text-green-600 text-lg">✓</span>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-[var(--color-text-primary)]">CV uploaded successfully</p>
            <p className="text-xs text-[var(--color-text-tertiary)] truncate">{uploaded.name} · {formatFileSize(uploaded.size)}</p>
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <Button onClick={handleBuildProfile} className="w-full" size="lg">
            Build my profile from this CV
          </Button>
          <p className="text-xs text-[var(--color-text-tertiary)] text-center">
            We&apos;ll read your CV and walk you through it section by section.
          </p>
        </div>

        <button
          onClick={handleJustUpload}
          disabled={justUploading}
          className="text-sm text-[var(--color-interactive)] hover:underline text-center"
        >
          {justUploading ? 'Saving...' : "Just upload, don't change my profile"}
        </button>

        <p className="mt-4 text-xs text-[var(--color-text-tertiary)] text-center">
          Prefer to enter your details manually?{' '}
          <a href="/app/profile" className="text-[var(--color-interactive)] hover:text-[var(--color-interactive-hover)]">
            Edit profile
          </a>
        </p>
      </div>
    )
  }

  return (
    <div className="p-4">
      <h1 className="text-xl font-semibold text-[var(--color-text-primary)] mb-2">
        Upload CV
      </h1>
      <p className="text-sm text-[var(--color-text-secondary)] mb-6">
        Upload your CV to automatically populate your profile. We accept PDF and DOCX files up to 10 MB.
      </p>

      {uploading ? (
        <div className="flex flex-col items-center justify-center gap-3 rounded-lg border-2 border-dashed border-[var(--color-border)] bg-[var(--color-surface-raised)] p-12">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-[var(--color-text-tertiary)] border-t-[var(--color-interactive)]" />
          <p className="text-sm font-medium text-[var(--color-text-primary)]">Uploading…</p>
          <p className="text-xs text-[var(--color-text-tertiary)]">This may take a few seconds</p>
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
          <svg className="h-10 w-10 text-[var(--color-text-tertiary)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
          </svg>
          <p className="text-sm font-medium text-[var(--color-text-primary)]">Drag & drop your CV here</p>
          <p className="text-xs text-[var(--color-text-tertiary)]">or tap to browse files</p>
          <p className="text-xs text-[var(--color-text-tertiary)]">PDF or DOCX · Max 10 MB</p>
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

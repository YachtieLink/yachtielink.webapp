'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Eye, EyeOff, StickyNote, Trash2, FolderInput, ExternalLink } from 'lucide-react'
import { SavedProfileNoteEditor } from './SavedProfileNoteEditor'

interface SavedProfileCardProps {
  saved: {
    id: string
    notes: string | null
    watching: boolean
    created_at: string
    folder_id: string | null
  }
  user: {
    id: string
    display_name: string | null
    full_name: string
    handle: string
    profile_photo_url: string | null
    primary_role: string | null
    departments: string[] | null
    location_country: string | null
  }
  isColleague: boolean
  topCerts: string[]
  folders: Array<{ id: string; name: string; emoji?: string | null }>
  onUpdate: (id: string, patch: Partial<{ notes: string | null; watching: boolean; folder_id: string | null }>) => void
  onUnsave: (id: string) => void
}

export function SavedProfileCard({
  saved,
  user,
  isColleague,
  topCerts,
  folders,
  onUpdate,
  onUnsave,
}: SavedProfileCardProps) {
  const [showNote, setShowNote] = useState(!!saved.notes)
  const [showFolderMenu, setShowFolderMenu] = useState(false)
  const displayName = user.display_name ?? user.full_name
  const subtitle = [user.primary_role, user.departments?.join(' · ')].filter(Boolean).join(' · ')

  return (
    <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4 flex flex-col gap-3">
      {/* Top row: photo + info */}
      <div className="flex gap-3">
        <Link href={`/u/${user.handle}`} className="shrink-0">
          {user.profile_photo_url ? (
            <div className="relative w-12 h-12 rounded-full overflow-hidden border border-[var(--color-border)]">
              <Image src={user.profile_photo_url} alt={displayName} fill className="object-cover" unoptimized />
            </div>
          ) : (
            <div className="w-12 h-12 rounded-full bg-[var(--color-surface-overlay)] flex items-center justify-center text-lg text-[var(--color-text-tertiary)]">
              {displayName.charAt(0)}
            </div>
          )}
        </Link>

        <div className="flex-1 min-w-0">
          <Link href={`/u/${user.handle}`} className="hover:underline">
            <p className="text-sm font-semibold text-[var(--color-text-primary)] truncate">{displayName}</p>
          </Link>
          {subtitle && (
            <p className="text-xs text-[var(--color-text-secondary)] truncate">{subtitle}</p>
          )}
          {user.location_country && (
            <p className="text-xs text-[var(--color-text-tertiary)]">{user.location_country}</p>
          )}
          {isColleague && (
            <p className="text-xs text-[var(--color-interactive)] font-medium mt-0.5">Colleague</p>
          )}
          {topCerts.length > 0 && (
            <p className="text-xs text-[var(--color-text-tertiary)] mt-0.5">{topCerts.join(' · ')}</p>
          )}
        </div>

        {/* Profile link */}
        <Link
          href={`/u/${user.handle}`}
          className="shrink-0 w-8 h-8 flex items-center justify-center rounded-lg text-[var(--color-text-tertiary)] hover:bg-[var(--color-surface-overlay)] transition-colors"
          aria-label="View profile"
        >
          <ExternalLink size={14} />
        </Link>
      </div>

      {/* Action row */}
      <div className="flex items-center gap-1 flex-wrap">
        {/* Note toggle */}
        <button
          onClick={() => setShowNote(!showNote)}
          className={`flex items-center gap-1 px-2 py-1 rounded-lg text-xs transition-colors ${
            saved.notes
              ? 'text-[var(--color-interactive)] bg-[var(--color-interactive)]/10'
              : 'text-[var(--color-text-tertiary)] hover:bg-[var(--color-surface-overlay)]'
          }`}
          aria-label="Notes"
        >
          <StickyNote size={12} />
          Note
        </button>

        {/* Watch toggle */}
        <button
          onClick={() => onUpdate(saved.id, { watching: !saved.watching })}
          className={`flex items-center gap-1 px-2 py-1 rounded-lg text-xs transition-colors ${
            saved.watching
              ? 'text-[var(--color-interactive)] bg-[var(--color-interactive)]/10'
              : 'text-[var(--color-text-tertiary)] hover:bg-[var(--color-surface-overlay)]'
          }`}
          aria-label={saved.watching ? 'Stop watching' : 'Watch for availability'}
        >
          {saved.watching ? <Eye size={12} /> : <EyeOff size={12} />}
          {saved.watching ? 'Watching' : 'Watch'}
        </button>

        {/* Folder move */}
        <div className="relative">
          <button
            onClick={() => setShowFolderMenu(!showFolderMenu)}
            className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs text-[var(--color-text-tertiary)] hover:bg-[var(--color-surface-overlay)] transition-colors"
            aria-label="Move to folder"
          >
            <FolderInput size={12} />
            Folder
          </button>
          {showFolderMenu && (
            <div className="absolute top-full left-0 mt-1 z-20 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-lg shadow-lg min-w-[140px]">
              <button
                onClick={() => { onUpdate(saved.id, { folder_id: null }); setShowFolderMenu(false) }}
                className={`w-full text-left px-3 py-2 text-xs hover:bg-[var(--color-surface-overlay)] ${
                  !saved.folder_id ? 'text-[var(--color-interactive)] font-medium' : 'text-[var(--color-text-primary)]'
                }`}
              >
                Unfiled
              </button>
              {folders.map((f) => (
                <button
                  key={f.id}
                  onClick={() => { onUpdate(saved.id, { folder_id: f.id }); setShowFolderMenu(false) }}
                  className={`w-full text-left px-3 py-2 text-xs hover:bg-[var(--color-surface-overlay)] ${
                    saved.folder_id === f.id ? 'text-[var(--color-interactive)] font-medium' : 'text-[var(--color-text-primary)]'
                  }`}
                >
                  {f.emoji ? `${f.emoji} ` : ''}{f.name}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Unsave */}
        <button
          onClick={() => onUnsave(saved.id)}
          className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs text-[var(--color-error)] hover:bg-[var(--color-error)]/10 transition-colors ml-auto"
          aria-label="Remove saved profile"
        >
          <Trash2 size={12} />
        </button>
      </div>

      {/* Note editor */}
      {showNote && (
        <SavedProfileNoteEditor
          initialNote={saved.notes}
          onSave={(note) => onUpdate(saved.id, { notes: note || null })}
        />
      )}
    </div>
  )
}

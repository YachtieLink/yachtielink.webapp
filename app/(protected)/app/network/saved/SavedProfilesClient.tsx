'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { BackButton } from '@/components/ui/BackButton'
import { EmptyState } from '@/components/ui/EmptyState'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'

interface SavedUser {
  id: string
  full_name: string
  display_name: string | null
  handle: string | null
  profile_photo_url: string | null
  primary_role: string | null
}

interface SavedProfile {
  id: string
  folder_id: string | null
  saved_user_id: string
  saved_user: SavedUser | null
}

interface Folder {
  id: string
  name: string
  emoji: string | null
}

interface Props {
  initialProfiles: SavedProfile[]
  initialFolders: Folder[]
}

export function SavedProfilesClient({ initialProfiles, initialFolders }: Props) {
  const [profiles, setProfiles] = useState(initialProfiles)
  const [folders, setFolders] = useState(initialFolders)
  const [activeFolder, setActiveFolder] = useState<string | null>(null)
  const [newFolderName, setNewFolderName] = useState('')
  const [showNewFolder, setShowNewFolder] = useState(false)

  async function unsave(savedUserId: string) {
    setProfiles((prev) => prev.filter((p) => p.saved_user_id !== savedUserId))
    await fetch('/api/saved-profiles', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ saved_user_id: savedUserId }),
    })
  }

  async function moveToFolder(profileId: string, folderId: string | null) {
    setProfiles((prev) =>
      prev.map((p) => (p.id === profileId ? { ...p, folder_id: folderId } : p))
    )
    await fetch(`/api/saved-profiles/${profileId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ folder_id: folderId }),
    })
  }

  async function createFolder() {
    const name = newFolderName.trim()
    if (!name) return
    const res = await fetch('/api/profile-folders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name }),
    })
    if (res.ok) {
      const { folder } = await res.json()
      setFolders((prev) => [...prev, folder])
      setNewFolderName('')
      setShowNewFolder(false)
    }
  }

  async function deleteFolder(folderId: string) {
    if (!confirm('Delete this folder? Profiles will be moved to "All".')) return
    // Move profiles out of this folder first
    setProfiles((prev) =>
      prev.map((p) => (p.folder_id === folderId ? { ...p, folder_id: null } : p))
    )
    setFolders((prev) => prev.filter((f) => f.id !== folderId))
    if (activeFolder === folderId) setActiveFolder(null)
    await fetch(`/api/profile-folders/${folderId}`, { method: 'DELETE' })
  }

  const filtered = activeFolder
    ? profiles.filter((p) => p.folder_id === activeFolder)
    : profiles

  if (profiles.length === 0) {
    return (
      <>
        <div className="flex items-center gap-3">
          <BackButton href="/app/network" />
          <h1 className="font-semibold text-lg text-[var(--color-text-primary)]">Saved Profiles</h1>
        </div>
        <EmptyState
          icon="🔖"
          title="No saved profiles yet"
          description="Tap the bookmark on any profile to save them here."
        />
      </>
    )
  }

  return (
    <>
      <div className="flex items-center gap-3">
        <BackButton href="/app/network" />
        <h1 className="font-semibold text-lg text-[var(--color-text-primary)]">Saved Profiles</h1>
        <span className="text-sm text-[var(--color-text-secondary)]">({profiles.length})</span>
      </div>

      {/* Folder filter pills */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        <button
          onClick={() => setActiveFolder(null)}
          className={`shrink-0 text-xs px-3 py-1.5 rounded-full font-medium transition-colors ${
            activeFolder === null
              ? 'bg-[var(--color-interactive)] text-white'
              : 'bg-[var(--color-surface-raised)] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]'
          }`}
        >
          All ({profiles.length})
        </button>
        {folders.map((f) => {
          const count = profiles.filter((p) => p.folder_id === f.id).length
          return (
            <button
              key={f.id}
              onClick={() => setActiveFolder(f.id)}
              className={`shrink-0 text-xs px-3 py-1.5 rounded-full font-medium transition-colors ${
                activeFolder === f.id
                  ? 'bg-[var(--color-interactive)] text-white'
                  : 'bg-[var(--color-surface-raised)] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]'
              }`}
            >
              {f.emoji ? `${f.emoji} ` : ''}{f.name} ({count})
            </button>
          )
        })}
        <button
          onClick={() => setShowNewFolder(!showNewFolder)}
          className="shrink-0 text-xs px-3 py-1.5 rounded-full font-medium bg-[var(--color-surface-raised)] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-colors"
        >
          + Folder
        </button>
      </div>

      {/* New folder input */}
      {showNewFolder && (
        <div className="flex gap-2">
          <Input
            value={newFolderName}
            onChange={(e) => setNewFolderName(e.target.value)}
            placeholder="Folder name"
            maxLength={50}
            onKeyDown={(e) => e.key === 'Enter' && createFolder()}
            className="flex-1"
          />
          <Button
            onClick={createFolder}
            size="sm"
          >
            Create
          </Button>
        </div>
      )}

      {/* Active folder actions */}
      {activeFolder && (
        <div className="flex justify-end">
          <Button
            variant="link"
            size="sm"
            onClick={() => deleteFolder(activeFolder)}
            className="text-xs text-[var(--color-error)]"
          >
            Delete folder
          </Button>
        </div>
      )}

      {/* Profile list */}
      <div className="flex flex-col gap-3">
        {filtered.map((entry) => {
          const u = entry.saved_user
          if (!u) return null
          const name = u.display_name ?? u.full_name
          return (
            <div key={entry.id} className="bg-[var(--color-surface)] rounded-2xl p-4 flex items-center gap-3">
              <Link href={`/u/${u.handle}`} className="w-11 h-11 rounded-full bg-[var(--color-surface-raised)] overflow-hidden shrink-0">
                {u.profile_photo_url ? (
                  <Image src={u.profile_photo_url} alt={name} width={44} height={44} className="object-cover w-full h-full" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-base font-semibold text-[var(--color-text-secondary)]">
                    {name[0]?.toUpperCase()}
                  </div>
                )}
              </Link>
              <Link href={`/u/${u.handle}`} className="min-w-0 flex-1">
                <p className="font-medium text-sm text-[var(--color-text-primary)] truncate">{name}</p>
                {u.primary_role && (
                  <p className="text-xs text-[var(--color-text-secondary)] truncate">{u.primary_role}</p>
                )}
              </Link>
              {/* Folder move dropdown */}
              {folders.length > 0 && (
                <Select
                  value={entry.folder_id ?? ''}
                  onChange={(e) => moveToFolder(entry.id, e.target.value || null)}
                  className="shrink-0 h-8 text-xs px-2"
                >
                  <option value="">No folder</option>
                  {folders.map((f) => (
                    <option key={f.id} value={f.id}>{f.emoji ? `${f.emoji} ` : ''}{f.name}</option>
                  ))}
                </Select>
              )}
              <button
                onClick={() => unsave(u.id)}
                className="shrink-0 text-xs text-[var(--color-text-secondary)] hover:text-[var(--color-error)] transition-colors px-2 py-1"
                aria-label="Unsave"
              >
                ✕
              </button>
            </div>
          )
        })}
        {filtered.length === 0 && activeFolder && (
          <EmptyState title="No profiles in this folder" variant="card" />
        )}
      </div>
    </>
  )
}

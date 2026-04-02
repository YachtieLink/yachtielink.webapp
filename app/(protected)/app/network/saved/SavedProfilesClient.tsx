'use client'

import { useState } from 'react'
import { PageHeader } from '@/components/ui/PageHeader'
import { EmptyState } from '@/components/ui/EmptyState'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { SavedProfileCard } from '@/components/network/SavedProfileCard'
import { SavedProfileFilters, type SortOption } from '@/components/network/SavedProfileFilters'
import { useToast } from '@/components/ui/Toast'

interface SavedUser {
  id: string
  full_name: string
  display_name: string | null
  handle: string
  profile_photo_url: string | null
  primary_role: string | null
  departments: string[] | null
  location_country: string | null
}

interface SavedProfile {
  id: string
  folder_id: string | null
  notes: string | null
  watching: boolean
  created_at: string
  saved_user: SavedUser | null
  isColleague: boolean
  topCerts: string[]
  seaTimeDays: number
  yachtCount: number
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
  const { toast } = useToast()
  const [profiles, setProfiles] = useState(initialProfiles)
  const [folders, setFolders] = useState(initialFolders)
  const [activeFolder, setActiveFolder] = useState<string | null>(null)
  const [sort, setSort] = useState<SortOption>('recent')
  const [watchingOnly, setWatchingOnly] = useState(false)
  const [newFolderName, setNewFolderName] = useState('')
  const [showNewFolder, setShowNewFolder] = useState(false)

  async function updateProfile(id: string, patch: Partial<{ notes: string | null; watching: boolean; folder_id: string | null }>) {
    const previous = profiles.find((p) => p.id === id)
    setProfiles((prev) =>
      prev.map((p) => (p.id === id ? { ...p, ...patch } : p))
    )
    try {
      const res = await fetch(`/api/saved-profiles/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(patch),
      })
      if (!res.ok) throw new Error()
    } catch {
      if (previous) {
        setProfiles((prev) =>
          prev.map((p) => (p.id === id ? previous : p))
        )
      }
      toast('Update failed', 'error')
    }
  }

  async function unsave(id: string) {
    const profile = profiles.find((p) => p.id === id)
    if (!profile?.saved_user) return
    const previousProfiles = profiles
    setProfiles((prev) => prev.filter((p) => p.id !== id))
    try {
      const res = await fetch('/api/saved-profiles', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ saved_user_id: profile.saved_user.id }),
      })
      if (!res.ok) throw new Error()
    } catch {
      setProfiles(previousProfiles)
      toast('Could not unsave', 'error')
    }
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
    const previousProfiles = profiles
    const previousFolders = folders
    const previousActiveFolder = activeFolder
    setProfiles((prev) =>
      prev.map((p) => (p.folder_id === folderId ? { ...p, folder_id: null } : p))
    )
    setFolders((prev) => prev.filter((f) => f.id !== folderId))
    if (activeFolder === folderId) setActiveFolder(null)
    try {
      const res = await fetch(`/api/profile-folders/${folderId}`, { method: 'DELETE' })
      if (!res.ok) throw new Error()
    } catch {
      setProfiles(previousProfiles)
      setFolders(previousFolders)
      setActiveFolder(previousActiveFolder)
      toast('Could not delete folder', 'error')
    }
  }

  // Apply filters
  let filtered = profiles
  if (activeFolder) filtered = filtered.filter((p) => p.folder_id === activeFolder)
  if (watchingOnly) filtered = filtered.filter((p) => p.watching)

  // Apply sort (client-side for name/role since we have all page data)
  if (sort === 'name') {
    filtered = [...filtered].sort((a, b) => {
      const nameA = (a.saved_user?.display_name ?? a.saved_user?.full_name ?? '').toLowerCase()
      const nameB = (b.saved_user?.display_name ?? b.saved_user?.full_name ?? '').toLowerCase()
      return nameA.localeCompare(nameB)
    })
  } else if (sort === 'role') {
    filtered = [...filtered].sort((a, b) => {
      const roleA = (a.saved_user?.primary_role ?? '').toLowerCase()
      const roleB = (b.saved_user?.primary_role ?? '').toLowerCase()
      return roleA.localeCompare(roleB)
    })
  }
  // 'recent' is already the default order from API

  if (profiles.length === 0) {
    return (
      <>
        <PageHeader backHref="/app/more" title="Saved Profiles" />
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
      <PageHeader backHref="/app/more" title="Saved Profiles" count={profiles.length} />

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
          <Button onClick={createFolder} size="sm">
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

      {/* Sort + filter */}
      <SavedProfileFilters
        sort={sort}
        onSortChange={setSort}
        watchingOnly={watchingOnly}
        onWatchingChange={setWatchingOnly}
      />

      {/* Profile cards */}
      <div className="flex flex-col gap-3">
        {filtered.map((entry) => {
          const u = entry.saved_user
          if (!u) return null
          return (
            <SavedProfileCard
              key={entry.id}
              saved={{
                id: entry.id,
                notes: entry.notes,
                watching: entry.watching,
                created_at: entry.created_at,
                folder_id: entry.folder_id,
              }}
              user={u}
              isColleague={entry.isColleague}
              topCerts={entry.topCerts}
              seaTimeDays={entry.seaTimeDays}
              yachtCount={entry.yachtCount}
              folders={folders}
              onUpdate={updateProfile}
              onUnsave={unsave}
            />
          )
        })}
        {filtered.length === 0 && (activeFolder || watchingOnly) && (
          <EmptyState title="No profiles match" variant="card" />
        )}
      </div>
    </>
  )
}

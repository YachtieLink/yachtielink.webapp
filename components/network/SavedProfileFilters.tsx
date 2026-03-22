'use client'

import { Eye } from 'lucide-react'

export type SortOption = 'recent' | 'name' | 'role'

interface SavedProfileFiltersProps {
  sort: SortOption
  onSortChange: (sort: SortOption) => void
  watchingOnly: boolean
  onWatchingChange: (watching: boolean) => void
}

export function SavedProfileFilters({
  sort,
  onSortChange,
  watchingOnly,
  onWatchingChange,
}: SavedProfileFiltersProps) {
  return (
    <div className="flex items-center gap-2 flex-wrap">
      <select
        value={sort}
        onChange={(e) => onSortChange(e.target.value as SortOption)}
        className="h-8 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-2 text-xs text-[var(--color-text-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--color-interactive)]"
      >
        <option value="recent">Recently saved</option>
        <option value="name">Name A–Z</option>
        <option value="role">Role</option>
      </select>

      <button
        onClick={() => onWatchingChange(!watchingOnly)}
        className={`flex items-center gap-1 h-8 px-3 rounded-lg border text-xs transition-colors ${
          watchingOnly
            ? 'border-[var(--color-interactive)] bg-[var(--color-interactive)]/10 text-[var(--color-interactive)]'
            : 'border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text-tertiary)] hover:bg-[var(--color-surface-overlay)]'
        }`}
      >
        <Eye size={12} />
        Watching only
      </button>
    </div>
  )
}

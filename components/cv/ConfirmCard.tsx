'use client'

import { useState } from 'react'
import { Button } from '@/components/ui'

interface ConfirmCardProps {
  title: string
  children: React.ReactNode
  editView?: React.ReactNode
  onConfirm: () => void
  confirmLabel?: string
  editLabel?: string
  loading?: boolean
}

export function ConfirmCard({
  title,
  children,
  editView,
  onConfirm,
  confirmLabel = 'Looks good',
  editLabel = 'Edit',
  loading = false,
}: ConfirmCardProps) {
  const [editing, setEditing] = useState(false)

  return (
    <div className="bg-[var(--color-surface)] rounded-2xl p-5 flex flex-col gap-3">
      <h2 className="text-base font-semibold text-[var(--color-text-primary)]">{title}</h2>

      {editing && editView ? (
        <>
          {editView}
          <Button onClick={() => setEditing(false)} className="w-full">
            Done
          </Button>
        </>
      ) : (
        <>
          {children}
          <div className="flex gap-2 mt-1">
            <Button onClick={onConfirm} loading={loading} className="flex-1">
              {confirmLabel}
            </Button>
            {editView && (
              <Button variant="secondary" onClick={() => setEditing(true)} className="flex-1">
                {editLabel}
              </Button>
            )}
          </div>
        </>
      )}
    </div>
  )
}

'use client'

import { X } from 'lucide-react'

interface SectionModalProps {
  title: string
  open: boolean
  onClose: () => void
  children: React.ReactNode
}

export function SectionModal({ title, open, onClose, children }: SectionModalProps) {
  if (!open) return null

  return (
    <div className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm flex items-stretch justify-center p-4 pb-[20vh]">
      <div className="relative w-full sm:max-w-[480px] bg-[var(--color-surface)] rounded-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--color-border-subtle)]">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-[var(--color-text-primary)]">
            {title}
          </h2>
          <button
            onClick={onClose}
            className="flex items-center justify-center w-8 h-8 rounded-full hover:bg-[var(--color-surface-raised)] transition-colors"
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>
        {/* Content */}
        <div className="flex-1 overflow-y-auto p-5">
          {children}
        </div>
      </div>
      {/* Click outside to close */}
      <div className="absolute inset-0 -z-10" onClick={onClose} />
    </div>
  )
}

'use client'

import { Share2 } from 'lucide-react'
import { SectionModal } from './SectionModal'

interface CvPreviewModalProps {
  open: boolean
  onClose: () => void
  handle: string
}

export function CvPreviewModal({ open, onClose, handle }: CvPreviewModalProps) {
  return (
    <SectionModal
      title="CV Preview"
      open={open}
      onClose={onClose}
      footer={
        <div className="flex gap-3">
          <a
            href={`/api/cv/public-download/${handle}`}
            download
            onClick={(e) => e.stopPropagation()}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-[var(--accent-500,#0f9b8e)] text-white text-sm font-semibold hover:opacity-90 transition-opacity"
          >
            Download CV
          </a>
          <button
            onClick={() => { navigator.clipboard.writeText(`https://yachtie.link/u/${handle}/cv`) }}
            className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-[var(--color-border)] text-sm font-medium text-[var(--color-text-primary)] hover:bg-[var(--color-surface-raised)] transition-colors"
          >
            <Share2 size={14} />
            Share
          </button>
        </div>
      }
    >
      <div className="h-full rounded-xl overflow-hidden bg-gray-100">
        <iframe src={`/api/cv/public-download/${handle}`} className="w-full h-full border-0" title="CV Preview" />
      </div>
    </SectionModal>
  )
}

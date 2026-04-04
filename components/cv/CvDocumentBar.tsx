'use client'

import Link from 'next/link'
import { Eye, Download, RefreshCw } from 'lucide-react'
import { StickyBottomBar } from '@/components/ui/StickyBottomBar'

interface CvDocumentBarProps {
  hasGeneratedPdf: boolean
  pdfStale: boolean
}

/**
 * Sticky document action bar for the CV tab.
 * Shows when a generated PDF exists — puts Preview/Download/Regenerate in thumb zone.
 */
export function CvDocumentBar({ hasGeneratedPdf, pdfStale }: CvDocumentBarProps) {
  return (
    <StickyBottomBar visible={hasGeneratedPdf}>
      <div className="flex items-center justify-between gap-2">
        <Link
          href="/app/cv/preview"
          className="flex items-center gap-1.5 text-sm font-medium text-[var(--color-interactive)] hover:underline"
        >
          <Eye size={14} />
          Preview
        </Link>

        <button
          type="button"
          onClick={async () => {
            try {
              const res = await fetch('/api/cv/download-pdf')
              if (!res.ok) throw new Error('Download failed')
              const { url } = await res.json()
              window.open(url, '_blank')
            } catch {
              // CvActions handles the full error UX — this is a quick shortcut
            }
          }}
          className="flex items-center gap-1.5 text-sm font-medium text-[var(--color-interactive)] hover:underline"
        >
          <Download size={14} />
          Download
        </button>

        <Link
          href="/app/cv#regenerate"
          className={`flex items-center gap-1.5 text-sm font-medium ${
            pdfStale
              ? 'text-[var(--color-amber-600)] font-semibold'
              : 'text-[var(--color-interactive)]'
          } hover:underline`}
        >
          <RefreshCw size={14} />
          {pdfStale ? 'Update CV' : 'Regenerate'}
        </Link>
      </div>
    </StickyBottomBar>
  )
}

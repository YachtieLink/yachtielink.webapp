'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Eye, Download, RefreshCw } from 'lucide-react'
import { StickyBottomBar } from '@/components/ui/StickyBottomBar'
import { useToast } from '@/components/ui/Toast'

interface CvDocumentBarProps {
  hasGeneratedPdf: boolean
  pdfStale: boolean
}

/**
 * Sticky document action bar for the CV tab.
 * Shows when a generated PDF exists — puts Preview/Download/Regenerate in thumb zone.
 */
export function CvDocumentBar({ hasGeneratedPdf, pdfStale }: CvDocumentBarProps) {
  const { toast } = useToast()
  const [downloading, setDownloading] = useState(false)

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
          disabled={downloading}
          onClick={async () => {
            setDownloading(true)
            try {
              const res = await fetch('/api/cv/download-pdf')
              if (!res.ok) {
                const body = await res.json().catch(() => ({}))
                throw new Error(body.error || 'Failed to get download link')
              }
              const { url } = await res.json()
              window.open(url, '_blank')
            } catch (err) {
              toast(err instanceof Error ? err.message : 'Could not download PDF', 'error')
            } finally {
              setDownloading(false)
            }
          }}
          className="flex items-center gap-1.5 text-sm font-medium text-[var(--color-interactive)] hover:underline disabled:opacity-50"
        >
          <Download size={14} />
          {downloading ? 'Loading...' : 'Download'}
        </button>

        <a
          href="#cv-actions"
          className={`flex items-center gap-1.5 text-sm font-medium ${
            pdfStale
              ? 'text-[var(--color-amber-700)] font-semibold'
              : 'text-[var(--color-interactive)]'
          } hover:underline`}
        >
          <RefreshCw size={14} />
          {pdfStale ? 'Update CV' : 'Regenerate'}
        </a>
      </div>
    </StickyBottomBar>
  )
}

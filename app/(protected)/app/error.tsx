'use client'

import { useEffect } from 'react'
import * as Sentry from '@sentry/nextjs'

export default function AppError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    Sentry.captureException(error)
  }, [error])

  return (
    <div className="flex flex-col items-center justify-center gap-4 px-6 py-20 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[var(--color-surface-raised)]">
        <span className="text-2xl">⚠</span>
      </div>
      <h2 className="text-lg font-semibold text-[var(--color-text-primary)]">
        Something went wrong
      </h2>
      <p className="text-sm text-[var(--color-text-secondary)] max-w-sm">
        We hit an unexpected error. Try refreshing, or go back and try again.
      </p>
      <button
        onClick={reset}
        className="rounded-xl bg-[var(--color-interactive)] px-6 py-2.5 text-sm font-semibold text-white hover:bg-[var(--color-interactive-hover)] transition-colors"
      >
        Try again
      </button>
    </div>
  )
}

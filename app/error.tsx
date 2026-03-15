'use client';

import * as Sentry from '@sentry/nextjs';
import { useEffect } from 'react';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 text-center">
      <h2 className="text-xl font-semibold mb-2 text-[var(--foreground)]">Something went wrong</h2>
      <p className="text-[var(--muted-foreground)] mb-6">We&apos;ve been notified and are looking into it.</p>
      <button
        onClick={reset}
        className="px-4 py-2 bg-[var(--foreground)] text-[var(--background)] rounded-lg text-sm"
      >
        Try again
      </button>
    </div>
  );
}

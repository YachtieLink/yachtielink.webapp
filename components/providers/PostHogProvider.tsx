'use client'

import { useEffect } from 'react'
import { usePathname } from 'next/navigation'

export function PostHogProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()

  useEffect(() => {
    // Skip PostHog on auth pages and non-page routes
    if (pathname.startsWith('/api') || pathname.startsWith('/_next')) return

    // Dynamic import — only loads the bundle when needed
    import('posthog-js').then((posthog) => {
      if (!posthog.default.__loaded) {
        posthog.default.init(process.env.NEXT_PUBLIC_POSTHOG_KEY!, {
          api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST || 'https://us.i.posthog.com',
          capture_pageview: false,
          capture_pageleave: true,
          persistence: 'localStorage',
          autocapture: false, // manual events only — less noise
        })
      }
      posthog.default.capture('$pageview')
    })
  }, [pathname])

  return <>{children}</>
}

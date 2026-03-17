'use client'

import { useState, useEffect } from 'react'

/**
 * Client-side hook that fetches the network badge count.
 * Runs once on mount, then refreshes every 60 seconds.
 * This keeps the badge count out of the layout's server render,
 * so the app shell (nav + sidebar) renders instantly.
 */
export function useNetworkBadge() {
  const [count, setCount] = useState(0)

  useEffect(() => {
    let mounted = true

    async function fetchCount() {
      try {
        const res = await fetch('/api/badge-count')
        if (res.ok && mounted) {
          const data = await res.json()
          setCount(data.count ?? 0)
        }
      } catch {
        // fail silent — badge is non-critical
      }
    }

    fetchCount()
    const interval = setInterval(fetchCount, 60_000)

    return () => {
      mounted = false
      clearInterval(interval)
    }
  }, [])

  return count
}

'use client'

import { useState, useEffect } from 'react'

/**
 * Client-side hook that fetches the network badge count.
 * Runs once on mount, then refreshes every 5 minutes with random jitter
 * to prevent thundering herd (all users polling simultaneously).
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
    // 5 minute base interval + 0-60s random jitter to spread load
    const jitter = Math.random() * 60_000
    const interval = setInterval(fetchCount, 300_000 + jitter)

    return () => {
      mounted = false
      clearInterval(interval)
    }
  }, [])

  return count
}

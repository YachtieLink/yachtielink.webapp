'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

/**
 * Listens for auth state changes (sign out, token refresh, user update)
 * and syncs the browser state with the server.
 *
 * Without this, a user who gets signed out server-side (session expired,
 * password changed, admin action) continues seeing a stale UI until
 * they manually refresh the page.
 *
 * Also handles cross-tab sync — if a user signs out in one tab,
 * all other tabs redirect to /welcome.
 */
export function AuthStateListener() {
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event) => {
        if (event === 'SIGNED_OUT') {
          // Session expired or user signed out (possibly in another tab)
          router.push('/welcome')
        }
        if (event === 'TOKEN_REFRESHED' || event === 'USER_UPDATED') {
          // Refresh server state to pick up new cookies
          router.refresh()
        }
      }
    )

    return () => subscription.unsubscribe()
  }, [supabase, router])

  return null
}

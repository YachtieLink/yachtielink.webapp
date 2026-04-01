import { cache } from 'react'
import { createClient } from '@/lib/supabase/server'

export type GhostProfileSummary = {
  id: string
  full_name: string
  primary_role: string | null
  verified_via: 'email_token' | 'whatsapp_token' | 'unverified'
  endorsement_count: number
}

/**
 * Fetch a ghost profile summary by ID via SECURITY DEFINER RPC.
 * Returns null if the ghost does not exist or has already been claimed.
 * Cached per request — safe to call from multiple server components.
 */
export const getGhostProfileSummary = cache(async (id: string): Promise<GhostProfileSummary | null> => {
  const supabase = await createClient()
  const { data, error } = await supabase.rpc('get_ghost_profile_summary', { p_id: id })

  if (error || !data) return null

  return data as GhostProfileSummary
})

/**
 * Ghost-to-real merge helpers.
 *
 * The core claim logic lives in the claim_ghost_profile() Supabase RPC
 * (migration 20260401000002). Identity is resolved inside the RPC from
 * auth.uid() — no caller-supplied identity is accepted.
 */

import { createClient } from '@/lib/supabase/server'

export type ClaimResult = {
  migrated_count: number
  ghost_ids_claimed: string[]
}

/**
 * Claim all ghost profiles matching the authenticated user's verified email.
 *
 * The RPC resolves identity from auth.uid() and fetches the email from
 * auth.users internally — this call passes no identity parameters.
 *
 * Atomically:
 *   1. Finds unclaimed ghosts with matching email
 *   2. Migrates their endorsements to the real user account
 *   3. Marks ghosts as claimed
 *   4. Sets onboarding_complete = true on the user record
 *
 * Returns { migrated_count, ghost_ids_claimed }.
 * Returns a zero-count result if no matching ghosts were found (idempotent).
 *
 * Throws if the RPC call fails.
 */
export async function claimGhostProfile(): Promise<ClaimResult> {
  const supabase = await createClient()

  const { data, error } = await supabase.rpc('claim_ghost_profile')

  if (error) {
    throw new Error(`claim_ghost_profile failed: ${error.message}`)
  }

  return data as ClaimResult
}

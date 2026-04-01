import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { handleApiError } from '@/lib/api/errors'

type ClaimResult = {
  migrated_count: number
  ghost_ids_claimed: string[]
}

/**
 * POST /api/ghost-profiles/claim
 *
 * Requires authentication with a confirmed email.
 * Calls the claim_ghost_profile() RPC which resolves identity internally
 * from auth.uid() — no caller-supplied identity trusted.
 *
 * The RPC:
 *   - Fetches the user's email from auth.users (not from this request)
 *   - Finds all unclaimed ghost profiles matching that email
 *   - Migrates their endorsements to the real user account
 *   - Marks ghosts as claimed
 *   - Sets onboarding_complete = true (bypasses the wizard for claimers)
 *
 * Returns { migrated_count, ghost_ids_claimed }.
 * Returns 200 even if no ghosts were found (idempotent).
 */
export async function POST(_req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Require a verified email — unconfirmed accounts must not claim ghost endorsements
    if (!user.email_confirmed_at) {
      return NextResponse.json(
        { error: 'Please verify your email address before claiming a profile.' },
        { status: 403 }
      )
    }

    // RPC resolves identity from auth.uid() internally — no params passed
    const { data, error } = await supabase.rpc('claim_ghost_profile')

    if (error) {
      console.error('claim_ghost_profile RPC error:', error)
      return NextResponse.json({ error: 'Failed to claim profile.' }, { status: 500 })
    }

    const result = data as ClaimResult

    return NextResponse.json({ result }, { status: 200 })
  } catch (err) {
    return handleApiError(err)
  }
}

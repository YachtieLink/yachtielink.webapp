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
 * Requires authentication. Calls the claim_ghost_profile RPC which:
 *   - Finds all unclaimed ghost profiles matching the user's verified email
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

    if (!user.email) {
      return NextResponse.json({ error: 'Account has no verified email.' }, { status: 400 })
    }

    const { data, error } = await supabase.rpc('claim_ghost_profile', {
      p_claiming_user_id: user.id,
      p_claiming_email:   user.email,
    })

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

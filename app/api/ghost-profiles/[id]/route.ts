import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { handleApiError } from '@/lib/api/errors'

type GhostProfileSummary = {
  id: string
  full_name: string
  primary_role: string | null
  verified_via: 'email_token' | 'whatsapp_token' | 'unverified'
  endorsement_count: number
}

/**
 * GET /api/ghost-profiles/[id]
 *
 * Returns a minimal public summary of a ghost profile for the claim landing page.
 * No PII (email/phone) is returned. Returns 404 if the ghost is already claimed
 * or does not exist.
 */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const supabase = await createClient()
    const { data, error } = await supabase.rpc('get_ghost_profile_summary', { p_id: id })

    if (error) {
      return NextResponse.json({ error: 'Failed to load profile.' }, { status: 500 })
    }

    if (!data) {
      return NextResponse.json({ error: 'Profile not found or already claimed.' }, { status: 404 })
    }

    const summary = data as GhostProfileSummary

    return NextResponse.json({ profile: summary })
  } catch (err) {
    return handleApiError(err)
  }
}

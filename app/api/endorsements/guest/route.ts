import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/admin'
import { validateBody } from '@/lib/validation/validate'
import { guestEndorsementSchema } from '@/lib/ghost/schemas'
import { applyRateLimit } from '@/lib/rate-limit/helpers'
import { moderateText } from '@/lib/ai/moderation'
import { trackServerEvent } from '@/lib/analytics/server'
import { handleApiError } from '@/lib/api/errors'

// Shape returned by get_endorsement_request_by_token (updated in migration 003)
type EndorsementRequestRow = {
  id: string
  token: string
  requester_id: string
  yacht_id: string
  recipient_email: string | null
  recipient_phone: string | null
  recipient_user_id: string | null
  sent_via: string | null
  suggested_endorsements: unknown[] | null
  status: string
  expires_at: string
  accepted_at: string | null
  cancelled_at: string | null
  requester: { display_name: string | null; full_name: string | null } | null
  yacht: { id: string; name: string } | null
}

/**
 * POST /api/endorsements/guest
 *
 * No authentication required. Validates an endorsement request token,
 * creates (or reuses) a ghost_profile, inserts an endorsement with
 * ghost_endorser_id set, and marks the request as accepted.
 *
 * Trust gate: the token is a 32-byte hex secret. Possession of the token
 * proves the recipient received the specific request. The coworker gate is
 * intentionally bypassed for ghost endorsements.
 *
 * Rate limited: 10 endorsements per hour per IP (fail-open).
 */
export async function POST(req: NextRequest) {
  try {
    // ── 1. IP rate limit (ghostEndorsement: 10/1h/IP, fail-open) ─────────────
    const limited = await applyRateLimit(req, 'ghostEndorsement')
    if (limited) return limited

    // ── 2. Validate body ──────────────────────────────────────────────────────
    const result = await validateBody(req, guestEndorsementSchema)
    if ('error' in result) return result.error
    const { token, content, endorser_name, endorser_role, endorser_email } = result.data

    // ── 3. Look up endorsement request by token (SECURITY DEFINER RPC) ────────
    const supabase = await createClient()
    const { data: rawRequest, error: reqError } = await supabase.rpc(
      'get_endorsement_request_by_token',
      { p_token: token }
    )

    if (reqError || !rawRequest) {
      return NextResponse.json({ error: 'Invalid or expired link.' }, { status: 404 })
    }

    const request = rawRequest as EndorsementRequestRow

    // ── 4. Validate request state ─────────────────────────────────────────────
    if (request.cancelled_at || request.status === 'cancelled') {
      return NextResponse.json({ error: 'This endorsement request was cancelled.' }, { status: 410 })
    }
    if (request.status === 'accepted') {
      return NextResponse.json(
        { error: 'You have already submitted this endorsement.', code: 'already_submitted' },
        { status: 409 }
      )
    }
    if (new Date(request.expires_at) < new Date()) {
      return NextResponse.json(
        { error: 'This link has expired. Ask the sender to send a new request.', code: 'expired' },
        { status: 410 }
      )
    }

    // ── 5. Block if recipient already belongs to a real user ──────────────────
    // Uses admin client to prevent account enumeration via anon RLS leaks.
    const admin = createServiceClient()
    const recipientEmail = request.recipient_email
    const recipientPhone = request.recipient_phone
    const sentVia = request.sent_via

    if (recipientEmail) {
      const { data: existingUser } = await admin
        .from('users')
        .select('id')
        .eq('email', recipientEmail)
        .single()
      if (existingUser) {
        return NextResponse.json(
          {
            error: 'An account with this email already exists. Please sign in to write this endorsement.',
            code: 'user_exists',
          },
          { status: 409 }
        )
      }
    }

    // Phone dedup: catch existing users contacted via WhatsApp
    if (recipientPhone) {
      const { data: existingUser } = await admin
        .from('users')
        .select('id')
        .eq('phone', recipientPhone)
        .single()
      if (existingUser) {
        return NextResponse.json(
          {
            error: 'An account with this phone number already exists. Please sign in to write this endorsement.',
            code: 'user_exists',
          },
          { status: 409 }
        )
      }
    }

    // ── 6. Determine ghost contact info + verified_via ─────────────────────────
    const verifiedVia: 'email_token' | 'whatsapp_token' | 'unverified' =
      sentVia === 'email'          ? 'email_token'    :
      sentVia === 'whatsapp'       ? 'whatsapp_token' :
                                     'unverified'

    // For shareable links: email provided by the user in the form (unverified)
    // For token-based requests: use the pre-verified contact from the request
    const ghostEmail = sentVia === 'shareable_link' ? (endorser_email ?? null) : recipientEmail
    const ghostPhone = sentVia === 'whatsapp'       ? recipientPhone            : null

    // ── 7. Content moderation ─────────────────────────────────────────────────
    const moderation = await moderateText(content)
    if (moderation.flagged) {
      trackServerEvent('ghost', 'moderation.flagged', {
        context: 'ghost_endorsement.create',
        categories: moderation.categories,
      })
      return NextResponse.json(
        { error: 'Your endorsement was flagged as potentially inappropriate. Please revise it.' },
        { status: 422 }
      )
    }

    // ── 8. Create or reuse ghost profile (admin client bypasses RLS) ──────────
    let ghostId: string

    if (ghostEmail) {
      const { data: existing, error: findError } = await admin
        .from('ghost_profiles')
        .select('id')
        .eq('email', ghostEmail)
        .single()

      // PGRST116 = no rows — not a real error here
      if (findError && findError.code !== 'PGRST116') {
        return NextResponse.json({ error: 'Internal error.' }, { status: 500 })
      }

      if (existing) {
        ghostId = existing.id
        // Refresh name/role from the latest submission
        await admin
          .from('ghost_profiles')
          .update({ full_name: endorser_name, primary_role: endorser_role || null })
          .eq('id', ghostId)
      } else {
        const { data: created, error: createError } = await admin
          .from('ghost_profiles')
          .insert({
            full_name:    endorser_name,
            email:        ghostEmail,
            phone:        ghostPhone,
            primary_role: endorser_role || null,
            verified_via: verifiedVia,
          })
          .select('id')
          .single()

        if (createError || !created) {
          console.error('Ghost profile create error:', createError)
          return NextResponse.json({ error: 'Failed to create profile.' }, { status: 500 })
        }
        ghostId = created.id
      }
    } else if (ghostPhone) {
      const { data: existing, error: findError } = await admin
        .from('ghost_profiles')
        .select('id')
        .eq('phone', ghostPhone)
        .single()

      if (findError && findError.code !== 'PGRST116') {
        return NextResponse.json({ error: 'Internal error.' }, { status: 500 })
      }

      if (existing) {
        ghostId = existing.id
        await admin
          .from('ghost_profiles')
          .update({ full_name: endorser_name, primary_role: endorser_role || null })
          .eq('id', ghostId)
      } else {
        const { data: created, error: createError } = await admin
          .from('ghost_profiles')
          .insert({
            full_name:    endorser_name,
            phone:        ghostPhone,
            primary_role: endorser_role || null,
            verified_via: verifiedVia,
          })
          .select('id')
          .single()

        if (createError || !created) {
          console.error('Ghost profile create error (phone):', createError)
          return NextResponse.json({ error: 'Failed to create profile.' }, { status: 500 })
        }
        ghostId = created.id
      }
    } else {
      // No contact info (shareable link with no email provided)
      const { data: created, error: createError } = await admin
        .from('ghost_profiles')
        .insert({
          full_name:    endorser_name,
          primary_role: endorser_role || null,
          verified_via: 'unverified',
        })
        .select('id')
        .single()

      if (createError || !created) {
        console.error('Ghost profile create error (no contact):', createError)
        return NextResponse.json({ error: 'Failed to create profile.' }, { status: 500 })
      }
      ghostId = created.id
    }

    // ── 8b. Self-endorsement guard ─────────────────────────────────────────
    // Prevent users from endorsing themselves via the ghost flow.
    {
      const { data: requester } = await admin
        .from('users')
        .select('email, phone')
        .eq('id', request.requester_id)
        .single()
      if (requester) {
        const isSelf =
          (ghostEmail && requester.email === ghostEmail) ||
          (ghostPhone && requester.phone === ghostPhone)
        if (isSelf) {
          return NextResponse.json(
            { error: 'You cannot endorse yourself.', code: 'self_endorsement' },
            { status: 422 }
          )
        }
      }
    }

    // ── 9. Insert endorsement with ghost_endorser_id ──────────────────────────
    // Uses admin client to bypass the coworker RLS policy.
    // The token is the trust mechanism — the requester vouched for the relationship.
    const { data: endorsement, error: insertError } = await admin
      .from('endorsements')
      .insert({
        endorser_id:       null,
        ghost_endorser_id: ghostId,
        recipient_id:      request.requester_id, // crew member receiving the endorsement
        yacht_id:          request.yacht_id,
        content,
        endorser_role_label: endorser_role || null,
      })
      .select('id')
      .single()

    if (insertError) {
      if (insertError.code === '23505') {
        return NextResponse.json(
          { error: 'You have already endorsed this person for this yacht.', code: 'already_submitted' },
          { status: 409 }
        )
      }
      console.error('Ghost endorsement insert error:', insertError)
      return NextResponse.json({ error: 'Failed to save endorsement.' }, { status: 500 })
    }

    // ── 10. Mark request as accepted ──────────────────────────────────────────
    await admin
      .from('endorsement_requests')
      .update({ status: 'accepted', accepted_at: new Date().toISOString() })
      .eq('token', token)

    trackServerEvent(ghostId, 'ghost_endorsement.created', {
      recipient_id: request.requester_id,
      yacht_id:     request.yacht_id,
    })

    return NextResponse.json({ ghost_id: ghostId, endorsement_id: endorsement.id }, { status: 201 })
  } catch (err) {
    return handleApiError(err)
  }
}

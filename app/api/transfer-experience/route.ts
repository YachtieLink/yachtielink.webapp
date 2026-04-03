import { NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { handleApiError } from '@/lib/api/errors'
import { recalculateEndorsementDormancy } from '@/lib/endorsements/visibility'
import { rebuildColleagueConnections } from '@/lib/network/colleague-rebuild'

const transferSchema = z.object({
  employment_id: z.string().uuid(),
  to_yacht_id: z.string().uuid(),
})

export async function POST(req: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const parsed = transferSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid request', details: parsed.error.flatten() },
        { status: 400 },
      )
    }

    const { employment_id, to_yacht_id } = parsed.data

    // 1. Verify user owns this employment record
    const { data: attachment, error: attErr } = await supabase
      .from('attachments')
      .select('id, user_id, yacht_id')
      .eq('id', employment_id)
      .is('deleted_at', null)
      .single()

    if (attErr || !attachment) {
      return NextResponse.json({ error: 'Employment record not found' }, { status: 404 })
    }

    if (attachment.user_id !== user.id) {
      return NextResponse.json({ error: 'Not your employment record' }, { status: 403 })
    }

    const from_yacht_id = attachment.yacht_id

    if (from_yacht_id === to_yacht_id) {
      return NextResponse.json({ error: 'Source and destination yacht are the same' }, { status: 400 })
    }

    // 2. Verify destination yacht exists
    const { data: destYacht, error: yachtErr } = await supabase
      .from('yachts')
      .select('id')
      .eq('id', to_yacht_id)
      .single()

    if (yachtErr || !destYacht) {
      return NextResponse.json({ error: 'Destination yacht not found' }, { status: 404 })
    }

    // 2b. Check for duplicate attachment on destination yacht
    const { count: existingCount } = await supabase
      .from('attachments')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('yacht_id', to_yacht_id)
      .is('deleted_at', null)

    if ((existingCount ?? 0) > 0) {
      return NextResponse.json(
        { error: 'You already have an employment record on this yacht' },
        { status: 400 },
      )
    }

    // 3. Move employment attachment to new yacht
    const { error: updateErr } = await supabase
      .from('attachments')
      .update({ yacht_id: to_yacht_id })
      .eq('id', employment_id)

    if (updateErr) {
      return NextResponse.json({ error: 'Failed to transfer employment' }, { status: 500 })
    }

    // 4. Log the transfer in experience_transfers for audit
    const { data: transfer, error: logErr } = await supabase
      .from('experience_transfers')
      .insert({
        employment_id,
        user_id: user.id,
        from_yacht_id,
        to_yacht_id,
      })
      .select('id')
      .single()

    const auditLogged = !logErr
    if (logErr) {
      console.error('[transfer-experience] Audit log failed:', logErr)
    }

    // 5. Recalculate endorsement dormancy
    const dormancyResult = await recalculateEndorsementDormancy(user.id)

    // 6. Rebuild colleague connections (revalidate cached pages)
    rebuildColleagueConnections()

    return NextResponse.json({
      success: true,
      transfer_id: transfer?.id ?? null,
      audit_logged: auditLogged,
      from_yacht_id,
      to_yacht_id,
      endorsements_made_dormant: dormancyResult.madeDormant,
      endorsements_reactivated: dormancyResult.madeActive,
    })
  } catch (err) {
    return handleApiError(err)
  }
}

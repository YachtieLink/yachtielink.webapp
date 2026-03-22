import { NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'

const transferSchema = z.object({
  attachmentId: z.string().uuid(),
  toYachtId: z.string().uuid(),
  cascadeEndorsements: z.boolean().default(true),
  reason: z.string().max(500).nullable().optional(),
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
        { status: 400 }
      )
    }

    const { attachmentId, toYachtId, cascadeEndorsements, reason } = parsed.data

    const { data, error } = await supabase.rpc('transfer_attachment', {
      p_attachment_id: attachmentId,
      p_to_yacht_id: toYachtId,
      p_cascade_endorsements: cascadeEndorsements,
      p_reason: reason ?? null,
    })

    if (error) {
      console.error('[transfer] RPC error:', error)
      return NextResponse.json({ error: 'Transfer failed' }, { status: 500 })
    }

    const result = data as {
      success: boolean
      error?: string
      message?: string
      transfer_id?: string
      endorsements_moved?: number
      endorsements_skipped?: number
      requests_moved?: number
      skipped_endorsement_ids?: string[]
    }

    if (!result.success) {
      return NextResponse.json(
        { error: result.error, message: result.message },
        { status: 400 }
      )
    }

    return NextResponse.json(result)
  } catch (err) {
    console.error('[transfer] Unexpected error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

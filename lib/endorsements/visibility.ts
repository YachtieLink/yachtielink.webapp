import { createServiceClient } from '@/lib/supabase/admin'

/**
 * Recalculate `is_dormant` for every endorsement involving a given user.
 *
 * An endorsement is dormant when endorser and recipient no longer both have
 * active (non-deleted) attachments on the endorsement's yacht. The shared
 * yacht attachment IS the proof that two people worked together — without it,
 * the endorsement is hidden but not deleted.
 *
 * Call this after any experience transfer that changes yacht_id on an attachment.
 */
export async function recalculateEndorsementDormancy(userId: string): Promise<{
  updated: number
  madeDormant: number
  madeActive: number
}> {
  const supabase = createServiceClient()

  // 1. Get all endorsements involving this user (as endorser OR recipient)
  const { data: endorsements, error: endErr } = await supabase
    .from('endorsements')
    .select('id, endorser_id, recipient_id, yacht_id, is_dormant')
    .or(`endorser_id.eq.${userId},recipient_id.eq.${userId}`)
    .is('deleted_at', null)

  if (endErr || !endorsements || endorsements.length === 0) {
    return { updated: 0, madeDormant: 0, madeActive: 0 }
  }

  if (endorsements.length > 100) {
    console.warn('[dormancy] High endorsement count for user', userId, ':', endorsements.length)
  }

  // 2. Collect all unique (user_id, yacht_id) pairs we need to verify
  const pairsToCheck = new Set<string>()
  for (const e of endorsements) {
    if (e.endorser_id) pairsToCheck.add(`${e.endorser_id}:${e.yacht_id}`)
    pairsToCheck.add(`${e.recipient_id}:${e.yacht_id}`)
  }

  // 3. Get all relevant yacht IDs and user IDs
  const yachtIds = [...new Set(endorsements.map((e) => e.yacht_id))]
  const userIds = [...new Set(
    endorsements.flatMap((e) => [e.endorser_id, e.recipient_id].filter(Boolean) as string[])
  )]

  // 4. Fetch active attachments for these users on these yachts
  const { data: attachments } = await supabase
    .from('attachments')
    .select('user_id, yacht_id')
    .in('user_id', userIds)
    .in('yacht_id', yachtIds)
    .is('deleted_at', null)

  // 5. Build a lookup set of valid (user_id, yacht_id) pairs
  const activeAttachments = new Set<string>()
  for (const att of attachments ?? []) {
    activeAttachments.add(`${att.user_id}:${att.yacht_id}`)
  }

  // 6. Determine dormancy for each endorsement
  let madeDormant = 0
  let madeActive = 0
  const toMakeDormant: string[] = []
  const toMakeActive: string[] = []

  for (const e of endorsements) {
    // Ghost endorsements (no endorser_id) — check only recipient attachment
    const endorserOnYacht = e.endorser_id
      ? activeAttachments.has(`${e.endorser_id}:${e.yacht_id}`)
      : true
    const recipientOnYacht = activeAttachments.has(`${e.recipient_id}:${e.yacht_id}`)
    const shouldBeDormant = !(endorserOnYacht && recipientOnYacht)

    const currentlyDormant = e.is_dormant === true

    if (shouldBeDormant && !currentlyDormant) {
      toMakeDormant.push(e.id)
      madeDormant++
    } else if (!shouldBeDormant && currentlyDormant) {
      toMakeActive.push(e.id)
      madeActive++
    }
  }

  // 7. Batch update dormant endorsements
  if (toMakeDormant.length > 0) {
    await supabase
      .from('endorsements')
      .update({ is_dormant: true })
      .in('id', toMakeDormant)
  }

  if (toMakeActive.length > 0) {
    await supabase
      .from('endorsements')
      .update({ is_dormant: false })
      .in('id', toMakeActive)
  }

  return {
    updated: madeDormant + madeActive,
    madeDormant,
    madeActive,
  }
}

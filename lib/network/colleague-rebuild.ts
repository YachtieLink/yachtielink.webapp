import { revalidatePath } from 'next/cache'

/**
 * Trigger colleague connection refresh after an experience transfer.
 *
 * The `get_colleagues` RPC dynamically computes colleagues from shared yacht
 * attachments — there's no materialized table to update. After a transfer
 * changes an attachment's yacht_id, the RPC will automatically return updated
 * results on the next call.
 *
 * This function revalidates the cached pages that display colleague data so
 * they pick up the changes immediately.
 */
export function rebuildColleagueConnections(): void {
  revalidatePath('/app/network', 'page')
  revalidatePath('/app/network/colleagues', 'page')
  revalidatePath('/app/profile', 'page')
}

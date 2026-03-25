/** Shared helper for sending endorsement requests via the API */

export interface SendRequestParams {
  yacht_id: string
  yacht_name: string
  recipient_user_id?: string
  recipient_email?: string
  recipient_phone?: string
}

export interface SendRequestResult {
  ok: boolean
  skipped?: boolean
  error?: string
}

/** Send a single endorsement request. Returns { ok, skipped, error }. */
export async function sendEndorsementRequest(params: SendRequestParams): Promise<SendRequestResult> {
  try {
    const res = await fetch('/api/endorsement-requests', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    })
    const data = await res.json()
    if (res.ok && (data.ok || data.skipped)) {
      return { ok: true, skipped: !!data.skipped }
    }
    return { ok: false, error: data.error ?? 'Failed to send request' }
  } catch {
    return { ok: false, error: 'Network error' }
  }
}

/** Send endorsement requests to a batch of contacts. Returns success/fail counts. */
export async function sendBatchRequests(
  yachtId: string,
  yachtName: string,
  contacts: { type: 'email' | 'phone'; value: string }[],
): Promise<{ successCount: number; failCount: number }> {
  let successCount = 0
  let failCount = 0

  for (const contact of contacts) {
    const result = await sendEndorsementRequest({
      yacht_id: yachtId,
      yacht_name: yachtName,
      recipient_email: contact.type === 'email' ? contact.value : undefined,
      recipient_phone: contact.type === 'phone' ? contact.value : undefined,
    })
    if (result.ok) successCount++
    else failCount++
  }

  return { successCount, failCount }
}

'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/Button'
import { useToast } from '@/components/ui/Toast'

interface RequestActionsProps {
  requestId: string
  status: string
  expiresAt: string
  cancelledAt: string | null
}

export function RequestActions({ requestId, status, expiresAt, cancelledAt }: RequestActionsProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [loading, setLoading] = useState<'cancel' | 'resend' | null>(null)

  const isExpired = new Date(expiresAt) < new Date()
  const isCancelled = !!cancelledAt || status === 'cancelled'
  const isAccepted = status === 'accepted'

  if (isAccepted || isCancelled) return null

  async function handleAction(action: 'cancel' | 'resend') {
    setLoading(action)
    try {
      const res = await fetch(`/api/endorsement-requests/${requestId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      })
      if (!res.ok) {
        const data = await res.json() as { error?: string }
        toast(data.error ?? `Failed to ${action} request.`, 'error')
        return
      }
      if (action === 'cancel') {
        toast('Request cancelled.', 'success')
      } else {
        toast('Request resent.', 'success')
      }
      router.refresh()
    } catch {
      toast(`Failed to ${action} request.`, 'error')
    } finally {
      setLoading(null)
    }
  }

  return (
    <div className="flex gap-2 mt-2">
      <Button
        variant="secondary"
        size="sm"
        loading={loading === 'resend'}
        disabled={loading !== null}
        onClick={() => handleAction('resend')}
      >
        Resend
      </Button>
      {!isExpired && (
        <Button
          variant="ghost"
          size="sm"
          loading={loading === 'cancel'}
          disabled={loading !== null}
          onClick={() => handleAction('cancel')}
          className="text-red-400 hover:text-red-300"
        >
          Cancel
        </Button>
      )}
    </div>
  )
}

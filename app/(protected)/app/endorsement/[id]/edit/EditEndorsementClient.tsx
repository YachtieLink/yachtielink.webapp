'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { WriteEndorsementForm } from '@/components/endorsement/WriteEndorsementForm'
import { BottomSheet } from '@/components/ui/BottomSheet'
import { Button } from '@/components/ui/Button'
import { useToast } from '@/components/ui/Toast'

interface ExistingEndorsement {
  id: string
  content: string
  endorser_role_label?: string
  recipient_role_label?: string
  worked_together_start?: string
  worked_together_end?: string
}

interface EditEndorsementClientProps {
  endorsementId: string
  recipientId: string
  recipientName: string
  yachtId: string
  yachtName: string
  existingEndorsement: ExistingEndorsement
}

export function EditEndorsementClient({
  endorsementId,
  recipientId,
  recipientName,
  yachtId,
  yachtName,
  existingEndorsement,
}: EditEndorsementClientProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [deleteSheetOpen, setDeleteSheetOpen] = useState(false)
  const [deleting, setDeleting] = useState(false)

  function handleSuccess() {
    router.push('/app/audience')
  }

  async function handleDelete() {
    setDeleting(true)
    try {
      const res = await fetch(`/api/endorsements/${endorsementId}`, {
        method: 'DELETE',
      })
      if (!res.ok && res.status !== 204) {
        toast('Failed to delete endorsement.', 'error')
        setDeleting(false)
        return
      }
      toast('Endorsement deleted.', 'success')
      router.push('/app/audience')
    } catch {
      toast('Failed to delete endorsement.', 'error')
      setDeleting(false)
    }
  }

  return (
    <div className="min-h-screen bg-[var(--color-surface)] px-4 pt-8 pb-24">
      <h1 className="text-xl font-bold text-[var(--color-text-primary)] mb-6">Edit endorsement</h1>

      <WriteEndorsementForm
        recipientId={recipientId}
        recipientName={recipientName}
        yachtId={yachtId}
        yachtName={yachtName}
        existingEndorsement={existingEndorsement}
        onSuccess={handleSuccess}
      />

      {/* Delete section */}
      <div className="mt-8 pt-6 border-t border-[var(--color-border)]">
        <button
          onClick={() => setDeleteSheetOpen(true)}
          className="text-sm text-red-400 hover:text-red-300 transition-colors font-medium"
        >
          Delete endorsement
        </button>
      </div>

      <BottomSheet
        open={deleteSheetOpen}
        onClose={() => setDeleteSheetOpen(false)}
        title="Delete endorsement"
      >
        <p className="text-sm text-[var(--color-text-secondary)] mb-6">
          Are you sure you want to delete this endorsement? This action cannot be undone.
        </p>
        <div className="flex flex-col gap-3">
          <Button
            variant="destructive"
            size="lg"
            className="w-full"
            loading={deleting}
            onClick={handleDelete}
          >
            Yes, delete it
          </Button>
          <Button
            variant="secondary"
            size="lg"
            className="w-full"
            disabled={deleting}
            onClick={() => setDeleteSheetOpen(false)}
          >
            Cancel
          </Button>
        </div>
      </BottomSheet>
    </div>
  )
}

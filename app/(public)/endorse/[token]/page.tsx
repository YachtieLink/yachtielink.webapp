import { notFound, redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/admin'
import { GhostEndorseForm } from '@/components/ghost/GhostEndorseForm'
import Link from 'next/link'

interface PageProps {
  params: Promise<{ token: string }>
}

type Requester = {
  display_name: string | null
  full_name: string | null
  profile_photo_url: string | null
}

type Yacht = {
  id: string
  name: string
}

type RequesterAttachment = {
  role_label: string | null
  started_at: string | null
  ended_at: string | null
} | null

type SuggestedEndorsement = {
  text: string
}

type EndorsementRequestRow = {
  id: string
  token: string
  requester_id: string
  yacht_id: string
  recipient_email: string | null
  recipient_phone: string | null
  recipient_user_id: string | null
  sent_via: string | null
  suggested_endorsements: SuggestedEndorsement[] | null
  status: string
  expires_at: string
  accepted_at: string | null
  cancelled_at: string | null
  requester: Requester | null
  yacht: Yacht | null
  requester_attachment: RequesterAttachment
}

function requesterDisplayName(r: Requester | null) {
  return r?.full_name ?? r?.display_name ?? 'A colleague'
}

/**
 * /endorse/[token] — Ghost endorsement writing page.
 *
 * Accessible to unauthenticated visitors. Authenticated users are redirected
 * back to /r/[token] where they can write as a real user.
 *
 * Validates the endorsement request, then renders GhostEndorseForm.
 * On submit, the form POSTs to /api/endorsements/guest and navigates to the
 * success page.
 */
export default async function EndorsePage({ params }: PageProps) {
  const { token } = await params
  const supabase = await createClient()

  // If the user is already authenticated, redirect to the standard endorsement page
  const { data: { user } } = await supabase.auth.getUser()
  if (user) {
    redirect(`/r/${token}`)
  }

  // Look up request by token (SECURITY DEFINER RPC — works for anon users)
  const { data, error } = await supabase.rpc('get_endorsement_request_by_token', {
    p_token: token,
  })

  if (error || !data) return notFound()

  const request = data as EndorsementRequestRow

  // Cancelled
  if (request.cancelled_at || request.status === 'cancelled') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[var(--color-surface)] p-4">
        <div className="max-w-sm text-center">
          <p className="text-2xl mb-3">✗</p>
          <h1 className="text-xl font-bold text-[var(--color-text-primary)] mb-2">
            Request cancelled
          </h1>
          <p className="text-sm text-[var(--color-text-secondary)]">
            This endorsement request was cancelled.
          </p>
        </div>
      </div>
    )
  }

  // Already accepted
  if (request.status === 'accepted') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[var(--color-surface)] p-4">
        <div className="max-w-sm text-center">
          <p className="text-2xl mb-3">✓</p>
          <h1 className="text-xl font-bold text-[var(--color-text-primary)] mb-2">
            Endorsement already submitted
          </h1>
          <p className="text-sm text-[var(--color-text-secondary)] mb-6">
            This endorsement has already been submitted.
          </p>
        </div>
      </div>
    )
  }

  // Expired
  const isExpired = new Date(request.expires_at) < new Date()
  if (isExpired) {
    const name = requesterDisplayName(request.requester)
    return (
      <div className="flex min-h-screen items-center justify-center bg-[var(--color-surface)] p-4">
        <div className="max-w-sm text-center">
          <p className="text-2xl mb-3">⏰</p>
          <h1 className="text-xl font-bold text-[var(--color-text-primary)] mb-2">
            This link has expired
          </h1>
          <p className="text-sm text-[var(--color-text-secondary)] mb-6">
            Endorsement requests expire after 30 days. Ask {name} to send a new request.
          </p>
        </div>
      </div>
    )
  }

  if (!request.requester || !request.yacht) return notFound()

  // ── Existing-user check (Bug 1+3) ─────────────────────────────────────────
  // If recipient_email or recipient_phone matches an existing user, show a
  // sign-in prompt instead of the ghost form. Prevents wasted effort.
  // Admin client for user-existence check — prevents account enumeration via anon RLS
  const admin = createServiceClient()
  let existingUserFound = false
  if (request.recipient_email) {
    const { data } = await admin
      .from('users')
      .select('id')
      .eq('email', request.recipient_email)
      .single()
    if (data) existingUserFound = true
  }
  if (!existingUserFound && request.recipient_phone) {
    const { data } = await admin
      .from('users')
      .select('id')
      .eq('phone', request.recipient_phone)
      .single()
    if (data) existingUserFound = true
  }

  if (existingUserFound) {
    const name = requesterDisplayName(request.requester)
    return (
      <div className="min-h-screen bg-[var(--color-surface)] px-4 pt-8 pb-24">
        <div className="max-w-sm mx-auto">
          <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-raised)] px-4 py-4 mb-6">
            <p className="text-xs text-[var(--color-text-tertiary)] mb-1">Endorsement request from</p>
            <p className="text-base font-bold text-[var(--color-text-primary)]">{name}</p>
            <p className="text-sm text-[var(--color-text-secondary)]">{request.yacht.name}</p>
          </div>

          <h1 className="text-xl font-bold text-[var(--color-text-primary)] mb-2">
            You already have an account
          </h1>
          <p className="text-sm text-[var(--color-text-secondary)] mb-6 leading-relaxed">
            Sign in to write this endorsement with your full profile — your name, photo, and credentials will be linked automatically.
          </p>

          <Link
            href={`/login?returnTo=${encodeURIComponent(`/r/${token}`)}`}
            className="flex h-12 items-center justify-center rounded-xl bg-[var(--color-interactive)] text-white text-sm font-semibold w-full"
          >
            Sign in to endorse
          </Link>
        </div>
      </div>
    )
  }

  const requesterName = requesterDisplayName(request.requester)
  const yachtName = request.yacht.name
  const prefillRole = request.requester_attachment?.role_label ?? ''
  const isShareableLink = request.sent_via === 'shareable_link'
  const suggestions = request.suggested_endorsements ?? []

  return (
    <div className="min-h-screen bg-[var(--color-surface)] px-4 pt-8 pb-24">
      <div className="max-w-sm mx-auto">
        {/* Header */}
        <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-raised)] px-4 py-4 mb-6">
          <p className="text-xs text-[var(--color-text-tertiary)] mb-1">Endorsement request from</p>
          <p className="text-base font-bold text-[var(--color-text-primary)]">{requesterName}</p>
          <p className="text-sm text-[var(--color-text-secondary)]">{yachtName}</p>
        </div>

        <h1 className="text-xl font-bold text-[var(--color-text-primary)] mb-1">
          Endorse {requesterName}
        </h1>
        <p className="text-sm text-[var(--color-text-secondary)] mb-6">
          It takes about two minutes.
        </p>

        <GhostEndorseForm
          token={token}
          requesterName={requesterName}
          yachtName={yachtName}
          prefillRole={prefillRole}
          suggestedEndorsements={suggestions}
          isShareableLink={isShareableLink}
        />

        {/* Alternative: sign in to write as real user */}
        <div className="mt-8 pt-6 border-t border-[var(--color-border)]">
          <p className="text-xs text-[var(--color-text-tertiary)] text-center mb-3">
            Already have an account?
          </p>
          <Link
            href={`/login?returnTo=${encodeURIComponent(`/r/${token}`)}`}
            className="flex h-10 items-center justify-center rounded-xl border border-[var(--color-border)] text-[var(--color-text-secondary)] text-sm font-medium"
          >
            Sign in to write as yourself
          </Link>
        </div>
      </div>
    </div>
  )
}

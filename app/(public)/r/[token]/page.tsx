import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { DeepLinkFlow } from '@/components/endorsement/DeepLinkFlow'
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
  yacht_type: string | null
  length_meters: number | null
  flag_state: string | null
  year_built: number | null
}

type RequesterAttachment = {
  role_label: string | null
  started_at: string | null
  ended_at: string | null
} | null

type EndorsementRequestRow = {
  id: string
  token: string
  requester_id: string
  yacht_id: string
  recipient_email: string | null
  recipient_user_id: string | null
  status: string
  expires_at: string
  created_at: string
  accepted_at: string | null
  cancelled_at: string | null
  requester: Requester | null
  yacht: Yacht | null
  requester_attachment: RequesterAttachment
}

// Prefer full name over display name (username) everywhere on this page
function requesterDisplayName(r: Requester | null) {
  return r?.full_name ?? r?.display_name ?? 'A colleague'
}

export default async function EndorsementRequestPage({ params }: PageProps) {
  const { token } = await params
  const supabase = await createClient()

  // SECURITY DEFINER RPC — bypasses RLS so the anon key can read by token.
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

  // Expired
  const isExpired = new Date(request.expires_at) < new Date()
  if (isExpired) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[var(--color-surface)] p-4">
        <div className="max-w-sm text-center">
          <p className="text-2xl mb-3">⏰</p>
          <h1 className="text-xl font-bold text-[var(--color-text-primary)] mb-2">
            This link has expired
          </h1>
          <p className="text-sm text-[var(--color-text-secondary)] mb-6">
            Endorsement requests expire after 30 days. Ask{' '}
            {requesterDisplayName(request.requester)}{' '}
            to send a new request.
          </p>
          <Link
            href="/signup"
            className="inline-block px-6 py-3 rounded-xl bg-[var(--color-teal-700)] text-white text-sm font-semibold"
          >
            Create a YachtieLink profile
          </Link>
        </div>
      </div>
    )
  }

  const requester = request.requester
  const yacht = request.yacht

  if (!requester || !yacht) return notFound()

  // Check auth
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    const name = requesterDisplayName(requester)
    const returnTo = encodeURIComponent(`/r/${token}`)
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-[var(--color-surface)] px-4 py-12 gap-6">
        <div className="max-w-sm w-full">
          <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-raised)] px-4 py-4 mb-6">
            <p className="text-sm text-[var(--color-text-secondary)] mb-1">Endorsement request from</p>
            <p className="text-lg font-bold text-[var(--color-text-primary)]">{name}</p>
            <p className="text-sm text-[var(--color-text-secondary)]">{yacht.name}</p>
          </div>

          <h1 className="text-xl font-bold text-[var(--color-text-primary)] mb-2">
            Sign in to write an endorsement
          </h1>
          <p className="text-sm text-[var(--color-text-secondary)] mb-6">
            {name} is asking you to endorse their work. It takes about two minutes.
          </p>

          <div className="flex flex-col gap-3">
            <Link
              href={`/login?returnTo=${returnTo}`}
              className="flex h-12 items-center justify-center rounded-xl bg-[var(--color-teal-700)] text-white text-sm font-semibold"
            >
              Sign in
            </Link>
            <Link
              href={`/signup?returnTo=${returnTo}`}
              className="flex h-12 items-center justify-center rounded-xl border border-[var(--color-border)] text-[var(--color-text-primary)] text-sm font-semibold"
            >
              Create an account
            </Link>
          </div>
        </div>
      </div>
    )
  }

  const name = requesterDisplayName(requester)

  const requestForFlow = {
    id: request.id,
    token: request.token,
    requester_id: request.requester_id,
    yacht_id: request.yacht_id,
    recipient_email: request.recipient_email ?? '',
    status: request.status,
    expires_at: request.expires_at,
  }

  return (
    <div className="min-h-screen bg-[var(--color-surface)] px-4 pt-8 pb-24">
      <div className="max-w-sm mx-auto">
        <h1 className="text-2xl font-bold text-[var(--color-text-primary)] mb-1">
          Endorse {name}
        </h1>
        <p className="text-sm text-[var(--color-text-secondary)] mb-6">
          from {yacht.name}
        </p>

        <DeepLinkFlow
          request={requestForFlow}
          requester={requester}
          yacht={yacht}
          requesterAttachment={request.requester_attachment}
          currentUserId={user.id}
        />
      </div>
    </div>
  )
}

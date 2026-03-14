'use server'

import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { DeepLinkFlow } from '@/components/endorsement/DeepLinkFlow'
import Link from 'next/link'

interface PageProps {
  params: Promise<{ token: string }>
}

export default async function EndorsementRequestPage({ params }: PageProps) {
  const { token } = await params
  const supabase = await createClient()

  // Query Supabase directly — avoids self-fetch network round-trip that breaks on
  // preview deployments where NEXT_PUBLIC_APP_URL points to production.
  const { data: request, error } = await supabase
    .from('endorsement_requests')
    .select(`
      id, token, requester_id, yacht_id, recipient_email,
      status, expires_at, created_at, accepted_at, cancelled_at,
      requester:users!requester_id(display_name, full_name, profile_photo_url),
      yacht:yachts!yacht_id(id, name, yacht_type, length_meters, flag_state, year_built)
    `)
    .eq('token', token)
    .single()

  if (error || !request) return notFound()

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
    const requesterName =
      (request.requester as { display_name: string | null; full_name: string | null } | null)
        ?.display_name ??
      (request.requester as { display_name: string | null; full_name: string | null } | null)
        ?.full_name ??
      'them'
    return (
      <div className="flex min-h-screen items-center justify-center bg-[var(--color-surface)] p-4">
        <div className="max-w-sm text-center">
          <p className="text-2xl mb-3">⏰</p>
          <h1 className="text-xl font-bold text-[var(--color-text-primary)] mb-2">
            This link has expired
          </h1>
          <p className="text-sm text-[var(--color-text-secondary)] mb-6">
            Endorsement requests expire after 30 days. Ask{' '}
            {requesterName}{' '}
            to send a new request.
          </p>
          <Link
            href="/signup"
            className="inline-block px-6 py-3 rounded-xl bg-[var(--color-navy-800)] text-white text-sm font-semibold"
          >
            Create a YachtieLink profile
          </Link>
        </div>
      </div>
    )
  }

  // Type-narrow joined columns (Supabase returns them as unknown)
  type Requester = { display_name: string | null; full_name: string | null; profile_photo_url: string | null }
  type Yacht = { id: string; name: string; yacht_type: string | null; length_meters: number | null; flag_state: string | null; year_built: number | null }

  const requester = request.requester as Requester | null
  const yacht = request.yacht as Yacht | null

  // Defensive guard — should never happen if FK constraints are healthy
  if (!requester || !yacht) return notFound()

  // Check auth
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    const requesterName = requester.display_name ?? requester.full_name ?? 'A colleague'
    const returnTo = encodeURIComponent(`/r/${token}`)
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-[var(--color-surface)] px-4 py-12 gap-6">
        <div className="max-w-sm w-full">
          {/* Request context */}
          <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-raised)] px-4 py-4 mb-6">
            <p className="text-sm text-[var(--color-text-secondary)] mb-1">Endorsement request from</p>
            <p className="text-lg font-bold text-[var(--color-text-primary)]">{requesterName}</p>
            <p className="text-sm text-[var(--color-text-secondary)]">{yacht.name}</p>
          </div>

          <h1 className="text-xl font-bold text-[var(--color-text-primary)] mb-2">
            Sign in to write an endorsement
          </h1>
          <p className="text-sm text-[var(--color-text-secondary)] mb-6">
            {requesterName} is asking you to endorse their work. It takes about two minutes.
          </p>

          <div className="flex flex-col gap-3">
            <Link
              href={`/login?returnTo=${returnTo}`}
              className="flex h-12 items-center justify-center rounded-xl bg-[var(--color-navy-800)] text-white text-sm font-semibold"
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

  // Authenticated — render the write-endorsement flow
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
          Endorse {requester.display_name ?? requester.full_name ?? 'colleague'}
        </h1>
        <p className="text-sm text-[var(--color-text-secondary)] mb-6">
          from {yacht.name}
        </p>

        <DeepLinkFlow
          request={requestForFlow}
          requester={requester}
          yacht={yacht}
          currentUserId={user.id}
        />
      </div>
    </div>
  )
}

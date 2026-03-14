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

  // Load request
  const res = await fetch(
    `${process.env.NEXT_PUBLIC_APP_URL ?? 'https://yachtie.link'}/api/endorsement-requests/${token}`,
    { cache: 'no-store' }
  )

  if (res.status === 404) return notFound()

  if (res.status === 410) {
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

  const data = await res.json() as {
    expired?: boolean
    request: {
      id: string
      token: string
      requester_id: string
      yacht_id: string
      recipient_email: string
      status: string
      expires_at: string
      requester: { display_name: string | null; full_name: string | null; profile_photo_url: string | null }
      yacht: { id: string; name: string; yacht_type: string | null; length_meters: number | null; flag_state: string | null; year_built: number | null }
    }
  }

  if (data.expired) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[var(--color-surface)] p-4">
        <div className="max-w-sm text-center">
          <p className="text-2xl mb-3">⏰</p>
          <h1 className="text-xl font-bold text-[var(--color-text-primary)] mb-2">
            This link has expired
          </h1>
          <p className="text-sm text-[var(--color-text-secondary)] mb-6">
            Endorsement requests expire after 30 days. Ask{' '}
            {data.request.requester?.display_name ?? data.request.requester?.full_name ?? 'them'}{' '}
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

  const { request } = data

  // Check auth
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    const requesterName = request.requester?.display_name ?? request.requester?.full_name ?? 'A colleague'
    const returnTo = encodeURIComponent(`/r/${token}`)
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-[var(--color-surface)] px-4 py-12 gap-6">
        <div className="max-w-sm w-full">
          {/* Request context */}
          <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-raised)] px-4 py-4 mb-6">
            <p className="text-sm text-[var(--color-text-secondary)] mb-1">Endorsement request from</p>
            <p className="text-lg font-bold text-[var(--color-text-primary)]">{requesterName}</p>
            <p className="text-sm text-[var(--color-text-secondary)]">{request.yacht?.name}</p>
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

  // Authenticated — render the flow
  return (
    <div className="min-h-screen bg-[var(--color-surface)] px-4 pt-8 pb-24">
      <div className="max-w-sm mx-auto">
        <h1 className="text-2xl font-bold text-[var(--color-text-primary)] mb-1">
          Endorse {request.requester?.display_name ?? request.requester?.full_name ?? 'colleague'}
        </h1>
        <p className="text-sm text-[var(--color-text-secondary)] mb-6">
          from {request.yacht?.name}
        </p>

        <DeepLinkFlow
          request={request}
          requester={request.requester}
          yacht={request.yacht}
          currentUserId={user.id}
        />
      </div>
    </div>
  )
}

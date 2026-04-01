import Link from 'next/link'
import { Navigation } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'

export default async function NotFound() {
  let user = null
  try {
    const supabase = await createClient()
    const { data } = await supabase.auth.getUser()
    user = data.user
  } catch {
    // Supabase unreachable — degrade gracefully, show guest view
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100dvh-4rem)] p-6 text-center">
      <div className="flex flex-col items-center gap-6 max-w-sm">
        {/* Icon */}
        <div className="w-16 h-16 rounded-full bg-[var(--color-teal-50)] border border-[var(--color-teal-100)] flex items-center justify-center">
          <Navigation size={28} className="text-[var(--color-interactive)]" />
        </div>

        {/* Headline */}
        <div className="flex flex-col gap-2">
          <p className="text-xs font-semibold tracking-widest uppercase text-[var(--color-text-tertiary)]">
            404
          </p>
          <h1 className="font-serif text-3xl text-[var(--color-text-primary)] leading-tight">
            Even the best navigators get lost.
          </h1>
          <p className="text-sm text-[var(--color-text-secondary)]">
            That page doesn&apos;t exist — but your next destination does.
          </p>
        </div>

        {/* CTA */}
        <Link
          href={user ? '/app/profile' : '/welcome'}
          className="px-6 py-3 bg-[var(--color-interactive)] text-white rounded-xl text-sm font-semibold hover:bg-[var(--color-interactive-hover)] transition-colors w-full text-center"
        >
          {user ? 'Back to your profile' : 'Head to YachtieLink'}
        </Link>

        {user && (
          <Link
            href="/"
            className="text-sm text-[var(--color-text-tertiary)] hover:text-[var(--color-text-secondary)] transition-colors"
          >
            or go to the home page
          </Link>
        )}
      </div>
    </div>
  )
}

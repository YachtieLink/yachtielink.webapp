import Link from 'next/link'
import { createServiceClient } from '@/lib/supabase/admin'
import { LandingSections } from '@/components/marketing/LandingSections'

export const revalidate = 300 // ISR: revalidate every 5 minutes

export const metadata = {
  title: 'YachtieLink — Your Career on the Water, in One Place',
  description:
    'A portable professional identity for yacht crew. Built on real employment history, trusted endorsements from real coworkers, and the yacht graph that connects the industry.',
  openGraph: {
    title: 'YachtieLink — Your Career on the Water, in One Place',
    description:
      'Build your crew profile. Connect through yachts. Earn trusted endorsements.',
    url: 'https://yachtie.link',
    siteName: 'YachtieLink',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image' as const,
    title: 'YachtieLink',
    description: 'A portable professional identity for yacht crew.',
  },
}

async function getCrewCount(): Promise<number> {
  try {
    const supabase = createServiceClient()
    const { count } = await supabase
      .from('users')
      .select('id', { count: 'exact', head: true })
    return count ?? 0
  } catch {
    return 0
  }
}

export default async function LandingPage() {
  const crewCount = await getCrewCount()

  return (
    <div className="min-h-screen bg-[var(--color-surface)]">
      {/* ── Header ── */}
      <header className="sticky top-0 z-40 bg-[var(--color-surface)]/95 backdrop-blur-sm border-b border-[var(--color-border)]">
        <div className="max-w-5xl mx-auto flex items-center justify-between px-4 py-3">
          <Link href="/" className="font-semibold text-lg text-[var(--color-text-primary)]">
            YachtieLink
          </Link>
          <div className="flex items-center gap-3">
            <Link
              href="/welcome"
              className="text-sm text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-colors"
            >
              Log in
            </Link>
            <Link
              href="/welcome"
              className="text-sm font-medium px-4 py-2 rounded-full bg-[var(--color-interactive)] text-white hover:bg-[var(--color-interactive-hover)] transition-colors"
            >
              Sign up
            </Link>
          </div>
        </div>
      </header>

      {/* ── Client component handles animations ── */}
      <LandingSections crewCount={crewCount} />

      {/* ── Footer ── */}
      <footer className="border-t border-[var(--color-border)] bg-[var(--color-surface)]">
        <div className="max-w-5xl mx-auto px-4 py-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-[var(--color-text-tertiary)]">
            &copy; {new Date().getFullYear()} YachtieLink
          </p>
          <div className="flex gap-6">
            <Link href="/terms" className="text-xs text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-colors">
              Terms
            </Link>
            <Link href="/privacy" className="text-xs text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-colors">
              Privacy
            </Link>
          </div>
        </div>
      </footer>
    </div>
  )
}

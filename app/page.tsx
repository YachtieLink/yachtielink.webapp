import { createServiceClient } from '@/lib/supabase/admin'
import { LandingSections } from '@/components/marketing/LandingSections'
import { PublicHeader } from '@/components/public/PublicHeader'
import { PublicFooter } from '@/components/public/PublicFooter'

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
    <div className="min-h-screen flex flex-col bg-[var(--color-surface)]">
      <PublicHeader />
      <main className="flex-1">
        <LandingSections crewCount={crewCount} />
      </main>
      <PublicFooter />
    </div>
  )
}

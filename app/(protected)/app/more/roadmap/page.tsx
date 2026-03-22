import { BackButton } from '@/components/ui/BackButton'
import { PageTransition } from '@/components/ui/PageTransition'

export const metadata = { title: 'Feature Roadmap — YachtieLink' }

type RoadmapStatus = 'shipped' | 'in_progress' | 'planned'

interface RoadmapItem {
  title: string
  description: string
  status: RoadmapStatus
  category: string
}

const ROADMAP_ITEMS: RoadmapItem[] = [
  {
    title: 'Sea time calculator',
    description: 'Track total time at sea with a per-yacht breakdown — roles, dates, and days calculated automatically.',
    status: 'shipped',
    category: 'Profile',
  },
  {
    title: 'PDF resume snapshot',
    description: 'Generate a professionally formatted PDF of your YachtieLink profile at any time.',
    status: 'shipped',
    category: 'CV & Employment',
  },
  {
    title: 'Profile analytics dashboard',
    description: 'See who viewed your profile, when, and how they found you.',
    status: 'shipped',
    category: 'Analytics',
  },
  {
    title: 'Colleague network explorer',
    description: 'Browse everyone you\u2019ve worked with, grouped by yacht, with endorsement status and quick actions.',
    status: 'shipped',
    category: 'Networking',
  },
  {
    title: 'Dynamic OG images',
    description: 'When you share your profile link on WhatsApp or social media, a rich preview card generates automatically.',
    status: 'shipped',
    category: 'Profile',
  },
  {
    title: 'Crew search for Pro members',
    description: 'Search all crew by role, department, yacht history, and availability.',
    status: 'planned',
    category: 'Search & Discovery',
  },
  {
    title: 'Direct messaging',
    description: 'Send private messages to other crew members within YachtieLink.',
    status: 'planned',
    category: 'Messaging',
  },
  {
    title: 'Endorsement signals',
    description: 'Crew who served on the same yacht can signal agreement with an endorsement, adding a trust layer.',
    status: 'planned',
    category: 'Endorsements',
  },
  {
    title: 'Yacht owner & captain profiles',
    description: 'Dedicated profile type for owners and captains to browse crew and endorse from the other side.',
    status: 'planned',
    category: 'Profile',
  },
  {
    title: 'AI endorsement writing assistant',
    description: 'Get help drafting endorsements with AI that understands yachting roles and context.',
    status: 'planned',
    category: 'Endorsements',
  },
]

const STATUS_CONFIG: Record<RoadmapStatus, { label: string; className: string }> = {
  shipped: {
    label: 'Shipped',
    className: 'bg-emerald-50 text-emerald-700',
  },
  in_progress: {
    label: 'In Progress',
    className: 'bg-[var(--color-teal-50)] text-[var(--color-interactive)]',
  },
  planned: {
    label: 'Planned',
    className: 'bg-amber-50 text-amber-700',
  },
}

function StatusBadge({ status }: { status: RoadmapStatus }) {
  const config = STATUS_CONFIG[status]
  return (
    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${config.className}`}>
      {config.label}
    </span>
  )
}

export default function RoadmapPage() {
  const shipped = ROADMAP_ITEMS.filter((item) => item.status === 'shipped')
  const planned = ROADMAP_ITEMS.filter((item) => item.status === 'planned' || item.status === 'in_progress')

  return (
    <PageTransition className="flex flex-col gap-4 pb-24">
      <BackButton href="/app/more" />
      <h1 className="text-[28px] font-bold tracking-tight text-[var(--color-text-primary)]">
        Feature Roadmap
      </h1>
      <p className="text-sm text-[var(--color-text-secondary)]">
        See what we&apos;re building and what&apos;s coming next.
        Have an idea?{' '}
        <a
          href="mailto:hello@yachtie.link?subject=Feature idea"
          className="text-[var(--color-interactive)] underline"
        >
          Email us
        </a>
        {' '}— your feedback shapes what we build.
      </p>

      {/* Coming soon */}
      {planned.length > 0 && (
        <div>
          <h2 className="text-xs font-semibold uppercase tracking-wide text-[var(--color-text-tertiary)] mb-3 mt-4">
            Coming Soon
          </h2>
          <div className="flex flex-col gap-3">
            {planned.map((item) => (
              <div
                key={item.title}
                className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl p-4"
              >
                <div className="flex items-start justify-between gap-3 mb-1.5">
                  <h3 className="text-sm font-semibold text-[var(--color-text-primary)]">
                    {item.title}
                  </h3>
                  <StatusBadge status={item.status} />
                </div>
                <p className="text-sm text-[var(--color-text-secondary)] leading-relaxed mb-2">
                  {item.description}
                </p>
                <span className="text-xs text-[var(--color-text-tertiary)]">
                  {item.category}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recently shipped */}
      {shipped.length > 0 && (
        <div>
          <h2 className="text-xs font-semibold uppercase tracking-wide text-[var(--color-text-tertiary)] mb-3 mt-4">
            Recently Shipped
          </h2>
          <div className="flex flex-col gap-3">
            {shipped.map((item) => (
              <div
                key={item.title}
                className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl p-4"
              >
                <div className="flex items-start justify-between gap-3 mb-1.5">
                  <h3 className="text-sm font-semibold text-[var(--color-text-primary)]">
                    {item.title}
                  </h3>
                  <StatusBadge status={item.status} />
                </div>
                <p className="text-sm text-[var(--color-text-secondary)] leading-relaxed mb-2">
                  {item.description}
                </p>
                <span className="text-xs text-[var(--color-text-tertiary)]">
                  {item.category}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </PageTransition>
  )
}

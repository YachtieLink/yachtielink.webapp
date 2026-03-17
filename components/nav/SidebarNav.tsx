'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useNetworkBadge } from '@/lib/hooks/useNetworkBadge'
import {
  ProfileIcon,
  ProfileIconFilled,
  CvIcon,
  CvIconFilled,
  InsightsIcon,
  InsightsIconFilled,
  NetworkIcon,
  NetworkIconFilled,
  MoreIcon,
  MoreIconFilled,
} from './icons'

interface Tab {
  label: string
  href: string
  icon: React.ReactNode
  activeIcon: React.ReactNode
}

const tabs: Tab[] = [
  {
    label: 'My Profile',
    href: '/app/profile',
    icon: <ProfileIcon />,
    activeIcon: <ProfileIconFilled />,
  },
  {
    label: 'CV',
    href: '/app/cv',
    icon: <CvIcon />,
    activeIcon: <CvIconFilled />,
  },
  {
    label: 'Insights',
    href: '/app/insights',
    icon: <InsightsIcon />,
    activeIcon: <InsightsIconFilled />,
  },
  {
    label: 'Network',
    href: '/app/network',
    icon: <NetworkIcon />,
    activeIcon: <NetworkIconFilled />,
  },
  {
    label: 'More',
    href: '/app/more',
    icon: <MoreIcon />,
    activeIcon: <MoreIconFilled />,
  },
]

export function SidebarNav() {
  const pathname = usePathname()
  const router = useRouter()
  const networkBadge = useNetworkBadge()

  // Prefetch all tab routes on mount for instant navigation
  useEffect(() => {
    tabs.forEach((tab) => router.prefetch(tab.href))
  }, [router])

  return (
    <nav
      aria-label="Sidebar navigation"
      className="hidden md:flex fixed left-0 top-0 bottom-0 w-16 flex-col items-center gap-1 pt-6 pb-4 border-r border-[var(--color-border)] bg-[var(--color-surface)] z-40"
    >
      {/* Logo mark */}
      <div className="mb-6 flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--color-interactive)] text-white text-xs font-bold">
        YL
      </div>

      {/* Tab links */}
      {tabs.map((tab) => {
        const isActive = pathname.startsWith(tab.href)
        const showBadge = tab.href === '/app/network' && networkBadge > 0
        return (
          <Link
            key={tab.href}
            href={tab.href}
            title={tab.label}
            className={`
              relative flex flex-col items-center justify-center gap-0.5 w-12 h-12 rounded-lg
              text-[9px] font-medium transition-colors
              ${
                isActive
                  ? 'text-[var(--color-interactive)] bg-[var(--color-interactive)]/10'
                  : 'text-[var(--color-text-tertiary)] hover:text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-overlay)]'
              }
            `}
          >
            <span className="relative h-5 w-5">
              {isActive ? tab.activeIcon : tab.icon}
              {showBadge && (
                <span className="absolute -top-0.5 -right-0.5 h-2 w-2 rounded-full bg-red-500" />
              )}
            </span>
            <span>{tab.label}</span>
          </Link>
        )
      })}
    </nav>
  )
}

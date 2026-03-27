'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { useNetworkBadge } from '@/lib/hooks/useNetworkBadge'
import { popIn } from '@/lib/motion'
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
import { tabs as navTabs } from '@/lib/nav-config'
import { sectionColors, sectionClassMap } from '@/lib/section-colors'

/** Icons keyed by route — kept here because they're JSX (paired outline + filled SVGs) */
const tabIcons: Record<string, { icon: React.ReactNode; activeIcon: React.ReactNode }> = {
  '/app/profile':  { icon: <ProfileIcon />,  activeIcon: <ProfileIconFilled /> },
  '/app/cv':       { icon: <CvIcon />,       activeIcon: <CvIconFilled /> },
  '/app/insights': { icon: <InsightsIcon />,  activeIcon: <InsightsIconFilled /> },
  '/app/network':  { icon: <NetworkIcon />,   activeIcon: <NetworkIconFilled /> },
  '/app/more':     { icon: <MoreIcon />,      activeIcon: <MoreIconFilled /> },
}

export function SidebarNav() {
  const pathname = usePathname()
  const router = useRouter()
  const networkBadge = useNetworkBadge()

  // Prefetch all tab routes on mount for instant navigation
  useEffect(() => {
    navTabs.forEach((tab) => router.prefetch(tab.href))
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
      {navTabs.map((tab) => {
        const isActive = pathname.startsWith(tab.matchPrefix)
        const icons = tabIcons[tab.href]
        const sectionColor = sectionColors[tab.section] ?? 'teal'
        const classes = sectionClassMap[sectionColor]
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
                  ? `${classes.text} ${classes.bgSubtle}`
                  : 'text-[var(--color-text-tertiary)] hover:text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-overlay)]'
              }
            `}
          >
            <span className="relative h-5 w-5">
              {isActive ? icons?.activeIcon : icons?.icon}
              {showBadge && (
                <motion.span
                  key="network-badge"
                  variants={popIn}
                  initial="hidden"
                  animate="visible"
                  className="absolute -top-0.5 -right-0.5 h-2 w-2 rounded-full bg-[var(--color-error)]"
                />
              )}
            </span>
            <span>{tab.label}</span>
          </Link>
        )
      })}
    </nav>
  )
}

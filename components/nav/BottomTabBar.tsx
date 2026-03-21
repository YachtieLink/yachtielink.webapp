"use client";

import { useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useNetworkBadge } from "@/lib/hooks/useNetworkBadge";
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
} from "./icons";
import { tabs as navTabs } from "@/lib/nav-config";
import { sectionColors, sectionClassMap } from "@/lib/section-colors";

/** Icons keyed by route — kept here because they're JSX (paired outline + filled SVGs) */
const tabIcons: Record<string, { icon: React.ReactNode; activeIcon: React.ReactNode }> = {
  "/app/profile":  { icon: <ProfileIcon />,  activeIcon: <ProfileIconFilled /> },
  "/app/cv":       { icon: <CvIcon />,       activeIcon: <CvIconFilled /> },
  "/app/insights": { icon: <InsightsIcon />,  activeIcon: <InsightsIconFilled /> },
  "/app/network":  { icon: <NetworkIcon />,   activeIcon: <NetworkIconFilled /> },
  "/app/more":     { icon: <MoreIcon />,      activeIcon: <MoreIconFilled /> },
};

export function BottomTabBar() {
  const pathname = usePathname();
  const router = useRouter();
  const networkBadge = useNetworkBadge();

  // Prefetch all tab routes on mount for instant navigation
  useEffect(() => {
    navTabs.forEach((tab) => router.prefetch(tab.href));
  }, [router]);

  return (
    <nav
      aria-label="Main navigation"
      className="md:hidden fixed bottom-0 left-0 right-0 z-50 bottom-tab-bar border-t border-[var(--color-border)] bg-[var(--color-surface)]"
    >
      <ul className="flex h-16 items-stretch">
        {navTabs.map((tab) => {
          const isActive = pathname.startsWith(tab.matchPrefix);
          const icons = tabIcons[tab.href];
          const sectionColor = sectionColors[tab.section] ?? "teal";
          const activeClass = sectionClassMap[sectionColor].text;
          return (
            <li key={tab.href} className="flex flex-1">
              <Link
                href={tab.href}
                className={`
                  flex flex-1 flex-col items-center justify-center gap-0.5
                  text-[10px] font-medium transition-colors active:scale-[0.98] transition-transform
                  ${
                    isActive
                      ? activeClass
                      : "text-[var(--color-text-tertiary)] hover:text-[var(--color-text-secondary)]"
                  }
                `}
              >
                <span className="relative h-6 w-6">
                  {isActive ? icons?.activeIcon : icons?.icon}
                  {tab.href === '/app/network' && networkBadge > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 h-2 w-2 rounded-full bg-[var(--color-error)]" />
                  )}
                </span>
                <span>{tab.label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

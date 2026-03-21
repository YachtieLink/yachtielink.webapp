export interface NavTab {
  label: string;
  href: string;
  /** Used to match active route */
  matchPrefix: string;
  /** Section color key for active state tinting */
  section: string;
}

export const tabs: NavTab[] = [
  {
    label: "My Profile",
    href: "/app/profile",
    matchPrefix: "/app/profile",
    section: "profile",
  },
  {
    label: "CV",
    href: "/app/cv",
    matchPrefix: "/app/cv",
    section: "cv",
  },
  {
    label: "Insights",
    href: "/app/insights",
    matchPrefix: "/app/insights",
    section: "insights",
  },
  {
    label: "Network",
    href: "/app/network",
    matchPrefix: "/app/network",
    section: "network",
  },
  {
    label: "More",
    href: "/app/more",
    matchPrefix: "/app/more",
    section: "more",
  },
];

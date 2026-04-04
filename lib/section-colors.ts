/**
 * Section color assignments per style guide.
 * Each feature area gets one accent color.
 * Never combine all three in one component.
 */

export type SectionColor = "teal" | "coral" | "navy" | "amber" | "sand";

export interface SectionColorTokens {
  bg50: string;
  bg100: string;
  bg200: string;
  accent500: string;
  text700: string;
  borderAccent: string;
}

export const colorMap: Record<SectionColor, SectionColorTokens> = {
  teal: {
    bg50: "var(--color-teal-50)",
    bg100: "var(--color-teal-100)",
    bg200: "var(--color-teal-200)",
    accent500: "var(--color-teal-700)",
    text700: "var(--color-teal-900)",
    borderAccent: "var(--color-teal-700)",
  },
  coral: {
    bg50: "var(--color-coral-50)",
    bg100: "var(--color-coral-100)",
    bg200: "var(--color-coral-200)",
    accent500: "var(--color-coral-500)",
    text700: "var(--color-coral-700)",
    borderAccent: "var(--color-coral-500)",
  },
  navy: {
    bg50: "var(--color-navy-50)",
    bg100: "var(--color-navy-100)",
    bg200: "var(--color-navy-200)",
    accent500: "var(--color-navy-500)",
    text700: "var(--color-navy-700)",
    borderAccent: "var(--color-navy-500)",
  },
  amber: {
    bg50: "var(--color-amber-50)",
    bg100: "var(--color-amber-100)",
    bg200: "var(--color-amber-200)",
    accent500: "var(--color-amber-500)",
    text700: "var(--color-amber-700)",
    borderAccent: "var(--color-amber-500)",
  },
  sand: {
    bg50: "var(--color-sand-100)",
    bg100: "var(--color-sand-200)",
    bg200: "var(--color-sand-300)",
    accent500: "var(--color-sand-400)",
    text700: "var(--color-sand-400)",
    borderAccent: "var(--color-sand-300)",
  },
};

/** Feature → section color mapping
 * RULE: Every main tab must have a UNIQUE color. No two tabs share a color.
 * Profile=teal, CV=amber, Insights=coral, Network=navy, More=sand
 */
export const sectionColors: Record<string, SectionColor> = {
  profile: "teal",
  network: "navy",
  colleagues: "navy",
  endorsements: "coral",
  cv: "amber",
  certifications: "amber",
  insights: "coral",
  pro: "sand",
  more: "sand",
  experience: "navy",
  education: "teal",
  gallery: "teal",
};

/** Tailwind class map for dynamic section coloring without inline styles */
export const sectionClassMap: Record<
  SectionColor,
  { text: string; bg: string; border: string; bgSubtle: string }
> = {
  teal: {
    text: "text-[var(--color-teal-700)]",
    bg: "bg-[var(--color-teal-100)]",
    bgSubtle: "bg-[var(--color-teal-50)]",
    border: "border-[var(--color-teal-700)]",
  },
  coral: {
    text: "text-[var(--color-coral-500)]",
    bg: "bg-[var(--color-coral-100)]",
    bgSubtle: "bg-[var(--color-coral-50)]",
    border: "border-[var(--color-coral-500)]",
  },
  navy: {
    text: "text-[var(--color-navy-500)]",
    bg: "bg-[var(--color-navy-100)]",
    bgSubtle: "bg-[var(--color-navy-50)]",
    border: "border-[var(--color-navy-500)]",
  },
  amber: {
    text: "text-[var(--color-amber-500)]",
    bg: "bg-[var(--color-amber-100)]",
    bgSubtle: "bg-[var(--color-amber-50)]",
    border: "border-[var(--color-amber-500)]",
  },
  sand: {
    text: "text-[var(--color-sand-400)]",
    bg: "bg-[var(--color-sand-200)]",
    bgSubtle: "bg-[var(--color-sand-100)]",
    border: "border-[var(--color-sand-300)]",
  },
};

export function getSectionTokens(section: string): SectionColorTokens {
  const color = sectionColors[section] ?? "teal";
  return colorMap[color];
}

export function getSectionClasses(section: string) {
  const color = sectionColors[section] ?? "teal";
  return sectionClassMap[color];
}

export const accentColors = {
  teal:  { 500: '#14b8a6', 600: '#0d9488', 100: '#ccfbf1' },
  coral: { 500: '#f97066', 600: '#ef4444', 100: '#ffe4e6' },
  navy:  { 500: '#3b82f6', 600: '#2563eb', 100: '#dbeafe' },
  amber: { 500: '#f59e0b', 600: '#d97706', 100: '#fef3c7' },
  sand:  { 500: '#64748b', 600: '#475569', 100: '#f1f5f9' },
} as const

export type AccentColor = keyof typeof accentColors

'use client'

import { motion } from 'framer-motion'
import { popIn } from '@/lib/motion'
import Link from 'next/link'

interface ProfileStrengthProps {
  score: number       // 0–100
  label: string       // 'Getting started' | 'Looking good' | 'Standing out' | 'All squared away'
  nextPrompt: string
  nextHref?: string
}

export function ProfileStrength({ score, label, nextPrompt, nextHref }: ProfileStrengthProps) {
  const circumference = 2 * Math.PI * 28 // r=28
  const dash = (score / 100) * circumference

  const arcColor = score <= 30
    ? 'var(--color-strength-low)'
    : score <= 60
    ? 'var(--color-strength-mid)'
    : score <= 85
    ? 'var(--color-strength-high)'
    : 'var(--color-strength-full)'

  return (
    <div className="bg-[var(--color-surface)] rounded-2xl p-5 flex flex-col gap-4">
      <div className="flex items-center gap-4">
        {/* SVG donut */}
        <motion.div variants={popIn} initial="hidden" animate="visible" className="shrink-0">
          <svg width="72" height="72" viewBox="0 0 72 72">
            <circle cx="36" cy="36" r="28" fill="none" stroke="var(--color-border)" strokeWidth="6" />
            <circle
              cx="36"
              cy="36"
              r="28"
              fill="none"
              stroke={arcColor}
              strokeWidth="6"
              strokeDasharray={`${dash} ${circumference}`}
              strokeLinecap="round"
              transform="rotate(-90 36 36)"
              style={{ transition: 'stroke-dasharray 0.6s ease' }}
            />
            <text x="36" y="40" textAnchor="middle" fontSize="14" fontWeight="700" fill="var(--color-text-primary)">
              {score}%
            </text>
          </svg>
        </motion.div>

        <div className="min-w-0">
          <p className="font-semibold text-[var(--color-text-primary)]">Profile Strength</p>
          <p className="text-sm text-[var(--color-text-secondary)]">{label}</p>
        </div>
      </div>

      {nextPrompt && (
        <div className="flex items-center justify-between gap-3 p-3 rounded-xl bg-[var(--color-surface-raised)]">
          <p className="text-sm text-[var(--color-text-primary)]">{nextPrompt}</p>
          {nextHref && (
            <Link
              href={nextHref}
              className="shrink-0 text-xs font-medium text-[var(--color-interactive)] hover:underline"
            >
              Go →
            </Link>
          )}
        </div>
      )}
    </div>
  )
}

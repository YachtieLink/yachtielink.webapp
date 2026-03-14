'use client'

import { useState } from 'react'
import { ProgressWheel } from '@/components/ui'
import { BottomSheet } from '@/components/ui/BottomSheet'

export interface WheelAMilestones {
  roleSet:    boolean
  hasYacht:   boolean
  bioSet:     boolean
  hasCert:    boolean
  hasPhoto:   boolean
}

interface WheelACardProps {
  milestones: WheelAMilestones
}

const MILESTONE_CONFIG = [
  { key: 'roleSet'  as const, label: 'Role set',                    href: '/app/more/account' },
  { key: 'hasYacht' as const, label: 'At least one yacht added',    href: '/app/profile' },
  { key: 'bioSet'   as const, label: 'Bio written',                 href: '/app/about/edit' },
  { key: 'hasCert'  as const, label: 'At least one certification',  href: '/app/certification/new' },
  { key: 'hasPhoto' as const, label: 'Profile photo uploaded',      href: '/app/profile/photo' },
]

export function WheelACard({ milestones }: WheelACardProps) {
  const [open, setOpen] = useState(false)
  const done  = MILESTONE_CONFIG.filter((m) => milestones[m.key]).length
  const total = MILESTONE_CONFIG.length

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="w-full bg-[var(--card)] rounded-2xl p-5 flex items-center gap-4 text-left hover:bg-[var(--muted)]/30 transition-colors"
        aria-label="Profile setup details"
      >
        <ProgressWheel
          value={done}
          max={total}
          size={56}
          strokeWidth={5}
          label={`${done}/${total}`}
        />
        <div>
          <p className="font-medium text-[var(--foreground)]">Profile setup</p>
          <p className="text-sm text-[var(--muted-foreground)]">
            {done === total ? 'All steps complete' : `${total - done} step${total - done !== 1 ? 's' : ''} remaining`}
          </p>
        </div>
        <span className="ml-auto text-[var(--muted-foreground)]">›</span>
      </button>

      <BottomSheet open={open} onClose={() => setOpen(false)} title="Profile setup">
        <ul className="flex flex-col gap-3 pb-4">
          {MILESTONE_CONFIG.map((m) => {
            const done = milestones[m.key]
            return (
              <li key={m.key}>
                {done ? (
                  <div className="flex items-center gap-3 py-2">
                    <span className="w-6 h-6 rounded-full bg-[var(--ocean-500)] flex items-center justify-center shrink-0">
                      <svg className="w-3.5 h-3.5 text-white" viewBox="0 0 14 14" fill="none">
                        <path d="M2 7l4 4 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </span>
                    <span className="text-sm text-[var(--muted-foreground)] line-through">{m.label}</span>
                  </div>
                ) : (
                  <a
                    href={m.href}
                    onClick={() => setOpen(false)}
                    className="flex items-center gap-3 py-2 hover:text-[var(--ocean-500)] transition-colors"
                  >
                    <span className="w-6 h-6 rounded-full border-2 border-[var(--border)] shrink-0" />
                    <span className="text-sm text-[var(--foreground)]">{m.label}</span>
                    <span className="ml-auto text-[var(--muted-foreground)]">›</span>
                  </a>
                )}
              </li>
            )
          })}
        </ul>
      </BottomSheet>
    </>
  )
}

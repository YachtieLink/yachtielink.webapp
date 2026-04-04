'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { X } from 'lucide-react'
import { AnimatePresence, motion } from 'framer-motion'
import { springSnappy } from '@/lib/motion'

interface NudgeMessage {
  key: string
  text: string
  href: string
}

interface ProfileCoachingNudgeProps {
  hasPhoto: boolean
  hasBio: boolean
  hasYacht: boolean
  hasCert: boolean
}

const STORAGE_KEY = 'yl-profile-nudge-dismissed'
const SESSION_KEY = 'yl-profile-nudge-shown-this-session'

function pickNudge(props: ProfileCoachingNudgeProps): NudgeMessage | null {
  if (!props.hasPhoto) return { key: 'photo', text: 'Add a photo — profiles with photos get 5x more views', href: '/app/profile/photos' }
  if (!props.hasBio) return { key: 'bio', text: 'Write a bio — tell captains who you are', href: '/app/about/edit' }
  if (!props.hasCert) return { key: 'cert', text: 'Add certifications — captains filter by certs', href: '/app/certification/new' }
  if (!props.hasYacht) return { key: 'yacht', text: 'Add a yacht to build your crew network', href: '/app/attachment/new' }
  return null
}

export function ProfileCoachingNudge(props: ProfileCoachingNudgeProps) {
  const [visible, setVisible] = useState(false)
  const [nudge, setNudge] = useState<NudgeMessage | null>(null)

  useEffect(() => {
    const message = pickNudge(props)
    if (!message) return

    // Check if dismissed for this specific nudge key
    const dismissed = localStorage.getItem(STORAGE_KEY)
    if (dismissed === message.key) return

    // Rate-limit: max 1 nudge per session
    const shownThisSession = sessionStorage.getItem(SESSION_KEY)
    if (shownThisSession) return

    sessionStorage.setItem(SESSION_KEY, 'true')
    setNudge(message)
    setVisible(true)
  }, [props.hasPhoto, props.hasBio, props.hasYacht, props.hasCert])

  function dismiss() {
    if (nudge) localStorage.setItem(STORAGE_KEY, nudge.key)
    setVisible(false)
  }

  return (
    <AnimatePresence>
      {visible && nudge && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          transition={springSnappy}
          className="overflow-hidden"
        >
          <div className="rounded-2xl border border-[var(--color-teal-200)] bg-[var(--color-teal-50)] p-4 flex items-start gap-3">
            <div className="flex-1 min-w-0">
              <p className="text-sm text-[var(--color-text-primary)]">{nudge.text}</p>
              <Link
                href={nudge.href}
                className="inline-block mt-1.5 text-xs font-medium text-[var(--color-teal-700)] hover:underline"
              >
                Let&apos;s go &rarr;
              </Link>
            </div>
            <button
              onClick={dismiss}
              className="shrink-0 text-[var(--color-text-tertiary)] hover:text-[var(--color-text-secondary)] transition-colors p-0.5"
              aria-label="Dismiss"
            >
              <X size={14} />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

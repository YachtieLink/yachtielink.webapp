'use client'

import { motion } from 'framer-motion'
import { fadeUp } from '@/lib/motion'

/**
 * Thin client wrapper that applies a fadeUp entrance animation.
 * Use around server-component page content that can't import framer-motion directly.
 */
export function PageTransition({
  children,
  className,
}: {
  children: React.ReactNode
  className?: string
}) {
  return (
    <motion.div variants={fadeUp} initial="hidden" animate="visible" className={className}>
      {children}
    </motion.div>
  )
}

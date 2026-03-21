'use client'

import { motion } from 'framer-motion'
import { scrollReveal, scrollRevealViewport } from '@/lib/motion'

/**
 * Thin client wrapper for scroll-triggered reveal animations.
 * Use around server-component content that can't import framer-motion directly.
 */
export function ScrollReveal({
  children,
  className,
}: {
  children: React.ReactNode
  className?: string
}) {
  return (
    <motion.div
      variants={scrollReveal}
      initial="hidden"
      whileInView="visible"
      viewport={scrollRevealViewport}
      className={className}
    >
      {children}
    </motion.div>
  )
}

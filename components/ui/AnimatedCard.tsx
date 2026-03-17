'use client'

import { motion, useReducedMotion } from 'framer-motion'

interface AnimatedCardProps {
  children: React.ReactNode
  index?: number
  className?: string
}

export function AnimatedCard({ children, index = 0, className }: AnimatedCardProps) {
  const prefersReducedMotion = useReducedMotion()

  return (
    <motion.div
      initial={prefersReducedMotion ? false : { opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={
        prefersReducedMotion
          ? { duration: 0 }
          : { duration: 0.3, delay: index * 0.06, ease: 'easeOut' }
      }
      className={className}
    >
      {children}
    </motion.div>
  )
}

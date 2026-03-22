'use client'

import { motion } from 'framer-motion'
import { staggerContainer, fadeUp } from '@/lib/motion'

interface StaggeredListProps {
  children: React.ReactNode
  className?: string
}

export function StaggeredList({ children, className }: StaggeredListProps) {
  return (
    <motion.div
      variants={staggerContainer}
      initial="hidden"
      animate="visible"
      className={className}
    >
      {children}
    </motion.div>
  )
}

export function StaggeredItem({ children, className }: StaggeredListProps) {
  return (
    <motion.div variants={fadeUp} className={className}>
      {children}
    </motion.div>
  )
}

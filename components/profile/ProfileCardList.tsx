'use client'

import React from 'react'
import { AnimatedCard } from '@/components/ui/AnimatedCard'

export function ProfileCardList({ children }: { children: React.ReactNode }) {
  const items = React.Children.toArray(children)
  return (
    <>
      {items.map((child, i) => (
        <AnimatedCard key={(child as React.ReactElement).key ?? i} index={i}>
          {child}
        </AnimatedCard>
      ))}
    </>
  )
}

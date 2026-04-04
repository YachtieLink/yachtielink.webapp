'use client'

import { Info } from 'lucide-react'
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from '@/components/ui/tooltip'

interface InfoTooltipProps {
  text: string
  children?: React.ReactNode
}

/**
 * Convenience wrapper for showing an info tooltip.
 * If no children provided, renders a small (i) icon as the trigger.
 * Includes its own TooltipProvider for standalone usage.
 */
export function InfoTooltip({ text, children }: InfoTooltipProps) {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger
          className="inline-flex items-center text-[var(--color-text-tertiary)] hover:text-[var(--color-text-secondary)] transition-colors"
          aria-label="More info"
        >
          {children ?? <Info size={13} />}
        </TooltipTrigger>
        <TooltipContent>{text}</TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}

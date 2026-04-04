'use client'

import { useEffect } from 'react'
import { Onborda, OnbordaProvider, useOnborda } from 'onborda'
import type { CardComponentProps } from 'onborda'
import { allTours, TOUR_STORAGE_KEY } from './tour-steps'

/** Custom card component for tour steps */
function TourCard({ step, currentStep, totalSteps, nextStep, prevStep, arrow }: CardComponentProps) {
  const { closeOnborda } = useOnborda()
  const isLastStep = currentStep === totalSteps - 1

  return (
    <div className="bg-[var(--color-surface)] rounded-2xl shadow-lg border border-[var(--color-border)] p-4 max-w-[280px] relative">
      {arrow}
      <div className="flex items-start gap-3">
        {step.icon && (
          <span className="text-xl shrink-0 mt-0.5">{step.icon}</span>
        )}
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-semibold text-[var(--color-text-primary)] mb-1">
            {step.title}
          </h3>
          <p className="text-xs text-[var(--color-text-secondary)] leading-relaxed">
            {step.content}
          </p>
        </div>
      </div>

      <div className="flex items-center justify-between mt-3 pt-3 border-t border-[var(--color-border)]">
        <span className="text-[10px] text-[var(--color-text-tertiary)]">
          {currentStep + 1} of {totalSteps}
        </span>
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              localStorage.setItem(TOUR_STORAGE_KEY, 'skipped')
              closeOnborda()
            }}
            className="text-xs text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-colors"
          >
            Skip
          </button>
          {currentStep > 0 && (
            <button
              onClick={prevStep}
              className="text-xs font-medium text-[var(--color-interactive)] hover:underline"
            >
              Back
            </button>
          )}
          <button
            onClick={() => {
              if (isLastStep) {
                localStorage.setItem(TOUR_STORAGE_KEY, 'complete')
                closeOnborda()
              } else {
                nextStep()
              }
            }}
            className="px-3 py-1.5 text-xs font-medium rounded-lg bg-[var(--color-interactive)] text-white hover:opacity-90 transition-opacity"
          >
            {isLastStep ? 'Get started' : 'Next'}
          </button>
        </div>
      </div>
    </div>
  )
}

/**
 * Inner component that has access to OnbordaProvider context.
 * Triggers the tour on mount if the user hasn't completed it.
 */
function TourTrigger({ children }: { children: React.ReactNode }) {
  const { startOnborda } = useOnborda()

  useEffect(() => {
    const completed = localStorage.getItem(TOUR_STORAGE_KEY)
    if (!completed) {
      startOnborda('welcome')
    }
  }, [startOnborda])

  return <>{children}</>
}

export function TourProvider({ children }: { children: React.ReactNode }) {
  return (
    <OnbordaProvider>
      <Onborda
        steps={allTours}
        shadowRgb="0,0,0"
        shadowOpacity="0.6"
        cardComponent={TourCard}
        cardTransition={{ type: 'spring', stiffness: 300, damping: 25 }}
      >
        <TourTrigger>
          {children}
        </TourTrigger>
      </Onborda>
    </OnbordaProvider>
  )
}

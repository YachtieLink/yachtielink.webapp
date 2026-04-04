import type { Step } from 'onborda'

/** Tour shape matches Onborda's internal Tour interface (not exported from library) */
interface Tour {
  tour: string
  steps: Step[]
}

export const TOUR_STORAGE_KEY = 'yl_tour_complete'

export const productTour: Tour = {
  tour: 'welcome',
  steps: [
    {
      icon: '🔗',
      title: 'Your YachtieLink',
      content: 'This is your personal link — copy it, share it, put it in your CV. It\'s yours wherever you go.',
      selector: '[data-tour="profile-hero"]',
      side: 'bottom',
      showControls: true,
      pointerPadding: 8,
      pointerRadius: 16,
    },
    {
      icon: '💪',
      title: 'Track your progress',
      content: 'Follow the suggestions to stand out to captains.',
      selector: '[data-tour="strength-ring"]',
      side: 'left',
      showControls: true,
      pointerPadding: 4,
      pointerRadius: 12,
    },
    {
      icon: '🤝',
      title: 'Your professional network',
      content: 'Add yachts and we\'ll connect you with crew you\'ve worked with.',
      selector: '[data-tour="network-page"]',
      side: 'bottom',
      showControls: true,
      pointerPadding: 8,
      pointerRadius: 16,
      nextRoute: '/app/network',
      prevRoute: '/app/profile',
    },
    {
      icon: '📄',
      title: 'Your generated CV',
      content: 'Keep your profile updated and we\'ll keep this fresh.',
      selector: '[data-tour="cv-page"]',
      side: 'bottom',
      showControls: true,
      pointerPadding: 8,
      pointerRadius: 16,
      nextRoute: '/app/cv',
      prevRoute: '/app/network',
    },
    {
      icon: '📊',
      title: 'Career insights',
      content: 'See who\'s viewing your profile and what\'s working.',
      selector: '[data-tour="insights-page"]',
      side: 'bottom',
      showControls: true,
      pointerPadding: 8,
      pointerRadius: 16,
      nextRoute: '/app/insights',
      prevRoute: '/app/cv',
    },
    {
      icon: '⚙️',
      title: 'Settings',
      content: 'Account settings, billing, and support live here.',
      selector: '[data-tour="settings-page"]',
      side: 'bottom',
      showControls: true,
      pointerPadding: 8,
      pointerRadius: 16,
      nextRoute: '/app/more',
      prevRoute: '/app/insights',
    },
    {
      icon: '🎉',
      title: 'You\'re all set!',
      content: 'Start by completing your profile — captains notice complete profiles first.',
      selector: '[data-tour="profile-hero"]',
      side: 'bottom',
      showControls: true,
      pointerPadding: 8,
      pointerRadius: 16,
      nextRoute: '/app/profile',
      prevRoute: '/app/more',
    },
  ],
}

export const allTours: Tour[] = [productTour]

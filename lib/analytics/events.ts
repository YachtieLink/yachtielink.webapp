import posthog from 'posthog-js';

// Client-side events
export function trackEvent(event: string, properties?: Record<string, unknown>) {
  if (typeof window !== 'undefined' && posthog.__loaded) {
    posthog.capture(event, properties);
  }
}

// Identify user (call after login)
export function identifyUser(userId: string, traits?: Record<string, unknown>) {
  if (typeof window !== 'undefined' && posthog.__loaded) {
    posthog.identify(userId, traits);
  }
}

// Reset (call on logout)
export function resetAnalytics() {
  if (typeof window !== 'undefined' && posthog.__loaded) {
    posthog.reset();
  }
}

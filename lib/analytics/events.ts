// Lazy-load posthog-js so it doesn't bloat the initial bundle.
// Each exported function is async; callers can fire-and-forget with void.
async function getPostHog() {
  if (typeof window === 'undefined') return null;
  const { default: posthog } = await import('posthog-js');
  // Only return the instance if it has been initialised by PostHogProvider
  return posthog.__loaded ? posthog : null;
}

// Client-side events
export async function trackEvent(event: string, properties?: Record<string, unknown>) {
  const ph = await getPostHog();
  if (!ph) return;
  ph.capture(event, properties);
}

// Identify user (call after login)
export async function identifyUser(userId: string, traits?: Record<string, unknown>) {
  const ph = await getPostHog();
  if (!ph) return;
  ph.identify(userId, traits);
}

// Reset (call on logout)
export async function resetAnalytics() {
  const ph = await getPostHog();
  if (!ph) return;
  ph.reset();
}

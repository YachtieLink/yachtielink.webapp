import Stripe from 'stripe';

let _stripe: Stripe | null = null;

/**
 * Lazy Stripe singleton — server-side only.
 * Instantiated on first call so the module can be imported at build time
 * without requiring the env var to be present.
 * Never import in client components.
 */
export function getStripe(): Stripe {
  if (!_stripe) {
    if (!process.env.STRIPE_SECRET_KEY) {
      throw new Error('STRIPE_SECRET_KEY is not set');
    }
    _stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: '2026-02-25.clover',
      typescript: true,
    });
  }
  return _stripe;
}

// Convenience re-export for callers that want `stripe.xxx` syntax
export const stripe = new Proxy({} as Stripe, {
  get(_target, prop) {
    return (getStripe() as any)[prop];
  },
});

import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  tracesSampleRate: 0.1,
  replaysSessionSampleRate: 0,    // no session replays — trust platform, personal data
  replaysOnErrorSampleRate: 0.5,  // 50% of error sessions for debugging
  environment: process.env.NODE_ENV,
});

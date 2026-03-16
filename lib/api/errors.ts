import { NextResponse } from 'next/server';
import * as Sentry from '@sentry/nextjs';

export function apiError(message: string, status: number) {
  return NextResponse.json({ error: message }, { status });
}

export function handleApiError(error: unknown) {
  console.error('API error:', error);
  Sentry.captureException(error);
  // Never expose stack traces or internal details to the client
  return apiError('An unexpected error occurred', 500);
}

/**
 * Warn if dev environment is using a remote Supabase instance.
 * A dev server sharing the same Supabase project as production can
 * exhaust rate limits and lock out all production users (incident 2026-03-28).
 *
 * Call once at app startup (e.g., in instrumentation.ts or next.config).
 */
export function checkSupabaseEnvSafety() {
  if (process.env.NODE_ENV !== 'production') {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? ''
    const isLocalSupabase = url.includes('localhost') || url.includes('127.0.0.1')
    if (!isLocalSupabase && url.length > 0) {
      console.warn(
        '\n' +
        '='.repeat(70) + '\n' +
        '  WARNING: Dev environment is using a REMOTE Supabase instance.\n' +
        '  Hot-reload and dev traffic can exhaust production rate limits.\n' +
        '  Consider using `npx supabase start` for local development.\n' +
        `  Current URL: ${url}\n` +
        '='.repeat(70) + '\n'
      )
    }
  }
}

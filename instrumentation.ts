export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    await import('./sentry.server.config');
    // Warn if dev environment is using production Supabase (incident 2026-03-28)
    const { checkSupabaseEnvSafety } = await import('./lib/supabase/env-guard');
    checkSupabaseEnvSafety();
  }
  if (process.env.NEXT_RUNTIME === 'edge') {
    await import('./sentry.edge.config');
  }
}

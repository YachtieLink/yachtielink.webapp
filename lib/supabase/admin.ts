import 'server-only';
import { createClient } from '@supabase/supabase-js';

/**
 * Supabase service role client — bypasses RLS.
 * Use only in server-side API routes and webhook handlers.
 * Never expose to the client.
 */
export function createServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );
}

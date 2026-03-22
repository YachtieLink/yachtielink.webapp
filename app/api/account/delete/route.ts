import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createServiceClient } from '@/lib/supabase/admin';
import { stripe } from '@/lib/stripe/client';
import { validateBody } from '@/lib/validation/validate';
import { deleteAccountSchema } from '@/lib/validation/schemas';

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const result = await validateBody(req, deleteAccountSchema);
  if ('error' in result) return result.error;

  const admin = createServiceClient();

  // Fetch user record for Stripe customer ID
  const { data: userRecord } = await admin
    .from('users')
    .select('stripe_customer_id')
    .eq('id', user.id)
    .single();

  // 1. Cancel Stripe subscription if active
  if (userRecord?.stripe_customer_id) {
    try {
      const subscriptions = await stripe.subscriptions.list({
        customer: userRecord.stripe_customer_id,
        status: 'active',
      });
      for (const sub of subscriptions.data) {
        await stripe.subscriptions.cancel(sub.id);
      }
    } catch (e) {
      console.error('Stripe cancellation during account deletion failed:', e);
      // Non-fatal — proceed with deletion
    }
  }

  // 2. Delete storage files
  await Promise.allSettled([
    admin.storage.from('profile-photos').remove([`${user.id}/`]),
    admin.storage.from('cert-documents').remove([`${user.id}/`]),
    admin.storage.from('cv-uploads').remove([`${user.id}/`]),
    admin.storage.from('pdf-exports').remove([`${user.id}/`]),
    admin.storage.from('user-photos').remove([`${user.id}/`]),
    admin.storage.from('user-gallery').remove([`${user.id}/`]),
  ]);

  // 3. Anonymise user record (preserve endorsement graph — don't hard-delete)
  await admin.from('users').update({
    full_name: '[Deleted User]',
    display_name: '[Deleted User]',
    bio: null,
    phone: null,
    whatsapp: null,
    email: null,
    location_country: null,
    location_city: null,
    profile_photo_url: null,
    handle: `deleted-${user.id.slice(0, 8)}`,
    deleted_at: new Date().toISOString(),
  }).eq('id', user.id);

  // 4. Soft-delete attachments
  await admin.from('attachments')
    .update({ deleted_at: new Date().toISOString() })
    .eq('user_id', user.id);

  // 5. Hard-delete certifications (no deleted_at column — was a ghost column bug)
  const { error: certErr } = await admin.from('certifications')
    .delete()
    .eq('user_id', user.id);
  if (certErr) console.error('Account deletion: certifications cleanup failed:', certErr);

  // 6. Anonymise endorsements GIVEN by this user
  //    Keep endorsement text (it's about the recipient) but remove endorser context
  await admin.from('endorsements')
    .update({ endorser_role_label: null })
    .eq('endorser_id', user.id);

  // 7. Cancel pending endorsement requests (no deleted_at column — use status field)
  const { error: reqErr } = await admin.from('endorsement_requests')
    .update({ status: 'cancelled', cancelled_at: new Date().toISOString() })
    .eq('requester_id', user.id)
    .neq('status', 'accepted');
  if (reqErr) console.error('Account deletion: endorsement_requests cleanup failed:', reqErr);

  // 8. Delete analytics data (not needed post-deletion)
  await admin.from('profile_analytics')
    .delete()
    .eq('user_id', user.id);

  // 9. Clean up Sprint 10+ tables (not covered by CASCADE since users row is anonymised, not deleted)
  const cleanupErrors: string[] = [];
  const cleanupTables = [
    { table: 'saved_profiles', filter: 'user_id' },
    { table: 'saved_profiles', filter: 'saved_user_id' },
    { table: 'profile_folders', filter: 'user_id' },
    { table: 'user_education', filter: 'user_id' },
    { table: 'user_skills', filter: 'user_id' },
    { table: 'user_hobbies', filter: 'user_id' },
    { table: 'user_photos', filter: 'user_id' },
    { table: 'user_gallery', filter: 'user_id' },
  ] as const;

  for (const { table, filter } of cleanupTables) {
    const { error } = await admin.from(table).delete().eq(filter, user.id);
    if (error) {
      console.error(`Account deletion: ${table} (${filter}) cleanup failed:`, error);
      cleanupErrors.push(`${table}.${filter}`);
    }
  }

  // 10. Delete auth user — invalidates all sessions
  // This is the critical irreversible step. If it fails, data is already cleaned
  // but the user can still log in to a broken profile.
  try {
    const { error: authErr } = await admin.auth.admin.deleteUser(user.id);
    if (authErr) throw authErr;
  } catch (e) {
    console.error('Account deletion: auth.deleteUser failed:', e);
    return NextResponse.json(
      { error: 'Account deletion partially failed. Your data has been removed but your login still exists. Please contact support.' },
      { status: 500 },
    );
  }

  if (cleanupErrors.length > 0) {
    return NextResponse.json({
      ok: true,
      warning: `Account deleted but some data cleanup failed: ${cleanupErrors.join(', ')}. Contact support if needed.`,
    });
  }

  return NextResponse.json({ ok: true });
}

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

  // 5. Soft-delete certifications
  await admin.from('certifications')
    .update({ deleted_at: new Date().toISOString() })
    .eq('user_id', user.id);

  // 6. Anonymise endorsements GIVEN by this user
  //    Keep endorsement text (it's about the recipient) but remove endorser context
  await admin.from('endorsements')
    .update({ endorser_role_label: null })
    .eq('endorser_id', user.id);

  // 7. Soft-delete endorsement requests
  await admin.from('endorsement_requests')
    .update({ deleted_at: new Date().toISOString() })
    .eq('requester_id', user.id);

  // 8. Delete analytics data (not needed post-deletion)
  await admin.from('profile_analytics')
    .delete()
    .eq('user_id', user.id);

  // 9. Delete auth user — invalidates all sessions
  await admin.auth.admin.deleteUser(user.id);

  return NextResponse.json({ ok: true });
}

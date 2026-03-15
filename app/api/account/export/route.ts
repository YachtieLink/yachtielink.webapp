import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createServiceClient } from '@/lib/supabase/admin';
import { applyRateLimit } from '@/lib/rate-limit/helpers';

export async function GET(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  // Rate limit: use fileUpload budget (20/hour — generous for data export)
  const limited = await applyRateLimit(req, 'fileUpload', user.id);
  if (limited) return limited;

  const admin = createServiceClient();

  // Fetch all user data in parallel
  const [
    userRes,
    attachmentsRes,
    certificationsRes,
    endorsementsGivenRes,
    endorsementsReceivedRes,
    endorsementRequestsRes,
    analyticsRes,
  ] = await Promise.all([
    admin.from('users').select('*').eq('id', user.id).single(),
    admin.from('attachments').select('*, yacht:yachts!yacht_id(*)').eq('user_id', user.id),
    admin.from('certifications').select('*').eq('user_id', user.id),
    admin.from('endorsements').select('*').eq('endorser_id', user.id),
    admin.from('endorsements').select('*').eq('recipient_id', user.id),
    admin.from('endorsement_requests').select('*').eq('requester_id', user.id),
    admin.from('profile_analytics').select('*').eq('user_id', user.id),
  ]);

  const exportData = {
    exported_at: new Date().toISOString(),
    user: userRes.data,
    employment_history: attachmentsRes.data ?? [],
    certifications: certificationsRes.data ?? [],
    endorsements_given: endorsementsGivenRes.data ?? [],
    endorsements_received: endorsementsReceivedRes.data ?? [],
    endorsement_requests: endorsementRequestsRes.data ?? [],
    profile_analytics: analyticsRes.data ?? [],
  };

  return new Response(JSON.stringify(exportData, null, 2), {
    headers: {
      'Content-Type': 'application/json',
      'Content-Disposition': `attachment; filename="yachtielink-data-export-${new Date().toISOString().split('T')[0]}.json"`,
    },
  });
}

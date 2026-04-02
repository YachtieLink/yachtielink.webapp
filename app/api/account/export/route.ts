import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createServiceClient } from '@/lib/supabase/admin';
import { applyRateLimit } from '@/lib/rate-limit/helpers';

export async function GET(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  // Rate limit: dedicated category — must fail open for GDPR compliance
  const limited = await applyRateLimit(req, 'dataExport', user.id);
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
    savedProfilesRes,
    profileFoldersRes,
    educationRes,
    skillsRes,
    hobbiesRes,
    photosRes,
    galleryRes,
    landExperienceRes,
  ] = await Promise.all([
    admin.from('users').select('*').eq('id', user.id).single(),
    admin.from('attachments').select('*, yacht:yachts!yacht_id(*)').eq('user_id', user.id),
    admin.from('certifications').select('*').eq('user_id', user.id),
    admin.from('endorsements').select('*').eq('endorser_id', user.id),
    admin.from('endorsements').select('*').eq('recipient_id', user.id),
    admin.from('endorsement_requests').select('*').eq('requester_id', user.id),
    admin.from('profile_analytics').select('*').eq('user_id', user.id),
    admin.from('saved_profiles').select('*').eq('user_id', user.id),
    admin.from('profile_folders').select('*').eq('user_id', user.id),
    admin.from('user_education').select('*').eq('user_id', user.id),
    admin.from('user_skills').select('*').eq('user_id', user.id),
    admin.from('user_hobbies').select('*').eq('user_id', user.id),
    admin.from('user_photos').select('*').eq('user_id', user.id),
    admin.from('user_gallery').select('*').eq('user_id', user.id),
    admin.from('land_experience').select('*').eq('user_id', user.id),
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
    saved_profiles: savedProfilesRes.data ?? [],
    profile_folders: profileFoldersRes.data ?? [],
    education: educationRes.data ?? [],
    skills: skillsRes.data ?? [],
    hobbies: hobbiesRes.data ?? [],
    photos: photosRes.data ?? [],
    gallery: galleryRes.data ?? [],
    land_experience: landExperienceRes.data ?? [],
  };

  return new Response(JSON.stringify(exportData, null, 2), {
    headers: {
      'Content-Type': 'application/json',
      'Content-Disposition': `attachment; filename="yachtielink-data-export-${new Date().toISOString().split('T')[0]}.json"`,
    },
  });
}

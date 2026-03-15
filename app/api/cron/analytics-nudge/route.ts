import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/admin';
import { sendAnalyticsNudgeEmail } from '@/lib/email/analytics-nudge';

export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
  // Verify request is from Vercel Cron
  const cronSecret = req.headers.get('authorization');
  if (process.env.CRON_SECRET && cronSecret !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabase = createServiceClient();

  // Get 7-day profile view counts for all users
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  const { data: viewCounts } = await supabase
    .from('profile_analytics')
    .select('user_id')
    .eq('event_type', 'profile_view')
    .gte('occurred_at', sevenDaysAgo.toISOString());

  if (!viewCounts?.length) {
    return NextResponse.json({ sent: 0 });
  }

  // Count per user
  const countMap: Record<string, number> = {};
  for (const row of viewCounts) {
    countMap[row.user_id] = (countMap[row.user_id] ?? 0) + 1;
  }

  const counts = Object.values(countMap);
  const avg = counts.reduce((a, b) => a + b, 0) / counts.length;
  const threshold = avg * 2;

  // Find free users above threshold who haven't received the nudge
  const candidates = Object.entries(countMap)
    .filter(([, count]) => count >= threshold)
    .map(([userId]) => userId);

  if (!candidates.length) {
    return NextResponse.json({ sent: 0 });
  }

  const { data: users } = await supabase
    .from('users')
    .select('id, email, full_name, display_name')
    .in('id', candidates)
    .eq('subscription_status', 'free')
    .eq('analytics_nudge_sent', false);

  if (!users?.length) {
    return NextResponse.json({ sent: 0 });
  }

  let sent = 0;
  for (const user of users) {
    if (!user.email) continue;
    const viewCount = countMap[user.id] ?? 0;
    const name = user.full_name ?? user.display_name ?? 'there';

    await sendAnalyticsNudgeEmail({ email: user.email, name, viewCount });
    await supabase.from('users').update({ analytics_nudge_sent: true }).eq('id', user.id);
    sent++;
  }

  return NextResponse.json({ sent });
}

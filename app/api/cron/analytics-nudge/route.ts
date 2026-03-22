import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/admin';
import { sendAnalyticsNudgeEmail } from '@/lib/email/analytics-nudge';
import { handleApiError } from '@/lib/api/errors';

export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
  try {
    // Verify request is from Vercel Cron — secret is mandatory
    const cronSecret = req.headers.get('authorization');
    if (!process.env.CRON_SECRET || cronSecret !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = createServiceClient();

    // DB-level aggregation instead of fetching all rows into JS
    const { data: viewCounts } = await supabase.rpc('get_weekly_view_counts');

    if (!viewCounts?.length) {
      return NextResponse.json({ sent: 0 });
    }

    // Calculate threshold (2x average)
    const counts = viewCounts.map((r: { view_count: number }) => r.view_count);
    const avg = counts.reduce((a: number, b: number) => a + b, 0) / counts.length;
    const threshold = avg * 2;

    const candidates = viewCounts
      .filter((r: { view_count: number }) => r.view_count >= threshold)
      .map((r: { user_id: string }) => r.user_id);

    if (!candidates.length) {
      return NextResponse.json({ sent: 0 });
    }

    // Find free users above threshold who haven't received the nudge
    const { data: users } = await supabase
      .from('users')
      .select('id, email, full_name, display_name')
      .in('id', candidates)
      .eq('subscription_status', 'free')
      .eq('analytics_nudge_sent', false);

    if (!users?.length) {
      return NextResponse.json({ sent: 0 });
    }

    // Build a count map for email content
    const countMap: Record<string, number> = {};
    for (const r of viewCounts) {
      countMap[r.user_id] = r.view_count;
    }

    // Fire emails in parallel (promises start eagerly at .map() time,
    // allSettled just awaits completion). Batch update flags after.
    const emailTasks = users
      .filter((u) => u.email)
      .map((u) => ({
        id: u.id,
        promise: sendAnalyticsNudgeEmail({
          email: u.email!,
          name: u.full_name ?? u.display_name ?? 'there',
          viewCount: countMap[u.id] ?? 0,
        }),
      }));

    const results = await Promise.allSettled(emailTasks.map((t) => t.promise));
    const sentIds = emailTasks
      .filter((_, i) => results[i].status === 'fulfilled')
      .map((t) => t.id);

    if (sentIds.length > 0) {
      await supabase.from('users').update({ analytics_nudge_sent: true }).in('id', sentIds);
    }

    return NextResponse.json({ sent: sentIds.length });
  } catch (e) {
    return handleApiError(e);
  }
}

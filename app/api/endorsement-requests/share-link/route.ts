import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { validateBody } from "@/lib/validation/validate";
import { applyRateLimit } from "@/lib/rate-limit/helpers";

const shareLinkSchema = z.object({
  yacht_id: z.string().uuid(),
});

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://yachtie.link";

/**
 * POST /api/endorsement-requests/share-link
 * Creates (or returns existing) shareable endorsement request link.
 * One reusable link per requester+yacht — anyone with the link can write an endorsement.
 */
export async function POST(req: NextRequest) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const limited = await applyRateLimit(req, 'endorsementCreate', user.id);
  if (limited) return limited;

  const result = await validateBody(req, shareLinkSchema);
  if ('error' in result) return result.error;
  const { yacht_id } = result.data;

  // Check for existing shareable link for this user+yacht
  const { data: existing } = await supabase
    .from("endorsement_requests")
    .select("id, token")
    .eq("requester_id", user.id)
    .eq("yacht_id", yacht_id)
    .eq("is_shareable", true)
    .is("cancelled_at", null)
    .maybeSingle();

  if (existing) {
    return NextResponse.json({
      ok: true,
      token: existing.token,
      deep_link: `${APP_URL}/r/${existing.token}`,
    });
  }

  // Create new shareable link
  const { data: request, error } = await supabase
    .from("endorsement_requests")
    .insert({
      requester_id: user.id,
      yacht_id,
      is_shareable: true,
      recipient_email: null,
      recipient_phone: null,
      recipient_user_id: null,
    })
    .select("id, token")
    .single();

  if (error || !request) {
    return NextResponse.json({ error: "Failed to create share link" }, { status: 500 });
  }

  return NextResponse.json({
    ok: true,
    token: request.token,
    deep_link: `${APP_URL}/r/${request.token}`,
  });
}

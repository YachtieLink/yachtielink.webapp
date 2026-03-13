import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { sendNotifyEmail } from "@/lib/email";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://yachtie.link";

// ─── Email templates ──────────────────────────────────────────────────────────

function buildHtml(requesterName: string, yachtName: string, deepLink: string) {
  const yachtLine = yachtName ? ` on <strong>${yachtName}</strong>` : "";
  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f5f5f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f5f5;padding:40px 16px;">
    <tr><td align="center">
      <table width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;background:#ffffff;border-radius:12px;overflow:hidden;">

        <!-- Header -->
        <tr><td style="background:#0a1628;padding:28px 32px;">
          <p style="margin:0;color:#ffffff;font-size:18px;font-weight:600;letter-spacing:-0.3px;">YachtieLink</p>
        </td></tr>

        <!-- Body -->
        <tr><td style="padding:32px;">
          <p style="margin:0 0 16px;font-size:16px;color:#111827;font-weight:600;line-height:1.4;">
            ${requesterName} is asking for an endorsement
          </p>
          <p style="margin:0 0 24px;font-size:15px;color:#374151;line-height:1.6;">
            They've worked${yachtLine} and would like you to write a short endorsement of their work.
            It takes about two minutes.
          </p>

          <!-- CTA button -->
          <table cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
            <tr><td style="background:#0a1628;border-radius:8px;">
              <a href="${deepLink}" style="display:inline-block;padding:14px 28px;color:#ffffff;font-size:15px;font-weight:600;text-decoration:none;letter-spacing:-0.2px;">
                Write an endorsement →
              </a>
            </td></tr>
          </table>

          <p style="margin:0;font-size:13px;color:#9ca3af;line-height:1.5;">
            Or copy this link: <a href="${deepLink}" style="color:#9ca3af;">${deepLink}</a>
          </p>
        </td></tr>

        <!-- Footer -->
        <tr><td style="padding:20px 32px;border-top:1px solid #f3f4f6;">
          <p style="margin:0;font-size:12px;color:#9ca3af;line-height:1.5;">
            You received this because ${requesterName} added your email address.
            If you don't know them, you can ignore this email.
          </p>
        </td></tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

function buildText(requesterName: string, yachtName: string, deepLink: string) {
  const yachtLine = yachtName ? ` on ${yachtName}` : "";
  return `${requesterName} is asking for an endorsement

They've worked${yachtLine} and would like you to write a short endorsement of their work. It takes about two minutes.

Write an endorsement: ${deepLink}

---
You received this because ${requesterName} added your email address. If you don't know them, you can ignore this email.`;
}

// ─── Route handler ────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { yacht_id, recipient_email, yacht_name } = body as {
    yacht_id: string;
    recipient_email: string;
    yacht_name?: string;
  };

  if (!yacht_id || !recipient_email) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  // Get requester display name
  const { data: profile } = await supabase
    .from("users")
    .select("display_name, full_name")
    .eq("id", user.id)
    .single();
  const requesterName =
    (profile?.display_name as string | null) ||
    (profile?.full_name as string | null) ||
    "A colleague";

  // Insert request and retrieve the auto-generated token
  const { data: request, error: insertError } = await supabase
    .from("endorsement_requests")
    .insert({
      requester_id: user.id,
      yacht_id,
      recipient_email: recipient_email.trim().toLowerCase(),
    })
    .select("token")
    .single();

  if (insertError || !request) {
    // Unique constraint violation (already requested) is non-fatal — skip silently
    if (insertError?.code === "23505") {
      return NextResponse.json({ ok: true, skipped: true });
    }
    return NextResponse.json({ error: "Failed to create request" }, { status: 500 });
  }

  const deepLink = `${APP_URL}/r/${request.token}`;
  const yachtDisplay = (yacht_name as string | undefined) ?? "";
  const subjectYacht = yachtDisplay ? ` on ${yachtDisplay}` : "";

  // Send email — non-fatal if it fails (request is already in DB)
  try {
    await sendNotifyEmail({
      to: recipient_email.trim(),
      subject: `${requesterName} asked you to endorse their work${subjectYacht}`,
      html: buildHtml(requesterName, yachtDisplay, deepLink),
      text: buildText(requesterName, yachtDisplay, deepLink),
    });
  } catch {
    // Email failure is non-fatal — token is saved, user can resend later
  }

  return NextResponse.json({ ok: true });
}

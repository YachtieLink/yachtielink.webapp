import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = await createClient();

  const { error } = await supabase
    .from("users")
    .select("id")
    .limit(1);

  return NextResponse.json({
    ok: !error,
    error: error ? "Database check failed" : null,
  });
}
